// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const ethers = require('ethers');
const Database = require('better-sqlite3');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000;
const QUICKNODE = process.env.QUICKNODE_RPC;
const HOT_KEY = process.env.HOT_WALLET_PRIVATE_KEY;
const USDT_ADDRESS = process.env.USDT_ADDRESS || "0x3813e82e6f7098b9583FC0F33a962D02018B6803";
const USDT_DECIMALS = parseInt(process.env.USDT_DECIMALS || "6", 10);

if (!QUICKNODE) {
  console.error("Please set QUICKNODE_RPC in environment variables.");
  process.exit(1);
}
if (!HOT_KEY) {
  console.warn("WARNING: HOT_WALLET_PRIVATE_KEY not set — payouts will fail until it's configured.");
}

// Init app
const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '200kb' }));
app.use(cors());

// Rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),
});
app.use(limiter);

// Serve static files (public)
app.use(express.static(path.join(__dirname, 'public')));

// Ethers provider & hot signer (if hot key present)
const provider = new ethers.JsonRpcProvider(QUICKNODE);
let hotSigner = null;
if (HOT_KEY) hotSigner = new ethers.Wallet(HOT_KEY, provider);

// ERC20 minimal ABI
const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 value) returns (bool)"
];

// Usdt contract connected to provider (read-only) and to signer (for transfers)
const usdtRead = new ethers.Contract(USDT_ADDRESS, erc20Abi, provider);
let usdtWrite = null;
if (hotSigner) usdtWrite = new ethers.Contract(USDT_ADDRESS, erc20Abi, hotSigner);

// SQLite DB
const db = new Database('payments.db');
db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  earned TEXT DEFAULT '0',
  claimed INTEGER DEFAULT 0,
  nonce INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  amount TEXT NOT NULL,
  txhash TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Utilities to convert amounts (string decimal) to base units (BigInt) and back
function toUint(amountDecimalStr) {
  // amountDecimalStr: "1.25" or number
  const s = String(amountDecimalStr);
  if (s.indexOf('.') === -1) {
    return BigInt(s) * (BigInt(10) ** BigInt(USDT_DECIMALS));
  } else {
    const [whole, frac] = s.split('.');
    const fracPadded = (frac + '0'.repeat(USDT_DECIMALS)).slice(0, USDT_DECIMALS);
    return BigInt(whole) * (BigInt(10) ** BigInt(USDT_DECIMALS)) + BigInt(fracPadded || '0');
  }
}
function fromUint(bigIntStr) {
  const v = BigInt(bigIntStr);
  const factor = BigInt(10) ** BigInt(USDT_DECIMALS);
  const whole = v / factor;
  const frac = v % factor;
  const fracStr = frac.toString().padStart(USDT_DECIMALS, '0');
  // trim trailing zeros for nice display
  return `${whole.toString()}.${fracStr}`;
}

// API: hot balance (read-only)
app.get('/api/hot-balance', async (req, res) => {
  try {
    if (!hotSigner) return res.status(400).json({ error: 'hot wallet not configured' });
    const addr = await hotSigner.getAddress();
    const bal = await usdtRead.balanceOf(addr);
    const decimals = USDT_DECIMALS;
    return res.json({ address: addr, balance: fromUint(bal), decimals });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'failed to read hot wallet balance' });
  }
});

// API: get address USDT balance (read-only)
app.get('/api/address-balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'invalid address' });
    const bal = await usdtRead.balanceOf(address);
    return res.json({ address, balance: fromUint(bal), decimals: USDT_DECIMALS });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'failed to read address balance' });
  }
});

// POST /api/report
// body: { address, earned, nonce, signature }
// message signed by client: `flatdrive-report:${address}:${earned}:${nonce}`
app.post('/api/report', async (req, res) => {
  try {
    const { address, earned, nonce, signature } = req.body;
    if (!address || earned == null || nonce == null || !signature) {
      return res.status(400).json({ error: 'address, earned, nonce, signature required' });
    }
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'invalid address' });

    const message = `flatdrive-report:${address}:${earned}:${nonce}`;
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'signature mismatch' });
    }

    // check last nonce
    const row = db.prepare('SELECT nonce FROM sessions WHERE address = ? ORDER BY id DESC LIMIT 1').get(address.toLowerCase());
    const currentNonce = row ? row.nonce : 0;
    if (nonce <= currentNonce) {
      return res.status(409).json({ error: 'nonce too small or replay detected' });
    }

    // store session record, store earned as integer base-units string
    const earnedUnits = toUint(String(earned)).toString();
    const stmt = db.prepare('INSERT INTO sessions (address, earned, nonce) VALUES (?, ?, ?)');
    const info = stmt.run(address.toLowerCase(), earnedUnits, nonce);

    return res.json({ ok: true, sessionId: info.lastInsertRowid });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
});

// POST /api/claim
// body: { address, signature }  — message signed: `flatdrive-claim:${address}:${nonce}` where nonce is latest server nonce for address
app.post('/api/claim', async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'address & signature required' });
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'invalid address' });

    // find latest nonce stored
    const lastRow = db.prepare('SELECT nonce FROM sessions WHERE address = ? ORDER BY id DESC LIMIT 1').get(address.toLowerCase());
    const nonce = lastRow ? lastRow.nonce : 0;
    const message = `flatdrive-claim:${address}:${nonce}`;
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'signature mismatch' });
    }

    // sum unclaimed earned
    const sumRow = db.prepare('SELECT SUM(CAST(earned AS INTEGER)) as total_unclaimed FROM sessions WHERE address = ? AND claimed = 0').get(address.toLowerCase());
    const totalUnclaimed = sumRow && sumRow.total_unclaimed ? BigInt(sumRow.total_unclaimed) : BigInt(0);

    if (totalUnclaimed === BigInt(0)) {
      return res.status(400).json({ error: 'no earnings to claim' });
    }

    // check hot wallet
    if (!hotSigner || !usdtWrite) {
      return res.status(500).json({ error: 'hot wallet not configured on server' });
    }
    const hotAddr = await hotSigner.getAddress();
    const hotBal = BigInt(await usdtRead.balanceOf(hotAddr));
    if (hotBal < totalUnclaimed) {
      return res.status(409).json({ error: 'hot wallet has insufficient USDT balance' });
    }

    // send transfer
    const tx = await usdtWrite.transfer(address, totalUnclaimed);
    // mark sessions claimed
    db.prepare('UPDATE sessions SET claimed = 1 WHERE address = ? AND claimed = 0').run(address.toLowerCase());

    // record payout
    db.prepare('INSERT INTO payouts (address, amount, txhash, status) VALUES (?, ?, ?, ?)').run(
      address.toLowerCase(),
      totalUnclaimed.toString(),
      tx.hash,
      'pending'
    );

    // wait for 1 confirmation and update status (async)
    tx.wait(1).then(() => {
      db.prepare('UPDATE payouts SET status = ? WHERE txhash = ?').run('confirmed', tx.hash);
    }).catch(err => {
      console.error('tx wait error', err);
    });

    return res.json({ ok: true, txHash: tx.hash, amount: fromUint(totalUnclaimed) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
});

// GET /api/status/:address
app.get('/api/status/:address', (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'invalid address' });
    const sessions = db.prepare('SELECT id, earned, claimed, nonce, created_at FROM sessions WHERE address = ? ORDER BY id DESC').all(address);
    const payouts = db.prepare('SELECT id, amount, txhash, status, created_at FROM payouts WHERE address = ? ORDER BY id DESC').all(address);
    res.json({ sessions, payouts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin payouts list (protected by API_SECRET header)
app.get('/api/admin/payouts', (req, res) => {
  const secret = req.headers['x-api-secret'] || '';
  if (secret !== process.env.API_SECRET) return res.status(403).json({ error: 'forbidden' });
  const rows = db.prepare('SELECT * FROM payouts ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`FlatDrive payments service running on port ${PORT}`);
});

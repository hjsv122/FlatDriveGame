require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// CONFIG
const NETWORK = bitcoin.networks.bitcoin; // mainnet
const HOT_WALLET_WIF = process.env.HOT_WALLET_WIF || ''; // ضع WIF هنا أو في .env
const COLD_WALLET_ADDRESS = process.env.COLD_WALLET_ADDRESS || '19nHPmxUtYQNcoJvT3b9q9QHu2yyXkspzG';

if (!HOT_WALLET_WIF) {
  console.error('ERROR: HOT_WALLET_WIF not set in environment (.env)!');
  process.exit(1);
}

const keyPair = bitcoin.ECPair.fromWIF(HOT_WALLET_WIF, NETWORK);
const hotPayment = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: NETWORK });
const HOT_ADDRESS = hotPayment.address;

console.log('Hot wallet address:', HOT_ADDRESS);

// Blockstream API base
const BLOCKSTREAM_BASE = 'https://blockstream.info/api';

// helper functions
async function fetchUTXOs(address) {
  const res = await axios.get(`${BLOCKSTREAM_BASE}/address/${address}/utxo`);
  return res.data;
}
async function fetchRawTx(txid) {
  const res = await axios.get(`${BLOCKSTREAM_BASE}/tx/${txid}/hex`);
  return res.data;
}
async function broadcastTx(rawHex) {
  const res = await axios.post(`${BLOCKSTREAM_BASE}/tx`, rawHex, { headers: {'Content-Type':'text/plain'} });
  return res.data;
}

app.post('/send', async (req, res) => {
  try {
    const { amount } = req.body; // amount in satoshi
    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'invalid amount' });

    // fetch utxos
    const utxos = await fetchUTXOs(HOT_ADDRESS);
    if (!utxos || utxos.length === 0) return res.status(400).json({ error: 'no utxos in hot wallet' });

    // build PSBT
    const psbt = new bitcoin.Psbt({ network: NETWORK });
    let sum = 0;
    const EST_FEE = 1000; // تخمين أولي للرسوم; يمكن تحسينه لاحقًا

    for (const u of utxos) {
      const raw = await fetchRawTx(u.txid);
      psbt.addInput({ hash: u.txid, index: u.vout, nonWitnessUtxo: Buffer.from(raw, 'hex') });
      sum += u.value;
      if (sum >= amount + EST_FEE) break;
    }

    if (sum < amount + EST_FEE) return res.status(400).json({ error: 'insufficient funds in hot wallet' });

    const change = sum - amount - EST_FEE;
    psbt.addOutput({ address: COLD_WALLET_ADDRESS, value: amount });
    if (change > 0) psbt.addOutput({ address: HOT_ADDRESS, value: change });

    // sign inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, keyPair);
    }
    psbt.validateSignaturesOfAllInputs();
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = await broadcastTx(txHex);

    return res.json({ success: true, txid });
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

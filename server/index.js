import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const ECPair = ECPairFactory(tinysecp);

// Load wallet keys
console.log("✅ HOT_WALLET_WIF:", process.env.HOT_WALLET_WIF ? "Loaded" : "Missing");
console.log("✅ COLD_WALLET_WIF:", process.env.COLD_WALLET_WIF ? "Loaded" : "Missing");

if (!process.env.HOT_WALLET_WIF || !process.env.COLD_WALLET_WIF) {
  throw new Error("❌ مفاتيح المحفظة مفقودة في Environment Variables");
}

const hotKeyPair = ECPair.fromWIF(process.env.HOT_WALLET_WIF);
const coldKeyPair = ECPair.fromWIF(process.env.COLD_WALLET_WIF);

// ----- إعداد مجلد public للواجهة -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// ----- صفحة البداية -----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----- تشغيل السيرفر -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));

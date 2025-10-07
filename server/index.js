import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const ECPair = ECPairFactory(tinysecp);

console.log("✅ HOT_WALLET_WIF:", process.env.HOT_WALLET_WIF ? "Loaded" : "Missing");
console.log("✅ COLD_WALLET_WIF:", process.env.COLD_WALLET_WIF ? "Loaded" : "Missing");

if (!process.env.HOT_WALLET_WIF || !process.env.COLD_WALLET_WIF) {
  throw new Error("❌ المفاتيح غير موجودة في الإعدادات البيئية (Environment Variables).");
}

const hotKeyPair = ECPair.fromWIF(process.env.HOT_WALLET_WIF);
const coldKeyPair = ECPair.fromWIF(process.env.COLD_WALLET_WIF);

app.get('/', (req, res) => {
  res.send("🚀 FlatDriveGame server is running successfully!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));

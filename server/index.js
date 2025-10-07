// index.js

// ------------------------- IMPORTS -------------------------
import * as bitcoin from 'bitcoinjs-lib'; // إذا تستخدم CommonJS استخدم: const bitcoin = require('bitcoinjs-lib');
import tinysecp from 'tiny-secp256k1';   // إذا تستخدم CommonJS: const tinysecp = require('tiny-secp256k1');

// ------------------------- ECPAIR FACTORY -------------------------
const { ECPairFactory } = bitcoin;
const ECPair = ECPairFactory(tinysecp); // هذا هو الإصلاح الأساسي للخطأ السابق

// ------------------------- إعداد المحفظة الداخلية -------------------------
/**
 * افترض أنك تريد استخدام محفظتك القديمة داخل اللعبة
 * يمكنك وضع مفتاحك القديم هنا أو توليد مفتاح جديد.
 * المثال التالي يوضح توليد زوج مفاتيح جديد:
 */
const keyPair = ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

console.log('Internal Wallet Address:', address);
console.log('Private Key WIF:', keyPair.toWIF());

// ------------------------- مثال إرسال USDT -------------------------
// لاحقاً عندما ترتبط بمحفظة Tatum أو خادم:
// ستستخدم privateKey لإرسال أرباح اللاعبين
async function sendUSDT(toAddress, amount) {
  // مثال توضيحي: هذا الجزء تحتاج ربطه بـ Tatum API لاحقاً
  console.log(`Send ${amount} USDT from internal wallet ${address} to ${toAddress}`);
}

// ------------------------- تشغيل السيرفر -------------------------
import express from 'express'; // إذا تستخدم CommonJS: const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`Game Wallet Address: ${address}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

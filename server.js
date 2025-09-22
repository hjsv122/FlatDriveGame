const express = require('express');
const bodyParser = require('body-parser');
const bitcoin = require('bitcoinjs-lib');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

// شبكة البيتكوين mainnet
const network = bitcoin.networks.bitcoin;

// المفتاح الخاص لمحفظة اللعبة (ضع المفتاح الخاص الخاص بالخادم هنا)
const SERVER_WIF = process.env.SERVER_WIF || 'PUT_YOUR_SERVER_WIF_HERE';

if (SERVER_WIF === 'PUT_YOUR_SERVER_WIF_HERE') {
  console.warn('⚠️ الرجاء تعيين متغير البيئة SERVER_WIF في الخادم!');
}

const keyPair = bitcoin.ECPair.fromWIF(SERVER_WIF, network);
const { address: serverAddress } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

// توكن API للتحقق من الطلبات
const API_TOKEN = process.env.API_TOKEN || 'PUT_YOUR_API_TOKEN_HERE';

if (API_TOKEN === 'PUT_YOUR_API_TOKEN_HERE') {
  console.warn('⚠️ الرجاء تعيين متغير البيئة API_TOKEN في الخادم!');
}

// نقطة النهاية لتحويل الأرباح
app.post('/api/transfer', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== API_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, address } = req.body;

    if (!amount || !Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // جلب UTXOs لمحفظة الخادم
    const utxoResponse = await fetch(`https://blockstream.info/api/address/${serverAddress}/utxo`);
    if (!utxoResponse.ok) throw new Error('Failed to fetch UTXOs');
    const utxos = await utxoResponse.json();

    // اختيار UTXOs لتغطية المبلغ + رسوم
    const fee = 1000; // رسوم ثابتة بالساتوشي
    let inputSum = 0;
    const inputs = [];

    for (const utxo of utxos) {
      inputs.push(utxo);
      inputSum += utxo.value;
      if (inputSum >= amount + fee) break;
    }

    if (inputSum < amount + fee) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // بناء المعاملة
    const psbt = new bitcoin.Psbt({ network });

    // نحتاج جلب raw transaction لكل input من أجل nonWitnessUtxo
    // هنا تبسيط: جلب الـ rawtx من API Blockstream
    for (const input of inputs) {
      const rawTxResp = await fetch(`https://blockstream.info/api/tx/${input.txid}/hex`);
      if (!rawTxResp.ok) throw new Error('Failed to fetch raw tx');
      const rawTxHex = await rawTxResp.text();
      const rawTxBuffer = Buffer.from(rawTxHex, 'hex');

      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        nonWitnessUtxo: rawTxBuffer,
      });
    }

    // مخرج الدفع للمستخدم
    psbt.addOutput({
      address,
      value: amount,
    });

    // الباقي يعاد للخادم
    const change = inputSum - amount - fee;
    if (change > 0) {
      psbt.addOutput({
        address: serverAddress,
        value: change,
      });
    }

    // توقيع المدخلات
    inputs.forEach((_, idx) => {
      psbt.signInput(idx, keyPair);
    });

    psbt.finalizeAllInputs();

    const rawTx = psbt.extractTransaction().toHex();

    // بث المعاملة
    const broadcastResponse = await fetch('https://blockstream.info/api/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawTx,
    });

    if (!broadcastResponse.ok) {
      const errText = await broadcastResponse.text();
      return res.status(500).json({ error: 'Broadcast failed: ' + errText });
    }

    const txid = await broadcastResponse.text();

    res.json({ success: true, txid });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ملفات static في public
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

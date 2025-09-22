const express = require("express");
const bodyParser = require("body-parser");
const bitcoin = require("bitcoinjs-lib");
const { ECPairFactory } = require("ecpair");
const ecc = require("tiny-secp256k1");
const axios = require("axios");

const ECPair = ECPairFactory(ecc);

const app = express();
app.use(bodyParser.json());

// إعدادات الشبكة ومحفظة الإرسال
const NETWORK = bitcoin.networks.bitcoin; // Mainnet
const SENDER_WIF = process.env.SENDER_WIF; // مفتاح خاص من متغير البيئة
const SENDER_ADDRESS = bitcoin.payments.p2pkh({
  pubkey: ECPair.fromWIF(SENDER_WIF, NETWORK).publicKey,
  network: NETWORK,
}).address;

const API_BASE = "https://blockstream.info/api";

// نقطة استقبال من اللعبة
app.post("/api/send", async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount < 1) {
    return res.status(400).json({ success: false, error: "قيمة غير صالحة" });
  }

  try {
    const keyPair = ECPair.fromWIF(SENDER_WIF, NETWORK);

    // استعلام UTXOs الخاصة بعنوان الإرسال
    const utxosRes = await axios.get(`${API_BASE}/address/${SENDER_ADDRESS}/utxo`);
    const utxos = utxosRes.data;

    if (!utxos.length) {
      return res.status(400).json({ success: false, error: "لا يوجد رصيد كافٍ" });
    }

    // إعداد المعاملة
    const psbt = new bitcoin.Psbt({ network: NETWORK });

    let inputTotal = 0;
    const fee = 150; // رسوم ثابتة (ساتوشي)
    const targetAddress = "1HXoXdtiMzPJoJQZaP4iuEAAacHt7E8rFK"; // عنوان المحفظة الحقيقية

    for (const utxo of utxos) {
      if (inputTotal >= amount + fee) break;

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(SENDER_ADDRESS, NETWORK),
          value: utxo.value,
        },
      });

      inputTotal += utxo.value;
    }

    if (inputTotal < amount + fee) {
      return res.status(400).json({ success: false, error: "رصيد غير كافٍ لإرسال المبلغ مع الرسوم" });
    }

    // إضافة المخرجات
    psbt.addOutput({
      address: targetAddress,
      value: amount,
    });

    const change = inputTotal - amount - fee;
    if (change > 0) {
      psbt.addOutput({
        address: SENDER_ADDRESS,
        value: change,
      });
    }

    // التوقيع
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();

    // بث المعاملة
    const broadcastRes = await axios.post(`${API_BASE}/tx`, txHex);

    return res.json({ success: true, txid: broadcastRes.data });
  } catch (err) {
    console.error("Send error:", err.message);
    return res.status(500).json({ success: false, error: "فشل إرسال المعاملة" });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

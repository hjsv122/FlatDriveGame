// استدعاء المكتبات
const express = require('express');
const bodyParser = require('body-parser');
const { ECPair, payments, networks, Psbt } = require('bitcoinjs-lib');
const bitcoin = require('bitcoinjs-lib');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // لملفات اللعبة (HTML/JS/CSS)

// ==== إعداد المحفظة الساخنة (Hot wallet) ====
if (!process.env.HOT_WALLET_WIF || !process.env.COLD_WALLET_ADDRESS) {
  console.error("❌ تأكد من تعيين HOT_WALLET_WIF وCOLD_WALLET_ADDRESS في Environment Variables");
  process.exit(1);
}

const hotKeyPair = ECPair.fromWIF(process.env.HOT_WALLET_WIF);
const { address: hotWalletAddress } = payments.p2pkh({ pubkey: hotKeyPair.publicKey });
const coldWalletAddress = process.env.COLD_WALLET_ADDRESS;

console.log("✅ Hot wallet:", hotWalletAddress);
console.log("✅ Cold wallet (recipient):", coldWalletAddress);

// ==== نقطة النهاية لتلقي أرباح اللعبة ====
app.post('/collect', async (req, res) => {
  try {
    const { amountSatoshi } = req.body; // المبلغ بالساتوشي

    if (!amountSatoshi || amountSatoshi <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // إرسال البيتكوين من Hot wallet إلى Cold wallet
    // ملاحظة: هنا يمكن ربط مع API حقيقي مثل Blockstream أو استخدام شبكة Testnet/Real
    console.log(`🔹 إرسال ${amountSatoshi} satoshi من Hot wallet إلى Cold wallet`);

    // مثال: الرد فقط (تحتاج لربط API أو خادم Bitcoin حقيقي)
    res.json({
      status: 'success',
      from: hotWalletAddress,
      to: coldWalletAddress,
      amountSatoshi
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==== تشغيل السيرفر ====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

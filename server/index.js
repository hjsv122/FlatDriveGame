import express from "express";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as tinysecp from "tiny-secp256k1";
import dotenv from "dotenv";

dotenv.config();

// ✅ تهيئة ECPair من المكتبة الجديدة
const ECPair = ECPairFactory(tinysecp);

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ✅ تحميل المفاتيح من المتغيرات البيئية (Render Environment)
const hotWif = process.env.HOT_WALLET_WIF;
const coldWif = process.env.COLD_WALLET_WIF;

if (!hotWif || !coldWif) {
  console.error("❌ لم يتم العثور على مفاتيح المحافظ في Render Environment.");
  process.exit(1);
}

// ✅ إنشاء الأزواج من المفاتيح الخاصة
const hotKeyPair = ECPair.fromWIF(hotWif);
const coldKeyPair = ECPair.fromWIF(coldWif);

// ✅ توليد العناوين العامة
const hotAddress = bitcoin.payments.p2pkh({ pubkey: hotKeyPair.publicKey }).address;
const coldAddress = bitcoin.payments.p2pkh({ pubkey: coldKeyPair.publicKey }).address;

console.log("✅ تم تحميل المحافظ بنجاح:");
console.log("HOT WALLET:", hotAddress);
console.log("COLD WALLET:", coldAddress);

// ✅ مسار تجريبي لتأكيد أن السيرفر يعمل
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    hotWallet: hotAddress,
    coldWallet: coldAddress,
  });
});

// ✅ استقبال طلبات التحويل من اللعبة (مستقبلاً)
app.post("/api/transfer", (req, res) => {
  const { amount } = req.body;
  console.log(`📦 تحويل ${amount} satoshis من المحفظة الساخنة إلى الباردة`);
  // ملاحظة: لا يتم تنفيذ تحويل حقيقي هنا (بدون عقد/بلوكشين)
  res.json({ success: true, message: "تم استقبال طلب التحويل (محاكاة فقط)." });
});

// ✅ تشغيل الخادم
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});ط

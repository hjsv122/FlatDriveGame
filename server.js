// server.js

const express = require('express');
const cors = require('cors');
const TronWeb = require('tronweb'); // لا حاجة لـ dotenv بعد الآن

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ======= البيانات الثابتة (اختبارية فقط) =======
const serverWalletAddress = 'TU8bJ6onRZprwbp4tMdmAgVTaqjXbXgi52';
const PRIVATE_KEY = '0e2413f4bc348b648b6745dab8fabb6fefa10651be688a2b98a1d75d4326b27d';
// ==============================================

const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io',
  privateKey: PRIVATE_KEY
});

console.log(`🔐 الخادم يستخدم المحفظة: ${serverWalletAddress}`);

const USDT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

// endpoint لجلب الرصيد
app.get('/server-balance', async (req, res) => {
  try {
    const trxSun = await tronWeb.trx.getBalance(serverWalletAddress);
    const trxBalance = tronWeb.fromSun(trxSun);

    const contract = await tronWeb.contract().at(USDT_ADDRESS);
    const usdtRaw = await contract.balanceOf(serverWalletAddress).call();
    const usdtBalance = parseFloat(usdtRaw) / 1e6;

    res.json({ success: true, trxBalance, usdtBalance });
  } catch (err) {
    console.error("Error fetching balance:", err);
    res.json({ success: false, message: err.message });
  }
});

// endpoint للسحب USDT
app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount || amount <= 0) {
    return res.json({ success: false, message: "Invalid request parameters" });
  }
  try {
    const contract = await tronWeb.contract().at(USDT_ADDRESS);
    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();
    res.json({ success: true, tx });
  } catch (err) {
    console.error("Error sending USDT:", err);
    res.json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server (Shasta) running on port ${PORT}`));

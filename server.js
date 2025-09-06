const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TronWeb = require('tronweb');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io',
  privateKey: process.env.PRIVATE_KEY
});

// عنوان عقد USDT على شبكة Shasta
const USDT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

// ✅ API: تحويل USDT
app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount || amount <= 0)
    return res.json({ success: false, message: "بيانات غير صحيحة" });
  try {
    const contract = await tronWeb.contract().at(USDT_ADDRESS);
    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();
    res.json({ success: true, tx });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ✅ API: تحويل TRX
app.post('/withdraw-trx', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount || amount <= 0)
    return res.json({ success: false, message: "بيانات غير صحيحة" });
  try {
    const tx = await tronWeb.trx.sendTransaction(toAddress, tronWeb.toSun(amount));
    res.json({ success: true, tx });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ✅ API: عرض رصيد محفظة الخادم
app.get('/server-balance', async (req, res) => {
  try {
    const address = tronWeb.address.fromPrivateKey(process.env.PRIVATE_KEY);
    const trxBalanceSun = await tronWeb.trx.getBalance(address);
    const trxBalance = tronWeb.fromSun(trxBalanceSun);

    const contract = await tronWeb.contract().at(USDT_ADDRESS);
    const usdtBalanceRaw = await contract.balanceOf(address).call();
    const usdtBalance = usdtBalanceRaw / 1e6;

    res.json({ success: true, trxBalance, usdtBalance, address });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

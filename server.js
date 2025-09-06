require('dotenv').config();
const express = require('express');
const TronWeb = require('tronweb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const FULL_NODE = 'https://api.trongrid.io';
const SOLIDITY_NODE = 'https://api.trongrid.io';
const EVENT_SERVER = 'https://api.trongrid.io';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // مفتاح محفظة الخادم
const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // TRC20 USDT Mainnet

const tronWeb = new TronWeb(FULL_NODE, SOLIDITY_NODE, EVENT_SERVER, PRIVATE_KEY);

app.post('/withdraw-usdt', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!tronWeb.isAddress(toAddress)) {
      return res.status(400).json({ error: 'عنوان خاطئ' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'المبلغ غير صالح' });
    }

    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const balance = await contract.methods.balanceOf(tronWeb.defaultAddress.base58).call();

    const decimals = 6; // USDT TRC20 لديها 6 منازل عشرية
    const amountSun = amount * Math.pow(10, decimals);

    if (Number(balance) < amountSun) {
      return res.status(400).json({ error: 'رصيد USDT في المحفظة غير كافٍ' });
    }

    // تحقق من رصيد TRX لتغطية الرسوم
    const trxBalance = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58);
    if (trxBalance < 100000) { // أقل من 0.1 TRX
      return res.status(400).json({ error: 'رصيد TRX غير كافٍ للرسوم' });
    }

    const tx = await contract.methods.transfer(toAddress, amountSun).send();
    return res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'فشل العملية' });
  }
});

app.post('/withdraw-trx', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!tronWeb.isAddress(toAddress)) {
      return res.status(400).json({ error: 'عنوان خاطئ' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'المبلغ غير صالح' });
    }

    const trxBalance = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58);
    const amountSun = tronWeb.toSun(amount);

    if (trxBalance < amountSun) {
      return res.status(400).json({ error: 'رصيد TRX غير كافٍ' });
    }

    const tx = await tronWeb.trx.sendTransaction(toAddress, amountSun);
    return res.json({ success: true, txId: tx.txid });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'فشل العملية' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

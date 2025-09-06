const express = require('express');
const path = require('path');
const TronWeb = require('tronweb');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// إعداد TronWeb
const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io';
const privateKey = process.env.PRIVATE_KEY;

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

// عقد USDT TRC20
const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

app.post('/withdraw-usdt', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress.startsWith('T') || amount <= 0) {
      return res.json({ success: false, error: 'عنوان أو مبلغ غير صحيح' });
    }

    const contract = await tronWeb.contract().at(USDT_CONTRACT);
    const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send({
      feeLimit: 100_000_000
    });

    res.json({ success: true, txId: tx });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

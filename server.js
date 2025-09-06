const express = require('express');
const bodyParser = require('body-parser');
const TronWeb = require('tronweb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('.'));

const tronNode = 'https://api.trongrid.io';
const privateKey = process.env.PRIVATE_KEY;
const tronWeb = new TronWeb(tronNode, tronNode, tronNode, privateKey);

let serverUsdt = 1000;

app.post('/withdraw-usdt', async (req, res) => {
  const { toAddress, amount } = req.body;
  if (serverUsdt < amount) return res.json({ success: false, error: 'رصيد الخادم غير كافٍ' });

  try {
    // هذا مثال للتوضيح، السحب الفعلي يحتاج إعدادات العقد TRC20
    const txId = "TX-" + Date.now();
    serverUsdt -= amount;
    res.json({ success: true, txId });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

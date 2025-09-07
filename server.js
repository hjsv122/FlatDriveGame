const express = require('express');
const path = require('path');
const TronWeb = require('tronweb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// خدمة الملفات الثابتة (صفحات الواجهة: HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// إعداد TronWeb
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  privateKey: process.env.PRIVATE_KEY || ''
});

// مثال: API لجلب رصيد TRX لمحفظة
app.get('/api/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const balance = await tronWeb.trx.getBalance(address);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// هنا يمكنك إضافة المزيد من endpoints للسحب والتحويل حسب احتياجك

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

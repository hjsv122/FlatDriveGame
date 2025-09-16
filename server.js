// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // مجلد اللعبة (index.html و game.js)

app.post('/create-invoice', async (req, res) => {
  const { amountUSD, payoutAddress } = req.body;

  if (!amountUSD || isNaN(amountUSD) || amountUSD <= 0) {
    return res.status(400).json({ error: "amountUSD غير صالح" });
  }
  if (!payoutAddress) {
    return res.status(400).json({ error: "payoutAddress مطلوب" });
  }

  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: amountUSD,
        price_currency: 'USDT',
        pay_currency: 'BTC',
        payout_address: payoutAddress,
        order_id: `flatdrive_${Date.now()}`,
        order_description: 'FlatDrive Game Earnings',
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to create invoice:', error.response?.data || error.message);
    res.status(500).json({ error: 'فشل في إنشاء الفاتورة' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

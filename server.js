require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// إنشاء فاتورة على NOWPayments
app.post('/create-invoice', async (req, res) => {
  const { amountUSD } = req.body;

  if (!process.env.NOW_API_KEY || !process.env.PAYOUT_WALLET) {
    return res.status(500).json({ error: "NOWPayments API key or payout wallet not configured" });
  }

  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: Number(amountUSD),
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: `flatdrive_${Date.now()}`,
        order_description: 'سحب أرباح FlatDrive',
        payout_address: process.env.PAYOUT_WALLET
      },
      {
        headers: {
          'x-api-key': process.env.NOW_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("NOWPayments error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create invoice", details: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

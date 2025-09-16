const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

app.post('/create-invoice', async (req, res) => {
  const { amount, currency } = req.body;

  if (!amount || !currency) {
    return res.status(400).json({ error: 'Amount and currency are required' });
  }

  try {
    const apiKey = process.env.NOW_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key not configured' });
    }

    const invoiceResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: currency,
        pay_currency: 'usdt',
        order_id: `game_withdraw_${Date.now()}`,
        order_description: 'سحب أرباح من لعبة FlatDrive',
        ipn_callback_url: '', // ضع رابط IPN هنا إن أردت إشعارات دفع
        success_url: '',      // رابط إعادة التوجيه بعد الدفع (اختياري)
      })
    });

    const invoiceData = await invoiceResponse.json();

    if (invoiceData.invoice_id) {
      return res.json({
        invoice_url: invoiceData.invoice_url,
        invoice_id: invoiceData.invoice_id
      });
    } else {
      return res.status(500).json({ error: 'Failed to create invoice', detail: invoiceData });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

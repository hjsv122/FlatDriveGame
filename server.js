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

app.post('/create-invoice', async (req, res) => {
  const { amountUSD } = req.body;

  if (!process.env.PLISIO_API_KEY) {
    console.error("❌ PLISIO_API_KEY not found in .env");
    return res.status(500).json({ error: "Plisio API key not configured" });
  }

  if (!amountUSD || isNaN(amountUSD) || amountUSD <= 0) {
    console.error("❌ amountUSD is invalid:", amountUSD);
    return res.status(400).json({ error: "amountUSD is invalid or missing" });
  }

  // ✳️ النسبة المئوية لرسوم Plisio (افتراضيًا 0.5%)
  const feeRate = parseFloat(process.env.PLISIO_FEE_RATE || '0.005');

  // ✅ خصم الرسوم من المبلغ قبل إرسال الفاتورة
  const netAmount = amountUSD / (1 + feeRate);

  const orderNumber = `flatdrive_${Date.now()}`;
  const orderName = 'FlatDrive Earnings';

  try {
    const params = new URLSearchParams({
      api_key: process.env.PLISIO_API_KEY,
      source_currency: 'USD',
      source_amount: netAmount.toFixed(2),
      currency: 'USDT_TRX',
      order_number: orderNumber,
      order_name: orderName,
      // يمكن إضافة callback_url هنا إذا لزم
    });

    const url = `https://api.plisio.net/api/v1/invoices/new?${params.toString()}`;
    const response = await axios.get(url, { timeout: 10000 });

    const data = response.data;

    if (data.status === 'success' && data.data && data.data.invoice_url) {
      console.log("✅ Invoice created:", data.data.invoice_url);
      res.json({ invoice_url: data.data.invoice_url });
    } else {
      console.error("❌ Plisio API error response:", data);
      res.status(500).json({ error: "Plisio did not return invoice_url", details: data });
    }
  } catch (err) {
    console.error("❌ Plisio request failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect to Plisio", details: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

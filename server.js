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
    console.error("Error: PLISIO_API_KEY not found in env");
    return res.status(500).json({ error: "Plisio API key not configured" });
  }

  if (!amountUSD || isNaN(amountUSD) || amountUSD <= 0) {
    console.error("Error: amountUSD is missing, not a number, or <= 0:", amountUSD);
    return res.status(400).json({ error: "amountUSD is invalid or missing" });
  }

  const orderNumber = `flatdrive_${Date.now()}`;
  const orderName = 'FlatDrive Earnings';

  try {
    // ملاحظة: طلب GET مع params وليس POST مع body
    const params = new URLSearchParams({
      api_key: process.env.PLISIO_API_KEY,
      source_currency: 'USD',
      source_amount: amountUSD.toFixed(2),
      currency: 'USDT_TRX',  // تأكد من أن هذه العملة مدعومة في حسابك
      order_number: orderNumber,
      order_name: orderName,
      // يمكنك إضافة callback_url هنا إذا أردت
      // callback_url: 'https://yourdomain.com/callback'
    });

    const url = `https://api.plisio.net/api/v1/invoices/new?${params.toString()}`;

    const response = await axios.get(url, { timeout: 10000 });

    console.log("Plisio response data:", response.data);

    const data = response.data;

    if (data.status === 'success' && data.data && data.data.invoice_url) {
      res.json({ invoice_url: data.data.invoice_url });
    } else {
      console.error("Plisio did not return success or invoice_url:", data);
      res.status(500).json({ error: "Plisio did not return invoice_url", details: data });
    }
  } catch (err) {
    console.error("Plisio create-invoice error catch:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to connect to Plisio / request rejected", details: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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

  if (!amountUSD || isNaN(amountUSD)) {
    console.error("Error: amountUSD is missing or not a number:", amountUSD);
    return res.status(400).json({ error: "amountUSD is invalid or missing" });
  }

  const orderNumber = `flatdrive_${Date.now()}`; // ضمان أنه فريد
  const orderName = 'FlatDrive Earnings';

  try {
    // طبق التوثيق — قد يكون GET هو المطلوب، لكن سنبقي على POST إن كان Plisio يدعم
    const response = await axios.post(
      'https://api.plisio.net/api/v1/invoices/new',
      {
        amount: amountUSD.toFixed(2),
        currency: 'USDT_TRX',
        order_name: orderName,
        order_number: orderNumber,
        // يمكنك إضافة callback_url إن أردت
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PLISIO_API_KEY}`
        },
        timeout: 10000
      }
    );

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

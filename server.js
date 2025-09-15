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

// إنشاء فاتورة من Plisio
app.post('/create-invoice', async (req, res) => {
  const { amountUSD } = req.body;

  if (!process.env.PLISIO_API_KEY) {
    return res.status(500).json({ error: "Plisio API key not configured" });
  }

  try {
    const response = await axios.post(
      'https://plisio.net/api/v1/invoices/new',
      {
        amount: amountUSD.toFixed(2),
        currency: 'USDT_TRX', // هذا هو Tether TRC-20
        order_name: 'FlatDrive Earnings',
        order_number: `flatdrive_${Date.now()}`,
        callback_url: '', // يمكن تركها فارغة الآن
        success_url: '',
        failed_url: ''
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PLISIO_API_KEY}`
        }
      }
    );

    const invoice = response.data?.data;

    if (invoice?.invoice_url) {
      res.json({ invoice_url: invoice.invoice_url });
    } else {
      res.status(500).json({ error: 'Failed to generate invoice', details: invoice });
    }

  } catch (error) {
    console.error("Plisio error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create Plisio invoice",
      details: error.response?.data || error.message
    });
  }
});

// بدء تشغيل السيرفر
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

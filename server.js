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

app.post('/create-nowpayment-invoice', async (req, res) => {
  const { amountUSD, orderId } = req.body;

  if (!amountUSD || isNaN(amountUSD)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: parseFloat(amountUSD).toFixed(2),
        price_currency: 'usd',
        pay_currency: 'usdttrc20', // Or use process.env.CURRENCY
        order_id: orderId,
        order_description: 'FlatDrive Game Earnings',
        ipn_callback_url: 'https://yourdomain.com/ipn-handler'
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.invoice_url) {
      return res.json({ invoice_url: response.data.invoice_url });
    } else {
      console.error("Invoice creation failed", response.data);
      return res.status(500).json({ error: "Failed to create invoice", details: response.data });
    }
  } catch (err) {
    console.error("NowPayments error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Server error", details: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

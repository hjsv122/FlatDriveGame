const express = require('express');
const fetch = require('node-fetch'); // هنا استدعاء node-fetch النسخة 2

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('خدمة لعبة FlatDrive-4 تعمل بنجاح!');
});

// مثال طلب API مع NOWPayments
app.post('/create-invoice', async (req, res) => {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح API غير موجود في المتغيرات البيئية' });
  }

  try {
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: req.body.price_amount,
        price_currency: req.body.price_currency,
        pay_currency: req.body.pay_currency,
        order_id: req.body.order_id
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'فشل إنشاء الفاتورة' });
    }

    res.json(data);
  } catch (error) {
    console.error('خطأ في إنشاء الفاتورة:', error);
    res.status(500).json({ error: 'حدث خطأ داخلي' });
  }
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});

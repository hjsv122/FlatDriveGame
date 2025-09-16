document.getElementById('collectBtn').onclick = async () => {
  if (trxEarned < 1) {
    alert("لا توجد أرباح لجمعها.");
    return;
  }

  const amountUSD = parseFloat(trxEarned.toFixed(2));
  const orderId = `game_withdraw_${Date.now()}`;
  trxEarned = 0;
  updateUI();

  try {
    const resp = await fetch('/create-nowpayment-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUSD, orderId })
    });

    const data = await resp.json();

    if (data.invoice_url) {
      window.open(data.invoice_url, '_blank');
      alert("✅ تم إنشاء الفاتورة بنجاح. انتظر تأكيد الدفع.");
    } else {
      alert("❌ فشل في إنشاء الفاتورة.");
    }
  } catch (err) {
    console.error("Invoice error:", err);
    alert("❌ حدث خطأ أثناء إنشاء الفاتورة.");
  }
};

document.getElementById('reqWithdraw').onclick = () => {
  const to = document.getElementById('toAddress').value;
  const amt = parseFloat(document.getElementById('amount').value);

  if (!to.startsWith("T") || amt <= 0 || wallet < amt) {
    alert("تحقق من العنوان أو الرصيد.");
    return;
  }

  const fee = Math.max(1, amt * 0.005); // 0.5% أو 1 TRX كحد أدنى

  if (serverWallet < fee) {
    alert("محفظة الخادم لا تحتوي على رسوم كافية.");
    return;
  }

  fetch('http://localhost:3000/api/send-trx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to,
      amount: amt
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      wallet -= amt;
      serverWallet -= fee;
      updateUI();
      alert(`✅ تم إرسال ${amt} TRX إلى ${to}. رسوم التحويل: ${fee.toFixed(2)} TRX.`);
    } else {
      alert(`❌ فشل التحويل: ${data.message}`);
    }
  })
  .catch(err => alert("حدث خطأ أثناء الاتصال بالخادم."));
};

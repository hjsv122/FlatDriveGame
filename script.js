let wallet = 0;

document.getElementById('reqWithdraw').onclick = async () => {
  const to = document.getElementById('toAddress').value.trim();
  const amt = parseFloat(document.getElementById('amount').value);

  if (!to.startsWith('T') || amt <= 0 || wallet < amt) {
    alert("تحقق من العنوان أو الرصيد.");
    return;
  }

  try {
    const response = await fetch('/withdraw-usdt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toAddress: to, amount: amt })
    });

    const data = await response.json();

    if (data.success) {
      wallet -= amt;
      alert(`✅ تم السحب بنجاح!\nTX ID: ${data.txId}`);
    } else {
      alert(`❌ فشل السحب: ${data.error || 'خطأ غير معروف'}`);
    }
  } catch (err) {
    console.error(err);
    alert('❌ فشل السحب: خطأ في الاتصال بالخادم');
  }
};

let distance = 0;
let earned = 0;
let wallet = 0;
let running = false;

// تحديث الواجهة
function updateUI() {
  document.getElementById("distance").textContent = distance;
  document.getElementById("earned").textContent = earned;
  document.getElementById("wallet").textContent = wallet.toFixed(2);
  document.getElementById("status").textContent = running ? "تعمل" : "متوقفة";
}

// بدء القيادة
document.getElementById("startBtn").onclick = () => {
  if (!running) {
    running = true;
    gameLoop();
  }
};

// التوقف
document.getElementById("stopBtn").onclick = () => {
  running = false;
};

// حلقة اللعبة
function gameLoop() {
  if (!running) return;

  distance += 10;
  earned += 0.01;
  wallet += 0.01;
  updateUI();

  setTimeout(gameLoop, 500);
}

// تنفيذ السحب
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
      updateUI();
      alert(`✅ تم السحب بنجاح!\nTX ID: ${data.txId}`);
    } else {
      alert(`❌ فشل السحب: ${data.error || 'خطأ غير معروف'}`);
    }
  } catch (err) {
    console.error(err);
    alert('❌ فشل السحب: خطأ في الاتصال بالخادم');
  }
};

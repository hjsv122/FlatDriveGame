const car = document.getElementById('car');
const earningsDisplay = document.getElementById('earnings');
const collectBtn = document.getElementById('collectBtn');

let trxEarned = 0;
let carPosition = 0;
const carSpeed = 5; // كما طلبت لا نغيرها

function updateEarningsDisplay() {
  earningsDisplay.textContent = `الأرباح: ${trxEarned.toFixed(4)} USDT`;
}

function simulateEarnings() {
  // كل ثانية نزيد الأرباح بشكل عشوائي (كمثال)
  trxEarned += 0.001 + Math.random() * 0.004;
  updateEarningsDisplay();
}

// تحريك السيارة يمين ويسار (كمثال مبسط فقط)
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') {
    carPosition += carSpeed;
    if (carPosition > 540) carPosition = 540; // حدود اللعبة
    car.style.left = carPosition + 'px';
  } else if (e.key === 'ArrowLeft') {
    carPosition -= carSpeed;
    if (carPosition < 0) carPosition = 0;
    car.style.left = carPosition + 'px';
  }
});

collectBtn.onclick = async () => {
  if (trxEarned < 0.001) {
    alert("لا توجد أرباح كافية لجمعها.");
    return;
  }

  const payoutAddress = prompt("ادخل عنوان محفظة BTC لاستلام الأرباح:");

  if (!payoutAddress) {
    alert("يرجى إدخال عنوان المحفظة.");
    return;
  }

  try {
    const response = await fetch('/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountUSD: trxEarned,
        payoutAddress: payoutAddress
      }),
    });

    const data = await response.json();

    if (data.invoice_url) {
      window.open(data.invoice_url, '_blank');
      alert("تم إنشاء فاتورة الدفع. الرجاء إتمام الدفع.");
      trxEarned = 0;
      updateEarningsDisplay();
    } else {
      alert("حدث خطأ في إنشاء الفاتورة.");
    }
  } catch (error) {
    alert("فشل في الاتصال بالخادم.");
    console.error(error);
  }
};

// محاكاة الأرباح كل ثانية
setInterval(simulateEarnings, 1000);

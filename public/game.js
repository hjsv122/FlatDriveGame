document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let trxEarned = 0;
  let distance = 0;
  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  const walletAddressElem = document.getElementById('walletAddress');
  const walletBalanceElem = document.getElementById('walletBalance');
  const privateKeyElem = document.getElementById('privateKey');
  const trxEarnedElem = document.getElementById('trxEarned');
  const distanceElem = document.getElementById('distance');
  const statusElem = document.getElementById('status');

  let walletAddress = '';

  fetch('/wallet-address')
    .then(res => res.json())
    .then(data => {
      walletAddress = data.address;
      walletAddressElem.textContent = walletAddress;
      privateKeyElem.textContent = '(مخفي)';
      walletBalanceElem.textContent = '--';
      updateBalance();
    });

  function updateBalance() {
    fetch('/balance?address=' + walletAddress)
      .then(res => res.json())
      .then(data => {
        walletBalanceElem.textContent = data.balance || '0.0000';
      });
  }

  const updateUI = () => {
    trxEarnedElem.textContent = Math.floor(trxEarned);
    distanceElem.textContent = distance;
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08323a';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillStyle = carColor;
    ctx.fillRect(carX, canvas.height - 44, 60, 28);
    ctx.fillStyle = '#061119';
    ctx.beginPath();
    ctx.arc(carX + 12, canvas.height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 48, canvas.height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const gameTick = () => {
    if (!running) return;
    carX += speed;
    if (carX > canvas.width) carX = -80;
    distance += speed;
    if (Math.random() < 0.9) {
      trxEarned += Math.floor(Math.random() * 5) + 1;
    }
    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById('carColor').onchange = e => {
    carColor = e.target.value;
  };

  document.getElementById('startBtn').onclick = () => {
    speedLevel++;
    if (speedLevel === 1) speed = 10;
    else if (speedLevel === 2) speed = 20;
    else if (speedLevel === 3) speed = 35;
    else if (speedLevel >= 4) speed = 60;
    running = true;
    statusElem.textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    statusElem.textContent = 'متوقفة';
  };

  document.getElementById('collectBtn').onclick = async () => {
    if (trxEarned < 1) {
      alert("لا توجد أرباح لجمعها.");
      return;
    }
    const amountToSend = trxEarned;
    trxEarned = 0;
    updateUI();
    try {
      const response = await fetch('/send-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToSend })
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ تم إرسال ${amountToSend} USDT إلى المحفظة الحقيقية.`);
        updateBalance();
      } else {
        alert('❌ فشل إرسال الأرباح: ' + result.error);
      }
    } catch (err) {
      alert('❌ خطأ في الاتصال بالخادم.');
    }
  };

  // إلغاء زر الإرسال الخارجي
  document.getElementById('sendBtn').onclick = () => {
    alert("🚫 الإرسال اليدوي غير مفعل في هذه النسخة.");
  };
});

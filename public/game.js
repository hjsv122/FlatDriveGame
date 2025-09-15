document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false,
      trxEarned = 0,
      distance = 0,
      carX = 10,
      carColor = '#ff6b6b',
      speedLevel = 0,
      speed = 10;

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('distance').textContent = distance;
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
    if (Math.random() < 0.9) trxEarned += Math.floor(Math.random() * 5) + 1;
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
    else speed = 60;

    running = true;
    document.getElementById('status').textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    document.getElementById('status').textContent = 'متوقفة';
  };

  // ✅ تحديث زر "اجمع" ليستخدم Plisio API
  document.getElementById('collectBtn').onclick = async () => {
    if (trxEarned < 1) {
      alert("لا توجد أرباح لجمعها.");
      return;
    }

    const amountUSD = trxEarned;
    trxEarned = 0;
    updateUI();

    try {
      const resp = await fetch('/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD })
      });

      const data = await resp.json();

      if (data.invoice_url) {
        window.open(data.invoice_url, '_blank');
        alert("✅ تم إنشاء فاتورة دفع عبر Plisio.");
      } else {
        alert("❌ لم يتم إنشاء الفاتورة. تحقق من الخادم.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء الاتصال بـ Plisio.");
    }
  };

  updateUI();
  draw();
});

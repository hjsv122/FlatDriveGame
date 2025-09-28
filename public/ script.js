document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let trxEarned = 0;
  let wallet = 0;
  let gameFund = 0;
  let distance = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('wallet').textContent = wallet.toFixed(2);
    document.getElementById('gameFund').textContent = gameFund.toFixed(2);
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
    else if (speedLevel >= 4) speed = 60;

    running = true;
    document.getElementById('status').textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    document.getElementById('status').textContent = 'متوقفة';
  };

  document.getElementById('collectBtn').onclick = () => {
    if (trxEarned < 1) {
      alert("لا توجد أرباح لجمعها.");
      return;
    }

    const fundFee = trxEarned * 0.05;
    const netEarned = trxEarned - fundFee;

    gameFund += fundFee;
    wallet += netEarned;
    trxEarned = 0;
    updateUI();

    alert(`تم تحويل ${netEarned.toFixed(2)} USDT إلى محفظتك الداخلية.\nتم إضافة ${fundFee.toFixed(2)} USDT كتمويل للعبة.`);
  };

  document.getElementById('convertFund').onclick = () => {
    if (gameFund <= 0) {
      alert("لا يوجد رصيد تمويل لتحويله.");
      return;
    }
    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("✅ تم تحويل تمويل اللعبة إلى محفظتك الداخلية.");
  };

  document.getElementById('withdrawBtn').onclick = async () => {
    const to = prompt("أدخل عنوان المحفظة:");
    if (!to) return;
    const amount = prompt("أدخل المبلغ (USDT):");
    if (!amount || isNaN(amount)) return;

    try {
      const res = await fetch("https://YOUR-RENDER-URL.onrender.com/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ تم الإرسال بنجاح\n" + data.message);
      } else {
        alert("❌ فشل في تنفيذ المعاملة.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ فشل في الاتصال بالخادم.");
    }
  };

  updateUI();
  draw();
});

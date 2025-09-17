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
    speed = [10, 20, 35, 60][Math.min(speedLevel - 1, 3)];
    running = true;
    document.getElementById('status').textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    document.getElementById('status').textContent = 'متوقفة';
  };

  document.getElementById('collectBtn').onclick = () => {
    if (trxEarned < 1) return alert("لا توجد أرباح لجمعها.");
    const fee = trxEarned * 0.05;
    const net = trxEarned - fee;
    gameFund += fee;
    wallet += net;
    trxEarned = 0;
    updateUI();
    alert(`تم تحويل ${net.toFixed(2)} USDT إلى محفظتك.\nتم تمويل اللعبة بـ ${fee.toFixed(2)}.`);
  };

  document.getElementById('convertFund').onclick = () => {
    if (gameFund <= 0) return alert("لا يوجد رصيد لتحويله.");
    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("✅ تم تحويل تمويل اللعبة إلى المحفظة.");
  };

  document.getElementById('withdrawBtn').onclick = async () => {
    if (wallet <= 0) return alert("لا يوجد رصيد كافٍ.");
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: wallet.toFixed(2),
          order_id: `order_${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.code === 0) {
        wallet = 0;
        updateUI();
        window.open(data.data.pay_url, '_blank');
      } else {
        alert("فشل في إنشاء رابط الدفع");
      }
    } catch (err) {
      alert("خطأ أثناء محاولة الدفع");
      console.error(err);
    }
  };

  updateUI();
  draw();
});

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
  let serverWallet = 0;
  let serverWalletUSDT = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  const API_BASE = 'https://your-render-url.onrender.com'; // ← غيّرها لاحقًا إلى رابط الخادم

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('wallet').textContent = wallet.toFixed(2);
    document.getElementById('gameFund').textContent = gameFund.toFixed(2);
    document.getElementById('distance').textContent = distance;
    document.getElementById('serverWallet').textContent = serverWallet.toFixed(2);
    document.getElementById('serverWalletUSDT').textContent = serverWalletUSDT.toFixed(2);
  };

  async function fetchServerBalances() {
    try {
      const trxRes = await fetch(`${API_BASE}/balance/trx`);
      const usdtRes = await fetch(`${API_BASE}/balance/usdt`);

      const trxData = await trxRes.json();
      const usdtData = await usdtRes.json();

      serverWallet = trxData.balance;
      serverWalletUSDT = usdtData.balance;
      updateUI();
    } catch (err) {
      console.error('فشل في جلب الرصيد الحقيقي:', err);
    }
  }

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
    if (Math.random() < 0.7) trxEarned += 1;
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
    document.getElementById('status').

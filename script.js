document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 720;
  const height = canvas.height = 140;

  let running = false,
      trxEarned = 0,
      wallet = 0,
      gameFund = 0,
      distance = 0,
      serverWallet = 0,
      serverWalletUSDT = 0;

  let carX = 10, carColor = '#ff6b6b', speedLevel = 0, speed = 10;

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('wallet').textContent = wallet.toFixed(2);
    document.getElementById('gameFund').textContent = gameFund.toFixed(2);
    document.getElementById('distance').textContent = distance;
    document.getElementById('serverWallet').textContent = serverWallet.toFixed(2);
    document.getElementById('serverWalletUSDT').textContent = serverWalletUSDT.toFixed(2);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#08323a';
    ctx.fillRect(0, height - 20, width, 20);
    ctx.fillStyle = carColor;
    ctx.fillRect(carX, height - 44, 60, 28);
    ctx.fillStyle = '#061119';
    ctx.beginPath();
    ctx.arc(carX + 12, height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 48, height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const gameTick = () => {
    if (!running) return;
    carX = (carX + speed) % (width + 80) - 80;
    distance += speed;
    if (Math.random() < 0.7) trxEarned++;
    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById('carColor').onchange = e => carColor = e.target.value;
  document.getElementById('startBtn').onclick = () => {
    speedLevel++;
    speed = speedLevel >= 4 ? 60 : speedLevel === 3 ? 35 : speedLevel === 2 ? 20 : 10;
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
    const totalUSDT = trxEarned;
    const fee = totalUSDT * 0.03;
    const netUSDT = totalUSDT - fee;
    gameFund += fee;
    wallet += netUSDT;
    trxEarned = 0;
    updateUI();
    alert(`تم تحويل ${netUSDT.toFixed(2)} USDT (خصم 3%).`);
  };

  document.getElementById('convertFund').onclick = () => {
    if (!gameFund) return alert("لا يوجد تمويل للعبة.");
    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("تم تحويل تمويل اللعبة إلى محفظتك.");
  };

  document.getElementById('reqWithdraw').onclick = async () => {
    const to = document.getElementById('toAddress').value;
    const amt = parseFloat(document.getElementById('amount').value);
    if (!to.startsWith("T") || !amt || wallet < amt) return alert("تحقق من العنوان أو الرصيد.");
    try {
      const res = await fetch('/withdraw-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toAddress: to, amount: amt })
      });
      const data = await res.json();
      if (data.success) {
        wallet -= amt;
        updateUI();
        alert(`تم سحب ${amt.toFixed(2)} USDT.`);
      } else {
        alert(`فشل السحب: ${data.message}`);
      }
    } catch {
      alert("خطأ في الخادم.");
    }
  };

  document.getElementById('sendUSDTToServer').onclick = () => {
    const amt = parseFloat(document.getElementById('usdtToServerAmount').value);
    if (!amt || amt > wallet) return alert("مبلغ غير صالح أو أكبر من رصيدك.");
    wallet -= amt;
    serverWalletUSDT += amt;
    updateUI();
    alert(`تم تحويل ${amt.toFixed(2)} USDT إلى محفظة الخادم.`);
  };

  document.getElementById('withdrawFromServer').onclick = () => {
    const amt = parseFloat(document.getElementById('serverToWalletAmount').value);
    if (!amt || amt > serverWalletUSDT) return alert("رصيد غير كافٍ.");
    serverWalletUSDT -= amt;
    wallet += amt;
    updateUI();
    alert(`تم سحب ${amt.toFixed(2)} USDT من محفظة الخادم.`);
  };

  updateUI();
  draw();

  async function fetchServerBalance() {
    try {
      const res = await fetch('/server-balance');
      const data = await res.json();
      if (data.success) {
        serverWallet = parseFloat(data.trxBalance);
        serverWalletUSDT = parseFloat(data.usdtBalance);
        updateUI();
      } else {
        console.warn("لم يتمكن من جلب رصيد الخادم:", data.message);
      }
    } catch (e) {
      console.error("خطأ أثناء جلب رصيد الخادم:", e);
    }
  }
  fetchServerBalance();
  setInterval(fetchServerBalance, 60000);
});

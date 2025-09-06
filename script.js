// script.js

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false,
      trxEarned = 0,
      wallet = 0,
      gameFund = 0,
      distance = 0,
      serverWallet = 0,
      serverWalletUSDT = 0;

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('wallet').textContent = wallet.toFixed(2);
    document.getElementById('gameFund').textContent = gameFund.toFixed(2);
    document.getElementById('distance').textContent = distance;
    document.getElementById('serverWallet').textContent = serverWallet.toFixed(2);
    document.getElementById('serverWalletUSDT').textContent = serverWalletUSDT.toFixed(2);
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08323a';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(trxEarned % canvas.width, canvas.height - 44, 60, 28);
  };

  const gameTick = () => {
    if (!running) return;
    trxEarned++;
    distance += 10;
    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById('startBtn').onclick = () => {
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
    alert(`تم تحويل ${netUSDT.toFixed(2)} USDT (بعد خصم 3%).`);
  };

  document.getElementById('convertFund').onclick = () => {
    if (!gameFund) return alert("لا يوجد تمويل للعبة.");
    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("تم تحويل التمويل إلى محفظتك.");
  };

  document.getElementById('reqWithdraw').onclick = async () => {
    const to = document.getElementById('toAddress').value;
    const amt = parseFloat(document.getElementById('amount').value);
    if (!to.startsWith("T") || !amt || wallet < amt) return alert("تحقق من العنوان أو المبلغ.");
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

  async function fetchServerBalance() {
    try {
      const res = await fetch('/server-balance');
      const data = await res.json();
      if (data.success) {
        serverWallet = parseFloat(data.trxBalance);
        serverWalletUSDT = parseFloat(data.usdtBalance);
        updateUI();
      } else {
        console.warn("Error fetching server balance:", data.message);
      }
    } catch (e) {
      console.error("Fetch server balance error:", e);
    }
  }

  fetchServerBalance();
  setInterval(fetchServerBalance, 60000);
  updateUI();
});

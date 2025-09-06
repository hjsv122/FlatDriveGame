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
    const rate = 1;
    const totalUSDT = trxEarned * rate;
    const fee = totalUSDT * 0.03;
    const netUSDT = totalUSDT - fee;
    gameFund += fee;
    wallet += netUSDT;
    trxEarned = 0;
    updateUI();
    alert(`تم تحويل ${netUSDT.toFixed(2)} USDT إلى محفظتك الداخلية (خصم 3% تمويل).`);
  };

  document.getElementById('convertFund').onclick = () => {
    if (gameFund <= 0) {
      alert("لا يوجد رصيد في محفظة التمويل.");
      return;
    }
    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("✅ تم تحويل تمويل اللعبة إلى محفظتك الداخلية.");
  };

  document.getElementById('fundServerBtn').onclick = () => {
    const amt = parseFloat(document.getElementById('fundAmount').value);
    if (isNaN(amt) || amt <= 0 || amt > trxEarned) {
      alert("مبلغ غير صحيح أو أكبر من أرباحك.");
      return;
    }
    trxEarned -= amt;
    serverWallet += amt;
    updateUI();
    alert(`✅ تم تحويل ${amt} TRX إلى محفظة الخادم.`);
  };

  document.getElementById('reqWithdraw').onclick = async () => {
    const to = document.getElementById('toAddress').value;
    const amt = parseFloat(document.getElementById('amount').value);
    if (!to.startsWith("T") || amt <= 0 || wallet < amt) {
      alert("تحقق من العنوان أو الرصيد.");
      return;
    }
    try {
      let res = await fetch('/withdraw-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toAddress: to, amount: amt })
      });
      let data = await res.json();
      if (data.success) {
        wallet -= amt;
        updateUI();
        alert(`✅ تم سحب ${amt.toFixed(2)} USDT بنجاح.`);
      } else {
        alert(`❌ فشل السحب: ${data.message}`);
      }
    } catch (e) {
      alert("❌ خطأ بالخادم.");
    }
  };

  document.getElementById('sendUSDTToServer').onclick = () => {
    const amt = parseFloat(document.getElementById('usdtToServerAmount').value);
    if (isNaN(amt) || amt <= 0 || amt > wallet) {
      alert("مبلغ غير صحيح أو أكبر من رصيدك الداخلي.");
      return;
    }
    wallet -= amt;
    serverWalletUSDT += amt;
    updateUI();
    alert(`✅ تم تحويل ${amt.toFixed(2)} USDT من محفظتك الداخلية إلى محفظة الخادم.`);
  };

  document.getElementById('withdrawFromServer').onclick = () => {
    const amt = parseFloat(document.getElementById('serverToWalletAmount').value);
    if (isNaN(amt) || amt <= 0) {
      alert("يرجى إدخال مبلغ صالح.");
      return;
    }
    if (serverWalletUSDT < amt) {
      alert("لا يوجد رصيد كافٍ في محفظة الخادم.");
      return;
    }
    serverWalletUSDT -= amt;
    wallet += amt;
    updateUI();
    alert(`✅ تم سحب ${amt.toFixed(2)} USDT من محفظة الخادم إلى محفظتك الداخلية.`);
  };

  // ✅ جلب رصيد الخادم من السيرفر
  async function fetchServerBalance() {
    try {
      const res = await fetch('/server-balance');
      const data = await res.json();
      if (data.success) {
        serverWallet = parseFloat(data.trxBalance);
        serverWalletUSDT = parseFloat(data.usdtBalance);
        updateUI();
      } else {
        console.warn("❌ لم يتمكن من جلب الرصيد:", data.message);
      }
    } catch (e) {
      console.error("❌ خطأ أثناء جلب رصيد الخادم:", e);
    }
  }

  fetchServerBalance(); // عند بدء التشغيل
  setInterval(fetchServerBalance, 60000); // كل 60 ثانية

  updateUI();
  draw();
});

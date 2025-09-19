// public/game.js
// Assumes server endpoints are available under /api
// Uses ethers (included in index.html)

document.addEventListener("DOMContentLoaded", async () => {
  // API base - relative to same origin
  const API_BASE = '/api';

  // We'll use a JSON-RPC provider only on the server to read balances (client will request balance via API).
  // Create or load local wallet (client-side) but it will NOT be used to send on-chain transfers (server does).
  let userWallet;
  let usdtDecimals = 6; // fallback; server uses same decimals
  const usdtAddressFallback = "0x3813e82e6f7098b9583FC0F33a962D02018B6803";

  // Create/load wallet in localStorage
  function loadOrCreateWallet() {
    const saved = localStorage.getItem("flatdrive_wallet");
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj.privateKey && obj.address) {
          userWallet = new ethers.Wallet(obj.privateKey);
        } else createNewWallet();
      } catch {
        createNewWallet();
      }
    } else {
      createNewWallet();
    }
  }

  function createNewWallet() {
    userWallet = ethers.Wallet.createRandom();
    localStorage.setItem("flatdrive_wallet", JSON.stringify({
      address: userWallet.address,
      privateKey: userWallet.privateKey
    }));
  }

  // Fetch real USDT balance for the user's address via server endpoint
  async function fetchRealUSDTBalance() {
    try {
      const resp = await fetch(`${API_BASE}/address-balance/${userWallet.address}`);
      if (!resp.ok) throw new Error('failed');
      const json = await resp.json();
      if (json && json.balance != null) {
        document.getElementById("realWallet").textContent = Number(json.balance).toFixed(6);
        usdtDecimals = json.decimals || usdtDecimals;
      } else {
        document.getElementById("realWallet").textContent = "0.00";
      }
    } catch (e) {
      document.getElementById("realWallet").textContent = "خطأ!";
      console.error("فشل في قراءة الرصيد من الخادم:", e);
    }
  }

  function updateWalletUI() {
    document.getElementById("walletAddress").textContent = userWallet.address;
  }

  function showPrivateKey() {
    const ok = confirm("🔐 سوف يعرض المفتاح الخاص — لا تشاركه مع أحد. تابع؟");
    if (ok) alert("🔐 مفتاحك الخاص:\n" + userWallet.privateKey);
  }

  // --- Game state ---
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let trxEarned = 0;
  let walletBalance = 0;
  let gameFund = 0;
  let distance = 0;

  let carX = 10;
  let carColor = "#ff6b6b";
  let speedLevel = 0;
  let speed = 10;

  function updateUI() {
    document.getElementById("trxEarned").textContent = Math.floor(trxEarned);
    document.getElementById("wallet").textContent = walletBalance.toFixed(2);
    document.getElementById("gameFund").textContent = gameFund.toFixed(2);
    document.getElementById("distance").textContent = distance;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#08323a";
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    ctx.fillStyle = carColor;
    ctx.fillRect(carX, canvas.height - 44, 60, 28);

    ctx.fillStyle = "#061119";
    ctx.beginPath();
    ctx.arc(carX + 12, canvas.height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 48, canvas.height - 12, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function gameTick() {
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
  }

  // --- Signing & server interactions ---

  // sign a report message: flatdrive-report:{address}:{earned}:{nonce}
  async function signReport(address, earnedNumber, nonce) {
    const message = `flatdrive-report:${address}:${earnedNumber}:${nonce}`;
    const sig = await userWallet.signMessage(message);
    return sig;
  }

  async function sendReportToServer(earnedAmount) {
    const nonce = Date.now();
    const signature = await signReport(userWallet.address, earnedAmount, nonce);
    const body = {
      address: userWallet.address,
      earned: Number(earnedAmount),
      nonce,
      signature
    };
    const r = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.json();
  }

  // claim: sign claim message and request payout
  async function claimEarnings() {
    // get last nonce from server (optional) or use timestamp
    // We'll request server status to find last nonce stored and use it to sign claim (recommended)
    try {
      const s = await fetch(`${API_BASE}/status/${userWallet.address}`);
      const sjson = await s.json();
      let lastNonce = 0;
      if (sjson && Array.isArray(sjson.sessions) && sjson.sessions.length > 0) {
        lastNonce = sjson.sessions[0].nonce || 0;
      } else {
        lastNonce = Date.now();
      }
      const message = `flatdrive-claim:${userWallet.address}:${lastNonce}`;
      const signature = await userWallet.signMessage(message);
      const r = await fetch(`${API_BASE}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userWallet.address, signature })
      });
      const json = await r.json();
      return json;
    } catch (e) {
      console.error('claim error', e);
      return { error: e.message || 'claim_failed' };
    }
  }

  // --- Events ---
  document.getElementById("carColor").addEventListener("change", (e) => {
    carColor = e.target.value;
  });

  document.getElementById("startBtn").addEventListener("click", () => {
    speedLevel++;
    if (speedLevel === 1) speed = 10;
    else if (speedLevel === 2) speed = 20;
    else if (speedLevel === 3) speed = 35;
    else if (speedLevel >= 4) speed = 60;

    if (!running) {
      running = true;
      document.getElementById("status").textContent = "تعمل";
      gameTick();
    }
  });

  document.getElementById("stopBtn").addEventListener("click", () => {
    running = false;
    document.getElementById("status").textContent = "متوقفة";
  });

  document.getElementById("collectBtn").addEventListener("click", async () => {
    if (trxEarned < 1) {
      alert("🚫 لا توجد أرباح لجمعها.");
      return;
    }

    // 1) أرسل تقريراً للخادم
    const earnedFloat = Number(trxEarned);
    try {
      const reportResp = await sendReportToServer(earnedFloat);
      if (!reportResp.ok) {
        alert('خطأ في إرسال التقرير: ' + (reportResp.error || JSON.stringify(reportResp)));
        return;
      }

      // 2) اطلب claim تلقائيًا
      const claimResp = await claimEarnings();
      if (claimResp.ok) {
        // ضع أرباحك المحلية إلى صفر — الدفع على البلوكتشين يتم من Hot Wallet على الخادم
        trxEarned = 0;
        updateUI();
        alert('✅ طلب سحب مُرسل للخادم\nTX: ' + claimResp.txHash + '\nالمبلغ: ' + claimResp.amount);
        // حدّث رصيد USDT الحقيقي بعد فترة قصيرة
        setTimeout(fetchRealUSDTBalance, 8000);
      } else {
        alert('فشل في طلب السحب: ' + (claimResp.error || JSON.stringify(claimResp)));
      }
    } catch (e) {
      console.error(e);
      alert('خطأ غير متوقع عند المحاولة');
    }
  });

  document.getElementById("convertFund").addEventListener("click", () => {
    if (gameFund <= 0) {
      alert("🚫 لا يوجد تمويل لتحويله.");
      return;
    }

    walletBalance += gameFund;
    gameFund = 0;
    updateUI();

    alert("✅ تم تحويل تمويل اللعبة إلى الرصيد الداخلي.");
  });

  document.getElementById("showPrivateBtn").addEventListener("click", () => {
    showPrivateKey();
  });

  // --- Start app ---
  loadOrCreateWallet();
  updateWalletUI();
  updateUI();
  draw();
  await fetchRealUSDTBalance();

  // Optionally poll real balance every 30s
  setInterval(fetchRealUSDTBalance, 30000);
});

document.addEventListener("DOMContentLoaded", () => {
  const bitcoin = window.bitcoin || window.bitcoinjs || window.bitcoinjsLib || window.Bitcoin || window.BitcoinJS;
  if (!bitcoin) {
    alert('خطأ: لم يتم تحميل مكتبة bitcoinjs.');
    return;
  }

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let btcEarned = 0;
  let walletBtc = 0;
  let gameFund = 0;
  let distance = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  let keyPair = null;
  let address = '—';
  let wif = '—';

  const elEarn = document.getElementById('btcEarned');
  const elWallet = document.getElementById('walletBtc');
  const elAddress = document.getElementById('btcAddress');
  const elWif = document.getElementById('btcWif');
  const elStatus = document.getElementById('status');
  const elGameFund = document.getElementById('gameFund');

  const updateUI = () => {
    elEarn.textContent = Math.floor(btcEarned);
    elWallet.textContent = Math.floor(walletBtc);
    elGameFund.textContent = Math.floor(gameFund);
    elAddress.textContent = address;
    elWif.textContent = wif;
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

    const add = Math.floor(Math.random() * 50) + 50;
    btcEarned += add;

    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  function generateWallet(saveToLocal = true) {
    try {
      if (bitcoin.ECPair && bitcoin.payments) {
        keyPair = bitcoin.ECPair.makeRandom();
        const p2pkh = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        address = p2pkh.address || '—';
        wif = keyPair.toWIF();
      } else {
        alert('نسخة المكتبة لا تدعم ECPair.makeRandom()');
        return;
      }

      if (saveToLocal) {
        localStorage.setItem('btcAddress', address);
        localStorage.setItem('btcWif', wif);
      }
    } catch (err) {
      console.error(err);
      alert('فشل توليد المحفظة: ' + err.message);
      return;
    }

    updateUI();
  }

  // استرجاع المحفظة من LocalStorage
  const savedAddress = localStorage.getItem('btcAddress');
  const savedWif = localStorage.getItem('btcWif');

  if (savedAddress && savedWif) {
    address = savedAddress;
    wif = savedWif;
    updateUI();
  } else {
    generateWallet(); // توليد أولي
  }

  document.getElementById('carColor').onchange = e => {
    carColor = e.target.value;
    draw();
  };

  document.getElementById('startBtn').onclick = () => {
    speedLevel++;
    if (speedLevel === 1) speed = 10;
    else if (speedLevel === 2) speed = 20;
    else if (speedLevel === 3) speed = 35;
    else if (speedLevel >= 4) speed = 60;

    running = true;
    elStatus.textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    elStatus.textContent = 'متوقفة';
  };

  document.getElementById('collectBtn').onclick = async () => {
    if (btcEarned < 1) {
      alert("لا توجد أرباح كافية للجمع.");
      return;
    }

    const fee = Math.floor(btcEarned * 0.05);
    const net = btcEarned - fee;

    try {
      const res = await fetch("https://your-server.com/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "x-api-key": "YOUR_API_KEY", // في حال أضفت حماية
        },
        body: JSON.stringify({ amount: net })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "خطأ غير معروف");

      walletBtc += net;
      gameFund += fee;
      btcEarned = 0;
      updateUI();

      alert(`✅ تم إرسال ${net} ساتوشي إلى المحفظة الحقيقية.\n📦 TXID: ${data.txid}`);
    } catch (err) {
      alert("❌ فشل التحويل: " + err.message);
    }
  };

  document.getElementById('transferFundBtn').onclick = () => {
    if (gameFund < 1) {
      alert("رصيد تمويل اللعبة غير كافي للتحويل.");
      return;
    }

    walletBtc += gameFund;
    alert(`✅ تم تحويل ${gameFund} BTC من تمويل اللعبة إلى الرصيد الداخلي.`);
    gameFund = 0;
    updateUI();
  };

  document.getElementById('generateBtn').onclick = () => {
    if (!confirm('هل تريد توليد محفظة جديدة؟ سيستبدل هذا المفتاح الحالي.')) return;
    generateWallet();
  };

  document.getElementById('copyAddr').onclick = () => {
    navigator.clipboard?.writeText(address).then(() => alert('تم نسخ العنوان'), () => alert('فشل النسخ'));
  };

  document.getElementById('copyWif').onclick = () => {
    navigator.clipboard?.writeText(wif).then(() => alert('تم نسخ المفتاح الخاص (WIF) — احفظه بأمان!'), () => alert('فشل النسخ'));
  };

  draw();
});

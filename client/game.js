document.addEventListener("DOMContentLoaded", () => {
  const bitcoin = window.bitcoinjsLib;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let btcEarned = 0; // أرباح مؤقتة بالساتوشي
  let walletBtc = 0; // الرصيد الداخلي
  let gameFund = 0; // تمويل اللعبة
  let distance = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 50;

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
    elEarn.textContent = (btcEarned / 1e8).toFixed(8);
    elWallet.textContent = (walletBtc / 1e8).toFixed(8);
    elGameFund.textContent = (gameFund / 1e8).toFixed(8);
    elAddress.textContent = address;
    elWif.textContent = wif;
  };

  const draw = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#08323a';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillStyle = carColor;
    ctx.fillRect(carX, canvas.height - 44, 60, 28);
    ctx.fillStyle = '#061119';
    ctx.beginPath();
    ctx.arc(carX + 12, canvas.height - 12, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 48, canvas.height - 12, 8, 0, Math.PI*2);
    ctx.fill();
  };

  const gameTick = () => {
    if (!running) return;
    carX += speed;
    if (carX > canvas.width) carX = -80;
    distance += speed;
    const add = Math.floor(Math.random() * 5000000) + 5000000; // 5-10 مليون ساتوشي
    btcEarned += add;
    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  function generateWallet(saveToLocal = true) {
    if (bitcoin.ECPair && bitcoin.payments) {
      keyPair = bitcoin.ECPair.makeRandom();
      const p2pkh = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      address = p2pkh.address || '—';
      wif = keyPair.toWIF();
    }
    if (saveToLocal) {
      localStorage.setItem('btcAddress', address);
      localStorage.setItem('btcWif', wif);
    }
    updateUI();
  }

  const savedAddress = localStorage.getItem('btcAddress');
  const savedWif = localStorage.getItem('btcWif');
  if (savedAddress && savedWif) {
    address = savedAddress;
    wif = savedWif;
    updateUI();
  } else generateWallet();

  document.getElementById('carColor').onchange = e => { carColor = e.target.value; draw(); };
  
  document.getElementById('startBtn').onclick = () => {
    speedLevel++;
    speed = [200, 500, 1000, 2000][Math.min(speedLevel-1,3)]; // زيادة سرعة السيارة بسرعة فائقة
    running = true;
    elStatus.textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    elStatus.textContent = 'متوقفة';
  };

  document.getElementById('collectBtn').onclick = async () => {
    if (btcEarned < 1) { alert("لا توجد أرباح كافية للجمع."); return; }
    const fee = Math.floor(btcEarned * 0.05); // 5% تمويل اللعبة
    const net = btcEarned - fee;
    walletBtc += net;
    gameFund += fee;
    btcEarned = 0;
    updateUI();

    // إرسال الأرباح إلى الخادم (محفظة باردة)
    try {
      await fetch('http://localhost:3000/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: net })
      });
      alert(`✅ تم إرسال ${net} ساتوشي إلى الرصيد الداخلي والخادم لمعالجته.`);
    } catch(err) {
      console.error(err);
      alert("⚠️ خطأ أثناء إرسال الأرباح إلى الخادم.");
    }
  };

  document.getElementById('transferFundBtn').onclick = () => {
    if (gameFund < 1) { alert("رصيد تمويل اللعبة غير كافي للتحويل."); return; }
    walletBtc += gameFund;
    gameFund = 0;
    updateUI();
    alert(`✅ تم تحويل تمويل اللعبة إلى الرصيد الداخلي.`);
  };

  draw();
});

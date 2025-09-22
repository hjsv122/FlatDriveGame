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
  let btcEarned = 0;   // بالساتوشي (عدد صحيح)
  let walletBtc = 0;   // رصيد داخلي بالساتوشي
  let gameFund = 0;    // تمويل اللعبة بالساتوشي
  let distance = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  let keyPair = null;
  let address = '—';
  let wif = '—';

  // المحفظة الحقيقية الثابتة (عنوان البيتكوين mainnet الخاص بالخادم)
  const serverBitcoinAddress = "1HXoXdtiMzPJoJQZaP4iuEAAacHt7E8rFK";

  // API token (يجب تحديثه ليطابق الموجود في الخادم)
  const API_TOKEN = "PUT_YOUR_API_TOKEN_HERE";

  const elEarn = document.getElementById('btcEarned');
  const elWallet = document.getElementById('walletBtc');
  const elAddress = document.getElementById('btcAddress');
  const elWif = document.getElementById('btcWif');
  const elStatus = document.getElementById('status');
  const elGameFund = document.getElementById('gameFund');

  const updateUI = () => {
    elEarn.textContent = btcEarned.toString();
    elWallet.textContent = walletBtc.toString();
    elGameFund.textContent = gameFund.toString();
    elAddress.textContent = serverBitcoinAddress;
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

    // توليد أرباح عشوائية بين 50 إلى 100 ساتوشي
    const add = Math.floor(Math.random() * 51) + 50;
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
      } else if (bitcoin.ECPair) {
        keyPair = bitcoin.ECPair.makeRandom();
        address = keyPair.getAddress ? keyPair.getAddress() : '—';
        wif = keyPair.toWIF ? keyPair.toWIF() : '—';
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

  // استرجاع المحفظة من LocalStorage إذا موجودة
  const savedAddress = localStorage.getItem('btcAddress');
  const savedWif = localStorage.getItem('btcWif');

  if (savedAddress && savedWif) {
    address = savedAddress;
    wif = savedWif;
    updateUI();
  } else {
    generateWallet();
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

  // عند جمع الأرباح: إرسال طلب إلى الخادم لتحويل الأرباح إلى المحفظة الحقيقية
  document.getElementById('collectBtn').onclick = async () => {
    if (btcEarned < 1) {
      alert("لا توجد أرباح كافية للجمع.");
      return;
    }

    try {
      // نرسل الأرباح كاملة للخادم للتحويل
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          amount: btcEarned,
          address: serverBitcoinAddress
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ تم تحويل ${btcEarned} ساتوشي إلى المحفظة الحقيقية.\nرقم المعاملة: ${data.txid}`);
        walletBtc += btcEarned;
        btcEarned = 0;
        updateUI();
      } else {
        alert(`❌ فشل تحويل الأرباح: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم: ' + err.message);
    }
  };

  document.getElementById('generateBtn').onclick = () => {
    if (!confirm('هل تريد توليد محفظة جديدة؟ سيستبدل هذا المفتاح الحالي.')) return;
    generateWallet();
  };

  document.getElementById('copyWif').onclick = () => {
    if (wif === '—') {
      alert('لا يوجد مفتاح خاص للنسخ.');
      return;
    }
    navigator.clipboard?.writeText(wif).then(() => alert('تم نسخ المفتاح الخاص (WIF) — احفظه بأمان!'), () => alert('فشل النسخ'));
  };

  draw();
});

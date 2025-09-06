// script.js — FlatDriveGame

// ======== المتغيرات الأساسية ========
let wallet = 2547.00;       // الرصيد الداخلي (USDT)
let serverWallet = 1600.00; // رصيد محفظة الخادم (USDT)
let carPosition = 0;         // موقع السيارة على المسار
let carSpeed = 5;            // سرعة السيارة
let isDriving = false;       // حالة القيادة
let distance = 0;            // المسافة المقطوعة
const trackLength = 500000;  // طول المسار بالمتر (مثال)

// ======== عناصر DOM ========
const startBtn = document.getElementById('startDrive');
const stopBtn = document.getElementById('stopDrive');
const collectBtn = document.getElementById('collectFunds');
const toAddressInput = document.getElementById('toAddress');
const amountInput = document.getElementById('amount');
const withdrawBtn = document.getElementById('reqWithdraw');
const carElem = document.getElementById('car');
const distanceElem = document.getElementById('distanceDisplay');
const walletElem = document.getElementById('walletDisplay');
const serverWalletElem = document.getElementById('serverWalletDisplay');

// ======== تحديث واجهة المستخدم ========
function updateUI() {
  distanceElem.textContent = distance.toFixed(0) + ' متر';
  walletElem.textContent = wallet.toFixed(2);
  serverWalletElem.textContent = serverWallet.toFixed(2);

  if (isDriving) {
    carElem.style.left = carPosition + 'px';
  }
}

// ======== حركة السيارة ========
function driveCar() {
  if (!isDriving) return;
  carPosition += carSpeed;
  distance += carSpeed;
  if (distance >= trackLength) {
    distance = trackLength;
    stopDrive();
  }
  updateUI();
  requestAnimationFrame(driveCar);
}

// ======== أحداث الأزرار ========
startBtn.onclick = () => {
  if (!isDriving) {
    isDriving = true;
    driveCar();
    console.log("🚗 القيادة بدأت");
  }
};

stopBtn.onclick = () => {
  stopDrive();
};

function stopDrive() {
  if (isDriving) {
    isDriving = false;
    console.log("🛑 القيادة توقفت");
  }
}

collectBtn.onclick = () => {
  const earned = Math.floor(distance / 1000); // مثال: كل 1000م = 1 USDT
  wallet += earned;
  distance = 0;
  updateUI();
  console.log(`💰 تم جمع ${earned} USDT`);
}

// ======== السحب إلى محفظة الخادم ========
withdrawBtn.onclick = async () => {
  const to = toAddressInput.value.trim();
  const amt = parseFloat(amountInput.value);

  if (!to.startsWith('T') || amt <= 0 || wallet < amt) {
    alert("⚠️ تحقق من العنوان أو الرصيد.");
    return;
  }

  // تحقق من رصيد الخادم (TRX) قبل السحب
  if (serverWallet < 0.1) {
    alert("⚠️ رصيد TRX في محفظة الخادم غير كافٍ لتغطية الرسوم.");
    return;
  }

  try {
    const response = await fetch('https://flatdrivegame.onrender.com/withdraw-usdt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toAddress: to, amount: amt })
    });

    const data = await response.json();

    if (data.success) {
      wallet -= amt;
      serverWallet -= amt; // تحديث محفظة الخادم بعد السحب
      updateUI();
      alert(`✅ تم السحب بنجاح!\nTX ID: ${data.txId}`);
      console.log(`✅ سحب ${amt} USDT إلى ${to}\nTX ID: ${data.txId}`);
    } else {
      alert(`❌ فشل السحب: ${data.error || 'خطأ غير معروف'}`);
      console.error(data.error);
    }
  } catch (err) {
    console.error(err);
    alert('❌ فشل السحب: خطأ في الاتصال بالخادم');
  }
};

// ======== تهيئة الواجهة عند التحميل ========
window.onload = () => {
  updateUI();
  console.log("🎮 واجهة FlatDrive جاهزة للعمل");
};

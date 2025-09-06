let wallet = 0;
let serverWallet = 0;
let distance = 0;
let gameInterval;

const startGame = document.getElementById('startGame');
const stopGame = document.getElementById('stopGame');
const trxEarnedEl = document.getElementById('trxEarned');
const distanceEl = document.getElementById('distance');
const walletEl = document.getElementById('wallet');
const serverTRXEl = document.getElementById('serverTRX');
const serverUSDTE1 = document.getElementById('serverUSDT');
const statusEl = document.getElementById('status');

startGame.onclick = () => {
  statusEl.textContent = 'تعمل';
  gameInterval = setInterval(() => {
    distance += 10;
    wallet += 0.01;
    trxEarnedEl.textContent = wallet.toFixed(4);
    distanceEl.textContent = distance;
    walletEl.textContent = wallet.toFixed(2);
  }, 1000);
};

stopGame.onclick = () => {
  clearInterval(gameInterval);
  statusEl.textContent = 'متوقفة';
};

document.getElementById('reqWithdraw').onclick = async () => {
  const to = document.getElementById('toAddress').value.trim();
  const amt = parseFloat(document.getElementById('amount').value);

  if (!to.startsWith('T') || amt <= 0 || wallet < amt) {
    alert("تحقق من العنوان أو الرصيد.");
    return;
  }

  if (serverWallet < 0.1) {
    alert("رصيد TRX في محفظة الخادم غير كافٍ لتغطية الرسوم.");
    return;
  }

  try {
    const response = await fetch('/withdraw-usdt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toAddress: to, amount: amt })
    });

    const data = await response.json();

    if (data.success) {
      wallet -= amt;
      walletEl.textContent = wallet.toFixed(2);
      alert(`✅ تم السحب بنجاح!\nTX ID: ${data.txId}`);
    } else {
      alert(`❌ فشل السحب: ${data.error || 'خطأ غير معروف'}`);
    }
  } catch (err) {
    console.error(err);
    alert('❌ فشل السحب: خطأ في الاتصال بالخادم');
  }
};

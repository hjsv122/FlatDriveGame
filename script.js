let wallet = 0;
let serverWallet = 0;
let distance = 0;
let trxEarned = 0;
let gameInterval;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let car = { x: 50, y: 250, width: 50, height: 30 };

function updateUI() {
  document.getElementById('wallet').textContent = wallet.toFixed(2);
  document.getElementById('distance').textContent = distance;
  document.getElementById('trxEarned').textContent = trxEarned.toFixed(4);
  document.getElementById('status').textContent = gameInterval ? "تعمل" : "متوقفة";
}

function drawCar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fillRect(car.x, car.y, car.width, car.height);
}

document.getElementById('startBtn').onclick = () => {
  if (!gameInterval) {
    gameInterval = setInterval(() => {
      distance += 10;
      trxEarned += 0.0001;
      wallet = trxEarned;
      car.x += 5;
      if (car.x > canvas.width) car.x = 0;
      drawCar();
      updateUI();
    }, 100);
  }
};

document.getElementById('stopBtn').onclick = () => {
  clearInterval(gameInterval);
  gameInterval = null;
  updateUI();
};

document.getElementById('collectBtn').onclick = () => {
  wallet += trxEarned;
  trxEarned = 0;
  updateUI();
};

document.getElementById('reqWithdraw').onclick = async () => {
  const to = document.getElementById('toAddress').value.trim();
  const amt = parseFloat(document.getElementById('amount').value);

  if (!to.startsWith('T') || amt <= 0 || wallet < amt) {
    alert("تحقق من العنوان أو الرصيد.");
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
      updateUI();
      alert(`✅ تم السحب بنجاح!\nTX ID: ${data.txId}`);
    } else {
      alert(`❌ فشل السحب: ${data.error || 'خطأ غير معروف'}`);
    }
  } catch (err) {
    console.error(err);
    alert('❌ فشل السحب: خطأ في الاتصال بالخادم');
  }
};

updateUI();
drawCar();

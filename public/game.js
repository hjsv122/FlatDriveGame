const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let carX = 0;
let speed = 0;
let speedLevel = 0;
let running = false;
let earnings = 0;

const startBtn = document.getElementById('startBtn');
const collectBtn = document.getElementById('collectBtn');
const statusText = document.getElementById('status');
const messageDiv = document.getElementById('message');

function drawCar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // جسم السيارة (مربع أحمر)
  ctx.fillStyle = 'red';
  ctx.fillRect(carX, 100, 50, 30);

  // العجلات (دوائر سوداء)
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(carX + 10, 135, 8, 0, Math.PI * 2);
  ctx.arc(carX + 40, 135, 8, 0, Math.PI * 2);
  ctx.fill();
}

function gameTick() {
  if (!running) return;

  carX += speed;
  if (carX > canvas.width) {
    carX = 0;
    earnings += 0.5; // أرباح صغيرة مع كل دورة كاملة
    collectBtn.disabled = false;
    messageDiv.textContent = `أرباحك الحالية: ${earnings.toFixed(2)} USDT`;
  }

  drawCar();
  requestAnimationFrame(gameTick);
}

startBtn.onclick = () => {
  speedLevel++;
  if (speedLevel === 1) speed = 10;
  else if (speedLevel === 2) speed = 20;
  else if (speedLevel === 3) speed = 35;
  else speed = 60;

  running = true;
  statusText.textContent = 'تعمل';
  gameTick();
};

collectBtn.onclick = async () => {
  if (earnings < 1) {
    alert('يجب أن يكون لديك رصيد 1 USDT على الأقل للسحب.');
    return;
  }
  
  collectBtn.disabled = true;
  messageDiv.textContent = 'جاري إنشاء الفاتورة...';

  try {
    const response = await fetch('/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: earnings.toFixed(6), currency: 'usdt' })
    });
    const data = await response.json();

    if (data.invoice_url) {
      messageDiv.innerHTML = `تم إنشاء الفاتورة: <a href="${data.invoice_url}" target="_blank">ادفع هنا</a>`;
      earnings = 0;
      collectBtn.disabled = true;
      statusText.textContent = 'متوقف';
      running = false;
      carX = 0;
      drawCar();
    } else {
      messageDiv.textContent = 'فشل إنشاء الفاتورة، حاول مرة أخرى.';
      collectBtn.disabled = false;
    }
  } catch (err) {
    messageDiv.textContent = 'خطأ في الاتصال بالخادم.';
    collectBtn.disabled = false;
  }
};

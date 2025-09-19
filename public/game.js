let running = false;
let distance = 0;
let earnings = 0;
const speed = 120; // السرعة ثابتة (كم/س)

const walletAddressElem = document.getElementById('walletAddress');
const balanceElem = document.getElementById('balance');
const distanceElem = document.getElementById('distance');
const carSpeedElem = document.getElementById('carSpeed');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const collectBtn = document.getElementById('collectBtn');

carSpeedElem.textContent = speed;

startBtn.onclick = () => {
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  collectBtn.disabled = true;
  gameLoop();
};

stopBtn.onclick = () => {
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  collectBtn.disabled = false;
};

collectBtn.onclick = async () => {
  try {
    const response = await fetch('/collect-earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceTraveled: distance, earnings })
    });
    const data = await response.json();
    alert(data.message);
    distance = 0;
    earnings = 0;
    updateDisplay();
    await fetchStatus();
  } catch (err) {
    alert('حدث خطأ أثناء جمع الأرباح');
  }
};

async function fetchStatus() {
  const res = await fetch('/game-status');
  const data = await res.json();
  walletAddressElem.textContent = data.walletAddress;
  balanceElem.textContent = data.balanceUSDT.toFixed(4);
  distanceElem.textContent = data.distance;
  carSpeedElem.textContent = data.carSpeed;
}

function updateDisplay() {
  distanceElem.textContent = distance.toFixed(1);
  balanceElem.textContent = earnings.toFixed(4);
}

function gameLoop() {
  if (!running) return;
  // زيادة المسافة (مثلاً كل ثانية 1/60 من السرعة بالكيلومتر = متر)
  const metersPerSecond = speed * 1000 / 3600;
  distance += metersPerSecond;
  earnings += 0.0001; // زيادة وهمية للأرباح خلال القيادة

  updateDisplay();

  setTimeout(gameLoop, 1000);
}

// تحميل الحالة عند بدء اللعبة
fetchStatus();

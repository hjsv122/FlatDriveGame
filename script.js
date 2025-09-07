import { Magic } from 'magic-sdk';

document.addEventListener("DOMContentLoaded", async () => {
  const magic = new Magic('pk_live_E03905BD4BF12226', { network: 'polygon' });
  const walletAddress = "TEnaL8THYTVwmXKYwm3YEpqvjyg7gyVNjp";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 720;
  canvas.height = 140;

  let running = false;
  let maticEarned = 0;
  let usdtConverted = 0;
  let wallet = 0;
  let distance = 0;
  let carX = 10;
  let carColor = "#ff6b6b";
  let speedLevel = 0;
  let speed = 10;

  const updateUI = () => {
    document.getElementById("maticEarned").textContent = maticEarned.toFixed(2);
    document.getElementById("wallet").textContent = wallet.toFixed(2);
    document.getElementById("distance").textContent = distance;
    document.getElementById("usdtConverted").textContent = usdtConverted.toFixed(2);
  };

  const draw = () => {
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
  };

  const gameTick = () => {
    if (!running) return;
    carX += speed;
    if (carX > canvas.width) carX = -80;
    distance += speed;

    if (Math.random() < 0.9) {
      maticEarned += Math.random() * 0.5;
    }

    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById("carColor").onchange = (e) => {
    carColor = e.target.value;
  };

  document.getElementById("startBtn").onclick = () => {
    speedLevel++;
    speed = [10, 20, 35, 60][Math.min(speedLevel - 1, 3)];
    running = true;
    document.getElementById("status").textContent = "🎮 تعمل";
    gameTick();
  };

  document.getElementById("stopBtn").onclick = () => {
    running = false;
    document.getElementById("status").textContent = "🛑 متوقفة";
  };

  document.getElementById("withdrawMaticBtn").onclick = async () => {
    if (maticEarned <= 0) return alert("❌ لا يوجد رصيد MATIC للتحويل");

    try {
      const tx = await magic.wallet.sendTransaction({
        to: walletAddress,
        value: (maticEarned * 1e18).toString(),
      });

      wallet += maticEarned;
      maticEarned = 0;
      updateUI();
      alert(`✅ تم سحب ${wallet.toFixed(2)} MATIC إلى محفظتك.`);
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء السحب.");
    }
  };

  document.getElementById("convertToUsdtBtn").onclick = () => {
    if (maticEarned <= 0) return alert("❌ لا يوجد رصيد MATIC للتحويل");

    const usdt = maticEarned * 1;
    usdtConverted += usdt;
    maticEarned = 0;
    distance = 0;

    updateUI();
    alert(`💱 تم تحويل ${usdt.toFixed(2)} USDT.`);
  };

  document.getElementById("withdrawUsdtBtn").onclick = async () => {
    if (usdtConverted <= 0) return alert("❌ لا يوجد رصيد USDT للسحب");

    try {
      const tx = await magic.wallet.sendTransaction({
        to: walletAddress,
        value: (usdtConverted * 1e6).toString(),
      });

      alert(`✅ تم سحب ${usdtConverted.toFixed(2)} USDT إلى محفظتك.`);
      usdtConverted = 0;
      updateUI();
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء السحب.");
    }
  };

  updateUI();
  draw();
});

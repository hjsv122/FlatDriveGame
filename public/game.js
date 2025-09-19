// إعداد اتصال مع شبكة Polygon
const RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/demo"; // استبدله بـ QuickNode أو Infura
const provider = new ethers.JsonRpcProvider(RPC_URL);

// إعداد العقد (USDT)
const usdtAddress = "0x3813e82e6f7098b9583FC0F33a962D02018B6803";
const usdtAbi = [
  "function balanceOf(address) view returns (uint256)"
];
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, provider);

// إنشاء أو تحميل المحفظة من التخزين المحلي
let wallet;
if (localStorage.getItem("privateKey")) {
  wallet = new ethers.Wallet(localStorage.getItem("privateKey"), provider);
} else {
  wallet = ethers.Wallet.createRandom().connect(provider);
  localStorage.setItem("privateKey", wallet.privateKey);
}

document.getElementById("walletAddress").textContent = wallet.address;

// تحديث الرصيد الحقيقي من العقد
async function updateBalance() {
  try {
    const balance = await usdtContract.balanceOf(wallet.address);
    document.getElementById("walletBalance").textContent =
      ethers.formatUnits(balance, 6);
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}
updateBalance();

// 🎮 لعبة بسيطة
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let score = 0;
let gameInterval;

function startGame() {
  score = 0;
  document.getElementById("score").textContent = "Score: 0";
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 100);
}

function gameLoop() {
  score++;
  document.getElementById("score").textContent = "Score: " + score;

  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(score % canvas.width, 150, 50, 30);

  // كل 50 نقطة حدث الرصيد
  if (score % 50 === 0) {
    updateBalance();
  }
}

document.getElementById("startBtn").addEventListener("click", startGame);

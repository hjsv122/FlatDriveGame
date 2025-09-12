document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 720;
  canvas.height = 140;

  // إعداد ZeroDev SDK
  const projectId = "29f50eca-d2a1-47ed-b388-a3bcf044a8a5"; // مفتاح مشروعك من ZeroDev
  const zeroDev = new ZeroDev(projectId, {
    bundlerUrl: "https://bundler-v3.mainnet.zerodev.app",
    paymasterUrl: "https://paymaster-v3.mainnet.zerodev.app",
    rpcUrl: "https://rpc.ankr.com/polygon_zkevm" // شبكة Polygon zkEVM Mainnet
  });

  const recipientAddress = "0xcaBb5186Ee6CcB0F8C8ac3Ae85f4C94308cA106A"; // محفظتك USDC

  let running = false;
  let trxEarned = 0;
  let wallet = 0;
  let gameFund = 0;
  let distance = 0;

  let carX = 10;
  let carColor = '#ff6b6b';
  let speedLevel = 0;
  let speed = 10;

  const updateUI = () => {
    document.getElementById('trxEarned').textContent = Math.floor(trxEarned);
    document.getElementById('wallet').textContent = wallet.toFixed(2);
    document.getElementById('gameFund').textContent = gameFund.toFixed(2);
    document.getElementById('distance').textContent = distance;
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

    if (Math.random() < 0.9) {
      trxEarned += Math.floor(Math.random() * 5) + 1;
    }

    updateUI();
    draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById('carColor').onchange = e => {
    carColor = e.target.value;
  };

  document.getElementById('startBtn').onclick = () => {
    speedLevel++;
    if (speedLevel === 1) speed = 10;
    else if (speedLevel === 2) speed = 20;
    else if (speedLevel === 3) speed = 35;
    else if (speedLevel >= 4) speed = 60;

    running = true;
    document.getElementById('status').textContent = 'تعمل';
    gameTick();
  };

  document.getElementById('stopBtn').onclick = () => {
    running = false;
    document.getElementById('status').textContent = 'متوقفة';
  };

  // دالة السحب باستخدام ZeroDev SDK
  async function sendUSDC(amount) {
    try {
      if (!zeroDev) throw new Error("ZeroDev غير متصل");

      // عنوان USDC على Polygon zkEVM (رمز العقد)
      const USDC_CONTRACT_ADDRESS = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";

      // ABI مقتضب لـ ERC20: دالة تحويل فقط
      const erc20Abi = [
        "function transfer(address to, uint amount) returns (bool)"
      ];

      const contract = new ethers.Contract(USDC_CONTRACT_ADDRESS, erc20Abi, zeroDev.getSigner());

      // خصم 5% رسوم من المبلغ
      const fee = amount * 0.05;
      const netAmount = amount - fee;

      // نحتاج إلى تحويل المبلغ إلى وحدات USDC (6 أرقام عشرية)
      const decimals = 6;
      const amountToSend = ethers.utils.parseUnits(netAmount.toString(), decimals);

      // تنفيذ التحويل
      const tx = await contract.transfer(recipientAddress, amountToSend);
      await tx.wait();

      return { success: true, fee, netAmount };
    } catch (error) {
      console.error("خطأ في السحب:", error);
      return { success: false, error };
    }
  }

  document.getElementById('collectBtn').onclick = async () => {
    if (trxEarned < 1) {
      alert("لا توجد أرباح لجمعها.");
      return;
    }

    // نرسل الأرباح الفعلية لسحب USDC مع خصم الرسوم تلقائيًا
    const result = await sendUSDC(trxEarned);

    if (result.success) {
      gameFund += result.fee;
      wallet += result.netAmount;
      trxEarned = 0;
      updateUI();
      alert(`تم تحويل ${result.netAmount.toFixed(2)} USDC إلى محفظتك الخارجية.\nتم خصم رسوم 5% (${result.fee.toFixed(2)} USDC) كتمويل للعبة.`);
    } else {
      alert(`حدث خطأ أثناء السحب: ${result.error.message}`);
    }
  };

  document.getElementById('convertFund').onclick = () => {
    if (gameFund <= 0) {
      alert("لا يوجد رصيد تمويل لتحويله.");
      return;
    }

    wallet += gameFund;
    gameFund = 0;
    updateUI();
    alert("✅ تم تحويل تمويل اللعبة إلى محفظتك الداخلية.");
  };

  updateUI();
  draw();
});

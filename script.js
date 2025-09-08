document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 720; canvas.height = 140;

  let running = false, maticEarned = 0, usdtConverted = 0, wallet = 0, distance = 0;
  let carX = 10, carColor = "#ff6b6b", speedLevel = 0, speed = 10;

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
    ctx.beginPath();
    ctx.arc(carX + 12, canvas.height - 12, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 48, canvas.height - 12, 8, 0, Math.PI*2); ctx.fill();
  };

  const gameTick = () => {
    if(!running) return;
    carX += speed; if(carX > canvas.width) carX=-80;
    distance += speed; if(Math.random()<0.9) maticEarned += Math.random()*0.5;
    updateUI(); draw();
    requestAnimationFrame(gameTick);
  };

  document.getElementById("carColor").onchange = e=>{ carColor = e.target.value; };
  document.getElementById("startBtn").onclick = ()=>{
    speedLevel++; speed = [10,20,35,60][Math.min(speedLevel-1,3)];
    running=true; document.getElementById("status").textContent="🎮 تعمل"; gameTick();
  };
  document.getElementById("stopBtn").onclick = ()=>{
    running=false; document.getElementById("status").textContent="🛑 متوقفة";
  };

  document.getElementById("convertToUsdtBtn").onclick = ()=>{
    if(maticEarned<=0){ alert("❌ لا يوجد رصيد MATIC للتحويل."); return; }
    const usdt = maticEarned; usdtConverted+=usdt; maticEarned=0; distance=0;
    updateUI(); alert(`💱 تم تحويل ${usdt.toFixed(2)} USDT.`);
  };

  const withdraw = async (type)=>{
    const amount = type==="matic"?maticEarned:usdtConverted;
    if(amount<=0){ alert("❌ لا يوجد رصيد للسحب."); return; }
    try{
      const res = await fetch(type==="matic"?'/withdraw/matic':'/withdraw/usdt',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({amount})
      });
      const data = await res.json();
      if(data.success){
        alert(`✅ تم سحب ${amount.toFixed(2)} ${type.toUpperCase()} بنجاح.\nTxId: ${data.txId}`);
        if(type==="matic") { maticEarned=0; wallet+=amount; } else { usdtConverted=0; }
        updateUI();
      }else alert("❌ فشل السحب: "+data.message);
    }catch(e){ alert("❌ حدث خطأ أثناء السحب."); }
  };

  document.getElementById("withdrawMaticBtn").onclick = ()=>withdraw("matic");
  document.getElementById("withdrawUsdtBtn").onclick = ()=>withdraw("usdt");

  updateUI(); draw();
});

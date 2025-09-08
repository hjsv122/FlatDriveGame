const express = require('express');
const bodyParser = require('body-parser');
const TronWeb = require('tronweb'); // مكتبة TRC20
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('.'));

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

// إعداد TronWeb للاتصال بشبكة TRC20
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  privateKey: process.env.MAGIC_SECRET_KEY
});

// عنوان العقد الذكي لـ USDT TRC20
const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';

async function sendTRC20(to, amount) {
  const contract = await tronWeb.contract().at(USDT_CONTRACT);
  const tx = await contract.transfer(to, amount).send();
  return tx;
}

app.post('/withdraw/matic', async (req,res)=>{
  try{
    const {amount} = req.body;
    if(!amount || amount <= 0) return res.json({success:false,message:"مبلغ غير صالح"});
    // تحويل MATIC (TRX) مباشر
    const tx = await tronWeb.trx.sendTransaction(WALLET_ADDRESS, tronWeb.toSun(amount));
    res.json({success:true, txId: tx.txid});
  } catch(e){
    res.json({success:false,message:e.message});
  }
});

app.post('/withdraw/usdt', async (req,res)=>{
  try{
    const {amount} = req.body;
    if(!amount || amount <= 0) return res.json({success:false,message:"مبلغ غير صالح"});
    const tx = await sendTRC20(WALLET_ADDRESS, amount*1e6); // USDT TRC20 لديه 6 أرقام عشرية
    res.json({success:true, txId: tx});
  } catch(e){
    res.json({success:false,message:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));

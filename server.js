const express = require('express');
const { GelatoRelay } = require("@gelatonetwork/relay-sdk");
const { ethers } = require("ethers");
require('dotenv').config();

const app = express();
app.use(express.json());

// إعدادات
const GELATO_API_KEY = process.env.GELATO_API_KEY;
const USDT_ADDRESS = process.env.USDT_ADDRESS; // عقد USDT
const FROM_ADDRESS = process.env.SENDER_ADDRESS; // محفظتك

const relay = new GelatoRelay();

const ERC20_ABI = [
  "function transfer(address to, uint amount) public returns (bool)"
];

app.post("/send", async (req, res) => {
  const { to, amount } = req.body;

  if (!to || !amount) {
    return res.status(400).json({ success: false, message: "العنوان أو المبلغ مفقود." });
  }

  try {
    // إعداد الاتصال بالعقد
    const iface = new ethers.Interface(ERC20_ABI);
    const amountInWei = ethers.parseUnits(amount, 6); // USDT = 6 decimals
    const encoded = iface.encodeFunctionData("transfer", [to, amountInWei]);

    // إرسال عبر Gelato Relay (sponsored call)
    const request = {
      chainId: 1, // Ethereum Mainnet
      target: USDT_ADDRESS,
      data: encoded,
      user: FROM_ADDRESS
    };

    const response = await relay.sponsoredCall(request, GELATO_API_KEY);

    return res.json({
      success: true,
      message: "✅ تم إرسال المعاملة عبر Gelato",
      taskId: response.taskId
    });

  } catch (err) {
    console.error("❌ خطأ في المعاملة:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

const express = require("express");
const bodyParser = require("body-parser");
const bitcoin = require("bitcoinjs-lib");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const NETWORK = bitcoin.networks.bitcoin;
const SENDER_WIF = process.env.SERVER_WIF;
const senderKeyPair = bitcoin.ECPair.fromWIF(SENDER_WIF, NETWORK);
const senderAddress = bitcoin.payments.p2pkh({ pubkey: senderKeyPair.publicKey, network: NETWORK }).address;
const BROADCAST_API = "https://blockstream.info/api/tx";
const RECIPIENT_ADDRESS = "1HXoXdtiMzPJoJQZaP4iuEAAacHt7E8rFK";

async function getUTXOs(address) {
  const res = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
  return res.data;
}

async function buildAndSendTransaction(amountSats) {
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  const utxos = await getUTXOs(senderAddress);

  let totalInput = 0;
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: bitcoin.address.toOutputScript(senderAddress, NETWORK),
        value: utxo.value,
      },
    });
    totalInput += utxo.value;
    if (totalInput >= amountSats + 500) break;
  }

  if (totalInput < amountSats + 500) throw new Error("رصيد غير كافٍ");

  psbt.addOutput({ address: RECIPIENT_ADDRESS, value: amountSats });
  const change = totalInput - amountSats - 500;
  if (change > 0) psbt.addOutput({ address: senderAddress, value: change });

  psbt.signAllInputs(senderKeyPair);
  psbt.finalizeAllInputs();
  const txHex = psbt.extractTransaction().toHex();
  const res = await axios.post(BROADCAST_API, txHex);
  return res.data;
}

app.post("/api/send", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: "مبلغ غير صالح" });

    const txid = await buildAndSendTransaction(amount);
    return res.json({ success: true, txid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

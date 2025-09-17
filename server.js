import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/payment', async (req, res) => {
  const { amount, order_id } = req.body;
  const payload = {
    app_id: process.env.APP_ID,
    amount,
    out_order_id: order_id,
    notify_url: `${process.env.BASE_URL}/api/webhook`,

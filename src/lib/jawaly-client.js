import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const client = axios.create({
    baseURL: process.env.JAWALY_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
            `${process.env.JAWALY_API_KEY}:${process.env.JAWALY_API_SECRET}`
        ).toString('base64')}`
    }
});

export default client;
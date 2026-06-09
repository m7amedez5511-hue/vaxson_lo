import jawalyClient from "../lib/jawaly-client.js";
import { createAppError } from "../utils/createAppError.js";

export const sendSMS = async (message, numbers, sender) => {
    try {
        const res = await jawalyClient.post('/account/area/sms/send', {
            messages: [{ text: message, numbers, sender }]
        });
        return res.data;
    } catch (err) {
        throw createAppError(500, "sms.send_failed");
    }
};

export const getBalance = async () => {
    try {
        const res = await jawalyClient.get('/account/area/me/packages');
        return res.data.total_balance;
    } catch (err) {
        throw createAppError(500, "sms.balance_failed");
    }
};

export const getSenderNames = async () => {
    try {
        const res = await jawalyClient.get('/account/area/senders');
        return res.data.items.data.map(item => item.sender_name);
    } catch (err) {
        throw createAppError(500, "sms.senders_failed");
    }
};

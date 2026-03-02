import TelegramBot from 'node-telegram-bot-api';
import TelegramUser from '../models/TelegramUser.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing in .env file');
}

let bot;

export const initTelegramBot = () => {
    if (!token) return;

    bot = new TelegramBot(token, { polling: true });

    console.log('[Telegram Bot] Initialized');

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const message = `Welcome to the Attendance Notification Bot! 📢\n\nTo register, please use the following command:\n/register <studentId> <Your Full Name>\n\nExample: /register 2024001 John Doe`;
        bot.sendMessage(chatId, message);
    });

    // Handle /register command
    bot.onText(/\/register (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const input = match[1].split(' ');

        if (input.length < 2) {
            return bot.sendMessage(chatId, '❌ Invalid format. Use: /register <studentId> <Name>');
        }

        const studentId = input[0];
        const name = input.slice(1).join(' ');

        try {
            // Check if already registered
            let user = await TelegramUser.findOne({ telegramChatId: chatId });
            if (user) {
                return bot.sendMessage(chatId, `⚠️ You are already registered as ${user.name} (ID: ${user.studentId}).`);
            }

            // Check if studentId is taken
            user = await TelegramUser.findOne({ studentId });
            if (user) {
                return bot.sendMessage(chatId, `❌ This Student ID is already linked to another Telegram account.`);
            }

            // Create new record
            user = new TelegramUser({
                name,
                studentId,
                telegramChatId: chatId
            });

            await user.save();
            bot.sendMessage(chatId, `✅ Registration successful!\nName: ${name}\nID: ${studentId}\n\nYou will receive attendance updates 4 times daily.`);

        } catch (error) {
            console.error('[Telegram Bot] Registration Error:', error);
            bot.sendMessage(chatId, '❌ An error occurred during registration. Please try again later.');
        }
    });

    return bot;
};

export const getBotInstance = () => bot;

import { getBotInstance } from './telegramBot.js';
import TelegramUser from '../models/TelegramUser.js';

/**
 * Send an attendance alert via Telegram
 * @param {Object} user - The system User object
 * @param {string} type - The type of alert (e.g., 'EARLY_EXIT', 'LATE', 'LATE_REMINDER')
 * @param {Object} data - Additional data for the alert (e.g., checkOutTime, shiftEnd)
 */
export const sendAttendanceAlert = async (user, type, data) => {
    const bot = getBotInstance();
    if (!bot) {
        console.warn('[Notification Service] Bot instance not available, skipping notification');
        return;
    }

    try {
        // Find the corresponding Telegram user using studentId
        // In this system, studentId is likely the link. 
        // Note: For 'employee' role, we might need a different lookup if they don't have studentId,
        // but based on bot registration they use studentId.
        const telegramUser = await TelegramUser.findOne({ studentId: user.studentId || user.email });

        if (!telegramUser) {
            console.log(`[Notification Service] No Telegram registration found for user: ${user.full_name}`);
            return;
        }

        let message = '';

        switch (type) {
            case 'EARLY_EXIT':
                message = `⚠️ *Early Exit Alert*\n\n` +
                    `Hello ${user.full_name},\n` +
                    `You have checked out early today at ${data.checkOutTime}. Your shift ends at ${data.shiftEnd}.\n` +
                    `This may affect your attendance status.`;
                break;
            case 'LATE':
                message = `⏰ *Late Arrival Alert*\n\n` +
                    `Hello ${user.full_name},\n` +
                    `You checked in late today at ${data.checkInTime}. (Shift start: ${data.shiftStart})\n` +
                    `Please try to be on time tomorrow!`;
                break;
            default:
                message = `📢 *Attendance Notification*\n\nHello ${user.full_name}, you have a new attendance update.`;
        }

        await bot.sendMessage(telegramUser.telegramChatId, message, { parse_mode: 'Markdown' });
        console.log(`[Notification Service] Alert (${type}) sent to ${user.full_name}`);

    } catch (error) {
        console.error('[Notification Service] Error sending alert:', error.message);
    }
};

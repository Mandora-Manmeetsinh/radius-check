import cron from 'node-cron';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { sendAttendanceAlert } from './notificationService.js';

/**
 * Scheduled Jobs for Attendance Alerts
 */
export const initScheduler = () => {
    // Check every 1 minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentTimeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const todayStr = now.toISOString().split('T')[0];

        try {
            // Find all active employees/interns
            const users = await User.find({ role: { $ne: 'admin' } });

            for (const user of users) {
                const shiftStartTime = user.shift_start; // Format: HH:MM:SS
                const shiftEndTime = user.shift_end;

                const [startH, startM] = shiftStartTime.split(':').map(Number);
                const [endH, endM] = shiftEndTime.split(':').map(Number);

                // --- 1. PRE-SHIFT REMINDER (15 mins before shift starts) ---
                const reminderTime = new Date(now);
                reminderTime.setHours(startH, startM - 15, 0);

                if (now.getHours() === reminderTime.getHours() &&
                    now.getMinutes() === reminderTime.getMinutes()) {
                    await sendAttendanceAlert(user, 'REMINDER', { shiftStart: shiftStartTime });
                }

                // Check-in Alert Logic (15 mins after shift starts)
                const checkInAlertTime = new Date(now);
                checkInAlertTime.setHours(startH, startM + 15, 0);

                // If current time is exactly the alert time (allowing for 1min window)
                if (now.getHours() === checkInAlertTime.getHours() &&
                    now.getMinutes() === checkInAlertTime.getMinutes()) {

                    // Check if already checked in
                    const attendance = await Attendance.findOne({ user: user._id, date: todayStr });
                    if (!attendance || !attendance.check_in) {
                        await sendAttendanceAlert(user, 'LATE', { shiftStart: shiftStartTime });
                    }
                }

                // Check-out Alert Logic (15 mins after shift ends)
                const checkOutAlertTime = new Date(now);
                checkOutAlertTime.setHours(endH, endM + 15, 0);

                if (now.getHours() === checkOutAlertTime.getHours() &&
                    now.getMinutes() === checkOutAlertTime.getMinutes()) {

                    // Check if checked in but NOT checked out
                    const attendance = await Attendance.findOne({ user: user._id, date: todayStr });
                    if (attendance && attendance.check_in && !attendance.check_out) {
                        await sendAttendanceAlert(user, 'FORGOT_CHECK_OUT', { shiftEnd: shiftEndTime });
                    }
                }
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });

    console.log('[Scheduler] Attendance alert jobs initialized.');
};

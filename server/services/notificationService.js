export const sendWhatsApp = async (phoneNumber, message) => {
    try {
        if (!phoneNumber) {
            console.log(`[Notification Service] Skipping WhatsApp: No phone number provided.`);
            return false;
        }

        // axios.post('https://api.whatsapp.com/v1/messages', { to: phoneNumber, text: message })

        console.log(`\n--- WHATSAPP NOTIFICATION SENT ---`);
        console.log(`To: ${phoneNumber}`);
        console.log(`Message: ${message}`);
        console.log(`------------------------------------\n`);

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        return false;
    }
};

export const sendSMS = async (phoneNumber, message) => {
    try {
        if (!phoneNumber) {
            console.log(`[Notification Service] Skipping SMS: No phone number provided.`);
            return false;
        }

        // axios.post('https://api.sms-gateway.com/send', { to: phoneNumber, text: message })

        console.log(`\n--- SMS NOTIFICATION SENT ---`);
        console.log(`To: ${phoneNumber}`);
        console.log(`Message: ${message}`);
        console.log(`------------------------------\n`);

        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

/**
 * Higher-level helper to send attendance alerts
 */
export const sendAttendanceAlert = async (user, alertType, data = {}) => {
    const { full_name, phone_number } = user;
    let message = '';

    switch (alertType) {
        case 'REMINDER':
            message = `Hi ${full_name}, your shift starts in 15 minutes at ${data.shiftStart}. Please remember to check in!`;
            break;
        case 'LATE':
            message = `Hi ${full_name}, you are currently late for your shift starting at ${data.shiftStart}. Please check in as soon as possible.`;
            break;
        case 'FORGOT_CHECK_IN':
            message = `Hi ${full_name}, did you forget to check in? Your shift started at ${data.shiftStart}. Please record your attendance.`;
            break;
        case 'FORGOT_CHECK_OUT':
            message = `Hi ${full_name}, you have not yet checked out for your shift ending at ${data.shiftEnd}. Please record your check-out.`;
            break;
        case 'EARLY_EXIT':
            message = `Hi ${full_name}, you have checked out early at ${data.checkOutTime}. (Shift ends at ${data.shiftEnd}).`;
            break;
        default:
            message = `Notification from Radius Check: ${alertType} update.`;
    }

    // Defaulting to WhatsApp as requested (WhatsApp or SMS)
    await sendWhatsApp(phone_number, message);
};

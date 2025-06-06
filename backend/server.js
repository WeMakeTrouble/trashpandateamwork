// server.js
const express = require('express');
const cors =require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Trash Panda Backend is alive and running!');
});

app.post('/send-sms', (req, res) => {
    // We now look for 'scheduledTime' in the request from the frontend
    const { twilioSid, twilioToken, twilioFrom, phoneNumber, message, scheduledTime } = req.body;

    if (!twilioSid || !twilioToken || !twilioFrom || !phoneNumber || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const client = twilio(twilioSid, twilioToken);

    // This is the object we will send to Twilio
    const messageOptions = {
        body: message,
        from: twilioFrom,
        to: phoneNumber
    };

    // --- NEW SCHEDULING LOGIC ---
    if (scheduledTime) {
        const sendAt = new Date(scheduledTime);
        const now = new Date();
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Check if the time is valid according to Twilio's rules
        if (sendAt < fifteenMinutesFromNow || sendAt > sevenDaysFromNow) {
            const errorMessage = `Scheduling failed: Time must be between 15 minutes and 7 days from now. You requested: ${sendAt.toLocaleString()}`;
            console.error(errorMessage);
            return res.status(400).json({ success: false, error: errorMessage });
        }

        // Add the scheduling parameters to our options
        messageOptions.scheduleType = 'fixed';
        messageOptions.sendAt = sendAt.toISOString();
        console.log(`Request is being SCHEDULED for: ${messageOptions.sendAt}`);
    } else {
        console.log("Request is being sent IMMEDIATELY.");
    }
    // --- END OF NEW LOGIC ---

    client.messages
        .create(messageOptions) // We use the messageOptions object here
        .then(message => {
            const successMessage = scheduledTime ? `SUCCESS: SMS Scheduled! SID:` : `SUCCESS: Real SMS sent! SID:`;
            console.log(successMessage, message.sid);
            res.json({ success: true, sid: message.sid, status: message.status });
        })
        .catch(error => {
            console.error('ERROR: Failed to send/schedule SMS:', error.message);
            res.status(500).json({ success: false, error: error.message });
        });
});

app.listen(port, () => {
    console.log(`✅ Backend server is running and ready to send/schedule messages.`);
    console.log(`Listening on port ${port}`);
});

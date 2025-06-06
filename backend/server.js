// server.js
const express = require('express');
const cors = require('cors');
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
    const { twilioSid, twilioToken, twilioFrom, phoneNumber, message } = req.body;

    if (!twilioSid || !twilioToken || !twilioFrom || !phoneNumber || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields from the frontend.' });
    }

    const client = twilio(twilioSid, twilioToken);

    client.messages
        .create({
            body: message,
            from: twilioFrom,
            to: phoneNumber
        })
        .then(message => {
            console.log('SUCCESS: Real SMS sent! SID:', message.sid);
            res.json({ success: true, sid: message.sid });
        })
        .catch(error => {
            console.error('ERROR: Failed to send real SMS:', error.message);
            res.status(500).json({ success: false, error: error.message });
        });
});

app.listen(port, () => {
    console.log(`✅ Backend server is running and ready to send REAL SMS messages.`);
    console.log(`Listening on port ${port}`);
});

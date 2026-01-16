const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const eventPayload = { 
            headers: req.headers,
            body: req.body,
            receivedAt: new Date().toISOString() 
        };

        try {
            const companyId = req.body.company_id;

            if (!companyId) {
                console.log('Webhook received without a company ID. Ignoring.');
                return res.status(200).json({ message: 'Webhook ignored: No company ID' });
            }

            const companyChannelName = `company-${companyId}`;

            await pusher.trigger(companyChannelName, "new-event", eventPayload);
            
            res.status(200).json({ message: `Webhook received and forwarded to channel: ${companyChannelName}` });

        } catch (error) {
            console.error('Pusher trigger error:', error);
            res.status(500).json({ message: 'Failed to forward webhook to Pusher' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
// /api/webhook-receiver.js
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
        const eventData = { ...req.body, receivedAt: new Date().toISOString() };

        try {
            const companyId = eventData.company_id;

            // 디버깅을 위해 console.error도 추가
            console.log(`[INFO] Webhook received for company: ${companyId}`);
            console.error(`[DEBUG] Webhook received for company: ${companyId}`); // 에러 레벨 로그는 더 눈에 띌 수 있음

            if (!companyId) {
                console.log('Webhook ignored: No company ID');
                return res.status(200).json({ message: 'Webhook ignored: No company ID' });
            }

            const companyChannelName = `private-company-${companyId}`;
            console.log(`[INFO] Triggering Pusher event to channel: ${companyChannelName}`);
            console.error(`[DEBUG] Triggering Pusher event to channel: ${companyChannelName}`);

            await pusher.trigger(companyChannelName, "new-event", eventData);
            
            
            await new Promise(resolve => setTimeout(resolve, 100)); // 0.1초 대기

            res.status(200).json({ message: `Webhook received and forwarded to channel: ${companyChannelName}` });

        } catch (error) {
            console.error('[ERROR] Pusher trigger error:', error);
            await new Promise(resolve => setTimeout(resolve, 100));
            res.status(500).json({ message: 'Failed to forward webhook to Pusher' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
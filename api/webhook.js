// /api/webhook.js
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
        // 기존과 동일하게 받은 데이터에 타임스탬프를 추가합니다.
        const eventData = {
            ...req.body,
            receivedAt: new Date().toISOString()
        };

        try {
            // 3. 'webhook-channel'의 'new-event'라는 이름으로 데이터를 Pusher에 전송합니다.
            await pusher.trigger("webhook-channel", "new-event", eventData);

            // Pusher로 전송 성공 시 eformsign에 200 OK 응답을 보냅니다.
            res.status(200).json({ message: 'Webhook received and forwarded to Pusher' });

        } catch (error) {
            console.error('Pusher trigger error:', error);
            // Pusher 전송 실패 시 500 서버 에러 응답을 보냅니다.
            res.status(500).json({ message: 'Failed to forward webhook to Pusher' });
        }

    } else {
        // GET을 포함한 다른 모든 HTTP 메소드는 이제 허용하지 않습니다.
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
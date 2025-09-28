// /api/webhook.js

const events = [];
const clients = [];

// CommonJS 방식을 유지합니다.
module.exports = async function handler(req, res) {
    const now = new Date().toISOString();
    console.log(`[${now}] 요청 수신: Method=${req.method}, URL=${req.url}`);

    if (req.method === 'POST') {
        const eventData = {
            ...req.body,
            receivedAt: new Date().toISOString()
        };

        events.unshift(eventData);
        if (events.length > 20) {
            events.pop();
        }
        
        // ★★★ POST 요청 시점의 클라이언트 수를 확인합니다. ★★★
        console.log(`웹훅 POST 요청 수신. 현재 연결된 클라이언트 수: ${clients.length}`);
        console.log('수신 데이터:', JSON.stringify(eventData, null, 2));

        clients.forEach((client, index) => {
            console.log(`클라이언트 ${index + 1}에게 데이터 전송 중...`);
            client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        });

        res.status(200).json({ message: 'Webhook received' });

    } else if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const clientId = Date.now();
        const newClient = { id: clientId, res: res };
        clients.push(newClient);
        

        console.log(`새 클라이언트 연결 (ID: ${clientId}). 현재 총 클라이언트 수: ${clients.length}`);

        events.forEach(event => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        req.on('close', () => {
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients.splice(index, 1);
                console.log(`클라이언트 연결 끊김 (ID: ${clientId}). 현재 총 클라이언트 수: ${clients.length}`);
            }
        });

    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
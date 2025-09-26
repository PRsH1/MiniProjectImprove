// A simple in-memory store for the latest events
const events = [];

// A list of active client connections for real-time updates
const clients = [];

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const eventData = {
            ...req.body,
            receivedAt: new Date().toISOString()
        };

        events.unshift(eventData);
        if (events.length > 20) {
            events.pop();
        }

        clients.forEach(client => {
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

        events.forEach(event => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        req.on('close', () => {
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients.splice(index, 1);
            }
        });

    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
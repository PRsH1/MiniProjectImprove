// /api/getDocumentInfo.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { domain, documentId, token } = req.query;

        if (!domain || !documentId || !token) {
            return res.status(400).json({ message: 'Missing required query parameters.' });
        }

        const params = new URLSearchParams({
            include_fields: 'true',
            include_histories: 'true',
            include_previous_status: 'true',
            include_next_status: 'true',
            include_external_token: 'true',
            include_detail_template_info: 'true'
        });
        const url = `${domain}/v2.0/api/documents/${documentId}?${params.toString()}`;

        const docResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await docResponse.json();

        if (!docResponse.ok) {
            return res.status(docResponse.status).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching document info:', error);
        res.status(500).json({ message: 'Failed to fetch document info', error: error.message });
    }
}
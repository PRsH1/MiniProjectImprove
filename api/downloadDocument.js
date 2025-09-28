// /api/downloadDocument.js

function parseContentDisposition(dispositionHeader) {
    if (!dispositionHeader) return null;
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(dispositionHeader);
    if (utf8Match && utf8Match[1]) {
        try { return decodeURIComponent(utf8Match[1]); } catch (e) {}
    }
    const legacyMatch = /filename="?([^;"]+)"?/i.exec(dispositionHeader);
    if (legacyMatch && legacyMatch[1]) { return legacyMatch[1]; }
    return null;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { domain, documentId, file_type, title } = req.query;
        const token = req.headers.authorization?.split(' ')[1];

        if (!domain || !documentId || !file_type || !token) {
            return res.status(400).json({ message: 'Missing required parameters.' });
        }

        const params = new URLSearchParams({ file_type });
        const url = `${domain}/v2.0/api/documents/${documentId}/download_files?${params.toString()}`;

        const fileResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!fileResponse.ok) {
            const errorJson = await fileResponse.json();
            return res.status(fileResponse.status).json(errorJson);
        }

        const contentDisposition = fileResponse.headers.get('content-disposition');
        const contentType = fileResponse.headers.get('content-type');
        const fileBuffer = await fileResponse.arrayBuffer();

        
        let finalFileName = parseContentDisposition(contentDisposition);

     
        if (!finalFileName) {
            finalFileName = title || 'download'; // title이 없으면 'download'로 지정
            // Content-Type에 따라 확장자 추가
            if (contentType && contentType.includes('application/pdf') && !finalFileName.toLowerCase().endsWith('.pdf')) {
                finalFileName += '.pdf';
            } else if (contentType && contentType.includes('application/zip') && !finalFileName.toLowerCase().endsWith('.zip')) {
                finalFileName += '.zip';
            }
        }
        
        const encodedFileName = encodeURIComponent(finalFileName);
        res.setHeader('Content-Disposition', `attachment; filename*="UTF-8''${encodedFileName}"`);
        
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.send(Buffer.from(fileBuffer));

    } catch (error) {
        console.error('File download proxy error:', error);
        res.status(500).json({ message: 'Failed to download file', error: error.message });
    }
}
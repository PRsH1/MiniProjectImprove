// /api/downloadDocument.js

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { domain, documentId, file_type } = req.query;
        const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN" 형식에서 토큰 추출

        if (!domain || !documentId || !file_type || !token) {
            return res.status(400).json({ message: 'Missing required parameters.' });
        }

        const params = new URLSearchParams({ file_type });
        const url = `${domain}/v2.0/api/documents/${documentId}/download_files?${params.toString()}`;

        // eformsign 서버에 파일 다운로드 요청
        const fileResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!fileResponse.ok) {
            const errorJson = await fileResponse.json();
            // 클라이언트에 eformsign의 에러 메시지를 그대로 전달
            return res.status(fileResponse.status).json(errorJson);
        }

        // eformsign 응답에서 헤더와 파일 본문을 가져옴
        const contentDisposition = fileResponse.headers.get('content-disposition');
        const contentType = fileResponse.headers.get('content-type');
        const fileBuffer = await fileResponse.arrayBuffer();

        // 클라이언트(브라우저)에 헤더 설정
        if (contentDisposition) {
            res.setHeader('Content-Disposition', contentDisposition);
        }
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // 파일 본문을 클라이언트에 전송
        res.send(Buffer.from(fileBuffer));

    } catch (error) {
        console.error('File download proxy error:', error);
        res.status(500).json({ message: 'Failed to download file', error: error.message });
    }
}
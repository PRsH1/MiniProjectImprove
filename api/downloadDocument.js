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

        // --- 진단 로그 시작 ---
        console.log("--- 문서 다운로드 요청 진단 시작 ---");
        console.log(`[1] 프론트엔드에서 수신된 제목: ${title}`);

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

        console.log(`[2] eformsign 서버 응답 헤더 (Content-Disposition): ${contentDisposition}`);
        
        let finalFileName;
        const parsedFileName = parseContentDisposition(contentDisposition);
        
        console.log(`[3] 헤더에서 파싱된 파일명: ${parsedFileName}`);

        if (parsedFileName) {
            finalFileName = parsedFileName;
            console.log(`[4a] 결정 방식: 헤더 우선 원칙에 따라 파일명 결정됨 -> ${finalFileName}`);
        } else {
            finalFileName = title || 'download';
            console.log(`[4b] 결정 방식: 헤더 파일명이 없어 프론트엔드 제목 사용 -> ${finalFileName}`);
            if (contentType && contentType.includes('application/pdf') && !finalFileName.toLowerCase().endsWith('.pdf')) {
                finalFileName += '.pdf';
            } else if (contentType && contentType.includes('application/zip') && !finalFileName.toLowerCase().endsWith('.zip')) {
                finalFileName += '.zip';
            }
        }
        
        console.log(`[5] 최종 결정된 파일명: ${finalFileName}`);
        console.log("--- 문서 다운로드 요청 진단 종료 ---");
        
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
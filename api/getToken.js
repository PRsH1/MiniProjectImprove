// /api/getToken.js
// 1. 라이브러리 import 방식을 수정합니다.
import jsrsasign from 'jsrsasign-util';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { domain, apiKey, memberId, secretKey } = req.body;

        if (!domain || !apiKey || !memberId || !secretKey) {
            return res.status(400).json({ message: 'domain, apiKey, memberId, secretKey are all required.' });
        }

        const privateKey = secretKey;
        const execTime = Date.now();
        
        // 서명 생성
        // 2. KEYUTIL 대신 jsrsasign.KEYUTIL 을 사용합니다.
        const keyObj = jsrsasign.KEYUTIL.getKeyFromPlainPrivatePKCS8Hex(privateKey);
        
        // 3. KJUR 대신 jsrsasign.KJUR 을 사용합니다.
        const sig = new jsrsasign.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
        sig.init(keyObj);
        sig.updateString(execTime.toString());
        const signature = sig.sign();

        // eformsign에 토큰 요청
        const tokenResponse = await fetch(`${domain}/v2.0/api_auth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + Buffer.from(apiKey).toString('base64'),
                'eformsign_signature': signature
            },
            body: JSON.stringify({ execution_time: execTime, member_id: memberId }),
        });

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.status(tokenResponse.status).json(data);
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Error getting access token:', error);
        res.status(500).json({ message: 'Failed to get access token', error: error.message });
    }
}
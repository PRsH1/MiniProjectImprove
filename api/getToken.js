// /api/getToken.js

// 1. Node.js의 내장 'module'에서 createRequire 함수를 가져옵니다.
import { createRequire } from 'module';

// 2. 현재 모듈의 URL을 기준으로 require 함수를 생성합니다.
const require = createRequire(import.meta.url);

// 3. 공식 'jsrsasign' 패키지를 불러옵니다.
const jsrsasign = require('jsrsasign');


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
        
        const keyObj = jsrsasign.KEYUTIL.getKeyFromPlainPrivatePKCS8Hex(privateKey);
        
        // *** 오타를 'SHA256withECDSA'로 수정했습니다. ***
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
import nodemailer from 'nodemailer';
import { URLSearchParams } from 'url';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const logBuffer = []; // 로그를 저장할 배열
    
    try {
        const params = new URLSearchParams(req.body);
        const host = params.get('host');
        const port = parseInt(params.get('port'), 10);
        const authRequired = params.get('authRequired') === 'true';
        const user = params.get('user');
        const pass = params.get('pass');
        const from = params.get('from');
        const to = params.get('to');
        const security = params.get('security');

        if (!host || !port || !from || !to) {
            return res.status(400).json({ 
                success: false, 
                message: "<span style='color:red;'>❌ 필수값(Host/Port/From/To)이 비어 있습니다.</span>" 
            });
        }
        
        const requestInfo = `[REQUEST] Host=${host}, Port=${port}, AuthRequired=${authRequired}, User=${user}, From=${from}, To=${to}, Security=${security}`;
        console.log(requestInfo);
        logBuffer.push(requestInfo);

        const transporterOptions = {
            host: host,
            port: port,
            secure: security === 'ssl',
            requireTLS: security === 'tls',
            auth: authRequired ? { user, pass } : undefined,
            debug: true,
            logger: { // logger를 통해 로그를 배열에 저장
                info: (...args) => logBuffer.push(`[INFO] ${args.join(' ')}`),
                debug: (...args) => logBuffer.push(`[DEBUG] ${args.join(' ')}`),
                warn: (...args) => logBuffer.push(`[WARN] ${args.join(' ')}`),
                error: (...args) => logBuffer.push(`[ERROR] ${args.join(' ')}`),
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'DEFAULT:@SECLEVEL=1'
            }
        };

        const transporter = nodemailer.createTransport(transporterOptions);

        const mailOptions = {
            from: from,
            to: to,
            subject: 'SMTP 발송 테스트 (Node.js Serverless)',
            text: '이 메일은 Vercel 서버리스 함수를 통해 발송된 테스트입니다.',
        };

        const info = await transporter.sendMail(mailOptions);
        
        const successMessage = `[SUCCESS] Mail sent: ${info.response}`;
        console.log(successMessage);
        logBuffer.push(successMessage);

        res.status(200).json({
            success: true,
            message: `<span style='color:green;'>✅ 메일 발송 성공! 수신자: ${to}</span>`,
            logs: logBuffer
        });

    } catch (error) {
        const errorMessage = `[ERROR] Mail sending failed: ${error.message}`;
        console.error(errorMessage);
        logBuffer.push(errorMessage); // 에러 로그도 버퍼에 추가

        res.status(500).json({
            success: false,
            message: `<span style='color:red;'>❌ 메일 발송 실패: ${error.message}</span>`,
            logs: logBuffer,
            error: error.message
        });
    }
}
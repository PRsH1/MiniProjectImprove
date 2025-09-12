import nodemailer from 'nodemailer';
import { URLSearchParams } from 'url';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

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
      return res.status(400).send("<span style='color:red;'>❌ 필수값(Host/Port/From/To)이 비어 있습니다.</span>");
    }
    
    console.log(`[REQUEST] Host=${host}, Port=${port}, AuthRequired=${authRequired}, User=${user}, From=${from}, To=${to}, Security=${security}`);

    const transporterOptions = {
      host: host,
      port: port,
      secure: security === 'ssl',
      requireTLS: security === 'tls',
      auth: authRequired ? { user, pass } : undefined,
      debug: true,
     
      logger: {
        info: (...args) => console.log('[SMTP INFO]', ...args),
        debug: (...args) => console.log('[SMTP DEBUG]', ...args),
        warn: (...args) => console.warn('[SMTP WARN]', ...args),
        error: (...args) => console.error('[SMTP ERROR]', ...args),
      },
      
      tls: {
        rejectUnauthorized: false,
        // 보안 수준을 낮춰 호환성을 높입니다.
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
    
    // 성공 로그는 info.response가 문자열이므로 그대로 둡니다.
    console.log('[SUCCESS] Mail sent:', info.response);
    res.status(200).send(`<span style='color:green;'>✅ 메일 발송 성공! 수신자: ${to}</span>`);

  } catch (error) {
    console.error('[ERROR] Mail sending failed:', error);
    res.status(500).send(`<span style='color:red;'>❌ 메일 발송 실패: ${error.message}</span>`);
  }
}
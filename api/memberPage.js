import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'cookie';

export default async function handler(req, res) {
  // 1. 쿠키 파싱
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['vercel-auth-cookie'];

  // 2. 인증 확인
  if (authCookie === process.env.AUTH_COOKIE_VALUE) {
    // 3. 인증 성공 시: 비공개 파일을 읽어서 전송
    try {
      // 프로젝트 루트를 기준으로 파일 경로를 설정합니다.
      const filePath = path.join(process.cwd(), 'private', 'Member.html');
      const fileContents = await fs.readFile(filePath, 'utf8');

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(fileContents);
    } catch (error) {
      console.error('File read error:', error);
      res.status(500).send('Error loading page.');
    }
  } else {
    // 4. 인증 실패 시: 로그인 페이지로 리디렉션
    res.redirect(302, '/auth/login.html');
  }
}
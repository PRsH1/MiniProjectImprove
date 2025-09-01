import { serialize } from 'cookie';

export default function handler(req, res) {
  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Allow', 'POST').send('Method Not Allowed');
  }

  const { password } = req.body;

  // Vercel 환경 변수에서 설정한 비밀번호와 비교
  if (password === process.env.MEMBER_PAGE_PASSWORD) {
    // 암호가 맞으면 쿠키 생성
    const cookie = serialize('vercel-auth-cookie', process.env.AUTH_COOKIE_VALUE, {
      httpOnly: true, // 클라이언트 측 JS에서 접근 불가
      secure: process.env.NODE_ENV !== 'development', // 프로덕션 환경에서만 secure
      maxAge: 60 * 15, // 15분 유지
      sameSite: 'strict',
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    // 원래 접속하려던 페이지로 리디렉션
    res.redirect(302, '/API(JS,HTML)/Member.html');
  } else {
    // 암호가 틀리면 에러 표시와 함께 로그인 페이지로 다시 보냄
    res.redirect(302, '/auth/login.html?error=1');
  }
}
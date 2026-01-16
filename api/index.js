// api/index.js (Vercel Entry Point)

module.exports = async (req, res) => {
  const { url } = req;
  const path = url.split('?')[0]; // 쿼리 파라미터 제거

  let controllerName = '';

  // 1. URL에 따라 실행할 컨트롤러 결정
  if (path.startsWith('/api/')) {
    // 예: /api/auth -> auth
    // 예: /api/sso-login -> sso-login
    controllerName = path.replace('/api/', '').replace('/', '');
  } else if (path === '/ApiAutoTest') {
    // 예: /ApiAutoTest -> ApiAutoTest.js 실행
    controllerName = 'ApiAutoTest';
  } else if (path === '/templatecopy') {
    // 예: /templatecopy -> templatecopy.js 실행
    controllerName = 'templatecopy';
  }

  // 2. 컨트롤러가 없으면 404
  if (!controllerName) {
    return res.status(404).send('Not Found');
  }

  try {
    // 3. controllers 폴더에서 파일 로드
    // (보안: 상위 디렉토리 접근 방지)
    if (controllerName.includes('..')) {
      return res.status(403).send('Forbidden');
    }

    const controller = require(`../controllers/${controllerName}`);

    // 4. 컨트롤러 실행
    if (typeof controller === 'function') {
      return await controller(req, res);
    } else if (typeof controller.default === 'function') {
      return await controller.default(req, res);
    } else {
      throw new Error('Controller is not a function');
    }

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn(`⚠️ Controller not found: ${controllerName}`);
      return res.status(404).send('Page or API not found');
    }
    console.error(`❌ Critical Error in ${controllerName}:`, error);
    res.status(500).send('Internal Server Error');
  }
};
// api/index.js (Vercel Entry Point)

// [핵심] Vercel이 파일을 인식할 수 있도록 명시적으로 매핑합니다.
const controllers = {
  // --- API 엔드포인트 ---
  'auth': require('../controllers/auth'),
  'downloadDocument': require('../controllers/downloadDocument'),
  'getDocumentInfo': require('../controllers/getDocumentInfo'),
  'getToken': require('../controllers/getToken'),
  'idp-initiated-login': require('../controllers/idp-initiated-login'),
  'login': require('../controllers/login'),
  'memberPage': require('../controllers/memberPage'),
  'metadata': require('../controllers/metadata'),
  'send': require('../controllers/send'),
  'sso-login': require('../controllers/sso-login'),
  'templatecopy': require('../controllers/templatecopy'),
  'webhook-receiver': require('../controllers/webhook-receiver'),
  
  // --- 페이지 엔드포인트 (대소문자 정확히) ---
  'ApiAutoTest': require('../controllers/ApiAutoTest'),
  // 'templatecopy'는 위 API 목록에 있으므로 중복 생략 가능
};

module.exports = async (req, res) => {
  const { url } = req;
  const path = url.split('?')[0]; // 쿼리 파라미터 제거

  let controllerKey = '';

  // 1. URL에 따라 실행할 컨트롤러 키(Key) 결정
  if (path.startsWith('/api/')) {
    // 예: /api/auth -> auth
    controllerKey = path.replace('/api/', '').replace('/', '');
  } else if (path === '/ApiAutoTest') {
    controllerKey = 'ApiAutoTest';
  } else if (path === '/templatecopy') {
    controllerKey = 'templatecopy';
  }

  // 2. 컨트롤러 키가 없거나 맵에 등록되지 않은 경우 404
  const controller = controllers[controllerKey];

  if (!controllerKey || !controller) {
    console.warn(`⚠️ 404 Not Found: ${path} (Key: ${controllerKey})`);
    return res.status(404).send('Not Found');
  }

  try {
    // 3. 컨트롤러 실행
    // (CommonJS require로 불러왔으므로 default나 module.exports 처리)
    if (typeof controller === 'function') {
      return await controller(req, res);
    } else if (typeof controller.default === 'function') {
      return await controller.default(req, res);
    } else if (typeof controller.handler === 'function') {
      return await controller.handler(req, res);
    } else {
      throw new Error(`Controller [${controllerKey}] is not a function`);
    }

  } catch (error) {
    console.error(`❌ Critical Error in ${controllerKey}:`, error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
};
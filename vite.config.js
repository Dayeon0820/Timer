import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → GitHub Pages(하위 경로)와 Vercel(루트) 어디에 올려도 동작
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 공유 미리보기(og:image 등)에 쓸 사이트 절대 주소. 우선순위:
  // 1) 직접 지정한 VITE_SITE_URL (Vercel 대시보드 환경 변수 등)
  // 2) Vercel 이 빌드 때 알려주는 실제 배포 주소 (VERCEL_PROJECT_PRODUCTION_URL, 예: timer-xxx.vercel.app)
  // 3) .env 의 기본값
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const raw = process.env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}/` : env.VITE_SITE_URL) || '/';
  const siteUrl = raw.endsWith('/') ? raw : `${raw}/`;

  return {
    plugins: [
      react(),
      {
        // index.html 의 %VITE_SITE_URL% 을 위에서 정한 주소로 바꾼다
        name: 'site-url',
        transformIndexHtml: {
          order: 'pre',
          handler: (html) => html.replaceAll('%VITE_SITE_URL%', siteUrl),
        },
      },
    ],
    base: './',
  };
});

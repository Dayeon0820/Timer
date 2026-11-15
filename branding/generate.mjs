// 브랜드 이미지 생성 스크립트: npm run brand
// - public/favicon.svg 를 원본으로 PNG/ICO 아이콘을 만들고
// - branding/og-image.html 을 캡처해 공유 미리보기 이미지(1200×630)를 만든다.
// 설치된 Chrome/Edge 를 사용한다. 경로가 다르면 CHROME_PATH 환경변수로 지정.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (f) => join(root, 'public', f);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('Chrome 을 찾지 못했어요. CHROME_PATH 환경변수로 경로를 지정해 주세요.');
  process.exit(1);
}

// 파비콘(둥근 모서리) 원본
const favicon = readFileSync(pub('favicon.svg'), 'utf8');

// 홈 화면용(정사각형, 모서리는 OS 가 둥글게 자름): 배경을 꽉 채우고 마스코트를 안전 영역 안에 배치
const squareIcon = (scale, tx, ty) =>
  favicon
    .replace('rx="15"', 'rx="0"')
    .replace(/translate\([^)]*\) scale\([^)]*\)/, `translate(${tx} ${ty}) scale(${scale})`);
const APPLE_ICON = squareIcon(0.45, 4.1, 9.5); // iOS: 여백 적당히
const MASKABLE_ICON = squareIcon(0.36, 9.7, 14); // 안드로이드 maskable: 가운데 80% 안전 영역 안

const browser = await puppeteer.launch({ executablePath, headless: 'new' });
const page = await browser.newPage();

async function renderSvg(svg, size, file) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  await page.screenshot({ path: pub(file), omitBackground: true });
  console.log('✓', file);
}

await renderSvg(favicon, 32, 'favicon-32.png');
await renderSvg(favicon, 192, 'icon-192.png');
await renderSvg(favicon, 512, 'icon-512.png');
await renderSvg(APPLE_ICON, 180, 'apple-touch-icon.png');
await renderSvg(MASKABLE_ICON, 512, 'icon-maskable-512.png');

// favicon.ico: 32×32 PNG 하나를 ICO 컨테이너로 감싼다 (구형 브라우저/일부 크롤러용)
{
  const png = readFileSync(pub('favicon-32.png'));
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // 이미지 개수
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14); // 이미지 크기
  header.writeUInt32LE(22, 18); // 이미지 시작 위치
  writeFileSync(pub('favicon.ico'), Buffer.concat([header, png]));
  console.log('✓ favicon.ico');
}

// 공유 미리보기 이미지
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(root, 'branding', 'og-image.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: pub('og-image.png') });
console.log('✓ og-image.png');

await browser.close();

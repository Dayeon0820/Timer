// MediaPipe WASM 런타임 파일을 public/wasm 으로 복사하는 스크립트
// (CDN 없이 로컬에서 불러오기 위함. npm install 시 postinstall 로 자동 실행)
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dest = join(root, 'public', 'wasm');
// FilesetResolver.forVisionTasks() 기본값이 사용하는 파일만 복사 (용량 절약)
const files = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'];

if (!existsSync(src)) {
  console.warn('[copy-wasm] @mediapipe/tasks-vision 이 아직 설치되지 않아 건너뜁니다.');
} else {
  mkdirSync(dest, { recursive: true });
  for (const f of files) copyFileSync(join(src, f), join(dest, f));
  console.log('[copy-wasm] WASM 파일을 public/wasm 으로 복사했습니다.');
}

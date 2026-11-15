import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → GitHub Pages(https://아이디.github.io/저장소명/) 같은 하위 경로에서도 동작
export default defineConfig({
  plugins: [react()],
  base: './',
});

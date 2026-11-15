// 얇고 부드러운 원형 진행 표시
// tone: focus(딥그린) | rest(블루) | warn(일시정지 경고)
const VIEW = 200;

// size 를 생략하면 CSS 변수 --ring-size 로 크기를 정한다 (반응형 레이아웃용)
export default function ProgressRing({ progress = 0, tone = 'focus', size, stroke = 7, children, className = '' }) {
  const p = Math.min(1, Math.max(0, progress));
  const r = VIEW / 2 - stroke * 1.5; // 끝 점(dot)이 잘리지 않도록 여백
  const circ = 2 * Math.PI * r;
  // SVG 전체를 -90° 회전시켜 12시 방향에서 시작
  const angle = p * 2 * Math.PI;
  const dotX = VIEW / 2 + r * Math.cos(angle);
  const dotY = VIEW / 2 + r * Math.sin(angle);

  return (
    <div className={`ring ${tone !== 'focus' ? `ring--${tone}` : ''} ${className}`} style={size ? { '--ring-size': `${size}px` } : undefined}>
      <svg className="ring__svg" viewBox={`0 0 ${VIEW} ${VIEW}`} aria-hidden="true">
        <circle className="ring__track" cx={VIEW / 2} cy={VIEW / 2} r={r} strokeWidth={stroke} />
        {p > 0 && (
          <>
            <circle
              className="ring__bar"
              cx={VIEW / 2}
              cy={VIEW / 2}
              r={r}
              strokeWidth={stroke}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - p)}
            />
            {/* 시작 직후엔 끝 점이 링 위 마스코트에 가려지므로 조금 진행된 뒤부터 표시 */}
            {p > 0.04 && <circle className="ring__dot" cx={dotX} cy={dotY} r={stroke * 0.95} />}
          </>
        )}
      </svg>
      <div className="ring__content">{children}</div>
    </div>
  );
}

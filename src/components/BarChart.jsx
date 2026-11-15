// 라이브러리 없이 SVG로 그린 단일 계열 막대 차트 (일별 집중 시간, 시간대별 분석 공용)
// - 막대마다 호버/포커스 툴팁, 위쪽이 둥근 막대, 옅은 격자
import { useEffect, useRef, useState } from 'react';

const H = 220; // 차트 높이는 고정, 너비는 컨테이너에 맞춤 (글자 크기가 화면에 따라 변하지 않도록)
const PAD = { top: 20, right: 8, bottom: 28, left: 36 };

/** 위쪽 모서리만 둥근 막대 path (기준선에 붙는 아래쪽은 각지게) */
function barPath(x, y, w, h, r) {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/** 보기 좋은 y축 최댓값과 눈금. fixedTop 이 있으면(예: 100%) 그 값을 꼭대기로 쓴다 */
function niceTicks(max, minTop, fixedTop) {
  if (fixedTop) {
    const step = fixedTop / 4;
    return { top: fixedTop, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
  }
  const target = Math.max(max, minTop);
  const step = [1, 2, 5, 10, 15, 25, 30, 60, 120].find((s) => target / s <= 4) ?? 180;
  const top = Math.ceil(target / step) * step;
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { top, ticks };
}

/**
 * @param {{label:string, axisLabel?:string, value:number, detail?:string, highlight?:boolean}[]} data
 * @param {(v:number)=>string} formatValue 툴팁에 표시할 값 문구
 * @param {number} labelEvery  x축 라벨을 N개마다 하나씩만 표시 (막대가 많을 때)
 * @param {number} minTop      y축 최소 꼭대기 값 (데이터가 작을 때 막대가 너무 커지지 않게)
 * @param {number} fixedTop    y축 꼭대기 고정 (예: 집중도 100%)
 */
export default function BarChart({
  data,
  unit = '분',
  ariaLabel,
  formatValue = (v) => `${v}${unit} 집중`,
  labelEvery = 1,
  minTop = 10,
  fixedTop,
}) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const [W, setW] = useState(560);

  // 컨테이너 너비가 바뀌면 다시 그림
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const { top, ticks } = niceTicks(Math.max(...data.map((d) => d.value)), minTop, fixedTop);
  const slot = innerW / data.length;
  const barW = Math.min(40, slot * (data.length > 12 ? 0.68 : 0.6)); // 굵고 둥근 막대
  const y = (v) => PAD.top + innerH - (v / top) * innerH;

  return (
    <div className="chart" ref={wrapRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {/* 옅은 가로 격자 + y축 눈금 */}
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'chart-baseline' : 'chart-grid'} x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart-axis" x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const by = y(d.value);
          const active = hover === i;
          return (
            <g
              key={`${d.label}-${i}`}
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.label}: ${d.value}${unit}`}
            >
              {/* 막대보다 넓은 투명 히트 영역 (작은 막대도 쉽게 호버) */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {active && <rect className="chart-hover-band" x={PAD.left + slot * i + 2} y={PAD.top} width={slot - 4} height={innerH} rx="6" />}
              <path className={`chart-bar ${d.highlight ? 'today' : ''}`} d={barPath(cx - barW / 2, by, barW, PAD.top + innerH - by, barW / 2)} />
              {i % labelEvery === 0 && (
                <text className={`chart-axis ${d.highlight ? 'strong' : ''}`} x={cx} y={H - 8} textAnchor="middle">
                  {d.axisLabel ?? d.label}
                </text>
              )}
              {/* 선택적 직접 라벨: 오늘 막대에만 값 표시 */}
              {d.highlight && d.value > 0 && !active && (
                <text className="chart-value" x={cx} y={by - 6} textAnchor="middle">
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            // 양 끝 막대에서도 툴팁이 차트 밖으로 나가지 않도록 범위 제한
            left: `${Math.min(85, Math.max(15, ((PAD.left + slot * hover + slot / 2) / W) * 100))}%`,
            top: `${(Math.max(y(data[hover].value), PAD.top + 30) / H) * 100}%`,
          }}
        >
          <b>{data[hover].label}</b>
          <span>{formatValue(data[hover].value)}</span>
          {data[hover].detail && <small>{data[hover].detail}</small>}
        </div>
      )}
    </div>
  );
}

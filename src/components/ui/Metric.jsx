// 지표 타일 (아이콘 + 라벨 + 큰 숫자 + 오른쪽 보조 시각화)
// shortLabel: 좁은 화면(모바일 3칸 요약)에서 대신 보여줄 짧은 이름
export function Metric({ icon: Icon, label, shortLabel, value, sub, aside, className = '' }) {
  return (
    <div className={`metric ${className}`}>
      <div className="metric__text">
        <span className="metric__label">
          {Icon && <Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
          {shortLabel ? (
            <>
              <span className="metric__label-full">{label}</span>
              <span className="metric__label-short" aria-hidden="true">
                {shortLabel}
              </span>
            </>
          ) : (
            label
          )}
        </span>
        <span className="metric__value">{value}</span>
        {sub && <span className="metric__sub">{sub}</span>}
      </div>
      {aside}
    </div>
  );
}

// 지표 옆 작은 막대 추세 (마지막 값 = 오늘 강조)
export function MiniBars({ values, label }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mini-bars" role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          className={i === values.length - 1 ? 'is-current' : ''}
          style={{ height: `${Math.max(14, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

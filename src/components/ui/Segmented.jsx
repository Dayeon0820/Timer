// 세그먼트 컨트롤: 같은 영역에서 보기를 바꿀 때 (예: 집중 시간 / 집중도 / 졸음 / 딴짓)
export default function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className="segmented__item"
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

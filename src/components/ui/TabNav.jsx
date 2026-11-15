// 탭 내비게이션
// variant="pill": 데스크톱 상단 알약형 / variant="bar": 모바일 하단 탭바
export default function TabNav({ items, value, onChange, variant = 'pill', label = '화면 선택', className = '' }) {
  return (
    <nav className={`tabnav tabnav--${variant} ${className}`} role="tablist" aria-label={label}>
      {items.map(({ id, label: text, icon: Icon }) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className="tabnav__item" onClick={() => onChange(id)}>
          {variant === 'bar' ? (
            <span className="tabnav__icon">
              <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
            </span>
          ) : (
            <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {text}
        </button>
      ))}
    </nav>
  );
}

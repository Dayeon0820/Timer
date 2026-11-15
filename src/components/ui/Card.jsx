// 카드 컨테이너: 제목/아이콘/우측 액션이 있는 공통 패널
export default function Card({ title, subtitle, icon: Icon, action, flat = false, tight = false, className = '', children, ...rest }) {
  const classes = ['card', flat && 'card--flat', tight && 'card--tight', className].filter(Boolean).join(' ');
  return (
    <section className={classes} {...rest}>
      {(title || action) && (
        <header className="card__header">
          <div>
            {title && (
              <h2 className="card__title">
                {Icon && <Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
                {title}
              </h2>
            )}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

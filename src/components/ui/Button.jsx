// 버튼 컴포넌트
// variant: primary | secondary | ghost | danger | rest
// size: sm | md | lg
// icon: lucide-react 아이콘 컴포넌트, iconOnly 이면 label 은 스크린리더 전용
const ICON_SIZE = { sm: 16, md: 18, lg: 22 };

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconOnly = false,
  block = false,
  label,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    iconOnly && 'btn--icon',
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined} {...rest}>
      {Icon && <Icon size={ICON_SIZE[size]} strokeWidth={2.2} aria-hidden="true" />}
      {!iconOnly && <span className="btn__label">{children ?? label}</span>}
    </button>
  );
}

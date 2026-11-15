// 폼 컴포넌트: 슬라이더, 스위치, 숫자 스테퍼
import { Minus, Plus } from 'lucide-react';
import Button from './Button';

/** 라벨 + 현재값 + 슬라이더 + 도움말 */
export function SliderField({ label, hint, value, min, max, step = 1, unit = '', onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="field">
      <span className="field__head">
        <span>{label}</span>
        <output className="field__value">
          {value}
          {unit}
        </output>
      </span>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

/** 켜기/끄기 스위치 */
export function SwitchField({ label, hint, checked, onChange }) {
  return (
    <label className="field switch-field">
      <span>
        <span className="field__head">{label}</span>
        {hint && <small className="field__hint">{hint}</small>}
      </span>
      <input className="switch" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** 큰 숫자 + -/+ 버튼 */
export function Stepper({ label, value, unit, min, max, step = 1, onChange }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <span className="stepper__label">{label}</span>
      <span className="stepper__value">
        {String(value).padStart(2, '0')}
        {unit && <small>{unit}</small>}
      </span>
      <div className="stepper__controls">
        <Button size="sm" iconOnly icon={Minus} label={`${label} 줄이기`} onClick={() => set(value - step)} disabled={value <= min} />
        <Button size="sm" iconOnly icon={Plus} label={`${label} 늘리기`} onClick={() => set(value + step)} disabled={value >= max} />
      </div>
    </div>
  );
}

// 마스코트 "새싹떡" - 머리에 새싹이 난 작은 떡 캐릭터 (SVG 직접 제작)
// 색은 모두 CSS 토큰(.mascot__*)으로 칠하므로 테마를 바꾸면 함께 바뀐다.
//
// mood: happy(기본) | sleepy(졸음) | surprised(딴짓) | worried(자리비움) | rest(휴식) | idle
// peek: true 이면 앞발이 보이는 "빼꼼" 자세 (타이머 링 위에 걸쳐 앉을 때 사용)

function Eyes({ mood }) {
  switch (mood) {
    case 'sleepy':
      return (
        <>
          <path className="mascot__face" d="M43 58h9M72 58h9" />
          <path className="mascot__spark" d="M100 18h8l-8 9h8M112 6h6l-6 7h6" fill="none" />
        </>
      );
    case 'rest':
      return <path className="mascot__face" d="M43 60q4.5-6 9 0M72 60q4.5-6 9 0" />;
    case 'surprised':
      return (
        <>
          <circle className="mascot__eye" cx="48" cy="57" r="5" />
          <circle className="mascot__eye" cx="76" cy="57" r="5" />
          <path className="mascot__spark" d="M100 14l5-9M108 24l9-5M110 36h9" />
        </>
      );
    case 'idle':
      return <path className="mascot__face" d="M44 58h8M72 58h8" />;
    default:
      return (
        <>
          <circle className="mascot__eye" cx="48" cy="58" r="4" />
          <circle className="mascot__eye" cx="76" cy="58" r="4" />
        </>
      );
  }
}

function Mouth({ mood }) {
  switch (mood) {
    case 'sleepy':
      return <ellipse className="mascot__eye" cx="62" cy="69" rx="3" ry="2.5" />;
    case 'surprised':
      return <circle className="mascot__face" cx="62" cy="70" r="4" />;
    case 'worried':
      return <path className="mascot__face" d="M56 70q6-4 12 0" />;
    case 'idle':
      return <path className="mascot__face" d="M58 68h8" />;
    default:
      return <path className="mascot__face" d="M56 66q6 6 12 0" />;
  }
}

export default function Mascot({ mood = 'happy', size = 64, peek = false, bob = false, className = '', title }) {
  return (
    <svg
      className={`mascot ${bob ? 'mascot--bob' : ''} ${className}`}
      width={size}
      height={(size * 100) / 124}
      viewBox="0 0 124 100"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* 머리 위 새싹 */}
      <path className="mascot__face" d="M62 24v-10" />
      <path className="mascot__body" d="M62 15c-4-8-12-10-17-7 3 7 10 9 17 7zM62 15c4-8 12-10 17-7-3 7-10 9-17 7z" />
      {/* 몸통 (둥근 떡) */}
      <path className="mascot__body" d="M12 94C12 50 34 24 62 24s50 26 50 70z" />
      {/* 볼 */}
      <ellipse className="mascot__cheek" cx="37" cy="68" rx="6" ry="3.5" />
      <ellipse className="mascot__cheek" cx="87" cy="68" rx="6" ry="3.5" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* 빼꼼 자세일 때 앞발 */}
      {peek && (
        <>
          <ellipse className="mascot__paw" cx="32" cy="92" rx="12" ry="9" />
          <ellipse className="mascot__paw" cx="92" cy="92" rx="12" ry="9" />
        </>
      )}
    </svg>
  );
}

// 앱 전체에서 사용하는 기본 설정값
export const DEFAULT_SETTINGS = {
  // 뽀모도로 타이머 (분)
  focusMinutes: 25,
  breakMinutes: 5,

  // 졸음 판정: 양쪽 눈 감김 점수가 임계값 이상인 상태가 N초 지속
  blinkThreshold: 0.5,
  drowsySeconds: 2,

  // 딴짓 판정: 기준 자세 대비 좌우(yaw) 또는 아래(pitch) 각도가 N초 지속
  yawThreshold: 30,
  pitchThreshold: 25,
  distractedSeconds: 3,

  // 자리 비움 판정: 얼굴이 N초 이상 검출되지 않음
  awaySeconds: 5,

  // 졸음 단계별 대응 (1 화면 깜빡임 → 2 경고음 → 3 스트레칭 미션)
  drowsyEscalation: true,
  stretchMission: true,

  // 기타
  soundEnabled: true,
  invertPitch: false, // 카메라 환경에 따라 위/아래 방향이 반대로 잡힐 때 사용
  showDebug: false,
};

// 집중 상태 종류와 화면 표시용 정보
export const STATUS_INFO = {
  // tone: 디자인 토큰의 상태 색 / mood: 마스코트 표정 / message: 카메라 패널 안내 문구
  idle: { label: '대기 중', tone: 'muted', mood: 'idle', message: '카메라가 꺼져 있어요' },
  loading: { label: '준비 중', tone: 'muted', mood: 'idle', message: '얼굴 인식을 준비하고 있어요' },
  focused: { label: '집중 중', tone: 'good', mood: 'happy', message: '집중하는 중이에요!' },
  drowsy: { label: '졸음 감지', tone: 'warn', mood: 'sleepy', message: '졸고 있나요? 잠깐 기지개!' },
  distracted: { label: '딴짓 감지', tone: 'warn', mood: 'surprised', message: '화면을 바라봐 주세요' },
  away: { label: '자리 비움', tone: 'bad', mood: 'worried', message: '어디 가셨어요?' },
};

// 경고 화면에 띄울 안내 문구
export const ALERT_MESSAGE = {
  drowsy: '눈을 감고 계신 것 같아요. 잠깐 스트레칭 어떨까요?',
  distracted: '화면에서 시선이 벗어났어요. 다시 집중해볼까요?',
  away: '얼굴이 보이지 않아요. 자리로 돌아오면 자동으로 재개돼요.',
};

// 졸음 단계별 대응 기준
export const ESCALATION = {
  level2AfterMs: 4000, // 졸음이 감지된 뒤 4초 더 졸면 2단계 (경고음)
  level3AfterMs: 10000, // 10초 더 졸면 3단계 (스트레칭 미션)
  windowMs: 10 * 60 * 1000, // 10분 안에 다시 졸면 바로 다음 단계부터 시작
};

export const ESCALATION_STEPS = [
  { level: 1, title: '화면 깜빡임', detail: '졸음이 감지되면 먼저 화면을 깜빡여 깨워요' },
  { level: 2, title: '경고음', detail: '4초 더 졸거나 10분 안에 또 졸면 소리로 알려요' },
  { level: 3, title: '스트레칭 미션', detail: '계속 졸면 일어나서 스트레칭해야 타이머가 다시 움직여요' },
];

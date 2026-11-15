// 하단 3개 지표: 오늘 집중 시간 / 이번 주 뽀모도로 / 연속 집중일
import { Clock, Flame, Trophy } from 'lucide-react';
import { Card, Mascot, Metric, MiniBars } from './ui';
import { splitDuration, useHistory } from '../hooks/useHistory';

export default function MetricsBar() {
  const { days, streak } = useHistory(7);
  const today = days[days.length - 1];
  const { h, m } = splitDuration(today.focusSeconds);
  const weekPomodoros = days.reduce((sum, d) => sum + d.pomodoros, 0);

  return (
    <Card className="metrics-bar" aria-label="집중 요약">
      <Metric
        icon={Clock}
        label="오늘 집중한 시간"
        shortLabel="오늘 집중"
        value={
          h > 0 ? (
            <>
              {h}
              <small>시간</small> {m}
              <small>분</small>
            </>
          ) : (
            <>
              {m}
              <small>분</small>
            </>
          )
        }
        aside={<MiniBars values={days.map((d) => d.focusSeconds)} label="최근 7일 집중 시간 추세" />}
      />
      <Metric
        icon={Trophy}
        label="이번 주 뽀모도로"
        shortLabel="주간 뽀모도로"
        value={
          <>
            {weekPomodoros}
            <small>회</small>
          </>
        }
        aside={<MiniBars values={days.map((d) => d.pomodoros)} label="최근 7일 뽀모도로 추세" />}
      />
      <Metric
        icon={Flame}
        label={streak > 0 ? '연속 집중 중!' : '연속 집중'}
        shortLabel="연속 집중"
        value={
          <>
            {streak}
            <small>일째</small>
          </>
        }
        aside={<Mascot mood={streak > 0 ? 'happy' : 'idle'} size={58} className="metric-mascot" />}
      />
    </Card>
  );
}

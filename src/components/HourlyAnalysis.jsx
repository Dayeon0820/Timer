// 시간대별 집중 분석 카드: 분석 문장 + 0~23시 막대 차트
import { useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Card, Insight, Mascot, Segmented } from './ui';
import BarChart from './BarChart';
import { useHistory } from '../hooks/useHistory';
import { aggregateHours, formatHour, getInsights } from '../lib/hourlyAnalysis';

const PERIOD_DAYS = 30;

// 차트 보기 종류: 값 계산, 툴팁 문구, y축 설정
const METRICS = {
  focus: {
    label: '집중 시간',
    value: (h) => Math.round(h.focusSeconds / 60),
    format: (v) => `${v}분 집중`,
    chart: { minTop: 10 },
    unitLabel: '분',
  },
  rate: {
    label: '집중도',
    value: (h) => (h.focusRate === null ? 0 : Math.round(h.focusRate * 100)),
    format: (v) => `집중도 ${v}%`,
    chart: { fixedTop: 100 },
    unitLabel: '%',
  },
  drowsy: {
    label: '졸음',
    value: (h) => h.drowsy,
    format: (v) => `졸음 ${v}회`,
    chart: { minTop: 4 },
    unitLabel: '회',
  },
  distracted: {
    label: '딴짓',
    value: (h) => h.distracted,
    format: (v) => `딴짓 ${v}회`,
    chart: { minTop: 4 },
    unitLabel: '회',
  },
};

export default function HourlyAnalysis() {
  const { days } = useHistory(PERIOD_DAYS);
  const [metric, setMetric] = useState('focus');

  const hours = useMemo(() => aggregateHours(days), [days]);
  const insights = useMemo(() => getInsights(hours), [hours]);
  const hasData = hours.some((h) => h.total > 0 || h.drowsy > 0 || h.distracted > 0);

  const m = METRICS[metric];
  const values = hours.map(m.value);
  const peak = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);

  const chartData = hours.map((h, i) => ({
    label: formatHour(h.hour),
    axisLabel: `${h.hour}시`,
    value: values[i],
    highlight: values[i] > 0 && i === peak, // 가장 높은 시간대만 진하게 + 값 표시
    detail:
      h.total > 0 || h.drowsy || h.distracted
        ? `집중 ${Math.round(h.focusSeconds / 60)}분 · 멈춤 ${Math.round(h.heldSeconds / 60)}분 · 졸음 ${h.drowsy} · 딴짓 ${h.distracted}`
        : '기록 없음',
  }));

  return (
    <Card title="시간대별 집중 분석" icon={Clock3} subtitle={`최근 ${PERIOD_DAYS}일 동안 몇 시에 집중하고, 몇 시에 졸았는지 분석해요`}>
      {!hasData ? (
        <div className="empty-state">
          <Mascot mood="idle" size={72} />
          <p>타이머를 사용하면 시간대별 기록이 쌓여요.</p>
          <p className="text-xs text-muted">며칠 사용하면 &quot;나는 오후 3시에 제일 많이 졸아요&quot; 같은 분석을 보여드릴게요.</p>
        </div>
      ) : (
        <>
          <div className="insight-list">
            {insights.map((it) => (
              <Insight key={it.id} tone={it.tone} mood={it.mood} title={it.title} detail={it.detail} />
            ))}
          </div>

          <div className="hourly-toolbar">
            <Segmented
              label="차트 보기"
              value={metric}
              onChange={setMetric}
              options={Object.entries(METRICS).map(([id, v]) => ({ id, label: v.label }))}
            />
            <span className="text-xs text-muted">단위: {m.unitLabel}</span>
          </div>
          <BarChart
            data={chartData}
            unit={m.unitLabel}
            formatValue={m.format}
            labelEvery={3}
            ariaLabel={`0시부터 23시까지 시간대별 ${m.label} 막대 차트`}
            {...m.chart}
          />
        </>
      )}
    </Card>
  );
}

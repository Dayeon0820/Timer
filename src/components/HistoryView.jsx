// 기록 화면: 오늘 / 최근 7일 통계와 일별 집중 시간 차트
import { useState } from 'react';
import { CalendarDays, ChartColumn, Sun, Table, Trash2 } from 'lucide-react';
import { Button, Card, Chip } from './ui';
import BarChart from './BarChart';
import HourlyAnalysis from './HourlyAnalysis';
import { clearHistory } from '../lib/storage';
import { STATUS_ICON } from '../lib/statusIcons';
import { formatDuration, splitDuration, useHistory } from '../hooks/useHistory';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 강조 타일 (오늘 집중 / 뽀모도로) */
function HighlightTile({ tone, label, children }) {
  return (
    <div className={`highlight-tile highlight-tile--${tone}`}>
      <span className="highlight-tile__label">{label}</span>
      <span className="highlight-tile__value">{children}</span>
    </div>
  );
}

/** "1시간 6분" 을 숫자 크게 / 단위 작게 */
function Duration({ sec }) {
  const { h, m } = splitDuration(sec);
  return (
    <>
      {h > 0 && (
        <>
          {h}
          <small>시간 </small>
        </>
      )}
      {m}
      <small>분</small>
    </>
  );
}

export default function HistoryView() {
  const { days, streak } = useHistory(7);
  const [showTable, setShowTable] = useState(false);

  const today = days[days.length - 1];
  const sum = (key) => days.reduce((acc, d) => acc + d[key], 0);
  const week = {
    focusSeconds: sum('focusSeconds'),
    pomodoros: sum('pomodoros'),
    drowsy: sum('drowsy'),
    distracted: sum('distracted'),
    away: sum('away'),
  };
  const activeDays = days.filter((d) => d.focusSeconds > 0).length;
  const avg = activeDays ? week.focusSeconds / activeDays : 0;

  const chartData = days.map((d, i) => ({
    label: i === days.length - 1 ? '오늘' : WEEKDAYS[d.date.getDay()],
    value: Math.round(d.focusSeconds / 60),
    detail: `${d.date.getMonth() + 1}/${d.date.getDate()} · 졸음 ${d.drowsy} · 딴짓 ${d.distracted} · 자리비움 ${d.away}`,
    highlight: i === days.length - 1,
  }));

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">기록</h1>
        <p className="page-subtitle">{streak > 0 ? `${streak}일째 연속으로 집중하고 있어요` : '오늘도 한 번 집중해 볼까요?'}</p>
      </header>

      <div className="history-grid">
        <Card title="오늘" icon={Sun}>
          <div className="highlight-row">
            <HighlightTile tone="focus" label="집중">
              <Duration sec={today.focusSeconds} />
            </HighlightTile>
            <HighlightTile tone="rest" label="뽀모도로">
              {today.pomodoros}
              <small>회</small>
            </HighlightTile>
          </div>
          <div className="chip-row">
            <Chip icon={STATUS_ICON.drowsy}>졸음 {today.drowsy}회</Chip>
            <Chip icon={STATUS_ICON.distracted}>딴짓 {today.distracted}회</Chip>
            <Chip icon={STATUS_ICON.away}>자리비움 {today.away}회</Chip>
          </div>
        </Card>

        <Card
          title="최근 7일"
          icon={CalendarDays}
          action={
            <Button variant="ghost" size="sm" icon={showTable ? ChartColumn : Table} onClick={() => setShowTable((v) => !v)}>
              {showTable ? '차트' : '표'}
            </Button>
          }
          className="history-week"
        >
          <p className="big-figure">
            <span className="big-figure__value">
              <Duration sec={avg} />
            </span>
            <span className="big-figure__label">공부한 날 하루 평균</span>
          </p>

          {showTable ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>집중</th>
                    <th>뽀모도로</th>
                    <th>졸음</th>
                    <th>딴짓</th>
                    <th>자리비움</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.key}>
                      <td>
                        {d.date.getMonth() + 1}/{d.date.getDate()} ({WEEKDAYS[d.date.getDay()]})
                      </td>
                      <td>{formatDuration(d.focusSeconds)}</td>
                      <td>{d.pomodoros}</td>
                      <td>{d.drowsy}</td>
                      <td>{d.distracted}</td>
                      <td>{d.away}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <BarChart data={chartData} ariaLabel="최근 7일 일별 집중 시간(분) 막대 차트" />
          )}

          <dl className="summary-row">
            <div>
              <dt>총 집중</dt>
              <dd>{formatDuration(week.focusSeconds)}</dd>
            </div>
            <div>
              <dt>뽀모도로</dt>
              <dd>{week.pomodoros}회</dd>
            </div>
            <div>
              <dt>집중 깨짐</dt>
              <dd>{week.drowsy + week.distracted + week.away}회</dd>
            </div>
          </dl>
        </Card>
      </div>

      <HourlyAnalysis />

      <footer className="page-footer">
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={() => window.confirm('모든 기록을 삭제할까요? 되돌릴 수 없어요.') && clearHistory()}
        >
          기록 전체 삭제
        </Button>
        <p className="text-xs text-muted">기록은 이 브라우저의 localStorage 에만 저장돼요.</p>
      </footer>
    </div>
  );
}

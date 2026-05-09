import { useState } from 'react';
import { diagnosticLabel } from '../utils/format';

interface WeeklyPoint {
  date: string;
  diagnostics?: number;
  alerts?: number;
  highRisk?: number;
}

interface StatePoint {
  state: string;
  total: number;
  color: string;
  riskLevel?: string;
  priority?: string;
}

interface ZoneAlertPoint {
  zoneName: string;
  totalAlerts: number;
}

const chartWidth = 640;
const chartHeight = 260;
const padding = { top: 18, right: 22, bottom: 36, left: 38 };

function getMax(values: number[]) {
  return Math.max(1, ...values);
}

function getX(index: number, total: number) {
  const innerWidth = chartWidth - padding.left - padding.right;
  if (total <= 1) {
    return padding.left + innerWidth / 2;
  }

  return padding.left + (index / (total - 1)) * innerWidth;
}

function getY(value: number, max: number) {
  const innerHeight = chartHeight - padding.top - padding.bottom;
  return padding.top + innerHeight - (value / max) * innerHeight;
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

function formatPercent(value: number, total: number) {
  if (!total) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}

export function WeeklyLineChart({ data }: { data: WeeklyPoint[] }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));
  const max = getMax(data.flatMap((item) => [item.diagnostics || 0, item.alerts || 0]));
  const active = data[activeIndex] || data[0];
  const activeX = active ? getX(activeIndex, data.length) : 0;
  const diagnosticsPath = data
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index, data.length)} ${getY(item.diagnostics || 0, max)}`)
    .join(' ');
  const alertsPath = data
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index, data.length)} ${getY(item.alerts || 0, max)}`)
    .join(' ');

  return (
    <div className="interactive-chart simple-chart" role="img" aria-label="Tendencia semanal de diagnósticos y alertas">
      <div className="chart-plot-frame">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          <ChartGrid max={max} />
          {active && (
            <line
              x1={activeX}
              x2={activeX}
              y1={padding.top}
              y2={chartHeight - padding.bottom}
              className="chart-crosshair"
            />
          )}
          <path d={diagnosticsPath} fill="none" stroke="#2d5a27" strokeWidth="4" strokeLinecap="round" className="chart-series-path" />
          <path d={alertsPath} fill="none" stroke="#d6ae37" strokeWidth="4" strokeLinecap="round" className="chart-series-path" />
          {data.map((item, index) => (
            <g key={`${item.date}-${index}`}>
              <rect
                x={getX(index, data.length) - 22}
                y={padding.top}
                width="44"
                height={chartHeight - padding.top - padding.bottom}
                className="chart-hit-area"
                tabIndex={0}
                role="button"
                aria-label={`${formatShortDate(item.date)}: ${item.diagnostics || 0} diagnósticos y ${item.alerts || 0} alertas`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              />
              <circle
                cx={getX(index, data.length)}
                cy={getY(item.diagnostics || 0, max)}
                r={activeIndex === index ? 6 : 4}
                fill="#2d5a27"
                className="chart-point"
              />
              <circle
                cx={getX(index, data.length)}
                cy={getY(item.alerts || 0, max)}
                r={activeIndex === index ? 6 : 4}
                fill="#d6ae37"
                className="chart-point"
              />
              <text x={getX(index, data.length)} y={chartHeight - 10} textAnchor="middle" className="chart-label">
                {formatShortDate(item.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="chart-footer">
        {active && (
          <ChartInsight
            title={`Detalle ${formatShortDate(active.date)}`}
            items={[
              { label: 'Diagnósticos', value: active.diagnostics || 0, color: '#2d5a27' },
              { label: 'Alertas', value: active.alerts || 0, color: '#d6ae37' }
            ]}
          />
        )}
        <ChartLegend
          items={[
            { label: 'Diagnósticos', color: '#2d5a27' },
            { label: 'Alertas', color: '#d6ae37' }
          ]}
        />
      </div>
    </div>
  );
}

export function WeeklyBarChart({ data }: { data: WeeklyPoint[] }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));
  const max = getMax(data.flatMap((item) => [item.diagnostics || 0, item.highRisk || 0]));
  const innerWidth = chartWidth - padding.left - padding.right;
  const groupWidth = data.length ? innerWidth / data.length : innerWidth;
  const barWidth = Math.min(24, groupWidth / 3);
  const active = data[activeIndex] || data[0];

  return (
    <div className="interactive-chart simple-chart" role="img" aria-label="Barras semanales de diagnósticos y alto riesgo">
      <div className="chart-plot-frame">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          <ChartGrid max={max} />
          {data.map((item, index) => {
            const groupStart = padding.left + index * groupWidth + groupWidth / 2;
            const diagnosticsHeight = chartHeight - padding.bottom - getY(item.diagnostics || 0, max);
            const highRiskHeight = chartHeight - padding.bottom - getY(item.highRisk || 0, max);
            const active = activeIndex === index;

            return (
              <g key={`${item.date}-${index}`}>
                <rect
                  x={groupStart - groupWidth / 2}
                  y={padding.top}
                  width={groupWidth}
                  height={chartHeight - padding.top - padding.bottom}
                  className="chart-hit-area"
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatShortDate(item.date)}: ${item.diagnostics || 0} diagnósticos y ${item.highRisk || 0} alto riesgo`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                />
                <rect
                  x={groupStart - barWidth - 3}
                  y={chartHeight - padding.bottom - diagnosticsHeight}
                  width={barWidth}
                  height={diagnosticsHeight}
                  rx="5"
                  fill="#2d5a27"
                  className={`chart-bar ${active ? 'chart-bar--active' : ''}`}
                />
                <rect
                  x={groupStart + 3}
                  y={chartHeight - padding.bottom - highRiskHeight}
                  width={barWidth}
                  height={highRiskHeight}
                  rx="5"
                  fill="#d6ae37"
                  className={`chart-bar ${active ? 'chart-bar--active' : ''}`}
                />
                <text x={groupStart} y={chartHeight - 10} textAnchor="middle" className="chart-label">
                  {formatShortDate(item.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="chart-footer">
        {active && (
          <ChartInsight
            title={`Detalle ${formatShortDate(active.date)}`}
            items={[
              { label: 'Diagnósticos', value: active.diagnostics || 0, color: '#2d5a27' },
              { label: 'Alto riesgo', value: active.highRisk || 0, color: '#d6ae37' }
            ]}
          />
        )}
        <ChartLegend
          items={[
            { label: 'Diagnósticos', color: '#2d5a27' },
            { label: 'Alto riesgo', color: '#d6ae37' }
          ]}
        />
      </div>
    </div>
  );
}

export function DonutChart({ data }: { data: StatePoint[] }) {
  const [activeState, setActiveState] = useState(data[0]?.state || '');
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const activeItem = data.find((item) => item.state === activeState) || data[0];

  return (
    <div className="interactive-chart simple-chart simple-chart--donut" role="img" aria-label="Distribución por estado diagnóstico">
      <div className="chart-donut-frame">
        <svg viewBox="0 0 220 220" className="chart-svg">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#e7ece8" strokeWidth="22" />
          {data.map((item) => {
            const fraction = total ? item.total / total : 0;
            const dash = fraction * circumference;
            const isActive = activeItem?.state === item.state;
            const segment = (
              <circle
                key={item.state}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isActive ? 25 : 21}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 110 110)"
                className="chart-segment"
                tabIndex={0}
                role="button"
                aria-label={`${diagnosticLabel(item.state)}: ${item.total} casos, ${formatPercent(item.total, total)}`}
                onMouseEnter={() => setActiveState(item.state)}
                onFocus={() => setActiveState(item.state)}
                onClick={() => setActiveState(item.state)}
              />
            );
            offset += dash;
            return segment;
          })}
          <text x="110" y="104" textAnchor="middle" className="chart-total">
            {activeItem?.total ?? total}
          </text>
          <text x="110" y="128" textAnchor="middle" className="chart-label">
            {activeItem ? formatPercent(activeItem.total, total) : 'casos'}
          </text>
        </svg>
      </div>
      {activeItem && (
        <div className="chart-donut-detail" style={{ borderColor: activeItem.color }}>
          <p className="chart-donut-detail__label">{diagnosticLabel(activeItem.state)}</p>
          <p className="chart-donut-detail__value">
            {activeItem.total} casos · {formatPercent(activeItem.total, total)}
          </p>
        </div>
      )}
    </div>
  );
}

export function ZoneAlertsChart({ data }: { data: ZoneAlertPoint[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const max = getMax(data.map((item) => item.totalAlerts));
  const active = data[activeIndex] || data[0];

  return (
    <div className="space-y-3">
      {data.map((zone, index) => (
        <button
          key={zone.zoneName}
          type="button"
          className={`zone-alert-card ${activeIndex === index ? 'zone-alert-card--active' : ''}`}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
          onClick={() => setActiveIndex(index)}
          aria-pressed={activeIndex === index}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{zone.zoneName}</p>
            <span className="text-sm font-semibold">{zone.totalAlerts}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(6, (zone.totalAlerts / max) * 100)}%` }}
            />
          </div>
        </button>
      ))}
      {active && (
        <div className="chart-zone-detail">
          <span>{active.zoneName}</span>
          <strong>{active.totalAlerts} alertas recientes</strong>
        </div>
      )}
    </div>
  );
}

export function StateLegend({ data }: { data: StatePoint[] }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.state} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            {diagnosticLabel(item.state)}
          </span>
          <span className="font-medium">{item.total}</span>
        </div>
      ))}
    </div>
  );
}

function ChartGrid({ max }: { max: number }) {
  const lines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <g>
      {lines.map((line) => {
        const value = Math.round(max * (1 - line));
        const y = padding.top + line * (chartHeight - padding.top - padding.bottom);
        return (
          <g key={line}>
            <line x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} stroke="#e7ece8" />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" className="chart-label">
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ChartLegend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartInsight({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <div className="chart-insight">
      <p className="chart-insight__title">{title}</p>
      <div className="chart-insight__items">
        {items.map((item) => (
          <span key={item.label} className="chart-insight__item">
            <span className="chart-insight__dot" style={{ backgroundColor: item.color }} />
            {item.label}: <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

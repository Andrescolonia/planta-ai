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

export function WeeklyLineChart({ data }: { data: WeeklyPoint[] }) {
  const max = getMax(data.flatMap((item) => [item.diagnostics || 0, item.alerts || 0]));
  const diagnosticsPath = data
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index, data.length)} ${getY(item.diagnostics || 0, max)}`)
    .join(' ');
  const alertsPath = data
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index, data.length)} ${getY(item.alerts || 0, max)}`)
    .join(' ');

  return (
    <div className="simple-chart" role="img" aria-label="Tendencia semanal de diagnósticos y alertas">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
        <ChartGrid max={max} />
        <path d={diagnosticsPath} fill="none" stroke="#2d5a27" strokeWidth="4" strokeLinecap="round" />
        <path d={alertsPath} fill="none" stroke="#d6ae37" strokeWidth="4" strokeLinecap="round" />
        {data.map((item, index) => (
          <g key={`${item.date}-${index}`}>
            <circle cx={getX(index, data.length)} cy={getY(item.diagnostics || 0, max)} r="4" fill="#2d5a27" />
            <circle cx={getX(index, data.length)} cy={getY(item.alerts || 0, max)} r="4" fill="#d6ae37" />
            <text x={getX(index, data.length)} y={chartHeight - 10} textAnchor="middle" className="chart-label">
              {formatShortDate(item.date)}
            </text>
          </g>
        ))}
      </svg>
      <ChartLegend
        items={[
          { label: 'Diagnósticos', color: '#2d5a27' },
          { label: 'Alertas', color: '#d6ae37' }
        ]}
      />
    </div>
  );
}

export function WeeklyBarChart({ data }: { data: WeeklyPoint[] }) {
  const max = getMax(data.flatMap((item) => [item.diagnostics || 0, item.highRisk || 0]));
  const innerWidth = chartWidth - padding.left - padding.right;
  const groupWidth = data.length ? innerWidth / data.length : innerWidth;
  const barWidth = Math.min(24, groupWidth / 3);

  return (
    <div className="simple-chart" role="img" aria-label="Barras semanales de diagnósticos y alto riesgo">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
        <ChartGrid max={max} />
        {data.map((item, index) => {
          const groupStart = padding.left + index * groupWidth + groupWidth / 2;
          const diagnosticsHeight = chartHeight - padding.bottom - getY(item.diagnostics || 0, max);
          const highRiskHeight = chartHeight - padding.bottom - getY(item.highRisk || 0, max);

          return (
            <g key={`${item.date}-${index}`}>
              <rect
                x={groupStart - barWidth - 3}
                y={chartHeight - padding.bottom - diagnosticsHeight}
                width={barWidth}
                height={diagnosticsHeight}
                rx="5"
                fill="#2d5a27"
              />
              <rect
                x={groupStart + 3}
                y={chartHeight - padding.bottom - highRiskHeight}
                width={barWidth}
                height={highRiskHeight}
                rx="5"
                fill="#d6ae37"
              />
              <text x={groupStart} y={chartHeight - 10} textAnchor="middle" className="chart-label">
                {formatShortDate(item.date)}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={[
          { label: 'Diagnósticos', color: '#2d5a27' },
          { label: 'Alto riesgo', color: '#d6ae37' }
        ]}
      />
    </div>
  );
}

export function DonutChart({ data }: { data: StatePoint[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="simple-chart simple-chart--donut" role="img" aria-label="Distribución por estado diagnóstico">
      <svg viewBox="0 0 220 220" className="h-full w-full">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#e7ece8" strokeWidth="24" />
        {data.map((item) => {
          const fraction = total ? item.total / total : 0;
          const dash = fraction * circumference;
          const segment = (
            <circle
              key={item.state}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 110 110)"
            />
          );
          offset += dash;
          return segment;
        })}
        <text x="110" y="104" textAnchor="middle" className="chart-total">
          {total}
        </text>
        <text x="110" y="128" textAnchor="middle" className="chart-label">
          casos
        </text>
      </svg>
    </div>
  );
}

export function ZoneAlertsChart({ data }: { data: ZoneAlertPoint[] }) {
  const max = getMax(data.map((item) => item.totalAlerts));

  return (
    <div className="space-y-3">
      {data.map((zone) => (
        <div key={zone.zoneName} className="rounded-lg border border-border p-4">
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
        </div>
      ))}
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
    <div className="mt-3 flex flex-wrap justify-center gap-5 text-sm">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import type {
  AnalyticsSummary,
  PeriodComparison,
  TimeSeriesPoint,
} from "../context/PortfolioContext";

type TimeframeKey = "daily" | "weekly" | "monthly" | "yearly";
type ChartStyle = "bars" | "area";

const TIMEFRAME_LABELS: Record<
  TimeframeKey,
  { title: string; subtitle: string; prevLabel: string }
> = {
  daily: {
    title: "Daily Visitor Comparison",
    subtitle: "Last 14 days compared with the preceding 14-day window",
    prevLabel: "Prior 14-day period",
  },
  weekly: {
    title: "Weekly Visitor Comparison",
    subtitle: "Last 12 weeks compared with the preceding 12-week window",
    prevLabel: "Prior 12-week period",
  },
  monthly: {
    title: "Monthly Visitor Comparison",
    subtitle: "Last 12 months compared year-over-year",
    prevLabel: "Previous year month",
  },
  yearly: {
    title: "Yearly Visitor Comparison",
    subtitle: "Annual visitor volume and multi-year trajectory",
    prevLabel: "Prior year",
  },
};

function DeltaBadge({ pct }: { pct: number }) {
  const isPositive = pct >= 0;
  return (
    <span
      className={`owner-delta-badge ${isPositive ? "is-positive" : "is-negative"}`}
    >
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? `+${pct}%` : `${pct}%`}
    </span>
  );
}

function ComparisonKpiCard({
  label,
  periodNote,
  data,
  active,
  onSelect,
}: {
  label: string;
  periodNote: string;
  data: PeriodComparison;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`owner-kpi-card ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className="owner-kpi-top">
        <span className="eyebrow">{label}</span>
        <DeltaBadge pct={data.uniqueChangePct} />
      </div>
      <div className="owner-kpi-main">
        <strong>{data.currentUnique.toLocaleString()}</strong>
        <span>unique visitors</span>
      </div>
      <div className="owner-kpi-meta">
        <span>
          {data.currentViews.toLocaleString()} views (prev:{" "}
          {data.previousUnique.toLocaleString()} unique /{" "}
          {data.previousViews.toLocaleString()} views)
        </span>
        <small>{periodNote}</small>
      </div>
    </button>
  );
}

function ComparisonSvgChart({
  points,
  chartStyle,
  prevLabel,
}: {
  points: TimeSeriesPoint[];
  chartStyle: ChartStyle;
  prevLabel: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points.length) return null;

  const rawMax = Math.max(
    0,
    ...points.map((p) =>
      Math.max(p.views, p.uniqueVisitors, p.previousViews || 0),
    ),
  );
  const maxVal = Math.max(4, Math.ceil(rawMax / 4) * 4);

  const activePoint =
    hoveredIndex !== null && points[hoveredIndex]
      ? points[hoveredIndex]
      : points[points.length - 1]!;

  const width = 760;
  const height = 250;
  const padLeft = 40;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const toY = (val: number) =>
    padTop + plotH - Math.min(1, Math.max(0, val / maxVal)) * plotH;

  const stepX = points.length > 1 ? plotW / (points.length - 1) : plotW;

  const buildPolyline = (getter: (p: TimeSeriesPoint) => number) =>
    points
      .map((p, idx) => {
        const x =
          points.length > 1 ? padLeft + idx * stepX : padLeft + plotW / 2;
        const y = toY(getter(p));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const buildAreaPath = (getter: (p: TimeSeriesPoint) => number) => {
    if (!points.length) return "";
    const coords = points.map((p, idx) => {
      const x =
        points.length > 1 ? padLeft + idx * stepX : padLeft + plotW / 2;
      const y = toY(getter(p));
      return { x, y };
    });
    const first = coords[0]!;
    const last = coords[coords.length - 1]!;
    const linePart = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    return `${linePart} L ${last.x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${first.x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;
  };

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(maxVal * t),
  );

  return (
    <div className="owner-chart-wrapper">
      <div className="owner-chart-Callout" aria-live="polite">
        <div>
          <span className="owner-chart-callout-label">{activePoint.label}</span>
          <strong>
            {activePoint.uniqueVisitors.toLocaleString()} unique visitors
          </strong>
          <span>
            · {activePoint.views.toLocaleString()} total page views
          </span>
        </div>
        <div className="owner-chart-callout-prev">
          <span>
            {prevLabel}:{" "}
            <strong>
              {(activePoint.previousUniqueVisitors ?? 0).toLocaleString()}
            </strong>{" "}
            unique ({(activePoint.previousViews ?? 0).toLocaleString()} views)
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="owner-svg-chart"
        role="img"
        aria-label="Visitor comparison chart"
      >
        {/* Horizontal grid lines */}
        {gridTicks.map((tick, idx) => {
          const y = toY(tick);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                className="owner-chart-gridline"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="owner-chart-axis-text"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {chartStyle === "bars" ? (
          points.map((p, idx) => {
            const slotWidth = plotW / points.length;
            const centerX = padLeft + idx * slotWidth + slotWidth / 2;
            const barWidth = Math.min(14, Math.max(5, slotWidth * 0.24));

            const prevViewsY = toY(p.previousViews || 0);
            const prevViewsH = padTop + plotH - prevViewsY;

            const viewsY = toY(p.views);
            const viewsH = padTop + plotH - viewsY;

            const uniqueY = toY(p.uniqueVisitors);
            const uniqueH = padTop + plotH - uniqueY;

            return (
              <g
                key={p.key}
                className="owner-chart-bar-group"
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                {/* Hover hit target */}
                <rect
                  x={padLeft + idx * slotWidth}
                  y={padTop}
                  width={slotWidth}
                  height={plotH}
                  fill="transparent"
                />
                {/* Previous period views bar */}
                <rect
                  x={centerX - barWidth * 1.6}
                  y={prevViewsY}
                  width={barWidth}
                  height={Math.max(2, prevViewsH)}
                  rx={3}
                  className="owner-bar-prev"
                />
                {/* Current period views bar */}
                <rect
                  x={centerX - barWidth * 0.45}
                  y={viewsY}
                  width={barWidth}
                  height={Math.max(2, viewsH)}
                  rx={3}
                  className="owner-bar-views"
                />
                {/* Current unique visitors bar */}
                <rect
                  x={centerX + barWidth * 0.7}
                  y={uniqueY}
                  width={barWidth}
                  height={Math.max(2, uniqueH)}
                  rx={3}
                  className="owner-bar-unique"
                />
                <text
                  x={centerX}
                  y={height - 11}
                  textAnchor="middle"
                  className="owner-chart-axis-text"
                >
                  {p.label}
                </text>
              </g>
            );
          })
        ) : (
          <>
            <path
              d={buildAreaPath((p) => p.views)}
              className="owner-area-views"
            />
            <path
              d={buildAreaPath((p) => p.uniqueVisitors)}
              className="owner-area-unique"
            />
            <polyline
              fill="none"
              points={buildPolyline((p) => p.previousViews || 0)}
              className="owner-line-prev"
            />
            <polyline
              fill="none"
              points={buildPolyline((p) => p.views)}
              className="owner-line-views"
            />
            <polyline
              fill="none"
              points={buildPolyline((p) => p.uniqueVisitors)}
              className="owner-line-unique"
            />
            {points.map((p, idx) => {
              const x =
                points.length > 1
                  ? padLeft + idx * stepX
                  : padLeft + plotW / 2;
              const yUnique = toY(p.uniqueVisitors);
              const yViews = toY(p.views);
              return (
                <g
                  key={p.key}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  className="owner-chart-point-group"
                >
                  <circle
                    cx={x}
                    cy={yViews}
                    r={4}
                    className="owner-point-views"
                  />
                  <circle
                    cx={x}
                    cy={yUnique}
                    r={4.5}
                    className="owner-point-unique"
                  />
                  <text
                    x={x}
                    y={height - 11}
                    textAnchor="middle"
                    className="owner-chart-axis-text"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>

      <div className="owner-chart-legend">
        <span>
          <i className="legend-dot is-unique" /> Unique Visitors (Current)
        </span>
        <span>
          <i className="legend-dot is-views" /> Total Views (Current)
        </span>
        <span>
          <i className="legend-dot is-prev" /> {prevLabel} (Comparison)
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ token }: { token: string }) {
  const { fetchAnalytics } = usePortfolio();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState<TimeframeKey>("daily");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("bars");
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  async function loadAnalytics(dateToLoad?: string) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAnalytics(token, dateToLoad || selectedDate);
      setSummary(data);
      if (data.selectedDay?.date) {
        setSelectedDate(data.selectedDay.date);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load visitor analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleDateChange(nextDate: string) {
    setSelectedDate(nextDate);
    void loadAnalytics(nextDate);
  }

  if (loading && !summary) {
    return (
      <div className="owner-card">
        <p className="muted">Loading visitor analytics and comparison charts…</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="owner-card">
        <p className="owner-alert owner-alert-error" role="alert">
          {error}
        </p>
        <button
          type="button"
          className="button button-secondary mt-4"
          onClick={() => void loadAnalytics(selectedDate)}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const activeSeries = summary.series[timeframe];
  const meta = TIMEFRAME_LABELS[timeframe];
  const maxHourly = Math.max(
    4,
    ...summary.selectedDay.hourly.map((h) => h.views),
  );
  const totalDeviceCount =
    summary.devices.desktop + summary.devices.mobile + summary.devices.tablet ||
    1;

  return (
    <div className="owner-analytics-stack">
      {/* Top Overview Banner */}
      <div className="owner-card owner-analytics-banner">
        <div>
          <p className="eyebrow">
            <span>00</span> Live Visitor Telemetry
          </p>
          <h3>Audience & Traffic Comparisons</h3>
          <p className="muted">
            Track daily visitor counts alongside daily, weekly, monthly, and
            yearly comparison trends.
          </p>
        </div>
        <div className="owner-alltime-badges">
          <div className="owner-stat-pill">
            <Users size={16} />
            <div>
              <small>ALL-TIME UNIQUE</small>
              <strong>{summary.totalUniqueAllTime.toLocaleString()}</strong>
            </div>
          </div>
          <div className="owner-stat-pill">
            <Activity size={16} />
            <div>
              <small>ALL-TIME VIEWS</small>
              <strong>{summary.totalViewsAllTime.toLocaleString()}</strong>
            </div>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadAnalytics(selectedDate)}
            aria-label="Refresh analytics"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Period Comparison KPI Cards */}
      <div
        className="owner-kpi-grid"
        role="group"
        aria-label="Visitor period comparisons"
      >
        <ComparisonKpiCard
          label="Daily (Today)"
          periodNote="Compared with yesterday"
          data={summary.comparisons.daily}
          active={timeframe === "daily"}
          onSelect={() => setTimeframe("daily")}
        />
        <ComparisonKpiCard
          label="Weekly (7 Days)"
          periodNote="Compared with prior 7 days"
          data={summary.comparisons.weekly}
          active={timeframe === "weekly"}
          onSelect={() => setTimeframe("weekly")}
        />
        <ComparisonKpiCard
          label="Monthly (30 Days)"
          periodNote="Compared with prior 30 days"
          data={summary.comparisons.monthly}
          active={timeframe === "monthly"}
          onSelect={() => setTimeframe("monthly")}
        />
        <ComparisonKpiCard
          label="Yearly (365 Days)"
          periodNote="Compared with prior year"
          data={summary.comparisons.yearly}
          active={timeframe === "yearly"}
          onSelect={() => setTimeframe("yearly")}
        />
      </div>

      {/* Main Interactive Comparison Chart (Daily / Weekly / Monthly / Yearly) */}
      <div className="owner-card">
        <div className="owner-chart-header">
          <div>
            <h4>{meta.title}</h4>
            <p className="muted">{meta.subtitle}</p>
          </div>
          <div className="owner-chart-controls">
            <div
              className="owner-segmented"
              role="group"
              aria-label="Select comparison timeframe"
            >
              {(["daily", "weekly", "monthly", "yearly"] as const).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={timeframe === key}
                    onClick={() => setTimeframe(key)}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ),
              )}
            </div>
            <div
              className="owner-segmented"
              role="group"
              aria-label="Select chart visualization type"
            >
              <button
                type="button"
                aria-pressed={chartStyle === "bars"}
                onClick={() => setChartStyle("bars")}
              >
                <BarChart3 size={14} /> Bars
              </button>
              <button
                type="button"
                aria-pressed={chartStyle === "area"}
                onClick={() => setChartStyle("area")}
              >
                <Activity size={14} /> Area / Line
              </button>
            </div>
          </div>
        </div>

        <ComparisonSvgChart
          points={activeSeries}
          chartStyle={chartStyle}
          prevLabel={meta.prevLabel}
        />
      </div>

      {/* Single-Day Visitor Count Inspector & Device Breakdown */}
      <div className="owner-analytics-bottom-grid">
        <div className="owner-card">
          <div className="owner-day-header">
            <div>
              <p className="eyebrow">
                <Calendar size={13} /> Single-Day Visitor Lookup
              </p>
              <h4>Visitor Count on a Specific Day</h4>
            </div>
            <div className="owner-date-picker-wrap">
              <label htmlFor="analytics-day-input" className="sr-only">
                Select date to inspect visitors
              </label>
              <input
                id="analytics-day-input"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="owner-day-summary">
            <div className="owner-day-stat">
              <span>Unique Visitors ({summary.selectedDay.date})</span>
              <div className="owner-day-stat-value">
                <strong>
                  {summary.selectedDay.uniqueVisitors.toLocaleString()}
                </strong>
                <DeltaBadge pct={summary.selectedDay.uniqueChangePct} />
              </div>
              <small>
                Prior day ({summary.selectedDay.previousDate}):{" "}
                {summary.selectedDay.previousUniqueVisitors.toLocaleString()}{" "}
                unique
              </small>
            </div>
            <div className="owner-day-stat">
              <span>Total Page Views ({summary.selectedDay.date})</span>
              <div className="owner-day-stat-value">
                <strong>{summary.selectedDay.views.toLocaleString()}</strong>
                <DeltaBadge pct={summary.selectedDay.viewsChangePct} />
              </div>
              <small>
                Prior day ({summary.selectedDay.previousDate}):{" "}
                {summary.selectedDay.previousViews.toLocaleString()} views
              </small>
            </div>
          </div>

          <div
            className="owner-hourly-chart"
            role="region"
            aria-label={`Hourly visitor distribution for ${summary.selectedDay.date}`}
          >
            <span className="owner-hourly-title">
              24-Hour Activity Breakdown ({summary.selectedDay.date})
            </span>
            <div className="owner-hourly-bars">
              {summary.selectedDay.hourly.map((slot) => {
                const heightPct = Math.round((slot.views / maxHourly) * 100);
                return (
                  <div
                    key={slot.hour}
                    className="owner-hour-col"
                    title={`${slot.hour}: ${slot.uniqueVisitors} unique, ${slot.views} views`}
                  >
                    <div className="owner-hour-bar-track">
                      <div
                        className="owner-hour-bar-fill"
                        style={{
                          height: `${slot.views > 0 ? Math.max(12, heightPct) : 3}%`,
                        }}
                      />
                    </div>
                    {Number(slot.hour.slice(0, 2)) % 4 === 0 && (
                      <small>{slot.hour.slice(0, 2)}h</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="owner-card">
          <p className="eyebrow">Visitor Devices</p>
          <h4>Platform Distribution</h4>
          <p className="muted">
            Breakdown of visitors browsing from desktop, mobile phones, and
            tablets.
          </p>
          <div className="owner-device-list">
            {[
              {
                label: "Desktop",
                icon: Monitor,
                count: summary.devices.desktop,
              },
              {
                label: "Mobile",
                icon: Smartphone,
                count: summary.devices.mobile,
              },
              {
                label: "Tablet",
                icon: Tablet,
                count: summary.devices.tablet,
              },
            ].map(({ label, icon: Icon, count }) => {
              const pct = Math.round((count / totalDeviceCount) * 100);
              return (
                <div key={label} className="owner-device-row">
                  <div className="owner-device-label">
                    <Icon size={16} />
                    <strong>{label}</strong>
                    <span>
                      {count.toLocaleString()} visits ({pct}%)
                    </span>
                  </div>
                  <div className="owner-device-bar">
                    <div
                      style={{
                        width: count > 0 ? `${Math.max(4, pct)}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

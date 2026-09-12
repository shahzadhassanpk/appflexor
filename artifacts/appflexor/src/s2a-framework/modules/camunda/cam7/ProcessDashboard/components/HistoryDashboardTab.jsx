/* eslint-disable react/prop-types */
import {
    formatDateTime,
    formatPercent,
    formatSeconds,
} from "../utils";
import HistoryFilterBar from "./HistoryFilterBar";
import MetricCard from "./MetricCard";
import SectionCard from "./SectionCard";

export default function HistoryDashboardTab({
    historyDraft,
    setHistoryDraft,
    onApply,
    onReset,
    selectedLabel,
    historyState,
}) {
    return (
        <>
            <HistoryFilterBar
                historyDraft={historyDraft}
                setHistoryDraft={setHistoryDraft}
                onApply={onApply}
                onReset={onReset}
                selectedLabel={selectedLabel}
                loading={historyState.loading}
            />

            {historyState.error && (
                <div
                    role="alert"
                    className="process-dashboard__alert rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {historyState.error}
                </div>
            )}

            <div className="process-dashboard__metrics-grid grid grid-cols-2 gap-3 xl:grid-cols-5">
                <MetricCard
                    icon="fa-solid fa-hourglass-half"
                    label="Avg Cycle Time"
                    value={formatSeconds(historyState.summary.avgCycleSeconds)}
                    tone="default"
                    helper="Per process definition"
                />
                <MetricCard
                    icon="fa-solid fa-boxes-stacked"
                    label="Completed"
                    value={historyState.summary.completedTotal}
                    tone="success"
                    helper="Across selected range"
                />
                <MetricCard
                    icon="fa-solid fa-shield-check"
                    label="SLA Compliance"
                    value={formatPercent(historyState.summary.compliancePercent)}
                    tone="success"
                    helper="Average completion within SLA"
                />
                <MetricCard
                    icon="fa-solid fa-stopwatch"
                    label="Slowest Activity"
                    value={formatSeconds(historyState.summary.slowestActivitySeconds)}
                    tone="warning"
                    helper="Mean execution time"
                />
                <MetricCard
                    icon="fa-solid fa-bell"
                    label="Escalations"
                    value={historyState.summary.historicEscalations}
                    tone={historyState.summary.historicEscalations > 0 ? "danger" : "default"}
                    helper="Historic escalation frequency"
                />
            </div>

            {historyState.loading ? (
                <div className="process-dashboard__loading rounded-2xl border bg-white py-5 text-center text-sm shadow-sm">
                    <i className="fa-solid fa-circle-notch fa-spin me-2 text-indigo-600" />
                    Loading process history KPIs...
                </div>
            ) : (
                <div className="process-dashboard__sections-grid grid gap-4 xl:grid-cols-2">
                    <SectionCard
                        title="Cycle Time Analysis"
                        subtitle="Average duration per process definition."
                        icon="fa-solid fa-hourglass-half">
                        {historyState.cycleRows.length ? (
                            <div className="process-dashboard__stack space-y-2">
                                {historyState.cycleRows.map(row => (
                                    <div
                                        key={row.processKey}
                                        className="process-dashboard__list-item flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                                        <div className="process-dashboard__item-copy min-w-0">
                                            <p className="process-dashboard__item-title mb-0 truncate text-sm font-semibold">
                                                {row.title}
                                            </p>
                                            <p className="process-dashboard__item-key mb-0 text-xs">
                                                {row.processKey}
                                            </p>
                                        </div>
                                        <span className="process-dashboard__value text-sm font-bold">
                                            {formatSeconds(row.avgCycleSeconds)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                No completed history found for the selected dates.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Throughput Metrics"
                        subtitle="Completed instances by day, week, and month."
                        icon="fa-solid fa-chart-column">
                        <div className="process-dashboard__summary-grid mb-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Daily avg</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {Math.round(historyState.summary.completedDailyAverage * 10) / 10}
                                </p>
                            </div>
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Weekly avg</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {Math.round(historyState.summary.completedWeeklyAverage * 10) / 10}
                                </p>
                            </div>
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Monthly avg</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {Math.round(historyState.summary.completedMonthlyAverage * 10) / 10}
                                </p>
                            </div>
                        </div>
                        {historyState.throughputRows.length ? (
                            <div className="process-dashboard__stack space-y-2">
                                {historyState.throughputRows.slice(-8).reverse().map((row, index) => (
                                    <div
                                        key={`${row.processKey}-${row.day}-${index}`}
                                        className="process-dashboard__list-item flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                                        <div className="process-dashboard__item-copy min-w-0">
                                            <p className="process-dashboard__item-title mb-0 truncate text-sm font-semibold">
                                                {row.title}
                                            </p>
                                            <p className="process-dashboard__date mb-0 text-xs">
                                                {formatDateTime(row.day)}
                                            </p>
                                        </div>
                                        <span className="process-dashboard__count-badge rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-slate-200">
                                            {row.completedInstances} completed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                No throughput records returned for this range.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="SLA Compliance Rate"
                        subtitle="Percent of tasks completed within the SLA target."
                        icon="fa-solid fa-badge-check">
                        {historyState.complianceRows.length ? (
                            <div className="process-dashboard__stack space-y-2">
                                {historyState.complianceRows.map(row => (
                                    <div
                                        key={row.processKey}
                                        className="process-dashboard__list-item rounded-xl border p-3">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="process-dashboard__item-copy min-w-0">
                                                <p className="process-dashboard__item-title mb-0 truncate text-sm font-semibold">
                                                    {row.title}
                                                </p>
                                                <p className="process-dashboard__item-key mb-0 text-xs">
                                                    {row.processKey}
                                                </p>
                                            </div>
                                            <span className="process-dashboard__value text-sm font-bold">
                                                {formatPercent(row.compliancePercent)}
                                            </span>
                                        </div>
                                        <div className="process-dashboard__progress-track h-2 overflow-hidden rounded-full ring-1 ring-inset ring-slate-200">
                                            <div
                                                className="process-dashboard__progress-fill h-full rounded-full bg-indigo-600"
                                                style={{
                                                    "--process-dashboard-progress": `${Math.max(0, Math.min(100, row.compliancePercent))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                No SLA compliance rows available.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Activity Performance"
                        subtitle="Mean execution time per activity."
                        icon="fa-solid fa-person-running">
                        {historyState.activityPerformanceRows.length ? (
                            <div className="process-dashboard__stack space-y-2">
                                {historyState.activityPerformanceRows.slice(0, 10).map(row => (
                                    <div
                                        key={row.taskName}
                                        className="process-dashboard__list-item flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                                        <p className="process-dashboard__item-title mb-0 truncate text-sm font-semibold">
                                            {row.taskName}
                                        </p>
                                        <span className="process-dashboard__value text-sm font-bold">
                                            {formatSeconds(row.avgActivitySeconds)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                No activity performance data available.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Failure & Incident Trends"
                        subtitle="Historic errors, incidents, and escalations."
                        icon="fa-solid fa-triangle-exclamation">
                        <div className="process-dashboard__summary-grid mb-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Errors</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {historyState.summary.historicFailures}
                                </p>
                            </div>
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Incidents</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {historyState.summary.historicIncidents}
                                </p>
                            </div>
                            <div className="process-dashboard__summary-tile rounded-lg p-3 ring-1 ring-inset ring-slate-200">
                                <p className="process-dashboard__label mb-1">Escalations</p>
                                <p className="process-dashboard__value mb-0 text-sm font-bold">
                                    {historyState.summary.historicEscalations}
                                </p>
                            </div>
                        </div>
                        {historyState.failureRows.length ? (
                            <div className="process-dashboard__stack space-y-2">
                                {historyState.failureRows.slice(-10).reverse().map((row, index) => (
                                    <div
                                        key={`${row.processKey}-${row.event}-${row.day}-${index}`}
                                        className="process-dashboard__list-item rounded-xl border p-3">
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <div className="process-dashboard__item-copy min-w-0">
                                                <p className="process-dashboard__item-title mb-0 truncate text-sm font-semibold">
                                                    {row.title}
                                                </p>
                                                <p className="process-dashboard__label mb-0 text-xs uppercase tracking-wide">
                                                    {row.event}
                                                </p>
                                            </div>
                                            <span className="process-dashboard__count-badge rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-slate-200">
                                                {row.eventCount}
                                            </span>
                                        </div>
                                        <p className="process-dashboard__date mb-0 text-xs">
                                            {formatDateTime(row.day)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                No historic failure or escalation events found.
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}
        </>
    );
}

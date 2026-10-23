/* eslint-disable react/prop-types */
import { formatDateTimeForUserView } from "../../../../../utils/utils";
import MetricCard from "./MetricCard";
import SectionCard from "./SectionCard";

export default function LiveDashboardTab({ config, dashboardState }) {
    return (
        <>
            {dashboardState.error && (
                <div
                    role="alert"
                    className="process-dashboard__alert rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {dashboardState.error}
                </div>
            )}

            <div className="process-dashboard__metrics-grid grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                    icon="fa-solid fa-play"
                    label="Active Instances"
                    value={dashboardState.summary?.activeCount ?? 0}
                    tone="success"
                    helper="Currently running"
                />
                <MetricCard
                    icon="fa-solid fa-pause"
                    label="Suspended Instances"
                    value={dashboardState.summary?.suspendedCount ?? 0}
                    tone="warning"
                    helper="Paused in engine"
                />
                <MetricCard
                    icon="fa-solid fa-triangle-exclamation"
                    label="Failed Instances"
                    value={dashboardState.summary?.failedCount ?? 0}
                    tone="danger"
                    helper="Jobs or incidents attached"
                />
                <MetricCard
                    icon="fa-regular fa-clock"
                    label="SLA Breaches"
                    value={dashboardState.summary?.breachCount ?? 0}
                    tone={(dashboardState.summary?.breachCount || 0) > 0 ? "danger" : "default"}
                    helper="Past due right now"
                />
            </div>

            {dashboardState.loading ? (
                <div className="process-dashboard__loading rounded-2xl border bg-white py-5 text-center text-sm shadow-sm">
                    <i className="fa-solid fa-circle-notch fa-spin me-2 text-indigo-600" />
                    Loading process KPIs...
                </div>
            ) : (
                <div className="process-dashboard__sections-grid grid gap-4 xl:grid-cols-3">
                    {config.show_activity_status && (
                        <SectionCard
                            title="Activity Status"
                            subtitle="Live work in progress by process and step."
                            icon="fa-solid fa-diagram-project">
                            {dashboardState.activityRows.length ? (
                                <div className="process-dashboard__activity-stack space-y-3">
                                    {dashboardState.activityRows.map(row => (
                                        <article
                                            key={row.key}
                                            className="process-dashboard__activity-card process-dashboard__list-item rounded-xl border p-3">
                                            <div className="process-dashboard__activity-card-header mb-3 flex items-start justify-between gap-3">
                                                <div className="process-dashboard__item-copy min-w-0">
                                                    <p className="process-dashboard__item-title mb-1 truncate text-sm font-bold">
                                                        {row.title}
                                                    </p>
                                                    <p className="process-dashboard__activity-key process-dashboard__item-key mb-0 text-xs">
                                                        <i className="fa-solid fa-fingerprint me-1" aria-hidden="true" />
                                                        {row.processKey || row.key}
                                                    </p>
                                                </div>
                                                <span className="process-dashboard__activity-total inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset">
                                                    <i className="fa-solid fa-play" aria-hidden="true" />
                                                    {row.activeInstances}
                                                    <span className="font-semibold">active</span>
                                                </span>
                                            </div>
                                            <div className="process-dashboard__activity-list grid gap-2">
                                                {row.activities.slice(0, 4).map(activity => (
                                                    <div
                                                        key={`${row.key}-${activity.id || activity.name}`}
                                                        className="process-dashboard__activity-step flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs">
                                                        <span className="min-w-0 truncate font-semibold">
                                                            {activity.name}
                                                        </span>
                                                        <span className="process-dashboard__activity-step-count inline-flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-0.5 font-bold">
                                                            {activity.count}
                                                        </span>
                                                    </div>
                                                ))}
                                                {row.activities.length > 4 && (
                                                    <div className="process-dashboard__activity-more px-3 text-xs font-semibold">
                                                        +{row.activities.length - 4} more active step{row.activities.length - 4 === 1 ? "" : "s"}
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                    No active process instances in scope.
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {config.show_error_tracking && (
                        <SectionCard
                            title="Error & Incident Tracking"
                            subtitle="Failed jobs, retry budget, and escalation path signals."
                            icon="fa-solid fa-bug">
                            {dashboardState.incidentRows.length ? (
                                <div className="process-dashboard__stack space-y-3">
                                    {dashboardState.incidentRows.map(row => (
                                        <article
                                            key={row.key}
                                            className="process-dashboard__list-item rounded-xl border p-3">
                                            <div className="mb-2">
                                                <p className="process-dashboard__item-title mb-1 truncate text-sm font-semibold">
                                                    {row.title}
                                                </p>
                                                <p className="process-dashboard__item-key mb-0 text-xs">
                                                    {row.processKey || row.key}
                                                </p>
                                            </div>
                                            <dl className="process-dashboard__summary-grid mb-2 grid grid-cols-3 gap-2 text-xs">
                                                <div className="process-dashboard__summary-tile rounded-lg p-2 ring-1 ring-inset ring-slate-200">
                                                    <dt className="process-dashboard__label">Failed jobs</dt>
                                                    <dd className="process-dashboard__value mb-0 text-sm font-bold">{row.failedJobs}</dd>
                                                </div>
                                                <div className="process-dashboard__summary-tile rounded-lg p-2 ring-1 ring-inset ring-slate-200">
                                                    <dt className="process-dashboard__label">Incidents</dt>
                                                    <dd className="process-dashboard__value mb-0 text-sm font-bold">{row.incidents}</dd>
                                                </div>
                                                <div className="process-dashboard__summary-tile rounded-lg p-2 ring-1 ring-inset ring-slate-200">
                                                    <dt className="process-dashboard__label">Retries left</dt>
                                                    <dd className="process-dashboard__value mb-0 text-sm font-bold">{row.totalRetries}</dd>
                                                </div>
                                            </dl>
                                            <p className="process-dashboard__meta mb-2 text-xs">
                                                Escalation path:{" "}
                                                <span className="process-dashboard__value font-semibold">
                                                    {row.escalationPath}
                                                </span>
                                            </p>
                                            {row.samples.length > 0 && (
                                                <div className="process-dashboard__stack space-y-2">
                                                    {row.samples.map((sample, index) => (
                                                        <div
                                                            key={`${row.key}-${sample.type}-${index}`}
                                                            className="process-dashboard__sample rounded-lg p-2 text-xs ring-1 ring-inset ring-slate-200">
                                                            <p className="process-dashboard__value mb-1 font-semibold">
                                                                {sample.type}
                                                                {sample.retries !== null
                                                                    ? ` - retries ${sample.retries}`
                                                                    : ""}
                                                            </p>
                                                            <p className="process-dashboard__meta mb-0">
                                                                {sample.message}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                    No failed jobs or incidents in scope.
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {config.show_sla_breaches && (
                        <SectionCard
                            title="SLA Breaches (Live)"
                            subtitle="Processes already past their calculated or configured due date."
                            icon="fa-regular fa-clock">
                            {dashboardState.slaRows.length ? (
                                <div className="process-dashboard__stack space-y-3">
                                    {dashboardState.slaRows.map(row => (
                                        <article
                                            key={row.id}
                                            className="process-dashboard__list-item rounded-xl border p-3">
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div className="process-dashboard__item-copy min-w-0">
                                                    <p className="process-dashboard__item-title mb-1 truncate text-sm font-semibold">
                                                        {row.title}
                                                    </p>
                                                    {/* <p className="process-dashboard__item-key mb-0 text-xs">
                                                        {row.businessKey}
                                                    </p> */}
                                                </div>
                                                <span className="process-dashboard__chip rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                    {row.overdueText}
                                                </span>
                                            </div>
                                            <dl className="grid gap-2 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <dt className="process-dashboard__label">Due date</dt>
                                                    <dd className="process-dashboard__value mb-0">
                                                        {formatDateTimeForUserView(row.deadline)}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <dt className="process-dashboard__label">Thresholds</dt>
                                                    <dd className="process-dashboard__value mb-0">
                                                        {row.thresholdText}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <dt className="process-dashboard__label">Escalation</dt>
                                                    <dd className="process-dashboard__value mb-0 truncate">
                                                        {row.escalationPath}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="process-dashboard__empty rounded-xl border border-dashed p-6 text-center text-sm">
                                    No live SLA breaches in scope.
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>
            )}
        </>
    );
}

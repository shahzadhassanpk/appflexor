/* eslint-disable react/prop-types */
export default function MetricCard({ icon, label, value, tone, helper }) {
    const toneClass =
        tone === "success"
            ? "bg-emerald-100 text-emerald-700"
            : tone === "danger"
                ? "bg-red-100 text-red-700"
                : tone === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700";

    return (
        <article className="process-dashboard__metric-card rounded-2xl border p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="process-dashboard__label mb-1 text-xs font-semibold uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="process-dashboard__metric-value mb-1 text-2xl font-bold">{value}</p>
                    <p className="process-dashboard__helper mb-0 text-xs">{helper}</p>
                </div>
                <span
                    className={`process-dashboard__metric-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
                    <i className={icon} aria-hidden="true" />
                </span>
            </div>
        </article>
    );
}

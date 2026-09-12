/* eslint-disable react/prop-types */
import { DEFAULT_CONFIG } from "../constants";

export default function DesignPlaceholder({ config, onConfigure }) {
    const selectedCount = config.process_scope === "SELECTED"
        ? config.process_keys.length
        : "All";

    return (
        <div className="process-dashboard__panel process-theme-surface rounded-2xl border p-4">
            <div className="process-dashboard__design-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="process-dashboard__design-copy min-w-0">
                    <div className="process-dashboard__chip mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        <i className="fa-solid fa-chart-line" aria-hidden="true" />
                        Camunda 7 Process Dashboard
                    </div>
                    <h3 className="process-dashboard__title mb-2 text-lg font-bold">
                        {config.title || DEFAULT_CONFIG.title}
                    </h3>
                    <p className="process-dashboard__meta mb-3 text-sm">
                        Add a live KPI dashboard for process instances, activity status,
                        incidents, retries, and SLA breaches.
                    </p>
                    <div className="process-dashboard__design-chips flex flex-wrap gap-2 text-xs">
                        <span className="process-dashboard__count-badge rounded-full px-3 py-1 ring-1 ring-inset ring-slate-200">
                            Scope: {config.process_scope === "SELECTED" ? "Selected processes" : "All processes"}
                        </span>
                        <span className="process-dashboard__count-badge rounded-full px-3 py-1 ring-1 ring-inset ring-slate-200">
                            Selection: {selectedCount}
                        </span>
                        <span className="process-dashboard__count-badge rounded-full px-3 py-1 ring-1 ring-inset ring-slate-200">
                            Refresh: {config.refresh_interval_seconds}s
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onConfigure}
                    className="btn button-theme btn-sm rounded-pill px-4">
                    <i className="fa-solid fa-sliders me-2" />
                    Configure
                </button>
            </div>
        </div>
    );
}

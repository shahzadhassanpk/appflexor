/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { HISTORY_QUICK_FILTERS } from "../constants";

export default function HistoryFilterBar({
    activeFilterKey,
    activeFilterLabel,
    activeFilterSummary,
    onQuickFilterSelect,
    onOpenCustomDates,
    availableProcesses,
    selectedProcessKeys,
    selectedProcessLabel,
    onToggleProcess,
    onSelectAllProcesses,
    onClearProcesses,
    loading,
}) {
    const [processMenuOpen, setProcessMenuOpen] = useState(false);
    const processMenuRef = useRef(null);
    const totalProcessCount = availableProcesses.length;
    const allProcessesSelected =
        totalProcessCount > 0 && selectedProcessKeys.length === totalProcessCount;
    const noProcessesSelected = selectedProcessKeys.length === 0;

    useEffect(() => {
        if (!processMenuOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!processMenuRef.current?.contains(event.target)) {
                setProcessMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [processMenuOpen]);

    return (
        <section className="process-dashboard__panel process-dashboard__history-filter-bar rounded-2xl border bg-white p-4 shadow-sm">
            <div className="process-dashboard__panel-row flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="process-dashboard__quick-filters">
                    <p className="process-dashboard__label mb-2 text-sm font-semibold">
                        Quick Filters
                    </p>
                    <div className="process-dashboard__quick-filter-row flex flex-wrap gap-2">
                        {HISTORY_QUICK_FILTERS.map(filter => {
                            const isCustom = filter.key === "CUSTOM";
                            const isActive = activeFilterKey === filter.key;
                            return (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => (
                                        isCustom
                                            ? onOpenCustomDates()
                                            : onQuickFilterSelect(filter.key)
                                    )}
                                    disabled={loading}
                                    className={`process-dashboard__quick-filter btn btn-sm rounded-pill px-3 ${
                                        isActive
                                            ? "button-theme"
                                            : "btn-outline-secondary"
                                    }`}>
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="process-dashboard__meta mb-0 mt-2 text-xs">
                        {activeFilterSummary}
                        {activeFilterKey === "CUSTOM" ? ` (${activeFilterLabel})` : ""}
                    </p>
                </div>
                <div className="process-dashboard__filter-actions flex flex-col gap-3 xl:items-end">
                    <div className="process-dashboard__history-filter-row flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* <div className="process-dashboard__selected-shell rounded-xl px-3 py-2 text-xs ring-1 ring-inset ring-slate-200">
                            Scope: <span className="process-dashboard__value font-semibold">{selectedLabel}</span>
                        </div> */}
                        <div
                            ref={processMenuRef}
                            className="process-dashboard__history-process-picker">
                            <button
                                type="button"
                                onClick={() => setProcessMenuOpen(previous => !previous)}
                                className="process-dashboard__history-process-summary border-0 bg-transparent p-0">
                                <span className="process-dashboard__selected-shell process-dashboard__history-process-trigger rounded-xl px-3 py-2 text-xs ring-1 ring-inset ring-slate-200">
                                    <i className="fa-solid fa-list-check me-2" />
                                    Process Filter:
                                    {" "}
                                    <span className="process-dashboard__value font-semibold">
                                        {selectedProcessLabel}
                                    </span>
                                    <i className={`fa-solid ${processMenuOpen ? "fa-chevron-up" : "fa-chevron-down"} ms-2`} />
                                </span>
                            </button>
                            {processMenuOpen && (
                                <div className="process-dashboard__history-process-menu rounded-2xl border p-3 shadow-sm">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="process-dashboard__label mb-0 text-xs font-semibold">
                                            Available processes
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={onSelectAllProcesses}
                                                disabled={loading || allProcessesSelected || totalProcessCount === 0}
                                                className="btn btn-link p-0 text-xs">
                                                Select all
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onClearProcesses}
                                                disabled={loading || noProcessesSelected || totalProcessCount === 0}
                                                className="btn btn-link process-dashboard__history-process-clear p-0 text-xs">
                                                Unselect all
                                            </button>
                                        </div>
                                    </div>
                                    <div className="process-dashboard__history-process-list">
                                        {availableProcesses.length ? availableProcesses.map(process => {
                                            const processKey = String(process.process_key || "");
                                            const checked = selectedProcessKeys.includes(processKey);
                                            return (
                                                <div
                                                    key={processKey}
                                                    className="process-dashboard__history-process-option flex items-start gap-2 rounded-xl border px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input mt-0.5 shrink-0"
                                                        checked={checked}
                                                        disabled={loading}
                                                        onChange={event =>
                                                            onToggleProcess(processKey, event.target.checked)
                                                        }
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="process-dashboard__item-title truncate text-sm font-semibold">
                                                            {process.title || processKey}
                                                        </span>
                                                        <span className="process-dashboard__item-key ms-1 truncate text-xs">
                                                            [ {processKey} ]
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        }) : (
                                            <p className="process-dashboard__empty mb-0 rounded-xl border border-dashed p-3 text-center text-sm">
                                                No processes available for this scope.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="process-dashboard__chip rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {activeFilterLabel}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

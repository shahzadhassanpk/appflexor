/* eslint-disable react/prop-types */
export default function HistoryFilterBar({
    historyDraft,
    setHistoryDraft,
    onApply,
    onReset,
    selectedLabel,
    loading,
}) {
    return (
        <section className="process-dashboard__panel rounded-2xl border bg-white p-4 shadow-sm">
            <div className="process-dashboard__panel-row flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="process-dashboard__date-grid grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                    <div>
                        <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                            Date from
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={historyDraft.from}
                            onChange={event =>
                                setHistoryDraft(previous => ({
                                    ...previous,
                                    from: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                            Date to
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={historyDraft.to}
                            onChange={event =>
                                setHistoryDraft(previous => ({
                                    ...previous,
                                    to: event.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div className="process-dashboard__filter-actions flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="process-dashboard__selected-shell rounded-xl px-3 py-2 text-xs ring-1 ring-inset ring-slate-200">
                        Scope: <span className="process-dashboard__value font-semibold">{selectedLabel}</span>
                    </div>
                    <div className="process-dashboard__button-group flex gap-2">
                        <button
                            type="button"
                            onClick={onReset}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-4">
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={onApply}
                            disabled={!historyDraft.from || !historyDraft.to || loading}
                            className="btn button-theme btn-sm rounded-pill px-4">
                            <i className={`fa-solid fa-filter me-2 ${loading ? "fa-spin" : ""}`} />
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* eslint-disable react/prop-types */
import { Modal } from "react-bootstrap";

export default function ProcessDashboardConfigModal({
    show,
    onHide,
    config,
    setConfig,
    selectedConfigProcesses,
    onToggleProcess,
    onOpenProcessSelector,
    onSave,
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            backdrop="static"
            keyboard={false}
            size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Configure Process Dashboard</Modal.Title>
            </Modal.Header>
            <Modal.Body className="process-dashboard__panel process-theme-surface">
                <div className="process-dashboard__config-body space-y-4">
                    <div className="process-dashboard__config-card rounded-2xl border p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={config.title}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                                    Refresh interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="15"
                                    className="form-control"
                                    value={config.refresh_interval_seconds}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            refresh_interval_seconds: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <section className="process-dashboard__config-section rounded-2xl border p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="process-dashboard__config-title mb-1 text-sm font-bold">
                                    Processes to display
                                </h3>
                                <p className="process-dashboard__config-note mb-0 text-xs">
                                    Match the Inbox selective process behavior for this dashboard.
                                </p>
                            </div>
                            {config.process_scope === "SELECTED" && (
                                <span className="process-dashboard__chip rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                    {(config.process_keys || []).length} selected
                                </span>
                            )}
                        </div>
                        <div className="mb-3 flex flex-wrap gap-4 text-sm">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    className="form-check-input m-0"
                                    checked={config.process_scope === "ALL"}
                                    onChange={() =>
                                        setConfig(previous => ({
                                            ...previous,
                                            process_scope: "ALL",
                                        }))
                                    }
                                />
                                <span>All processes</span>
                            </label>
                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    className="form-check-input m-0"
                                    checked={config.process_scope === "SELECTED"}
                                    onChange={() => {
                                        setConfig(previous => ({
                                            ...previous,
                                            process_scope: "SELECTED",
                                        }));
                                        onOpenProcessSelector();
                                    }}
                                />
                                <span>Selected processes</span>
                            </label>
                        </div>
                        {config.process_scope === "SELECTED" && (
                            <div className="process-dashboard__selected-shell rounded-xl border p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="process-dashboard__label text-xs font-semibold">
                                        Selected processes
                                    </span>
                                    <button
                                        type="button"
                                        onClick={onOpenProcessSelector}
                                        className="btn button-theme btn-sm rounded-pill px-3">
                                        <i className="fa-solid fa-list-check me-1.5" />
                                        Manage
                                    </button>
                                </div>
                                {selectedConfigProcesses.length ? (
                                    <div className="process-dashboard__selected-grid flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                                        {selectedConfigProcesses.map(process => (
                                            <span
                                                key={process.process_key}
                                                className="process-dashboard__chip inline-flex max-w-full items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                                <span className="truncate">
                                                    {process.title || process.process_key}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onToggleProcess(
                                                            String(process.process_key),
                                                            false,
                                                        )
                                                    }
                                                    className="border-0 bg-transparent p-0 text-indigo-400">
                                                    <i className="fa-solid fa-xmark" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onOpenProcessSelector}
                                        className="process-dashboard__empty w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm">
                                        No processes selected. Choose processes.
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="process-dashboard__config-section rounded-2xl border p-4">
                        <h3 className="process-dashboard__config-title mb-3 text-sm font-bold">
                            Visible sections
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config.show_header}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            show_header: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Show header and refresh bar</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config.show_activity_status}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            show_activity_status: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Show activity status</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config.show_error_tracking}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            show_error_tracking: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Show error and incident tracking</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config.show_sla_breaches}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            show_sla_breaches: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Show SLA breaches</span>
                            </label>
                        </div>
                    </section>

                    <section className="process-dashboard__config-section rounded-2xl border p-4">
                        <h3 className="process-dashboard__config-title mb-3 text-sm font-bold">Row limits</h3>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                                    Activity rows
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    value={config.max_activity_rows}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            max_activity_rows: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                                    Incident rows
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    value={config.max_incident_rows}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            max_incident_rows: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                                    SLA rows
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    value={config.max_sla_rows}
                                    onChange={event =>
                                        setConfig(previous => ({
                                            ...previous,
                                            max_sla_rows: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button
                    type="button"
                    onClick={onHide}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-4">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="btn button-theme btn-sm rounded-pill px-4">
                    Save
                </button>
            </Modal.Footer>
        </Modal>
    );
}

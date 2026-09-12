/* eslint-disable react/prop-types */
import { Modal } from "react-bootstrap";

export default function ProcessSelectorModal({
    show,
    onHide,
    processList,
    loading,
    processSearch,
    setProcessSearch,
    selectedProcessKeys,
    onToggleProcess,
    onClear,
}) {
    const searchTerm = processSearch.toLowerCase().trim();
    const filteredProcesses = processList.filter(process => (
        !searchTerm ||
        String(process.title || "").toLowerCase().includes(searchTerm) ||
        String(process.process_key || "").toLowerCase().includes(searchTerm)
    ));

    return (
        <Modal
            show={show}
            onHide={onHide}
            backdrop="static"
            centered
            size="lg"
            className="inbox-process-selector-modal process-dashboard__selector-modal">
            <Modal.Header closeButton>
                <Modal.Title className="modal-title">
                    <span>
                        <i className="fa-solid fa-diagram-project me-2 text-primary" />
                        Select processes
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div className="process-dashboard__selector-panel process-theme-surface">
                    <div className="process-dashboard__selector-toolbar sticky top-0 z-10 border-b border-slate-200 bg-white p-3">
                        <label className="relative block">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
                                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                            </span>
                            <input
                                type="search"
                                autoFocus
                                value={processSearch}
                                onChange={event => setProcessSearch(event.target.value)}
                                placeholder="Search process name or key..."
                                className="form-control rounded-xl py-3 ps-5"
                            />
                        </label>
                        <div className="process-dashboard__meta mt-2 flex items-center justify-between text-xs">
                            <span>
                                {filteredProcesses.length} available - {selectedProcessKeys.length} selected
                            </span>
                            {selectedProcessKeys.length > 0 && (
                                <button
                                    type="button"
                                    onClick={onClear}
                                    className="border-0 bg-transparent p-0 font-semibold text-red-600">
                                    Clear selection
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="process-dashboard__selector-results max-h-[55vh] overflow-y-auto p-3">
                        {loading ? (
                            <p className="mb-0 p-8 text-center text-sm text-slate-500">
                                <i className="fa-solid fa-spinner fa-spin me-2" />
                                Loading processes...
                            </p>
                        ) : filteredProcesses.length ? (
                            <div className="process-dashboard__selector-grid grid gap-2 sm:grid-cols-2">
                                {filteredProcesses.map((process, index) => {
                                    const processKey = String(process.process_key || "");
                                    const checked = selectedProcessKeys.includes(processKey);
                                    return (
                                        <label
                                            key={process.id || processKey || index}
                                            className={`process-dashboard__selector-option flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                                                checked
                                                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input mt-0.5 shrink-0"
                                                checked={checked}
                                                onChange={event =>
                                                    onToggleProcess(processKey, event.target.checked)
                                                }
                                            />
                                            <span className="process-dashboard__selector-copy min-w-0">
                                                <strong className="process-dashboard__item-title block truncate text-sm">
                                                    {process.title || processKey}
                                                </strong>
                                                <small className="process-dashboard__item-key mt-0.5 block truncate text-xs">
                                                    {processKey}
                                                </small>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="process-dashboard__empty p-10 text-center text-sm">
                                <i className="fa-solid fa-magnifying-glass mb-2 block text-xl text-slate-300" />
                                No processes match your search.
                            </div>
                        )}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button
                    type="button"
                    onClick={onHide}
                    className="btn button-theme btn-sm rounded-pill px-4">
                    <i className="fa-solid fa-check me-2" />
                    Done
                </button>
            </Modal.Footer>
        </Modal>
    );
}

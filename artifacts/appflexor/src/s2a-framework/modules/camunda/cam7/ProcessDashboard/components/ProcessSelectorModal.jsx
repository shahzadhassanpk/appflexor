/* eslint-disable react/prop-types */
import { Modal } from "react-bootstrap";

function getBusinessArea(process) {
    return String(process?.business_area_label || "").trim() || "Uncategorized";
}

function getCategory(process) {
    return String(process?.category_label || "").trim();
}

function getUnifiedProcessIcon() {
    return "fa-diagram-project";
}

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
        String(process.process_key || "").toLowerCase().includes(searchTerm) ||
        getBusinessArea(process).toLowerCase().includes(searchTerm) ||
        getCategory(process).toLowerCase().includes(searchTerm)
    ));
    const groupedProcesses = filteredProcesses.reduce((groups, process) => {
        const businessArea = getBusinessArea(process);
        if (!groups[businessArea]) {
            groups[businessArea] = [];
        }
        groups[businessArea].push(process);
        return groups;
    }, {});
    const sortedBusinessAreas = Object.keys(groupedProcesses).sort((left, right) =>
        left.localeCompare(right),
    );

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
                        <div className="relative block">
                            <span className="pointer-events-none absolute inset-y-0 left-2 flex w-8 items-center justify-center text-slate-400">
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
                        </div>
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
                            <div className="process-dashboard__selector-groups d-grid gap-3">
                                {sortedBusinessAreas.map(businessArea => (
                                    <section
                                        key={businessArea}
                                        className="process-dashboard__selector-group">
                                        <div className="process-dashboard__selector-group-header mb-2 d-flex items-center justify-between gap-2">
                                            <div className="process-dashboard__selector-group-title-wrap d-flex min-w-0 items-center gap-2">
                                                <span className="process-dashboard__selector-group-icon" aria-hidden="true">
                                                    <i className={`fa-solid fa-layer-group`} />
                                                </span>
                                                <p className="process-dashboard__selector-group-title mb-0 truncate text-sm fw-semibold">
                                                    {businessArea}
                                                </p>
                                            </div>
                                            <p className="process-dashboard__selector-group-meta mb-0 text-xs">
                                                {groupedProcesses[businessArea].length} process{groupedProcesses[businessArea].length === 1 ? "" : "es"}
                                            </p>
                                        </div>
                                        <div className="process-dashboard__selector-grid grid gap-2 sm:grid-cols-2">
                                            {groupedProcesses[businessArea].map((process, index) => {
                                                const processKey = String(process.process_key || "");
                                                const checked = selectedProcessKeys.includes(processKey);
                                                const category = getCategory(process);
                                                return (
                                                    <div
                                                        key={process.id || processKey || `${businessArea}-${index}`}
                                                        className={`process-dashboard__selector-option process-dashboard__selector-option--compact flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-all ${checked
                                                                ? "border-indigo-300 bg-indigo-50 shadow-sm"
                                                                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                                            }`}>
                                                        <div>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input process-dashboard__selector-checkbox mt-0.5 shrink-0"
                                                                checked={checked}
                                                                onChange={event =>
                                                                    onToggleProcess(processKey, event.target.checked)
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="process-dashboard__selector-copy min-w-0">
                                                                <span className="process-dashboard__selector-line flex items-center gap-2 text-sm">
                                                                    <i className={`fa-solid ${getUnifiedProcessIcon()} process-dashboard__selector-process-icon shrink-0`} aria-hidden="true" />
                                                                    <strong className="process-dashboard__item-title process-dashboard__selector-title-inline truncate">
                                                                        {process.title || processKey}
                                                                    </strong>
                                                                    <small className="process-dashboard__item-key process-dashboard__selector-key-inline truncate">
                                                                        [ {processKey} ]
                                                                    </small>
                                                                </span>
                                                                {category && (
                                                                    <span className="process-dashboard__selector-tags mt-1 flex flex-wrap items-center gap-1.5">
                                                                        <small className="process-dashboard__selector-badge process-dashboard__selector-badge--muted">
                                                                            {category}
                                                                        </small>
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
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

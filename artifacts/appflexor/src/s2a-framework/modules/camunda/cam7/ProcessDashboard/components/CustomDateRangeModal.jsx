/* eslint-disable react/prop-types */
import { Modal } from "react-bootstrap";

export default function CustomDateRangeModal({
    show,
    onHide,
    draft,
    setDraft,
    onApply,
    loading,
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            backdrop="static"
            className="process-dashboard__custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Select Custom Dates</Modal.Title>
            </Modal.Header>
            <Modal.Body className="process-dashboard__panel process-theme-surface">
                <div className="process-dashboard__custom-body grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="process-dashboard__label form-label text-sm font-semibold text-slate-700">
                            Date from
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={draft.from}
                            onChange={event =>
                                setDraft(previous => ({
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
                            value={draft.to}
                            onChange={event =>
                                setDraft(previous => ({
                                    ...previous,
                                    to: event.target.value,
                                }))
                            }
                        />
                    </div>
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
                    onClick={onApply}
                    disabled={!draft.from || !draft.to || loading}
                    className="btn button-theme btn-sm rounded-pill px-4">
                    <i className={`fa-solid fa-calendar-check me-2 ${loading ? "fa-spin" : ""}`} />
                    Apply Dates
                </button>
            </Modal.Footer>
        </Modal>
    );
}

import React from "react";
import { Modal } from "react-bootstrap";
import { SearchableSelect } from "./SearchableSelect";

/**
 * Property editor modal — shown when the user clicks Assign or Configure on a
 * BPMN element in the element-tabs panel.
 *
 * All state lives in the parent (ProcessDeployDialog). This component is
 * purely presentational.
 */
export function PropertyEditorModal({
    propModal,
    propForm,
    propLoading,
    refDataLoaded,
    groups,
    users,
    formList,
    aiAgents,
    aiAgentTasks,
    aiTasksLoading,
    onClose,
    onFormChange,   // (updater) => void
    onSave,         // () => void  (savePropChanges)
    onAgentChange,  // (agentKey) => void
}) {
    if (!propModal) return null;
    const { type, subType } = propModal;

    /* ── Form content ────────────────────────────────────────────────────── */
    function renderForm() {
        if (propLoading && !refDataLoaded) {
            return (
                <div className="text-center py-3">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading reference data…
                </div>
            );
        }

        /* Assignee editor */
        if (type === "userTasks" && subType === "assignee") {
            const isExprMode = propForm.assigneeType === "expression";
            return (
                <>
                    <div className="mb-3">
                        <div className="d-flex gap-3 flex-wrap">
                            {[
                                { value: "user",       label: "Individual" },
                                { value: "group",      label: "Group" },
                                { value: "expression", label: "Expression" },
                            ].map(t => (
                                <div key={t.value} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="assigneeType"
                                        id={`at-${t.value}`}
                                        value={t.value}
                                        checked={propForm.assigneeType === t.value}
                                        onChange={() =>
                                            onFormChange(p => ({ ...p, assigneeType: t.value, assignee: "" }))
                                        }
                                    />
                                    <label className="form-check-label" htmlFor={`at-${t.value}`}>
                                        {t.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-1">
                        {isExprMode ? (
                            <>
                                <label className="ai-label">Expression</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm font-monospace"
                                    value={propForm.assignee || ""}
                                    onChange={e => onFormChange(p => ({ ...p, assignee: e.target.value }))}
                                    placeholder="${initiator} or #{someVariable}"
                                />
                            </>
                        ) : (
                            <>
                                <label className="ai-label">
                                    {propForm.assigneeType === "group" ? "Group" : "User"}
                                </label>
                                <SearchableSelect
                                    options={propForm.assigneeType === "group" ? groups : users}
                                    value={propForm.assignee || ""}
                                    onChange={e => onFormChange(p => ({ ...p, assignee: e.target.value }))}
                                    placeholder={
                                        propForm.assigneeType === "group" ? "Search groups…" : "Search users…"
                                    }
                                />
                            </>
                        )}
                    </div>
                </>
            );
        }

        /* Form / form-key editor */
        if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            const isExprMode = propForm.formType === "expression";
            return (
                <>
                    <div className="mb-2">
                        <div className="d-flex gap-3">
                            {[
                                { value: "key",        label: "Form Key" },
                                { value: "expression", label: "Expression" },
                            ].map(t => (
                                <div key={t.value} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="formType"
                                        id={`ft-${t.value}`}
                                        value={t.value}
                                        checked={propForm.formType === t.value}
                                        onChange={() =>
                                            onFormChange(p => ({ ...p, formType: t.value, formKey: "" }))
                                        }
                                    />
                                    <label className="form-check-label" htmlFor={`ft-${t.value}`}>
                                        {t.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-1">
                        {isExprMode ? (
                            <>
                                <label className="ai-label">Expression</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm font-monospace"
                                    value={propForm.formKey || ""}
                                    onChange={e => onFormChange(p => ({ ...p, formKey: e.target.value }))}
                                    placeholder="${someFormKeyExpression}"
                                />
                            </>
                        ) : (
                            <>
                                <label className="ai-label">Form Key</label>
                                <SearchableSelect
                                    options={formList}
                                    value={propForm.formKey || ""}
                                    onChange={e => onFormChange(p => ({ ...p, formKey: e.target.value }))}
                                    placeholder="Search forms…"
                                />
                            </>
                        )}
                    </div>
                </>
            );
        }

        /* Service task editor */
        if (type === "serviceTasks") {
            const isAi = propForm.serviceType === "ai";
            return (
                <>
                    {/* Type toggle — uses proc-svc-type-toggle / proc-svc-type-btn */}
                    <div className="proc-svc-type-toggle mb-3">
                        <button
                            className={`proc-svc-type-btn${!isAi ? " active" : ""}`}
                            onClick={() => onFormChange(p => ({ ...p, serviceType: "external" }))}>
                            <i className="fa-solid fa-plug me-1" />External Worker
                        </button>
                        <button
                            className={`proc-svc-type-btn${isAi ? " active" : ""}`}
                            onClick={() => onFormChange(p => ({ ...p, serviceType: "ai" }))}>
                            <i className="fa-solid fa-robot me-1" />AI Agent
                        </button>
                    </div>

                    {isAi ? (
                        /* AI agent */
                        <>
                            <div className="mb-2">
                                <label className="ai-label">AI Agent</label>
                                <select
                                    className="form-control form-control-sm"
                                    value={propForm.agentKey || ""}
                                    onChange={e => {
                                        const agentKey = e.target.value;
                                        onFormChange(p => ({ ...p, agentKey, taskKey: "" }));
                                        onAgentChange(agentKey);
                                    }}>
                                    <option value="">— Select agent —</option>
                                    {aiAgents.map(a => (
                                        <option key={a.value} value={a.value}>{a.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="ai-label">Task</label>
                                {aiTasksLoading ? (
                                    <div className="text-muted small">
                                        <i className="fa-solid fa-spinner fa-spin me-1" />Loading tasks…
                                    </div>
                                ) : (
                                    <select
                                        className="form-control form-control-sm"
                                        value={propForm.taskKey || ""}
                                        onChange={e => onFormChange(p => ({ ...p, taskKey: e.target.value }))}>
                                        <option value="">— Select task —</option>
                                        {aiAgentTasks.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="mb-1">
                                <label className="ai-label">Payload Parameters</label>
                                <table className="proc-payload-table">
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Value</th>
                                            <th style={{ width: "2rem" }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(propForm.payload || []).map((p, i) => (
                                            <tr key={i}>
                                                <td>
                                                    {i < 2 ? (
                                                        <span className="proc-payload-fixed-key">{p.key}</span>
                                                    ) : (
                                                        <input
                                                            className="form-control form-control-sm proc-payload-key-input"
                                                            placeholder="key"
                                                            value={p.key}
                                                            onChange={e => {
                                                                const payload = [...(propForm.payload || [])];
                                                                payload[i] = { ...payload[i], key: e.target.value };
                                                                onFormChange(prev => ({ ...prev, payload }));
                                                            }}
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm proc-payload-val-input"
                                                        placeholder="value"
                                                        value={p.value}
                                                        onChange={e => {
                                                            const payload = [...(propForm.payload || [])];
                                                            payload[i] = { ...payload[i], value: e.target.value };
                                                            onFormChange(prev => ({ ...prev, payload }));
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    {i >= 2 && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                            onClick={() => {
                                                                const payload = (propForm.payload || []).filter((_, j) => j !== i);
                                                                onFormChange(prev => ({ ...prev, payload }));
                                                            }}>
                                                            <i className="fa fa-times" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    className="btn btn-outline-secondary btn-sm proc-payload-add-btn mt-2"
                                    onClick={() => {
                                        const payload = [...(propForm.payload || []), { key: "", value: "" }];
                                        onFormChange(prev => ({ ...prev, payload }));
                                    }}>
                                    <i className="fa fa-plus me-1" />Add Parameter
                                </button>
                                <p className="proc-payload-hint mt-1 mb-0">
                                    Values support Camunda expressions, e.g.{" "}
                                    <code>{"${execution.businessKey}"}</code> or{" "}
                                    <code>{"${someVariable}"}</code>
                                </p>
                            </div>
                        </>
                    ) : (
                        /* External worker */
                        <>
                            <div className="mb-2">
                                <label className="ai-label">Topic</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={propForm.topic || ""}
                                    onChange={e => onFormChange(p => ({ ...p, topic: e.target.value }))}
                                    placeholder="e.g. my.worker.topic"
                                />
                            </div>
                            <div className="mb-1">
                                <label className="ai-label">Input Parameters</label>
                                <table className="proc-payload-table">
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Value</th>
                                            <th style={{ width: "2rem" }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(propForm.params || []).map((p, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm proc-payload-key-input"
                                                        placeholder="key"
                                                        value={p.key}
                                                        onChange={e => {
                                                            const params = [...(propForm.params || [])];
                                                            params[i] = { ...params[i], key: e.target.value };
                                                            onFormChange(prev => ({ ...prev, params }));
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm proc-payload-val-input"
                                                        placeholder="value"
                                                        value={p.value}
                                                        onChange={e => {
                                                            const params = [...(propForm.params || [])];
                                                            params[i] = { ...params[i], value: e.target.value };
                                                            onFormChange(prev => ({ ...prev, params }));
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                        onClick={() => {
                                                            const params = (propForm.params || []).filter((_, j) => j !== i);
                                                            onFormChange(prev => ({ ...prev, params }));
                                                        }}>
                                                        <i className="fa fa-times" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    className="btn btn-outline-secondary btn-sm proc-payload-add-btn mt-2"
                                    onClick={() => {
                                        const params = [...(propForm.params || []), { key: "", value: "" }];
                                        onFormChange(prev => ({ ...prev, params }));
                                    }}>
                                    <i className="fa fa-plus me-1" />Add Parameter
                                </button>
                                <p className="proc-payload-hint mt-1 mb-0">
                                    Values support Camunda expressions, e.g.{" "}
                                    <code>{"${execution.businessKey}"}</code> or{" "}
                                    <code>{"${someVariable}"}</code>
                                </p>
                            </div>
                        </>
                    )}
                </>
            );
        }

        /* Variable name editor */
        if (type === "variables") {
            return (
                <div className="mb-2">
                    <label className="ai-label">Variable Name</label>
                    <input
                        className="form-control form-control-sm"
                        value={propForm.name || ""}
                        onChange={e => onFormChange(p => ({ ...p, name: e.target.value }))}
                    />
                </div>
            );
        }

        return null;
    }

    /* ── Modal title ─────────────────────────────────────────────────────── */
    function modalTitle() {
        if (type === "userTasks" && subType === "assignee")
            return `Assign "${propModal.title}" task`;
        if ((type === "userTasks" || type === "startEvent") && subType === "form")
            return `Configure form for "${propModal.title}"`;
        if (type === "serviceTasks")
            return `Configure "${propModal.title}" service task`;
        if (type === "variables")
            return `Edit variable "${propModal.title}"`;
        return "Edit properties";
    }

    return (
        <Modal
            show={!!propModal}
            onHide={onClose}
            backdrop="static"
            size="lg"
            style={{ zIndex: 1060 }}
            className="s2a-modal">
            <Modal.Header>
                <Modal.Title className="h4" style={{ fontSize: "0.9rem" }}>
                    <i className="fa-solid fa-sliders me-2" />
                    {modalTitle()}
                </Modal.Title>
                <button className="btn-close" onClick={onClose} />
            </Modal.Header>
            <Modal.Body>
                {renderForm()}
            </Modal.Body>
            <Modal.Footer className="py-2">
                <button className="btn button-theme btn-sm" onClick={onClose}>
                    <i className="fa-solid fa-xmark pe-1" />Cancel
                </button>
                <button
                    className="btn button-theme btn-sm"
                    onClick={onSave}
                    disabled={propLoading}>
                    <i className="fa-solid fa-check pe-1" />Apply
                </button>
            </Modal.Footer>
        </Modal>
    );
}

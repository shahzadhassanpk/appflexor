import React from "react";
import { Modal } from "react-bootstrap";
import { SearchableSelect } from "./SearchableSelect";

const APP_SERVICE_TOPIC = "app.service";

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
    onRefreshReferenceData,
    zIndex = 1100,
}) {
    if (!propModal) return null;
    const { type, subType } = propModal;

    function hasDuplicateAppServiceResults() {
        if (type !== "serviceTasks" || propForm.serviceType !== "app") return false;
        const rows = Array.isArray(propForm.appConfig?.dataKeys)
            ? propForm.appConfig.dataKeys
            : [];
        const counts = rows.reduce((result, row) => {
            const dataKey = String(row?.dataKey || row?.result || row?.resultVariable || "").trim().toLowerCase();
            if (dataKey) result[dataKey] = (result[dataKey] || 0) + 1;
            return result;
        }, {});
        return Object.values(counts).some(count => count > 1);
    }

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
                        <a href="/app/user-management" target="_blank">Add New User or Group</a>
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
                                <EditorLabel
                                    label={propForm.assigneeType === "group" ? "Group" : "User"}
                                    loading={propLoading}
                                    onRefresh={onRefreshReferenceData}
                                />
                                <SearchableSelect
                                    options={propForm.assigneeType === "group" ? groups : users}
                                    value={propForm.assignee || ""}
                                    assigneeType={propForm.assigneeType}
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
                        <a href="/app/data-management" target="_blank">Create New Form</a>
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
                                <EditorLabel
                                    label="Form Key"
                                    loading={propLoading}
                                    onRefresh={onRefreshReferenceData}
                                />
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
            const isAi  = propForm.serviceType === "ai";
            const isApp = propForm.serviceType === "app";

            /* Default config shapes per app-service key */
            function defaultAppConfig(key) {
                if (key === "update.formData")
                    return {
                        dataKeys: [{ serviceKey: "", serviceParams: "", dataKey: "result", mode: "formData" }],
                    };
                if (key === "send.email")
                    return {
                        dataKeys: [{ serviceKey: "", serviceParams: "", dataKey: "result", mode: "formData" }],
                    };
                /* get.formData default */
                return {
                    dataKeys: [{ serviceKey: "", serviceParams: "", dataKey: "result", mode: "formData" }],
                };
            }

            const cfg    = propForm.appConfig    || {};
            const svcKey = propForm.appServiceKey || "get.formData";

            function setCfg(patch) {
                onFormChange(p => ({
                    ...p,
                    appConfig: { dataKeys: normalizeServiceRows({ ...(p.appConfig || {}), ...patch }) },
                }));
            }

            function emptyServiceRow() {
                return { serviceKey: "", serviceParams: "", dataKey: "", mode: "formData" };
            }

            function defaultServiceRow() {
                return { serviceKey: "", serviceParams: "", dataKey: "result", mode: "formData" };
            }

            function normalizeServiceRows(config) {
                const rawRows = Array.isArray(config.dataKeys)
                    ? config.dataKeys
                    : Array.isArray(config.services)
                        ? config.services
                        : [];

                if (rawRows.length) {
                    return rawRows.map(row => ({
                        serviceKey: row.serviceKey || row.emailKey || row.formId || "",
                        serviceParams: row.serviceParams || "",
                        dataKey: row.dataKey || row.result || row.resultVariable || "result",
                        mode: row.mode || "formData",
                    }));
                }

                const serviceKey = svcKey === "send.email"
                    ? (config.emailKey || config.serviceKey || "")
                    : (config.serviceKey || config.formId || "");
                const serviceParams = config.serviceParams || "";
                const dataKey = config.dataKey || config.result || config.resultVariable || "result";

                if (serviceKey || serviceParams || dataKey) {
                    return [{ serviceKey, serviceParams, dataKey, mode: config.mode || "formData" }];
                }

                return [defaultServiceRow()];
            }

            const serviceRows = normalizeServiceRows(cfg);
            const resultCounts = serviceRows.reduce((counts, row) => {
                const dataKey = String(row.dataKey || "").trim().toLowerCase();
                if (dataKey) counts[dataKey] = (counts[dataKey] || 0) + 1;
                return counts;
            }, {});
            const hasDuplicateResult = Object.values(resultCounts).some(count => count > 1);

            function setServiceRows(rows) {
                const normalizedRows = (rows.length ? rows : [emptyServiceRow()]).map(row => ({
                    serviceKey: row.serviceKey || "",
                    serviceParams: row.serviceParams || "",
                    dataKey: row.dataKey || "",
                    mode: row.mode || "formData",
                }));
                onFormChange(p => ({
                    ...p,
                    appConfig: { dataKeys: normalizedRows },
                }));
            }

            function updateServiceRow(index, patch) {
                const rows = serviceRows.map((row, i) => (i === index ? { ...row, ...patch } : row));
                setServiceRows(rows);
            }

            function updateServiceResult(index, dataKey) {
                const normalizedDataKey = String(dataKey || "").trim().toLowerCase();
                const alreadyUsed = Boolean(normalizedDataKey && serviceRows.some((row, i) =>
                    i !== index &&
                    String(row.dataKey || "").trim().toLowerCase() === normalizedDataKey,
                ));
                if (alreadyUsed) return;
                updateServiceRow(index, { dataKey });
            }

            function renderAppServiceRows() {
                const keyLabel = svcKey === "send.email" ? "Email Key" : "Service Key";
                const keyPlaceholder = svcKey === "send.email"
                    ? "e.g. welcome_email"
                    : svcKey === "update.formData"
                        ? "e.g. update.user"
                        : "e.g. sys.user.list";

                return (
                    <div className="mb-2">
                        <label className="ai-label">{keyLabel}, Params and Result Variables</label>
                        <table className="proc-payload-table">
                            <thead>
                                <tr>
                                    <th>{keyLabel}</th>
                                    <th>Service Params</th>
                                    <th>
                                        <div>Result Variable {hasDuplicateResult && (
                                            <span className="text-danger small text-none mt-1" role="alert">
                                               - must be unique.
                                            </span>
                                        )}</div>
                                        
                                    </th>
                                    <th style={{ width: "2rem" }} />
                                </tr>
                            </thead>
                            <tbody>
                                {serviceRows.map((row, i) => (
                                    <tr key={i}>
                                        <td>
                                            <input
                                                className="form-control form-control-sm font-monospace proc-payload-key-input"
                                                value={row.serviceKey}
                                                onChange={e => updateServiceRow(i, { serviceKey: e.target.value })}
                                                placeholder={keyPlaceholder}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="form-control form-control-sm font-monospace proc-payload-val-input"
                                                value={row.serviceParams}
                                                onChange={e => updateServiceRow(i, { serviceParams: e.target.value })}
                                                placeholder="static value or ${expression}"
                                            />
                                        </td>
                                        <td>
                                            {(() => {
                                                const normalizedDataKey = String(row.dataKey || "").trim().toLowerCase();
                                                const isDuplicateResult = Boolean(normalizedDataKey && resultCounts[normalizedDataKey] > 1);
                                                return (
                                            <input
                                                className={`form-control form-control-sm font-monospace proc-payload-val-input ${isDuplicateResult ? "is-invalid" : ""}`}
                                                value={row.dataKey}
                                                onChange={e => updateServiceResult(i, e.target.value)}
                                                placeholder="e.g. result"
                                                aria-invalid={isDuplicateResult}
                                            />
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                onClick={() => setServiceRows(serviceRows.filter((_, j) => j !== i))}
                                                disabled={serviceRows.length === 1}
                                                title="Remove service config row"
                                                aria-label="Remove service config row">
                                                <i className="fa fa-times" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            className="btn btn-outline-secondary btn-sm proc-payload-add-btn mt-2"
                            onClick={() => setServiceRows([...serviceRows, emptyServiceRow()])}>
                            <i className="fa fa-plus me-1" />Add Service
                        </button>
                        <p className="proc-payload-hint mt-1 mb-0">
                            Saved in <code>serviceConfig.dataKeys</code> as a JSON array. Values support process engine expressions.
                        </p>
                    </div>
                );
            }

            /* Shared user-defined input parameters table — same for all tabs */
            function renderParamsTable() {
                return (
                    <div className="mb-2 mt-3">
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
                                                placeholder="value or ${expr}"
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
                            Values support process engine expressions, e.g.{" "}
                            <code>{"${execution.businessKey}"}</code> or{" "}
                            <code>{"${someVariable}"}</code>
                        </p>
                    </div>
                );
            }

            /* Auto-generate title from current form state */
            function computeAutoTitle() {
                if (isAi) {
                    const agentLabel = aiAgents.find(a => a.value === propForm.agentKey)?.label || propForm.agentKey || "";
                    const taskLabel  = aiAgentTasks.find(t => t.value === propForm.taskKey)?.label || propForm.taskKey || "";
                    if (agentLabel && taskLabel) return `AI Agent (${agentLabel}: ${taskLabel})`;
                    if (agentLabel)              return `AI Agent (${agentLabel})`;
                    return "AI Agent";
                }
                if (isApp) {
                    const legacyKeyCount = svcKey === "send.email"
                        ? (cfg.emailKey ? 1 : 0)
                        : (cfg.serviceKey || cfg.formId ? 1 : 0);
                    const serviceKeyCount = serviceRows.filter(row => row.serviceKey?.trim()).length || legacyKeyCount;
                    const svcName = svcKey === "get.formData"     ? "API Query"
                                  : svcKey === "update.formData"  ? "API Trigger"
                                  : "Send Email";
                    const detail = serviceKeyCount
                        ? `${serviceKeyCount} service key${serviceKeyCount === 1 ? "" : "s"}`
                        : "";
                    return detail ? `App Service (${svcName}: ${detail})` : `App Service (${svcName})`;
                }
                // AppFlexor Connector
                const topic = propForm.workerTopic || "";
                return topic ? `AppFlexor Connector (${topic})` : "AppFlexor Connector";
            }

            const autoTitle = computeAutoTitle();

            return (
                <>
                    {/* ── Type toggle ─────────────────────────────────────────── */}
                    <div className="proc-svc-type-toggle mb-3">
                        <button
                            className={`proc-svc-type-btn${(!isAi && !isApp) ? " active" : ""}`}
                            onClick={() => onFormChange(p => ({ ...p, serviceType: "external" }))}>
                            <i className="fa-solid fa-plug me-1" />AppFlexor Connector
                        </button>
                        <button
                            className={`proc-svc-type-btn${isApp ? " active" : ""}`}
                            onClick={() => onFormChange(p => ({
                                ...p,
                                serviceType:    "app",
                                appServiceKey:  p.appServiceKey  || "get.formData",
                                appConfig:      p.appConfig      || defaultAppConfig(p.appServiceKey || "get.formData"),
                            }))}>
                            <i className="fa-solid fa-server me-1" />App Service
                        </button>
                        <button
                            className={`proc-svc-type-btn${isAi ? " active" : ""}`}
                            onClick={() => onFormChange(p => ({ ...p, serviceType: "ai" }))}>
                            <i className="fa-solid fa-robot me-1" />AI Agent
                        </button>
                    </div>

                    {/* ── Auto-generated title (readonly) + Description ────────── */}
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <label className="ai-label">Title <span className="proc-payload-hint">(auto-generated)</span></label>
                            <input
                                className="form-control form-control-sm"
                                value={autoTitle}
                                readOnly
                                tabIndex={-1}
                                style={{ background: "var(--secondary-color)", opacity: 0.75, cursor: "default" }}
                            />
                        </div>
                        <div className="col-6">
                            <label className="ai-label">Description</label>
                            <input
                                className="form-control form-control-sm"
                                value={propForm.workerDescription || ""}
                                onChange={e => onFormChange(p => ({ ...p, workerDescription: e.target.value }))}
                                placeholder="Short description"
                            />
                        </div>
                    </div>

                    {/* ── AppFlexor Connector ─────────────────────────────────── */}
                    {!isAi && !isApp && (
                        <>
                            <div className="mb-2">
                                <label className="ai-label">Connector Topic</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={propForm.workerTopic || ""}
                                    onChange={e => onFormChange(p => ({ ...p, workerTopic: e.target.value }))}
                                    placeholder="e.g. my.connector.topic"
                                />
                            </div>
                            {renderParamsTable()}
                            <p className="proc-payload-hint mb-0 mt-2 d-flex align-items-center gap-1">
                                <i className="fa-solid fa-circle-info" />
                                Worker topic: <code>appflexor.connector</code>
                            </p>
                        </>
                    )}

                    {/* ── App Service ─────────────────────────────────────────── */}
                    {isApp && (
                        <>
                            <div className="mb-3">
                                <label className="ai-label">Service</label>
                                <select
                                    className="form-control form-control-sm"
                                    value={svcKey}
                                    onChange={e => {
                                        const key = e.target.value;
                                        onFormChange(p => ({
                                            ...p,
                                            appServiceKey: key,
                                            appConfig:     defaultAppConfig(key),
                                        }));
                                    }}>
                                    <option value="get.formData">API Query</option>
                                    <option value="update.formData">API Trigger</option>
                                    <option value="send.email">Send Email</option>
                                </select>
                            </div>

                            {renderAppServiceRows()}

                            {/* update.formData */}
                            {false && svcKey === "update.formData" && (
                                <>
                                    <div className="mb-2">
                                        <label className="ai-label">Table (formId)</label>
                                        <input
                                            className="form-control form-control-sm font-monospace"
                                            value={cfg.formId || ""}
                                            onChange={e => setCfg({ formId: e.target.value, entity: e.target.value })}
                                            placeholder="e.g. my_table"
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="ai-label">Action</label>
                                        <select
                                            className="form-control form-control-sm"
                                            value={cfg.action || "update"}
                                            onChange={e => setCfg({ action: e.target.value })}>
                                            <option value="update">update — Save existing record</option>
                                            <option value="create">create — Insert new record</option>
                                            <option value="delete">delete — Remove record</option>
                                        </select>
                                    </div>
                                    {cfg.action !== "create" && (
                                        <div className="mb-2">
                                            <label className="ai-label">Record ID</label>
                                            <input
                                                className="form-control form-control-sm font-monospace"
                                                value={cfg.id || ""}
                                                onChange={e => setCfg({ id: e.target.value })}
                                                placeholder="${execution.businessKey} or static"
                                            />
                                        </div>
                                    )}
                                    <div className="mb-1">
                                        <label className="ai-label">Data Fields</label>
                                        <table className="proc-payload-table">
                                            <thead>
                                                <tr>
                                                    <th>Field</th>
                                                    <th>Value / Expression</th>
                                                    <th style={{ width: "2rem" }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(cfg.formData || []).map((row, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <input
                                                                className="form-control form-control-sm proc-payload-key-input"
                                                                placeholder="field"
                                                                value={row.key}
                                                                onChange={e => {
                                                                    const fd = [...(cfg.formData || [])];
                                                                    fd[i] = { ...fd[i], key: e.target.value };
                                                                    setCfg({ formData: fd });
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                className="form-control form-control-sm proc-payload-val-input"
                                                                placeholder="value or ${expr}"
                                                                value={row.value}
                                                                onChange={e => {
                                                                    const fd = [...(cfg.formData || [])];
                                                                    fd[i] = { ...fd[i], value: e.target.value };
                                                                    setCfg({ formData: fd });
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                                onClick={() => {
                                                                    const fd = (cfg.formData || []).filter((_, j) => j !== i);
                                                                    setCfg({ formData: fd });
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
                                                const fd = [...(cfg.formData || []), { key: "", value: "" }];
                                                setCfg({ formData: fd });
                                            }}>
                                            <i className="fa fa-plus me-1" />Add Field
                                        </button>
                                        <p className="proc-payload-hint mt-1 mb-0">
                                            Values support process engine expressions, e.g.{" "}
                                            <code>{"${execution.businessKey}"}</code> or{" "}
                                            <code>{"${someVariable}"}</code>
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* {renderParamsTable()} */}
                            <p className="proc-payload-hint mb-0 mt-2 d-flex align-items-center gap-1">
                                <i className="fa-solid fa-circle-info" />
                                Worker topic: <code>{APP_SERVICE_TOPIC}</code>
                            </p>
                        </>
                    )}

                    {/* ── AI Agent ────────────────────────────────────────────── */}
                    {isAi && (
                        <>
                            <div className="mb-2">
                                <EditorLabel
                                    label="AI Agent"
                                    loading={propLoading}
                                    onRefresh={onRefreshReferenceData}
                                />
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
                                {(() => {
                                    const currentTask = propForm.taskKey || "";
                                    const hasTaskOption = !currentTask || aiAgentTasks.some(t => t.value === currentTask);
                                    return aiTasksLoading ? (
                                        <div className="text-muted small">
                                            <i className="fa-solid fa-spinner fa-spin me-1" />Loading tasks…
                                        </div>
                                    ) : (
                                        <select
                                            className="form-control form-control-sm"
                                            value={currentTask}
                                            onChange={e => onFormChange(p => ({ ...p, taskKey: e.target.value }))}>
                                            <option value="">— Select task —</option>
                                            {!hasTaskOption && (
                                                <option value={currentTask}>{currentTask}</option>
                                            )}
                                            {aiAgentTasks.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    );
                                })()}
                            </div>
                            <div className="mb-2">
                                <label className="ai-label">Result Variable</label>
                                <input
                                    className="form-control form-control-sm font-monospace"
                                    value={propForm.result || ""}
                                    onChange={e => onFormChange(p => ({ ...p, result: e.target.value }))}
                                    placeholder="e.g. result"
                                />
                                <p className="proc-payload-hint mt-1 mb-0">
                                    Process variable where the response will be stored
                                </p>
                            </div>
                            {renderParamsTable()}
                            <p className="proc-payload-hint mb-0 mt-2 d-flex align-items-center gap-1">
                                <i className="fa-solid fa-circle-info" />
                                Worker topic: <code>appflexor.ai.agent</code>
                            </p>
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
            backdropClassName="process-property-editor-backdrop"
            size="lg"
            style={{ zIndex }}
            className="s2a-modal process-theme-modal process-property-editor-modal">
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
                    disabled={propLoading || hasDuplicateAppServiceResults()}>
                    <i className="fa-solid fa-check pe-1" />Apply
                </button>
            </Modal.Footer>
        </Modal>
    );
}

function EditorLabel({ label, loading, onRefresh }) {
    return (
        <div className="mb-1 d-flex align-items-center justify-content-between gap-2">
            <label className="ai-label mb-0">{label}</label>
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1"
                onClick={onRefresh}
                disabled={loading}
                title={`Refresh ${label.toLowerCase()} list`}
                aria-label={`Refresh ${label.toLowerCase()} list`}>
                <i className={`fa-solid fa-rotate ${loading ? "fa-spin" : ""}`} aria-hidden="true" />
                <span>Refresh</span>
            </button>
        </div>
    );
}

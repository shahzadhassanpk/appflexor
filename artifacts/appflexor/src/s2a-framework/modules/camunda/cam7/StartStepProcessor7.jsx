import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
// import FormViewer, {
// } from "../data-management/form-builder/Forms/FormViewer/FormViewer";
import { AppContext } from "../../../../AppContext";
import ProcessFormViewer from "../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import { modeType } from "../../data-management/form-builder/Forms/FormViewer/constants";
import { BPM_API_URL } from "../CamundaConfig";
import { actions } from "../constants";
import { getProcessVariablesFromData } from "../helperFunctions";
function StartStepProcessor({
    id,
    handleProcessActions,
    camundaVars = {},
    formVars = {},
    action = {},
    processStartDraft = null,
    onDraftChange,
}) {
    const [processId, setProcessId] = useState("");
    const [formDetails, setFormDetails] = useState({});
    const [activeDraft, setActiveDraft] = useState(processStartDraft);
    const [startNotice, setStartNotice] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const startLockRef = useRef(false);
    const activeDraftIdRef = useRef(processStartDraft?.id || "");
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id || "";

    // side effects
    useEffect(() => {
        if (id === "") {
            let processId = getIdFromURL();
            setProcessId(processId);
        } else {
            setProcessId(id);
        }
    }, [id]);

    useEffect(() => {
        if (processId !== "") {
            getData(processId);
        }
    }, [processId]);

    useEffect(() => {
        const nextDraftId = processStartDraft?.id || "";
        if (activeDraftIdRef.current === nextDraftId) return;
        activeDraftIdRef.current = nextDraftId;
        setActiveDraft(processStartDraft);
        setStartNotice(null);
    }, [processStartDraft?.id]);

    // event handlers

    async function handleActions(
        actionType,
        state = {},
        savedFormDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        const taskVariables = getProcessVariablesFromData(
            state,
            componentsData,
        );

        if (actionType !== actions.complete) return true;

        const processKey =
            formDetails?.process_key || formDetails?.processKey || "";
        const formKey =
            formDetails?.form_key ||
            formDetails?.formKey ||
            savedFormDetails?.form_key ||
            savedFormDetails?.formKey ||
            "";
        const formTable =
            formDetails?.table ||
            formDetails?.form_table ||
            formDetails?.formTable ||
            savedFormDetails?.table ||
            "";
        const businessKey =
            processStartDraft?.business_key ||
            state?.business_key ||
            state?.id;
        if (!businessKey || !state?.id) {
            const message =
                "The saved form record is missing the identifier needed to start this process.";
            setStartNotice({ type: "danger", message });
            toastEmitter(message, true, "error");
            return false;
        }
        if (
            !processKey ||
            !formKey ||
            !formTable
        ) {
            const message =
                "The process configuration is missing the information needed to save this start request.";
            setStartNotice({ type: "danger", message });
            toastEmitter(message, true, "error");
            return false;
        }
        if (startLockRef.current) {
            return false;
        }

        startLockRef.current = true;
        setIsStarting(true);
        setStartNotice(null);
        try {
            await updateBusinessKey(
                state,
                { ...savedFormDetails, table: formTable },
                businessKey,
            );
            const variables = buildStartVariables(taskVariables);
            const draft = await saveDraft(processStartDraft, {
                process_definition_id: processId,
                process_key: processKey,
                form_key: formKey,
                form_table: formTable,
                form_record_id: state.id,
                business_key: businessKey,
                process_variables: JSON.stringify(variables),
                status: "STARTING",
                last_error: "",
                retry_count: Number(processStartDraft?.retry_count || 0),
                requester: appContext?.profile?.username || "",
            });
            setActiveDraft(draft);
            onDraftChange?.(draft);
            return await attemptStart(draft, variables, Boolean(processStartDraft));
        } catch (error) {
            const message = getErrorMessage(error);
            console.error(error);
            setStartNotice({ type: "danger", message });
            toastEmitter(message, true, "error");
            return false;
        } finally {
            startLockRef.current = false;
            setIsStarting(false);
        }
    }

    // utils
    function getIdFromURL() {
        let id = "";
        let currentUrl = window.location.href;

        if (currentUrl.includes(":id=")) {
            let arr = currentUrl.split(":id=");
            id = arr[1];
        }

        return id;
    }

    // api calls  app-service
    function getData(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "form",
                    serviceKey: "sys.start.process",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let data = response.data.C_DATA.form[0]
                        ? response.data.C_DATA.form[0]
                        : [];
                    setFormDetails(data);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function updateBusinessKey(formData, formDetails, businessKey) {
        let fieldsData = { ...formData, business_key: businessKey };

        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";
        entityForm.fileData = [];

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
            fieldsData.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);

        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );
        const status = response?.data?.C_STATUS || response?.data?.status;
        if (status !== "SUCCESS") {
            throw new Error(
                response?.data?.C_MESSAGE ||
                response?.data?.message ||
                "Unable to link the saved form to this process start.",
            );
        }
        return response?.data?.C_DATA?.[0]?.formData || fieldsData;
    }

    // api calls bpm-service
    function startProcessInstance(businessKey, taskVariables, processKey) {
        let path = "";

        if (tenantId === "") {
            path = `/process-definition/key/${processKey}/start`;
        } else {
            path = `/process-definition/key/${processKey}/tenant-id/${tenantId}/start`;
        }
        let variables = taskVariables ? { ...taskVariables } : camundaVars;
        variables["requestor"] = {
            value: appContext?.profile?.username,
            type: "string",
        };

        const dataRequest = {
            path,
            method: "POST",
            data: {
                // businessKey: "test",
                businessKey: businessKey,
                variables: variables,
            },
        };
        return axios.post(BPM_API_URL + "?service.key=bpm.data", dataRequest);
    }

    function buildStartVariables(taskVariables) {
        const variables = taskVariables
            ? { ...taskVariables }
            : { ...camundaVars };
        variables.requestor = {
            value: appContext?.profile?.username,
            type: "string",
        };
        return variables;
    }

    function getErrorMessage(error) {
        return (
            error?.response?.data?.C_MESSAGE ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to start the process."
        );
    }

    function normalizeDraft(draft) {
        return {
            ...draft,
            process_variables:
                typeof draft?.process_variables === "string"
                    ? draft.process_variables
                    : JSON.stringify(draft?.process_variables || {}),
            retry_count: Number(draft?.retry_count || 0),
        };
    }

    async function saveDraft(draft, changes) {
        const nextDraft = normalizeDraft({ ...draft, ...changes });
        const draftId = nextDraft.id || "new";
        const fields = {
            id: nextDraft.id,
            process_definition_id: nextDraft.process_definition_id,
            process_key: nextDraft.process_key,
            form_key: nextDraft.form_key,
            form_table: nextDraft.form_table,
            form_record_id: nextDraft.form_record_id,
            business_key: nextDraft.business_key,
            process_variables: nextDraft.process_variables,
            status: nextDraft.status,
            last_error: nextDraft.last_error || "",
            retry_count: nextDraft.retry_count,
            requester:
                nextDraft.requester || appContext?.profile?.username || "",
        };
        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            {
                data: [
                    {
                        formId: "process_start_draft",
                        entity: "process_start_draft",
                        action: "update",
                        id: draftId,
                        fileData: [],
                        formData: Object.fromEntries(
                            Object.entries(fields).filter(
                                ([, value]) => value !== undefined,
                            ),
                        ),
                    },
                ],
            },
        );
        const status = response?.data?.C_STATUS || response?.data?.status;
        if (status !== "SUCCESS") {
            throw new Error(
                response?.data?.C_MESSAGE ||
                response?.data?.message ||
                "Unable to save the pending process start.",
            );
        }
        const saved = response?.data?.C_DATA?.[0]?.formData || {};
        const savedDraft = normalizeDraft({
            ...nextDraft,
            ...saved,
            id: saved?.id || nextDraft.id,
        });
        if (!savedDraft.id) {
            throw new Error("Pending process start was saved without a draft id.");
        }
        return savedDraft;
    }

    async function processInstanceExists(draft) {
        const activeQuery = new URLSearchParams({
            businessKey: draft.business_key,
            processDefinitionKey: draft.process_key,
            active: "true",
        });
        if (tenantId) activeQuery.set("tenantIdIn", tenantId);
        else activeQuery.set("withoutTenantId", "true");

        async function findInstances(path) {
            const response = await axios.post(
                BPM_API_URL + "?service.key=bpm.data",
                { path, method: "GET" },
            );
            const status = response?.data?.C_STATUS || response?.data?.status;
            if (status && status !== "SUCCESS") {
                throw new Error(
                    response?.data?.C_MESSAGE ||
                    response?.data?.message ||
                    "Unable to confirm whether this process was already started.",
                );
            }
            const payload = response?.data || {};
            return [
                payload?.C_DATA?.processInstances,
                payload?.C_DATA,
                payload?.data?.processInstances,
                payload?.data,
                payload,
            ].find(Array.isArray) || [];
        }

        if (
            (await findInstances(
                `/process-instance?${activeQuery.toString()}`,
            )).length > 0
        ) {
            return true;
        }

        const historicQuery = new URLSearchParams({
            processDefinitionKey: draft.process_key,
            processInstanceBusinessKey: draft.business_key,
        });
        if (tenantId) historicQuery.set("tenantIdIn", tenantId);
        else historicQuery.set("processDefinitionWithoutTenantId", "true");

        return (
            (
                await findInstances(
                    `/history/process-instance?${historicQuery.toString()}`,
                )
            ).length > 0
        );
    }

    async function completeStartedDraft(draft) {
        try {
            const completedDraft = await saveDraft(draft, {
                status: "STARTED",
                last_error: "",
            });
            setActiveDraft(completedDraft);
            onDraftChange?.(completedDraft);
            handleProcessActions(actions.complete, "process");
            toastEmitter(
                action.deploy_msg || "Process started successfully.",
                true,
                "success",
            );
            return true;
        } catch (error) {
            const message =
                "The process started, but its completion status still needs to be saved.";
            console.error(error);
            setActiveDraft(draft);
            setStartNotice({
                type: "warning",
                message,
                requiresCompletionSave: true,
            });
            onDraftChange?.(draft);
            toastEmitter(message, true, "warning");
            return false;
        }
    }

    async function attemptStart(draft, variables, checkExisting) {
        try {
            if (checkExisting && (await processInstanceExists(draft))) {
                return await completeStartedDraft(draft);
            }

            const response = await startProcessInstance(
                draft.business_key,
                variables,
                draft.process_key,
            );
            const status = response?.data?.C_STATUS || response?.data?.status;
            if (status === "SUCCESS") {
                return await completeStartedDraft(draft);
            }
            throw new Error(
                response?.data?.C_MESSAGE ||
                    response?.data?.message ||
                    "Failed to start the process.",
            );
        } catch (error) {
            const message = getErrorMessage(error);
            const pendingDraft = await saveDraft(draft, {
                status: "PENDING_ENGINE",
                last_error: message,
                retry_count: Number(draft.retry_count || 0) + 1,
                process_variables:
                    typeof variables === "string"
                        ? variables
                        : JSON.stringify(variables || {}),
            });
            setActiveDraft(pendingDraft);
            onDraftChange?.(pendingDraft);
            setStartNotice({ type: "warning", message, canRetry: true });
            toastEmitter(message, true, "error");
            return false;
        }
    }

    async function retryPendingStart() {
        if (!activeDraft || isStarting || startLockRef.current) return;

        startLockRef.current = true;
        setIsStarting(true);
        setStartNotice(null);
        try {
            const variables =
                typeof activeDraft.process_variables === "string"
                    ? JSON.parse(activeDraft.process_variables || "{}")
                    : activeDraft.process_variables || {};
            const startingDraft = await saveDraft(activeDraft, {
                status: "STARTING",
                last_error: "",
            });
            setActiveDraft(startingDraft);
            onDraftChange?.(startingDraft);
            await attemptStart(startingDraft, variables, true);
        } catch (error) {
            const message = getErrorMessage(error);
            setStartNotice({ type: "danger", message });
            toastEmitter(message, true, "error");
        } finally {
            startLockRef.current = false;
            setIsStarting(false);
        }
    }

    function returnToInbox() {
        handleProcessActions(actions.draft, "process");
    }

    return (
        <div className="">
            {!processId ? (
                "Loading..."
            ) : (
                <ErrorBoundary render={Error}>
                    <>
                        <div className="process-task-title">
                            {formDetails && formDetails.title}
                        </div>
                        {startNotice && (
                            <div className={`alert alert-${startNotice.type} d-flex flex-wrap align-items-center gap-2`}>
                                <span className="me-auto">{startNotice.message}</span>
                                {startNotice.canRetry && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-warning"
                                        disabled={isStarting}
                                        onClick={retryPendingStart}>
                                        {isStarting ? "Retrying…" : "Retry now"}
                                    </button>
                                )}
                                {startNotice.requiresCompletionSave && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        disabled={isStarting}
                                        onClick={() =>
                                            completeStartedDraft(activeDraft)
                                        }>
                                        Save completion
                                    </button>
                                )}
                                {activeDraft && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link"
                                        onClick={returnToInbox}>
                                        Back to inbox
                                    </button>
                                )}
                            </div>
                        )}
                        <ProcessFormViewer
                            formKey={formDetails.form_key}
                            businessKey={"new"}
                            handleActions={handleActions}
                            submitLabel={"Start"}
                            processConfig={{
                                showActions: true,
                                allowComplete: true,
                                hideFormTitle: true,
                                showDraftButton: false,
                            }}
                            isInProcess={{
                                showActions: true,
                                showDraftButton: true,
                                allowComplete: false,
                            }}
                            mode={modeType.render}
                            processVariables={camundaVars}
                            formVars={formVars}></ProcessFormViewer>
                    </>
                </ErrorBoundary>
            )}
        </div>
    );
}

function Error() {
    return <div>Error occurred in Start Step Processor.</div>;
}

export default StartStepProcessor;

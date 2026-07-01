import axios from "axios";
import { Interweave } from "interweave";
import { useState } from "react";
import ModalBox from "../../../../../components/Modal/Modal";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
// import StartStepProcessor from "../../../../camunda/cam8/StartStepProcessor8";
import StartStepProcessor from "../../../../camunda/cam7/StartStepProcessor7";
import FormDialog from "../custom-action-dialogs/FormDialog";
import ProcessFormModal from "../custom-action-dialogs/ProcessFormDialog";
import { getData as globalGetData } from "../../../../../components/CrudApiCall";
import { useContext } from "react";
import { AppContext } from "../../../../../../AppContext";
import { API_URL } from "../../../../../Config";
import { tryToParse } from "../../../../data-management/form-builder/Forms/FormViewer/utils";
import { evaluateExpression } from "../datalist-filter-helpers/DatalistFilters";

export default function RenderCustomActions({
    item = {},
    params = "",
    record = {},
    handleActions = () => {setShow(false)},
    i = 0,
    getData,
    selectedItem,
    setFormAndModalConfig,
    moveAsideForm,
    page,
}) {
    let initial = {
        show: false,
        item: {
            url: "",
            target: "",
            id: "",
        },
        message: "",
    };
    const [showCustomAction, setShowCustomAction] = useState(initial);
    const appContext = useContext(AppContext);

    function replaceVariablesInUrl(url, record, appContext) {
        const matches = [...url.matchAll(/\[(.*?)\]/g)];

        let finalUrl = url;

        for (const match of matches) {
            const fullMatch = match[0]; // "[tenantSubscription.tenant_id]"
            const expr = match[1]; // "tenantSubscription.tenant_id"

            // Evaluate expression
            const value = evaluateExpression(
                { expression: expr },
                record,
                appContext?.channel,
                {},
                appContext?.profile,
                appContext?.isAuthorized,
                appContext?.tenantSubscription,
            );

            // Only replace if evaluation returned a value
            if (value !== undefined && value !== null) {
                finalUrl = finalUrl.replace(fullMatch, value);
            }
        }

        return finalUrl;
    }

    const [processModal, setProcessModal] = useState(false);
    const [processMsgModal, setProcessMsgModal] = useState({
        show: false,
        item: {},
        currentObj: {},
    });
    const [camundaVars, setCamundaVars] = useState({});
    const [formVars, setFormVars] = useState({});
    const [parentFormData, setParentFormData] = useState({});
    const [show, setShow] = useState(false);
    function navigateCustomURL(url, target) {
        window.open(url, target);
    }

    function navigationcustom(url, target, id, condition, modalrequired) {
        if (target !== "dialog") {
            if (condition === undefined && modalrequired) {
                setShowCustomAction(prev => ({
                    ...prev,
                    show: true,
                    item: {
                        url: url,
                        target: target,
                        id: id,
                    },
                    message: item.confirmation_message
                        ? item.confirmation_message
                        : "custom action",
                }));
            }
            if (!modalrequired) {
                // window.location.href = url;
                window.open(url, target);
                setShowCustomAction(initial);
                return false;
            } else {
                console.log("close");
            }
            if (
                (modalrequired === false || modalrequired === undefined) &&
                condition === undefined
            ) {
                window.open(url, target);
                setShowCustomAction(initial);
                return false;
            }
        } else {
            try {
                const id = item?.hyper_parameters.find(
                    item => item.parameter_name === "id",
                );
                getFormByFormKey(item.form);
            } catch (error) {
                console.log(error);
            }
            // let foreignKey = item.hyper_parameters[0];
            if (condition === undefined) {
                setShowCustomAction(prev => ({
                    ...prev,
                    show: true,
                    item: {
                        url: url,
                        target: target,
                        id: id,
                    },
                    message: item.confirmation_message
                        ? item.confirmation_message
                        : "custom action",
                }));
            }
            if (condition) {
                setShow(true);
                setShowCustomAction(initial);
            }
            if (
                (modalrequired === false || modalrequired === undefined) &&
                condition === undefined
            ) {
                setShowCustomAction(initial);
                setShow(true);
            }
        }
    }

    async function getFormByFormKey(key) {
        let keys, url, datasource, tenant_id;
        const { tenantSubscription } = appContext;
        tenant_id = tenantSubscription.tenant_id;
        datasource = "";
        url = API_URL + "?service.key=masterKey.tenantData";
        keys = [
            {
                params: key,
                dataKey: "data",
                serviceKey: "sys.form.formkey",
                mode: "formData",
            },
        ];
        let response = await globalGetData({
            keys,
            url,
            datasource,
            tenant_id,
        });
        let _form_datasource = response?.data?.C_DATA?.data[0].datasource;
        let tableName = response?.data?.C_DATA?.data[0].table;
        let useprefix = response?.data?.C_DATA?.data[0].useprefix;
        getSelectedRecordData(
            (datasource = _form_datasource),
            tenant_id,
            tableName,
            useprefix,
        );
    }
    async function getSelectedRecordData(...arr) {
        let datasource = arr[0],
            tenant_id = arr[1],
            table = arr[2],
            useprefix = arr[3];

        getSqlData(datasource, tenant_id, table, useprefix);
    }

    function getSqlData(datasource, tenant_id, table, useprefix) {
        let foreignKey, value, name, obj, url, _table;
        _table = useprefix === "YES" ? "app_fd_" + table : table;
        foreignKey = item.hyper_parameters.find(
            item => item.parameter_name === "id",
        );
        if (foreignKey) {
            value = record[foreignKey.column_name];
            name = foreignKey.parameter_name;
        }else{
            return;
        }

        obj = {
            datasource: datasource,
            tenant_id: tenant_id,
            query: `select * from ${_table} ${
                name ? `where ${name}='${value}'` : ""
            }`,
        };
        url = API_URL + "?service.key=bi.data&mode=formData";

        axios.post(url, obj).then(res => {
            if (res?.data?.C_DATA) {
                const obj = res?.data?.C_DATA[0];
                setParentFormData(obj);
            }
        });
    }

    function sendPostRequest(item, record) {
        try {
            debugger;
            let { method, post_url, hyper_parameters, post_json, api_service } =
                item;

            post_json = tryToParse(post_json);

            if (api_service === "APPSERVICE") {
                post_json.data.forEach(data => {
                    data.formData =
                        post_json && typeof data === "string"
                            ? JSON.parse(data.formData)
                            : data.formData;
                    // post_json.data[0].entity = item.entity;
                    // post_json.data[0].formId = item.entity;
                    // post_json.datasource = item.datasource;
                    hyper_parameters.forEach(parameter => {
                        let parameter_name = parameter.parameter_name;
                        let column_name = parameter.column_name;

                        if (
                            parameter.parameter_name == "id" &&
                            data.formData["id"] === "new"
                        ) {
                            data.formData["id"] = "new";
                            data.id = "new";
                        } else if (
                            parameter.parameter_name == "id" &&
                            data.formData["id"] === "id"
                        ) {
                            data.formData["id"] = record[parameter.column_name];
                        } else if (
                            parameter.parameter_name !== "id" &&
                            data.formData[parameter.parameter_name]
                        ) {
                            data.formData[parameter.parameter_name] =
                                record[parameter.column_name];
                            // if (parameter.column_name == "id") {
                            //     data.id = record[parameter.column_name];
                            // }
                        }
                        if (
                            parameter.parameter_name == "id" &&
                            data["id"] === "id"
                        ) {
                            data.id = record[parameter.column_name];
                        }
                    });
                });
                axios.post(post_url, post_json).then(response => {
                    if (response) {
                        method === "delete"
                            ? toastEmitter("Record Deleted Successfully", true)
                            : toastEmitter(
                                  `Record ${
                                      method === "update" ? "Updated" : "Save"
                                  } Successfully`,
                                  true,
                              );
                        if (item.allow_refresh) {
                            getData(selectedItem.form_id, selectedItem.id);
                        }
                    }
                });
            } else if (api_service === "EXTERNAL") {
                //post_url += `/${record.id}`;

                hyper_parameters.forEach(parameter => {
                    if (post_url.includes(parameter.parameter_name)) {
                        post_url = post_url.replaceAll(
                            `{${parameter.parameter_name}}`,
                            `${record[parameter.column_name]}`,
                        );
                    }
                    if (
                        method === "post" ||
                        method === "put" ||
                        method === "patch"
                    ) {
                        post_json[parameter.parameter_name] =
                            record[parameter.column_name];
                        // post_json["id"] = "new";
                    } else {
                        post_json.id = record[parameter.column_name];
                    }
                });

                axios[method](post_url, post_json)
                    .then(response => {
                        if (response) {
                            // method === "delete"
                            //     ? toastEmitter(
                            //           "Record Deleted Successfully",
                            //           true,
                            //       )
                            //     : toastEmitter(
                            //           `${
                            //               response?.data?.C_MESSAGE
                            //           }`,
                            //           true,
                            //       );
                            if (item.allow_refresh) {
                                getData(selectedItem.form_id, selectedItem.id);
                            }
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        toastEmitter(error.message, true, "error");
                    });
            }
        } catch (error) {
            toastEmitter(error, true, "error");
        }
    }

    function startProcessInstance(item, currentObj, condition) {
        if (condition === undefined) {
            setProcessMsgModal(prev => ({
                ...prev,
                show: true,
                item: item,
                currentObj: currentObj,
            }));
        }
        if (condition === true) {
            const { process_id } = item;
            // const string = JSON.stringify(item);
            const string = params.replaceAll("?", "&");
            //EXTERNAL
            if (item.link_type === "URL") {
                window.open(
                    `start-process?processId=${process_id}&data=${encodeURIComponent(
                        string,
                    )}`,
                    "_current",
                    "width=700,height=700",
                );
                return false;
            }
            //INTERNAL
            if (item.link_type === "PROCESS") {
                setProcessModal(true);
                let obj = {};
                item.hyper_parameters.forEach(item => {
                    if (item.type && item.type == "static") {
                        obj[item.parameter_name] = item.column_name;
                    } else {
                        obj[item.parameter_name] = currentObj[item.column_name];
                    }
                });
                let objKeys = Object.keys(obj);
                let formVarsTemp = {};
                // prepare form vars to pass process form
                objKeys.forEach(key => {
                    formVarsTemp[key] = obj[key];
                });
                setFormVars(formVarsTemp);
            }
            setProcessMsgModal(prev => ({
                ...prev,
                show: false,
                item: {},
                currentObj: {},
            }));
        }
    }

    function handleExternalDatalist(openIn) {
        let obj = {};
        let ecodeData = "";
        if (item && item.hyper_parameters && item.hyper_parameters.length > 0) {
            item.hyper_parameters.forEach(item => {
                obj[item.parameter_name] = record[item.column_name];
            });
            let fkColumn = Object.keys(obj)[0];
            let fkValue = Object.values(obj)[0];
            ecodeData = encodeURIComponent(
                `${
                    (fkColumn && `fkColumn=${fkColumn}`,
                    fkColumn && `,fkValue=${fkValue}`)
                }`,
            );
        }
        const hyper_link = item.hyper_link ? item.hyper_link : "";
        navigationcustom(
            hyper_link +
                `/app/datalist/:id=${item.datalist_id}${
                    ecodeData ? `?${ecodeData}` : ""
                }`,
            openIn,
            undefined,
            undefined,
            item.enable_modal,
        );
    }

    function sideForm(item, params, type) {
        if (setFormAndModalConfig) {
            setFormAndModalConfig(pre => ({
                ...pre,
                form: item.form,
                formVars: formVars,
                formId: record.id,
                type: type,
                aside_position: item.aside_position,
                datalist_aside_width: item.datalist_aside_width,
            }));
        }
        moveAsideForm && moveAsideForm(item.aside_position);
    }
    return (
        <div className="s2a-custom-action">
            {/* link_type: {JSON.stringify(item.link_type)} /{" "}
            hyper_target: {JSON.stringify(item.hyper_target)} */}
            {/* {JSON.stringify(formVars)} */}
            {processModal && (
                <ProcessFormModal
                    show={processModal}
                    title={item.title}
                    close={setProcessModal}>
                    <StartStepProcessor
                        id={item.process_id}
                        handleProcessActions={processAction => {
                            setProcessModal(false);
                        }}
                        camundaVars={camundaVars}
                        businessKey = {formVars?.business_key||"new"}
                        formVars={formVars}
                        action={item}
                    />
                </ProcessFormModal>
            )}
            {showCustomAction && (
                <ModalBox
                    state={showCustomAction}
                    message={
                        item.confirmation_message
                            ? item.confirmation_message
                            : "custom action"
                    }
                    operation={navigationcustom}
                    header="Confirm"
                    setState={setShowCustomAction}
                    modalType="showCustomActionMsgModal"
                />
            )}
            {processMsgModal && (
                <ModalBox
                    state={processMsgModal}
                    message={
                        item.deploy_msg ? item.deploy_msg : "custom action"
                    }
                    operation={startProcessInstance}
                    header="Confirm"
                    setState={setProcessMsgModal}
                    modalType="processMsg"
                />
            )}
            {item.link_type === "POST" && (
                <div onClick={() => sendPostRequest(item, record)}>
                    <ShowAs show_as={item.show_as}>
                        <Interweave content={item.title}></Interweave>
                    </ShowAs>
                </div>
            )}
            {!item.hyper_target && item.link_type === "PROCESS" && (
                <div onClick={() => startProcessInstance(item, record)}>
                    {item && (
                        <ShowAs show_as={item.show_as}>
                            <Interweave content={item.title}></Interweave>
                        </ShowAs>
                    )}
                </div>
            )}
            {item.hyper_target === "current_window" && (
                <>
                    {item.link_type === "URL" && (
                        <div
                            onClick={event => {
                                event.preventDefault();
                                let _url = replaceVariablesInUrl(item.hyper_link, record, appContext);

                                if (!_url) {
                                    _url = item.hyper_link;
                                }

                                navigationcustom(
                                    _url + params,
                                    "_self",
                                    undefined,
                                    undefined,
                                    item.enable_modal,
                                );
                            }}>
                            <ShowAs show_as={item.show_as}>
                                <Interweave content={item.title}></Interweave>
                            </ShowAs>
                        </div>
                    )}
                    {item.link_type === "FORM" && (
                        <div
                            onClick={event => {
                                event.preventDefault();
                                let _url = replaceVariablesInUrl(item.hyper_link, record, appContext);
                                navigationcustom(
                                    _url
                                        ? _url + params
                                        : "" +
                                              `/app/page-form-viewer?formKey=${item.form}&external=true` +
                                              params.replaceAll("?", "&"),
                                    "_self",
                                    undefined,
                                    undefined,
                                    item.enable_modal,
                                );
                            }}>
                            <ShowAs show_as={item.show_as}>
                                <Interweave content={item.title}></Interweave>
                            </ShowAs>
                        </div>
                    )}
                    {item.link_type === "PROCESS" && (
                        <div onClick={() => startProcessInstance(item, record)}>
                            {item && (
                                <ShowAs show_as={item.show_as}>
                                    <Interweave
                                        content={item.title}></Interweave>
                                </ShowAs>
                            )}
                        </div>
                    )}
                    {item.link_type === "DATALIST" && (
                        <div onClick={() => handleExternalDatalist("_self")}>
                            {item && (
                                <ShowAs show_as={item.show_as}>
                                    <Interweave
                                        content={item.title}></Interweave>
                                </ShowAs>
                            )}
                        </div>
                    )}
                </>
            )}
            {item.hyper_target === "new_window" && (
                <>
                    {item.link_type === "URL" && (
                        <div
                            onClick={event => {
                                event.preventDefault();
                                let _url = replaceVariablesInUrl(item.hyper_link, record, appContext);
                                
                                // else{
                                //     _url = evaluateExpression(
                                //         { expression: _url },
                                //         record,
                                //     );
                                // }

                                navigationcustom(
                                    _url + params,
                                    "_blank",
                                    undefined,
                                    undefined,
                                    item.enable_modal,
                                );
                                return false;
                            }}>
                            <ShowAs show_as={item.show_as}>
                                <Interweave content={item.title}></Interweave>
                            </ShowAs>
                        </div>
                    )}
                    {item.link_type === "FORM" && (
                        <div
                            onClick={event => {
                                event.preventDefault();
                                let _url = replaceVariablesInUrl(item.hyper_link, record, appContext);
                                
                                navigationcustom(
                                    _url
                                        ? _url + params
                                        : "" +
                                              `/app/page-form-viewer?formKey=${item.form}&external=true` +
                                              params.replaceAll("?", "&"),
                                    "_blank",
                                    false,
                                    false,
                                    item.enable_modal,
                                );
                            }}>
                            <ShowAs show_as={item.show_as}>
                                <Interweave content={item.title}></Interweave>
                            </ShowAs>
                        </div>
                    )}
                    {item.link_type === "DATALIST" && (
                        <div onClick={() => handleExternalDatalist("_blank")}>
                            {item && (
                                <ShowAs show_as={item.show_as}>
                                    <Interweave
                                        content={item.title}></Interweave>
                                </ShowAs>
                            )}
                        </div>
                    )}
                </>
            )}
            {item.hyper_target === "dialog" && (
                <>
                    {item.link_type === "FORM" && (
                        <>
                            <div
                                onClick={event => {
                                    event.preventDefault();
                                    let _url = replaceVariablesInUrl(item.hyper_link, record, appContext);
                                
                                    //Hold
                                    navigationcustom(
                                        _url + params,
                                        "dialog",
                                        `#abc${i}`,
                                        undefined,
                                        item.enable_modal,
                                    );
                                }}>
                                <ShowAs show_as={item.show_as}>
                                    <Interweave
                                        content={item.title}></Interweave>
                                </ShowAs>
                            </div>

                            {show && (
                                <FormDialog
                                    item={item}
                                    record={record}
                                    handleActions={handleActions}
                                    show={show}
                                    setShow={setShow}
                                    parentFormData={parentFormData}
                                    params={params}
                                />
                            )}
                        </>
                    )}
                    {item.link_type === "PROCESS" && (
                        <>
                            <div
                                onClick={() =>
                                    startProcessInstance(item, record, true)
                                }>
                                {" "}
                                {item && (
                                    <ShowAs show_as={item.show_as}>
                                        <Interweave
                                            content={item.title}></Interweave>
                                    </ShowAs>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
            {item.hyper_target === "aside" && (
                <div onClick={() => sideForm(item, params, "aside")}>
                    <ShowAs show_as={item.show_as}>
                        <Interweave content={item.title}></Interweave>
                    </ShowAs>
                </div>
            )}
            {item.hyper_target === "switch" && (
                <div onClick={() => sideForm(item, "switch")}>
                    <ShowAs show_as={item.show_as}>
                        <Interweave content={item.title}></Interweave>
                    </ShowAs>
                </div>
            )}
        </div>
    );
}

function ShowAs({ children, show_as }) {
    const className =
        show_as == "button" ? "button-theme s2a-custom-action-btn" : "s2a-link";

    return (
        <>
            <div className={className}>{children}</div>
        </>
    );
}

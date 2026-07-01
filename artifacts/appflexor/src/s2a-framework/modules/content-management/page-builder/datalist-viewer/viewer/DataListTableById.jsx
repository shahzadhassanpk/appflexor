import axios from "axios";
import { Interweave } from "interweave";
import moment from "moment";
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import Modal from "react-bootstrap/Modal";
import { AppContext } from "../../../../../../AppContext";
import { API_URL, DATE_TIME_FORMAT_FOR_USER_VIEW } from "../../../../../Config";
import { getData } from "../../../../../components/CrudApiCall";
import ModalComponent from "../../../../../components/Modal/Modal";
import Messsage from "../../../../../components/Subscription Message/Messsage";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import useKeyboardShortcut from "../../../../../utils/useKeyboardShortcut";
import { DEFAULTACTIONSOBJECT } from "../../../../data-management/datalist-builder/datalist-designer/DefaultActions";
import {
    checkMultiPageValidation,
    checkValidation,
    evalDefault,
    formatDateTimeForDataBase,
    getObjectSchemeForValidation,
    isEmpty,
    tryParseJSONObject,
    tryToParse,
} from "../../../../data-management/form-builder/Forms/FormViewer/utils";
import ImportModal from "../custom-action-dialogs/ImportModal";
import RenderCustomActions from "../custom-actions-renderer/RenderCustomActions";
import {
    GlobalFilter,
    datalistDataTypes,
    evaluateExpression,
    evaluateExpressionDefault,
    multiDelete,
} from "../datalist-filter-helpers/DatalistFilters";
import {
    CSVToJSON,
    checkArray,
    defaultActionEval,
    returnParams,
} from "../datalist-helper/DatalistHelpers";
import FormViewerWrap from "./FormViewerWrap";
import ReactTable from "./ReactTable";
import { eventBus } from "../../../../../eventBus";

const formAction = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};
import EditableGrid from "./components/EditableGrid";
import DateRange from "../../../../../components/DateRange";
import { SqlServiceParams } from "./context/SqlServiceParams";
import TextField from "../../../../../components/Textfield";
import useInput from "../../../../../hooks/useInput";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import DynamicCheckBoxs from "../../../../../components/dynamic-checkbox/Checkbox";
import DynamicRadio from "../../../../../components/dynamic-radio/radio";
import useGlobalData from "../../../../../components/useGlobal";

export default function DataListTableById(props) {
    const appContext = useContext(AppContext);
    const {
        selectedItem,
        selectedForm,
        fkColumn = "",
        fkValue = "",
        mode,
        modeType,
        hideLabel,
        hideFormDatalistLabel,
        dataKey = "",
        setDataKeys,
        tenantIdMain = "",
        serviceParams = "",
    } = props;
    const [dbData, setDbData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    // const [tenantId, setTenantId] = useState(tenantIdMain);
    const [selectedRowsLength, setSelectedRowsLength] = useState(0);
    const [viewerBtn, setViewerBtn] = useState({
        refresh: false,
        import: false,
        export: false,
        reset: false,
        showRefresh: false,
        showExport: false,
        showImport: false,
        showReset: false,
        flag: {},
    });
    // let _formComponent;
    const [formComponets, setFormComponets] = useState();
    const [selectedObject, setSelectedObject] = useState({});
    const [filter, setFilter] = useState({});
    const formDetails = useRef(null);
    const processDetail = useRef(null);
    const [flag, setFlag] = useState({
        add: false,
        search: false,
        export: false,
        pagination: false,
        refresh: false,
        defaultpage: selectedItem.defaultpage,
        showForm: false,
        deleteAll: false,
    });
    const [addAction, setAddAction] = useState({});
    const [editModalSize, setEditModalSize] = useState("lg");
    const [allowId, setAllowId] = useState("");
    const [allowChecked, setAllowChecked] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    const [delModal, setDelModal] = useState({
        show: false,
        item: {},
        message: "",
    });
    const [delAllModal, setDellAllModal] = useState({
        show: false,
        item: {},
    });
    const [editModal, setEditModal] = useState({
        show: false,
        item: {},
    });
    const inputReference = useRef(null);

    const [formAndModalConfig, setFormAndModalConfig] = useState({
        form: "",
        formId: "",
        formVars: {},
        type: "",
        show: false,
        datalist_aside_width: undefined,
        mode: undefined,
    });
    // (select,radio,checklist) form fields to make option for filters
    const [formDataForFilter, setFormDataForFilter] = useState({
        fields: {},
        response: {},
    });
    const [formData, setFormData] = useState({});
    const [currentAction, setCurrentAction] = useState({});
    const jsFunctions = { current_window: true, new_window: true };
    const userFunctions = { aside: true, switch: true };
    const replaceFunction = {
        current_window: "_self",
        new_window: "_blank",
    };
    const asideFormRef = useRef(null);

    const selectedFormId = selectedForm && selectedForm?.id;
    const [formFetch, setFormFetch] = useState(false);
    const featuresSubscription = appContext?.featuresSubscription;
    const [sqlServiceParams, setSqlServiceParams] = useState({});
    // const show = SubscriptionAllowViewer(
    //     "DATALIST_BUILDER",
    //     featuresSubscription,
    // );
    const show = true;

    const tableData = React.useMemo(() => {
        let _data = dataFormat(
            formDataForFilter?.response,
            formDataForFilter?.fields,
            selectedItem,
        );
        return _data;
    }, [formFetch]);

    const actions = React.useMemo(() => actionFormat(selectedItem), [mode]);
    let finalColumns = [];
    let dataColumns = {
        Header: () => null,
        Footer: () => null,
        isVisible: false,
        hideHeader: false,
        id: "Table Data",
        columns: tableData,
    };
    let actionColumns = {
        Header: () => null,
        Footer: () => null,
        isVisible: false,
        hideHeader: false,
        id: "Action",
        sticky: "right",
        columns: actions,
    };
    let tableColumns = [];
    tableColumns = [...finalColumns, dataColumns, actionColumns];
    useEffect(() => {
        getDatalistData(selectedItem?.form_id, undefined);
    }, [props.fkValue]);

    useEffect(() => {
        eventBus.on("update", data => {
            if (data !== selectedItem.id) {
                if (selectedItem?.type === "FORM") {
                    getDatalistData(selectedItem?.form_id, undefined);
                } else if (selectedItem?.type === "SQL") {
                    getDatalistData(undefined, selectedItem.id);
                }
            }
        });
        return () => eventBus.off("update");
    }, []);

    // useEffect(() => {
    //     if (!tenantIdMain || tenantIdMain === "") {
    //         setTenantId(appContext.tenantSubscription.datasource);
    //     }
    // }, [tenantIdMain]);

    useEffect(() => {
        if (flag && selectedItem && dbData?.length > 0) {
            let editAction = getAction(flag.actions, "edit");
            if (editAction?.hyper_target == "aside") {
                if (!selectedObject?.id) {
                    handleEdit(dbData[0], true, editAction);
                    setSelectedObject(dbData[0]);
                } else {
                    handleEdit(selectedObject, true, editAction);
                }
            }
        }
    }, [flag, dbData, selectedItem]);

    useEffect(() => {
        // debugger;
        // if (dbData && setDataKeys) {
        //     setDataKeys(prev => ({
        //         ...prev,
        //         [dataKey]: dbData,
        //     }));
        // }
        // console.log("**************** > "+JSON.stringify(dbData));
    }, [dbData]);

    useEffect(() => {
        if (show && !loaded) {
            if (selectedItem?.type === "FORM") {
                getDatalistData(selectedItem?.form_id, undefined);
            } else if (selectedItem?.type === "SQL") {
                getDatalistData(undefined, selectedItem.id);
            }
        }
    }, [selectedItem, filter]);

    useEffect(() => {
        if (selectedFormId && show) {
            makeFormComponents("FIRST-RENDER");
        }
    }, [selectedFormId]);

    useEffect(() => {
        if (show) {
            if (viewerBtn && viewerBtn.refresh === true) {
                refreshBtn();
                setViewerBtn(prev => ({
                    ...prev,
                    refresh: false,
                }));
            }
            if (viewerBtn && viewerBtn.export === true) {
                setViewerBtn(prev => ({
                    ...prev,
                    export: false,
                }));
            }
        }
    }, [viewerBtn]);

    useEffect(() => {
        if (formAndModalConfig.show === false && show) {
            setAllowId("");
            setAllowChecked(false);
            localStorage.removeItem("allowChecked");
        }
    }, [formAndModalConfig.show]);

    useKeyboardShortcut(
        ["Control", "/"],
        shortcutKeys => {
            inputReference.current.focus();
        },
        {
            overrideSystem: false,
            ignoreInputFields: false,
            repeatOnHold: false,
        },
    );

    const getParams = () => {
        let params = "";
        try {
            filter?.forEach((item, index) => {
                const key = item.id;
                let serviceParam = sqlServiceParams[key];
                if (!serviceParam) {
                    serviceParam = {
                        type: item.type,
                        value: item.default_value,
                    };
                }

                switch (serviceParam.type) {
                    case "DATE-RANGE": {
                        params += `${formatDateTimeForDataBase(
                            serviceParam?.start,
                        )},${formatDateTimeForDataBase(serviceParam?.end)},`;
                        break;
                    }
                    case "TEXT": {
                        params += `${serviceParam?.text},`;
                        break;
                    }
                    case "NUMBER": {
                        params += `${serviceParam?.text},`;
                        break;
                    }
                    case "SELECT": {
                        params += `${serviceParam?.value},`;
                        break;
                    }
                    case "RADIO": {
                        params += `${serviceParam?.value},`;
                        break;
                    }
                    case "CHECKBOX": {
                        params += `${serviceParam?.values?.replaceAll(
                            ";",
                            ",",
                        )},`;
                        break;
                    }
                }
            });
        } catch (e) {}
        return params;
    };

    async function getDatalistData(form_id, item_id) {
        setApiResponse("pending");
        let dataRequest = {};
        let fk_column =
            selectedItem.datasource === "" && fkColumn !== "id"
                ? fkColumn
                    ? selectedItem.useprefix == "YES"
                        ? `c_${fkColumn}`
                        : fkColumn
                    : ""
                : fkColumn
                ? fkColumn
                : "";

        if (selectedItem.type === "FORM") {
            if (fkColumn !== "" && fkValue !== "") {
                dataRequest = {
                    dataKeys: [
                        {
                            dataKey: "formData",
                            getFormBy: "id",
                            formId: selectedItem.form_id,
                            businessKey: "_all",
                            mode: "formData",
                            type: "", //form or sql
                            filterCondition: selectedItem.filter_condition,
                            fkColumn: fk_column,
                            fkValue,
                            serviceParams,
                        },
                    ],
                };
            } else {
                dataRequest = {
                    dataKeys: [
                        {
                            dataKey: "formData",
                            getFormBy: "id",
                            formId: selectedItem.form_id,
                            businessKey: "_all",
                            mode: "formData",
                            type: "", //form or sql
                            serviceParams,
                            filterCondition: selectedItem.filter_condition,
                        },
                    ],
                };
            }
        } else {
            if (fkColumn !== "" && fkValue !== "") {
                dataRequest.dataKeys = [
                    {
                        dataKey: "formData",
                        dataListId: selectedItem.id,
                        mode: "formData",
                        limit: "_all",
                        fkColumn:
                            selectedItem.useprefix == "YES"
                                ? `c_${fkColumn}`
                                : fkColumn,
                        fkValue,
                        serviceParams: getParams(),
                    },
                ];
            } else {
                if (fk_column && fkValue) {
                    dataRequest.dataKeys = [
                        {
                            dataKey: "formData",
                            dataListId: selectedItem.id,
                            mode: "formData",
                            limit: "_all",
                            fkColumn: fk_column,
                            fkValue,
                            serviceParams: getParams(),
                        },
                    ];
                } else {
                    dataRequest.dataKeys = [
                        {
                            dataKey: "formData",
                            dataListId: selectedItem.id,
                            mode: "formData",
                            limit: "_all",
                            serviceParams: getParams(),
                        },
                    ];
                }
            }
        }
        dataRequest.tenant_id = tenantId;
        if (selectedItem.type === "FORM") {
            dataRequest.datasource = selectedForm.datasource;
        } else if (selectedItem.type === "SQL") {
            dataRequest.datasource = selectedForm.datasource;
        } else {
            dataRequest.datasource = "";
        }

        let endPoint =
            selectedItem.type === "FORM"
                ? "?service.key=dataList.formData"
                : "?service.key=dataList.sqlData";
        axios
            .post(API_URL + endPoint, dataRequest)
            .then(response => {
                if (response.data === "" && selectedItem.type === "FORM") {
                    getDatalistData(form_id);
                } else if (
                    response.data === "" &&
                    selectedItem.type === "SQL"
                ) {
                    getDatalistData(null, item_id);
                }

                setLoaded(true);

                if (response.data.C_STATUS === "SUCCESS") {
                    setApiResponse("resolve");
                    if (response.data.C_DATA.formData) {
                        let dataArray = response.data.C_DATA.formData;
                        // Do not sort if orderbyfield is empty
                        if (
                            selectedItem.orderbyfield &&
                            selectedItem.orderbyfield != "" &&
                            selectedItem.orderby === "asc"
                        ) {
                            dataArray = dataArray.sort((a, b) => {
                                const valA = a?.[selectedItem.orderbyfield];
                                const valB = b?.[selectedItem.orderbyfield];

                                // Handle null/undefined
                                if (valA == null && valB == null) return 0;
                                if (valA == null) return -1;
                                if (valB == null) return 1;

                                // Number check
                                if (!isNaN(valA) && !isNaN(valB)) {
                                    return Number(valA) - Number(valB);
                                }

                                // Date check
                                const dateA = new Date(valA);
                                const dateB = new Date(valB);
                                if (!isNaN(dateA) && !isNaN(dateB)) {
                                    return dateA - dateB;
                                }

                                // Default: string comparison
                                return String(valA).localeCompare(
                                    String(valB),
                                    undefined,
                                    {
                                        numeric: true,
                                        sensitivity: "base",
                                    },
                                );
                            });
                        } else if (
                            selectedItem.orderby === "desc" &&
                            selectedItem.orderbyfield
                        ) {
                            dataArray = dataArray.sort((a, b) => {
                                const valA = a?.[selectedItem.orderbyfield];
                                const valB = b?.[selectedItem.orderbyfield];

                                // Handle null / undefined (nulls go last in DESC)
                                if (valA == null && valB == null) return 0;
                                if (valA == null) return 1;
                                if (valB == null) return -1;

                                // Number check
                                if (!isNaN(valA) && !isNaN(valB)) {
                                    return Number(valB) - Number(valA);
                                }

                                // Date check
                                const dateA = new Date(valA);
                                const dateB = new Date(valB);
                                if (!isNaN(dateA) && !isNaN(dateB)) {
                                    return dateB - dateA;
                                }

                                // Default: string comparison (DESC)
                                return String(valB).localeCompare(
                                    String(valA),
                                    undefined,
                                    {
                                        numeric: true,
                                        sensitivity: "base",
                                    },
                                );
                            });
                        } else {
                            // dataArray = dataArray.sort((a, b) => {
                            //     return (
                            //         a[selectedItem.orderbyfield] -
                            //         b[selectedItem.orderbyfield]
                            //     );
                            // });
                        }
                        // console.log("On fetch");
                        // console.log(dataArray);
                        setDbData(dataArray);
                        if (dataArray) {
                            setViewerBtn(pre => ({
                                ...pre,
                                listLength: dataArray.length,
                            }));
                        }
                    } else {
                        console.log(
                            `Either group data does not exists or SQL query returns no result.`,
                        );
                    }
                } else {
                    setApiResponse("failed");
                    setDbData([]);

                    setViewerBtn(pre => ({
                        ...pre,
                        listLength: 0,
                    }));
                    if (selectedItem?.filter_condition?.length > 0) {
                        toastEmitter(
                            "Please provide correct column in extra filter",
                            true,
                            "error",
                        );
                    }
                }
            })
            .catch(error => {
                console.error("getDatalistData:" + error);
                // toastEmitter(error, true, "error");
            });
        //shahzad

        var parsedServiceParams;
        try {
            parsedServiceParams = tryParseJSONObject(
                selectedItem.serviceparams,
                selectedItem.serviceparams,
            );
        } catch (error) {
            console.log(error);
        }
        var formFields = {};
        if (selectedItem.form_id) {
            var components = makeFormComponents();
            const requiredFilterTypes = [
                "checklist",
                "radio",
                "select",
                "checkbox",
            ];
            for (let key in components) {
                if (requiredFilterTypes.includes(components[key].type))
                    if (components[key].type === "checkbox") {
                        const field = {};

                        field.id = key;
                        field.data = components[key].data;
                        field.optionType = "static";

                        formFields[key] = field;
                    } else if (components[key].data.use_static === "YES") {
                        const options = tryToParse(
                            components[key].props[0].options,
                        );
                        const field = {};

                        field.id = key;
                        field.options = options;
                        field.data = components[key].data;
                        field.optionType = "static";

                        formFields[key] = field;
                    } else {
                        const field = {};

                        field.id = key;
                        field.data = components[key].data;
                        field.optionType = "dynamic";

                        formFields[key] = field;
                    }
            }
        }

        if (formFields && !isEmpty(formFields)) {
            const keys = [],
                url = API_URL + "?service.key=tenant.data",
                datasource = "",
                tenant_id = tenantId;
            getKeysForAllField(formFields, keys);
            const filterData = {};

            if (keys && keys.length > 0) {
                for (const key of keys) {
                    const res = await getData({
                        url,
                        keys: [key],
                        datasource: key.datasource,
                        tenant_id,
                    });
                    let keyData = res.data.C_DATA[key.dataKey];
                    filterData[key.dataKey] = keyData;
                }
            }
            setFormDataForFilter({
                ...formDataForFilter,
                fields: formFields,
                response: filterData,
            });
        }
        setFormFetch(true);
    }

    function getKeysForAllField(formFields, keys) {
        for (let key in formFields) {
            if (formFields[key].optionType === "dynamic") {
                const data = formFields[key].data;

                let obj = {
                    params: "",
                    dataKey: key,
                    datasource: data?.datasource ?? "",
                    serviceKey: data.serviceKey,
                    mode: "formData",
                };
                if (obj.serviceKey) keys.push(obj);
            }
        }
        return keys;
    }

    function makeFormComponents(condition) {
        let components;
        let updateComponents = {};
        const exludeComponents = ["datalist", "daterange"];
        if (selectedForm.enable_multipage === "YES") {
            const multi_forms = tryToParse(selectedForm.multipage_design);
            for (let single_form of multi_forms) {
                for (let key in single_form?.design?.components) {
                    if (
                        !exludeComponents.includes(
                            single_form.design.components[key].type,
                        )
                    ) {
                        updateComponents[key] =
                            single_form.design.components[key];
                    }
                }
            }
        } else {
            components =
                selectedForm &&
                selectedForm.design &&
                selectedForm.design.components;

            for (let key in components) {
                if (!exludeComponents.includes(components[key].type)) {
                    updateComponents[key] = components[key];
                }
            }
        }
        if (!isEmpty(updateComponents)) {
            if (condition === "FIRST-RENDER") {
                setFormComponets(updateComponents);
            } else if (!condition) return updateComponents;

            // make initial state form data for grid
            const formData = { id: "new" };
            for (let key in updateComponents) {
                const fieldConfig = updateComponents[key];
                const data = fieldConfig?.data;
                const db_column = data?.db_column;
                // default value
                let value = data?.value ?? "";
                // expression value have high priorty than default value
                let expressionValue = evalDefault(value, fieldConfig.type);
                value = expressionValue;
                if (db_column) {
                    formData[db_column] = value;
                }
            }
            setFormData(formData);
        }
    }

    function handleListEdit(row) {
        let editAction = getAction(flag.actions, "edit");
        handleEdit(row.original, undefined, editAction);
    }

    function handleEdit(selectedRowItem, condition, edit) {
        setCurrentAction(edit);
        let readOnlyExp = edit?.readonly_expression;
        let readOnly =
            readOnlyExp &&
            evaluateExpression({ expression: readOnlyExp }, selectedRowItem);
        let formMode = readOnly ? modeType.readonly : "";
        let msg = edit?.confirmation_message;
        let required = edit?.required;
        let modalSize = edit?.modal_size;
        let hyper_target = edit?.hyper_target;
        let aside_position = edit?.aside_position;
        let datalist_aside_width = edit?.datalist_aside_width;
        const layout = tryToParse(selectedItem.layout);
        const actions = layout.actions;
        const editAction = actions.find(item => item.code == "edit");
        if (hyper_target === "dialog" || hyper_target === undefined) {
            setEditModalSize(modalSize);
            if (required) {
                if (condition === undefined) {
                    setEditModal({
                        show: true,
                        item: selectedRowItem,
                        message: msg,
                        required: required,
                    });
                }
                if (condition === true) {
                    setFormAndModalConfig(pre => ({
                        ...pre,
                        show: true,
                        mode: formMode,
                    }));
                    // setShowModal(true);
                    setSelectedObject(selectedRowItem);
                    setEditModal({
                        show: false,
                        item: {},
                        message: "",
                    });
                }
            } else {
                // setShowModal(true);
                setFormAndModalConfig(pre => ({
                    ...pre,
                    show: true,
                    mode: formMode,
                }));
                setSelectedObject(selectedRowItem);
            }
        } else if (jsFunctions[hyper_target]) {
            let url = `/app/page-form-viewer?formKey=${selectedItem.form_key}&businessKey=${selectedRowItem.id}&external=true`;
            window.open(url, replaceFunction[hyper_target]);
        } else if (userFunctions[hyper_target]) {
            setFormAndModalConfig(pre => ({
                ...pre,
                form: selectedItem.form_key,
                formId: selectedRowItem.id,
                type: hyper_target,
                aside_position: aside_position,
                datalist_aside_width: datalist_aside_width,
                mode: formMode,
            }));
            moveAsideForm(aside_position);
        }
    }

    function moveAsideForm(aside_position) {
        if (asideFormRef.current) {
            const asideMapping = {
                left: "",
                right: "",
                top: "nearest",
                bottom: "nearest",
            };
            const blockPosition = asideMapping[aside_position];
            if (blockPosition)
                setTimeout(() => {
                    asideFormRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: blockPosition,
                        inline: blockPosition,
                    });
                }, 200);
        }
    }

    function handleDelete(id, condition, item, index, row) {
        /* show dialog on delete not delete at first so condition
        is use to open dialog*/
        if (condition === undefined) {
            setDelModal(prev => ({
                ...prev,
                show: true,
                item: id,
                message:
                    (typeof item === "object" && item.confirmation_message) ||
                    "",
                deleteItem: item,
                index: index,
                data: row,
            }));
        }
        if (condition === true) {
            if (delModal.item === "new") {
                setDbData(prev =>
                    prev.filter((item, i) => i !== delModal.index),
                );
                setDelModal(prev => ({
                    ...prev,
                    show: false,
                    item: "id",
                    message: "",
                    deleteItem: "",
                    index: "",
                }));
                return;
            }
            let request = {
                datasource: selectedItem.datasource,
                usePrefix: selectedItem?.useprefix,
            };
            request.data = [];
            let entityForm = {};
            let pkField = "id";
            if (selectedItem.type === "FORM") {
                entityForm.formId = selectedForm?.table;
                entityForm.entity = selectedForm?.table;
                entityForm.action = "delete";
                entityForm.id = row.original[pkField];
            } else if (selectedItem.type === "SQL") {
                entityForm.formId = selectedForm.table;
                entityForm.entity = selectedForm.table;
                pkField = selectedItem.primary_key;
                entityForm.id = "";
                entityForm.action = "fk_delete";
                entityForm.fk_id = row.original[pkField];
                entityForm.fk_name = pkField;
            }
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        // clearFields()
                        // onChange();
                    }
                    selectedItem.type === "SQL"
                        ? getDatalistData(undefined, selectedItem.id)
                        : getDatalistData(selectedItem.form_id, undefined);
                    setDelModal(prev => ({
                        ...prev,
                        show: false,
                        item: {},
                    }));
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
    }

    function actionFormat(selectedItem) {
        if (mode === modeType.readonly) {
            return [];
        }
        try {
            let actions = [];
            let actionsTitle = {
                edit: "edit",
                delete: "delete",
                add: "add",
                export: "export",
                import: "import",
                search: "search",
                refresh: "refresh",
                pagination: "pagination",
                resetfilter: "resetfilter",
            };
            let actionCondition = {
                defaultpage: 10,
                selectedItem: selectedItem,
                formId: selectedItem.form_id,
                getAllData: getDatalistData,
                deleteAllData: setDellAllModal,
                titles: {},
            };

            if (selectedItem && selectedItem !== undefined) {
                var parseActions =
                    typeof selectedItem.layout === "string"
                        ? JSON.parse(selectedItem.layout)
                        : selectedItem.layout;

                let Actions = parseActions.actions;
                let actionKeyValue = {};
                let customActions = [];
                let includeActions = ["edit", "delete", "save"];
                Actions.forEach((item, index) => {
                    actionsTitle[item.code] = item.title;
                    if (
                        item.selected === true &&
                        includeActions.includes(item.code)
                    ) {
                        actionKeyValue[item.code] = item;
                    } else if (
                        item.selected === true &&
                        item.type === "custom"
                    ) {
                        customActions.push(item);
                    }
                });
                let obj1 = {
                    id: "allactions",
                    accessor: "allactions",
                    Cell: ({ cell }) => {
                        let data = cell.row.original;
                        return (
                            <div
                                key={data?.id}
                                className="datalist-actions-row">
                                {actionKeyValue &&
                                    actionKeyValue.edit &&
                                    actionKeyValue.edit.code === "edit" &&
                                    defaultActionEval(
                                        actionKeyValue.edit,
                                        data,
                                        appContext,
                                    ) && (
                                        <div
                                            className="datalist-actions-cell datalist-edit-font"
                                            title={
                                                actionKeyValue.edit.list_title
                                                    ? actionKeyValue.edit
                                                          .list_title
                                                    : "Edit"
                                            }
                                            onClick={() =>
                                                handleEdit(
                                                    cell.row.original,
                                                    undefined,
                                                    actionKeyValue.edit,
                                                )
                                            }>
                                            {/* <i className="fa-solid fa-pen-to-square"></i> */}
                                            <Interweave
                                                content={
                                                    actionKeyValue.edit.title
                                                }></Interweave>
                                        </div>
                                    )}

                                {actionKeyValue &&
                                actionKeyValue.delete &&
                                actionKeyValue.delete.code === "delete" &&
                                defaultActionEval(
                                    actionKeyValue.delete,
                                    data,
                                    appContext,
                                ) ? (
                                    <div
                                        className="datalist-actions-cell datalist-delete-font"
                                        title={
                                            actionKeyValue.delete.list_title
                                                ? actionKeyValue.delete
                                                      .list_title
                                                : "Delete"
                                        }
                                        onClick={() => {
                                            handleDelete(
                                                cell.row.original?.id,
                                                undefined,
                                                actionKeyValue.delete,
                                                cell.row.id,
                                                cell.row,
                                            );
                                        }}>
                                        {/* <i className="fa-solid fa-pen-to-square"></i> */}
                                        <Interweave
                                            content={
                                                actionKeyValue.delete.title
                                            }></Interweave>
                                    </div>
                                ) : (
                                    <></>
                                )}

                                {actionKeyValue &&
                                    actionKeyValue.save &&
                                    actionKeyValue.save.code === "save" &&
                                    (defaultActionEval(
                                        actionKeyValue.save,
                                        data,
                                        appContext,
                                    ) ? (
                                        <div
                                            className="datalist-actions-cell datalist-edit-font"
                                            title={
                                                actionKeyValue.save.list_title
                                                    ? actionKeyValue.save
                                                          .list_title
                                                    : "save"
                                            }
                                            onClick={() =>
                                                updateDbData(
                                                    cell.row.original,
                                                    cell,
                                                )
                                            }>
                                            {/* <i className="fa-regular fa-trash-can text-danger"></i> */}
                                            <Interweave
                                                content={
                                                    actionKeyValue.save.title
                                                }></Interweave>
                                        </div>
                                    ) : (
                                        <></>
                                    ))}
                                {/* <span>{JSON.stringify(customActions)}</span> */}
                                {customActions && customActions.length > 0 && (
                                    <div className="dropdown">
                                        <span
                                            type="button"
                                            className="dropdown-trigger fa-solid fa-ellipsis-vertical show-hide-button p-2"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"></span>
                                        <ul className="dropdown-menu">
                                            {customActions &&
                                                customActions.map((item, i) => {
                                                    let data =
                                                        cell.row.original;

                                                    let params = returnParams(
                                                        item,
                                                        cell.row.original,
                                                        appContext,
                                                    );

                                                    return (
                                                        <React.Fragment
                                                            key={item?.id}>
                                                            {item.visibility_expression ? (
                                                                checkExpression(
                                                                    item,
                                                                    cell,
                                                                    data,
                                                                ) && (
                                                                    <li className="dropdown-list-item">
                                                                        <div
                                                                            className="datalist-actions-cell datalist-custom-font dropdown-item"
                                                                            title={
                                                                                item.list_title
                                                                            }>
                                                                            <RenderCustomActions
                                                                                item={
                                                                                    item
                                                                                }
                                                                                params={
                                                                                    params
                                                                                }
                                                                                record={
                                                                                    cell
                                                                                        .row
                                                                                        .original
                                                                                }
                                                                                handleActions={
                                                                                    handleActions
                                                                                }
                                                                                i={
                                                                                    i
                                                                                }
                                                                                formDetails={
                                                                                    formDetails
                                                                                }
                                                                                processDetail={
                                                                                    processDetail
                                                                                }
                                                                                getData={
                                                                                    getDatalistData
                                                                                }
                                                                                selectedItem={
                                                                                    selectedItem
                                                                                }
                                                                                setFormAndModalConfig={
                                                                                    setFormAndModalConfig
                                                                                }
                                                                                moveAsideForm={
                                                                                    moveAsideForm
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </li>
                                                                )
                                                            ) : (
                                                                <li className="dropdown-list-item">
                                                                    <div
                                                                        className="datalist-actions-cell datalist-custom-font dropdown-item"
                                                                        title={
                                                                            item.list_title
                                                                        }>
                                                                        {item &&
                                                                            cell && (
                                                                                <RenderCustomActions
                                                                                    item={
                                                                                        item
                                                                                    }
                                                                                    params={
                                                                                        params
                                                                                    }
                                                                                    record={
                                                                                        cell
                                                                                            .row
                                                                                            .original
                                                                                    }
                                                                                    handleActions={
                                                                                        handleActions
                                                                                    }
                                                                                    i={
                                                                                        i
                                                                                    }
                                                                                    formDetails={
                                                                                        formDetails
                                                                                    }
                                                                                    processDetail={
                                                                                        processDetail
                                                                                    }
                                                                                    getData={
                                                                                        getDatalistData
                                                                                    }
                                                                                    selectedItem={
                                                                                        selectedItem
                                                                                    }
                                                                                    setFormAndModalConfig={
                                                                                        setFormAndModalConfig
                                                                                    }
                                                                                    moveAsideForm={
                                                                                        moveAsideForm
                                                                                    }
                                                                                />
                                                                            )}
                                                                    </div>
                                                                </li>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    },
                    className: `actions allactions`,
                };
                actions.push(obj1);

                Actions.forEach((item, i) => {
                    if (item.selected === true) {
                        if (DEFAULTACTIONSOBJECT[item.code]) {
                            // if(item.code === "pagination" && hidePagination)
                            actionCondition[item.code] = true;
                        }
                        if (item.code === "add") {
                            setAddAction(item);
                        }
                    }
                });
            }
            actionCondition.defaultpage = selectedItem.defaultpage
                ? parseInt(selectedItem.defaultpage)
                : actionCondition.defaultpage;
            actionCondition.titles = actionsTitle;
            actionCondition.Form = selectedForm;
            actionCondition.actions = parseActions?.actions;
            setFlag(actionCondition);

            setViewerBtn(prev => ({
                ...prev,
                showRefresh: actionCondition.refresh,
                showExport: actionCondition.export,
                showImport: actionCondition.import,
                showReset: actionCondition.resetfilter,
                flag: actionCondition,
            }));

            return actions;
        } catch (error) {
            // console.log(error);
        }
    }

    function checkExpression(item, cell, data) {
        try {
            return (
                evaluateExpression(
                    { expression: item.visibility_expression },
                    data,
                ) === true &&
                item &&
                cell
            );
        } catch (error) {}
        return false;
    }

    function dataFormat(selectFieldData, formFields, selectedItem) {
        const columns = [];
        const datalistType = ["TABLE", "EDITABLE-GRID", "", undefined];
        const dbGenerated = [
            "datecreated",
            "datemodified",
            "createdby",
            "modifiedby",
        ];
        const excludedTypes = [
            "datalist",
            // "daterange",
            "carousel",
            // "fileuploader",
        ];
        if (selectedItem) {
            try {
                let parseLayout =
                    typeof selectedItem.layout === "string"
                        ? JSON.parse(selectedItem.layout)
                        : selectedItem.layout;
                let SelectedFields = parseLayout.selected_fields;
                const includeFields = [
                    "createdby",
                    "modifiedby",
                    "datecreated",
                    "datemodified",
                ];
                if (datalistType.includes(selectedItem.datalist_type)) {
                    SelectedFields.forEach(column => {
                        // console.log(JSON.stringify(column));
                        if (column.selected === true) {
                            if (
                                datalistDataTypes[column.type]?.code &&
                                !includeFields.includes(column.db_column)
                            ) {
                                let obj = datalistDataTypes[
                                    column.type
                                ].operation(
                                    column,
                                    selectedItem,
                                    selectFieldData,
                                    formFields,
                                );
                                if (obj) columns.push(obj);
                            } else if (
                                includeFields.includes(column.db_column) &&
                                datalistDataTypes[column.type]?.code
                            ) {
                                let obj = datalistDataTypes[
                                    column.db_column
                                ].operation(
                                    column,
                                    selectedItem,
                                    selectFieldData,
                                    formFields,
                                );
                                if (obj) columns.push(obj);
                            } else {
                                if (
                                    column.type !== "datalist" &&
                                    // column.type !== "daterange" &&
                                    column.db_column &&
                                    datalistDataTypes[column.type]?.code
                                ) {
                                    let obj = datalistDataTypes[
                                        undefined
                                    ].operation(
                                        column,
                                        selectedItem,
                                        selectFieldData,
                                        formFields,
                                    );
                                    if (obj) columns.push(obj);
                                }
                            }
                        }
                    });
                } else {
                    SelectedFields.forEach(column => {
                        if (
                            column.selected === true &&
                            !excludedTypes.includes(column.type)
                        ) {
                            if (dbGenerated.includes(column.db_column)) {
                                let obj = datalistDataTypes[
                                    column.db_column
                                ].operation(
                                    column,
                                    selectedItem,
                                    selectFieldData,
                                    formFields,
                                );
                                if (obj) columns.push(obj);
                            } else if (
                                datalistDataTypes[column.type] &&
                                datalistDataTypes[column.type].code
                            ) {
                                let obj = datalistDataTypes[
                                    undefined
                                ].operation(
                                    column,
                                    selectedItem,
                                    selectFieldData,
                                    formFields,
                                );
                                if (obj) columns.push(obj);
                            } else {
                                let obj = {
                                    Header: column.label,
                                    Footer: () => null,
                                    datatype: column.type,
                                    accessor: column.db_column.toLowerCase(),
                                    className: `data ${column.db_column.toLowerCase()}`,
                                };
                                if (obj) columns.push(obj);
                            }
                        }
                    });
                }
            } catch (error) {
                // console.log(error);
            }
        }
        return columns;
    }

    function getAction(actions, code) {
        let action = {};
        actions?.forEach((item, index) => {
            if (item.code == code) {
                action = item;
            }
        });
        return action;
    }

    function handleAddNew(flag) {
        let action = getAction(flag.actions, "add");
        setCurrentAction(action);
        if (selectedItem.datalist_type === "TABLE") {
            if (
                addAction.hyper_target === "dialog" ||
                addAction.hyper_target === undefined
            ) {
                setFormAndModalConfig(pre => ({
                    ...pre,
                    show: true,
                }));
            } else if (jsFunctions[addAction.hyper_target]) {
                let url = `/app/page-form-viewer?formKey=${selectedItem.form_key}&businessKey=new&external=true`;
                window.open(url, replaceFunction[addAction.hyper_target]);
            } else if (userFunctions[addAction.hyper_target]) {
                setFormAndModalConfig(pre => ({
                    ...pre,
                    form: selectedItem.form_key,
                    formId: "",
                    type: addAction.hyper_target,
                    aside_position: addAction.aside_position,
                    datalist_aside_width: addAction.datalist_aside_width,
                }));
                moveAsideForm(addAction.aside_position);
            }
        } else {
            setDbData(prev => [...prev, formData]);
            toastEmitter("New Record Inserted", true);
        }
        setSelectedObject({});
    }

    function handleClose() {
        setFormAndModalConfig({
            form: "",
            formId: "",
            type: "",
            show: false,
            datalist_aside_width: undefined,
        });
    }

    function saveAndStay() {
        return;
    }

    async function handleActions(
        actionType,
        updatedObj,
        p3,
        p4,
        p5,
        modal,
        handleClose,
        formStatus,
        setFormData,
        form,
    ) {
        try {
            const layout = tryToParse(selectedItem.layout);
            const actions = layout.actions;
            const addAction = actions.find(item => item.code === "add");
            const editAction = actions.find(item => item.code === "edit");
            const formControls = {
                save_and_close: handleClose,
                undefined: handleClose,
                save_and_add: saveAndAddNew,
                save_and_next: saveAndNext,
                save_and_stay: saveAndStay,
            };
            const notCloseableActions = [
                "saveAndStay",
                "saveAndNext",
                "saveAndAddNew",
            ];
            // let operation = formControls[editAction?.form_control];
            let operation;
            if (selectedItem.type == "FORM") {
                updatedObj = await getSelectedItem(
                    updatedObj.id,
                    selectedItem,
                    formStatus,
                );
                if (formStatus === "add") {
                    operation = formControls[addAction?.form_control];
                    if (operation.name === "handleClose") {
                        const items = [...dbData];
                        items.push(updatedObj);
                        setDbData(items);
                    }
                    if (operation) operation(updatedObj, setFormData);
                }
                if (formStatus === "edit") {
                    operation = formControls[editAction?.form_control];
                    if (operation.name === "handleClose") {
                        let items = [...dbData];
                        setDbData(
                            items.map(item => {
                                if (item.id === updatedObj.id) {
                                    // Create a *new* object with changes
                                    return updatedObj;
                                } else {
                                    // No changes
                                    return item;
                                }
                            }),
                        );
                    }
                }
                getDatalistData(selectedItem.form_id, selectedItem.id);
            } else if (selectedItem.type == "SQL") {
                if (formStatus === "add") {
                    operation = formControls[addAction?.form_control];
                    if (operation.name === "handleClose") {
                        const items = [...dbData];
                        items.push(updatedObj);
                        setDbData(items);
                    }
                    if (operation) operation(updatedObj, setFormData);
                }
                if (formStatus === "edit") {
                    operation = formControls[editAction?.form_control];
                    if (operation.name === "handleClose") {
                        let items = [...dbData];
                        setDbData(
                            items.map(item => {
                                if (item.id === updatedObj.id) {
                                    // Create a *new* object with changes
                                    return updatedObj;
                                } else {
                                    // No changes
                                    return item;
                                }
                            }),
                        );
                    }
                }
                getDatalistData(selectedItem.form_id, selectedItem.id);
                // handleClose();
            }
            if (operation) operation(updatedObj);
            if (!notCloseableActions.includes(operation.name)) {
                const formClose = form.close_on_save;
                if (formClose) {
                    getDatalistData(selectedItem.form_id, selectedItem.id);
                    handleClose();
                }
            }
            // if (!notCloseableActions.includes(operation.name)) {
            //     handleClose();
            // }

            // if (modal && typeof modal === "object") {
            //     modal.setShow(false);
            // }
            toastEmitter("Record Saved", true);
        } catch (error) {
            // console.log(error);
        }
    }

    function getSelectedItem(id, selectedItem, status) {
        const query = makeQuery(selectedItem, id);
        const pg_end_point = API_URL + "?service.key=analytics.sqlData";
        const dataSource = selectedItem?.datasource;
        const url = pg_end_point + `&datasource=${dataSource}`;

        const request = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "data",
                    sql: query,
                    mode: "formData",
                },
            ],
        };
        if (query) {
            return new Promise((resolve, reject) => {
                axios.post(url, request).then(res => {
                    if (res.data.C_STATUS === "SUCCESS") {
                        const response = res.data.C_DATA.data;
                        const selectedItem =
                            typeof response === "object" ? response[0] : [];
                        resolve(selectedItem);
                    }
                });
            });
        }
    }

    function makeQuery(selectedItem, id) {
        if (selectedItem.type === "FORM") {
            const usePrefix = selectedForm.useprefix;
            const table =
                usePrefix === "YES"
                    ? `app_fd_${selectedForm.table}`
                    : `${selectedForm.table}`;
            return `select * from ${table} where id = '${id}'`;
        } else if (selectedItem.type === "SQL") {
            const query = selectedItem.sql;
            const removeWhereCloseQuery = query.split("where")[0];
            return removeWhereCloseQuery + ` where id = '${id}'`;
        }
    }

    function saveAndAddNew(updatedObj, setFormData) {
        // makeFormComponents();
        setFormData(prev => {
            const newFormData = { ...prev };
            for (let key in newFormData) {
                newFormData[key] = "";
            }

            return newFormData;
        });
        setSelectedObject({});
        setFormAndModalConfig({
            form: "",
            formId: "",
            type: "",
            show: true,
            datalist_aside_width: undefined,
        });
        setDbData(prev => [...prev, updatedObj]);

        // handleAddNew();
    }

    function saveAndNext(updatedObj) {
        localStorage.setItem("allowChecked", true);
        editNext(updatedObj);
    }

    function editNext(updatedObj, showMsg) {
        for (let key in updatedObj) {
            if (typeof updatedObj[key] === "object") {
                updatedObj[key] = JSON.stringify(updatedObj[key]);
            }
        }

        let checked = localStorage.getItem("allowChecked");

        try {
            let tableData = structuredClone(dbData);
            let index = tableData.findIndex(item => item.id === updatedObj.id);
            //when api return obj it contain db format so we convert into user
            //this conversion is not required as alread done on render
            // updatedObj.datecreated = moment(updatedObj.datecreated).format(
            //     DATE_TIME_FORMAT_FOR_USER_VIEW,
            // );
            // updatedObj.datemodified = moment(updatedObj.datemodified).format(
            //     DATE_TIME_FORMAT_FOR_USER_VIEW,
            // );

            if (index !== -1) {
                tableData[index] = updatedObj;
                setDbData(tableData);
                if (checked === "true") {
                    NextElement(tableData, index + 1);
                }
            } else {
                tableData.push(updatedObj);
                setDbData(tableData);
            }
            if (tableData) {
                setViewerBtn(pre => ({
                    ...pre,
                    listLength: tableData.length,
                }));
            }
        } catch (error) {}

        if (updatedObj !== "process" && showMsg) {
            toastEmitter("Record Saved", true);
        }
    }

    function NextElement(arr, nextIndex) {
        try {
            if (arr.length === nextIndex) {
                toastEmitter("Next record does not exist", true, "error");
            } else {
                if (arr[nextIndex].id) {
                    setAllowId(arr[nextIndex].id);
                } else {
                    setAllowId("");
                }
            }
        } catch (error) {}
    }

    const EditableCell = ({
        value: initialValue,
        row,
        column,
        updateMyData,
        // This is a custom function that we supplied to our table instance
    }) => {
        const { index } = row;
        const { id } = column;
        // We need to keep and update the state of the cell normally
        // const styles = { fontSize: "1rem", padding: 0, margin: 0, border: 0 };
        const [value, setValue] = useState(initialValue);

        // If the initialValue is changed external, sync it up with our state
        useEffect(() => {
            setValue(initialValue);
        }, [initialValue]);

        const onChange = useCallback(
            (db_column, value, isValid, type, fileContent) => {
                updateMyData(index, db_column, value);
                // updateMyData(index, id, value);
                setValue(value);
            },
            [],
        );

        // We'll only update the external data when the input is blurred
        const onBlur = useCallback((type, _value) => {}, []);

        const EditableGridRender = useCallback(
            (row, column, value, onChange, onBlur) => {
                return (
                    <>
                        <EditableGrid
                            row={row}
                            column={column}
                            selectedValue={value}
                            handleInputFields={onChange}
                            handleOnFieldBlur={onBlur}
                            components={formComponets}
                            formData={formData}
                            mode={mode}
                        />
                    </>
                );
            },
            [row.original, formComponets],
        );

        return (
            <>
                <div className="datalist-grid-inputs">
                    <Delayed>
                        {EditableGridRender(
                            row,
                            column,
                            value,
                            onChange,
                            onBlur,
                        )}
                    </Delayed>
                </div>
            </>
        );
    };

    const updateMyData = (rowIndex, columnId, value) => {
        // We also turn on the flag to not reset the page
        // setSkipPageReset(true);
        setDbData(old =>
            old.map((row, index) => {
                if (index === rowIndex) {
                    return {
                        ...old[rowIndex],
                        [columnId]: value,
                    };
                }
                return row;
            }),
        );
    };

    const updateDbData = (updatedRecord, cell) => {
        try {
            let validations = [];
            if (fkColumn && fkColumn !== "") {
                updatedRecord[fkColumn] = fkValue;
            }
            const requiredField = [];
            const multipageDesign = tryToParse(selectedForm.multipage_design);
            const parsedDesign = tryToParse(selectedForm.design);
            const layout = parsedDesign.layout;
            const components = parsedDesign.components;
            const defaultData = getObjectSchemeForValidation(
                layout,
                components,
            );
            const updatedObj = { ...defaultData, ...updatedRecord };
            const datalistLayout = tryToParse(selectedItem.layout);
            const datalistSelectedFields = datalistLayout?.selected_fields;
            const notRequired = {
                fileuploader: false,
                imageuploader: false,
                daterange: false,
                hiddenfield: false,
                carousel: false,
                json: false,
                HTML: false,
            };
            for (let item of datalistSelectedFields) {
                if (item.selected) {
                    const db_column = item?.db_column;
                    const type = item?.type;
                    // const id = item?.id;
                    // const label = item?.label;
                    if (notRequired[type] || notRequired[type] === undefined) {
                        requiredField.push(db_column);
                    }
                }
            }
            if (
                selectedForm.enableMultipage &&
                selectedForm.enableMultipage === "YES"
            ) {
                validations = checkMultiPageValidation(
                    updatedObj,
                    multipageDesign,
                    requiredField,
                );
            } else {
                validations = checkValidation(
                    updatedObj,
                    layout,
                    components,
                    requiredField,
                );
            }

            if (validations && validations.isValid) {
                var url = API_URL + "?service.key=update.formData";
                var request = {
                    saveOrUpdate: "Yes",
                };
                request.data = [];
                request.datasource = selectedForm.datasource;
                request.useprefix = selectedForm.useprefix;
                var entityForm = {};

                entityForm.formId = selectedForm.table; //"formid"
                entityForm.entity = selectedForm.table; //Db- "table name"
                entityForm.action = "update";

                updatedRecord.id = updatedRecord.id;
                entityForm.id = updatedRecord.id;

                entityForm.formData = updatedRecord;
                request.data.push(entityForm);

                entityForm.fileData = [];

                axios.post(url, request).then(response => {
                    if (response.status === 200) {
                        const { index } = cell.row;
                        const selectedItem = response.data.C_DATA[0].formData;
                        setDbData(prev =>
                            prev.map((item, i) =>
                                i === index ? selectedItem : item,
                            ),
                        );
                        toastEmitter("Record Updated Successfully", true);
                    }
                });
            } else if (validations && !validations.isValid) {
                toastEmitter(
                    validations.invalidLabels.join(" "),
                    true,
                    "error",
                );
            }
        } catch (error) {
            // console.log(error);
        }
    };

    function refreshBtn() {
        if (selectedItem.type === "SQL") {
            getDatalistData(null, selectedItem.id);
        } else if (selectedItem.type === "FORM") {
            getDatalistData(selectedItem.form_id, null);
        }
    }

    function deleteAll() {
        setFlag(prev => ({
            ...prev,
            deleteAll: true,
        }));
    }

    function selectedExport() {
        setFlag(prev => ({
            ...prev,
            exportAll: true,
            tableColumns: tableColumns,
        }));
    }

    function resetAllFilters() {
        setFlag(prev => ({
            ...prev,
            reset: true,
        }));
    }

    function ModalTitle() {
        // let name = "";
        // if (selectedItem && selectedItem.form_name) {
        //     name = selectedItem.form_name;
        // } else {
        //     name = selectedForm.name;
        // }
        return selectedForm.name;
    }

    function FormKey() {
        let formKey = "";
        if (selectedItem && selectedItem.form_key) {
            formKey = selectedItem.form_key;
        } else {
            if (selectedItem.form_id) {
                formKey = selectedItem.form_key;
            } else {
                formKey = selectedForm.form_key;
            }
        }
        return formKey;
    }

    function BusinessKey() {
        let businessKey = "";
        if (selectedItem.type === "FORM") {
            businessKey = selectedObject.id;
        } else {
            businessKey = selectedObject[selectedItem.primary_key];
        }
        return businessKey;
    }

    function handleAllowNext(check) {
        localStorage.setItem("allowChecked", check);
        setAllowChecked(check);
    }

    function formClasses() {
        let className = "";
        const width = formAndModalConfig.datalist_aside_width;
        const asideTypes = {
            left: width
                ? `w-${100 - parseInt(width)} datalistform-left`
                : "w-50 datalistform-left",
            right: width
                ? `w-${100 - parseInt(width)} datalistform-right`
                : "w-50 datalistform-right",
            top: "w-100 datalistform-top",
            bottom: "w-100 datalistform-bottom",
        };

        if (formAndModalConfig.type === "switch") {
            className = "w-100";
        } else if (formAndModalConfig.type === "aside") {
            const position = formAndModalConfig.aside_position;
            className = asideTypes[position];
        }
        return className;
    }

    function tableClasses() {
        const width = formAndModalConfig.datalist_aside_width;
        const asideTypes = {
            left: width ? `w-${width}` : "w-50 datalist-left",
            right: width ? `w-${width} ` : "w-50 datalist-right",
            top: "w-100 datalist-top",
            bottom: "w-100 datalist-bottom",
        };
        const position = formAndModalConfig.aside_position;
        const finalWidth = asideTypes[position];
        return finalWidth;
    }

    function tableAndFormClass() {
        let className = "row d-flex";
        const asideTypes = {
            left: "flex-row-reverse",
            right: "flex-row",
            top: "flex-column-reverse",
            bottom: "flex-column",
        };

        const position = formAndModalConfig.aside_position;

        className = className + " " + asideTypes[position];

        return className;
    }
    if (show)
        return (
            <SqlServiceParams.Provider
                value={{ sqlServiceParams, setSqlServiceParams }}>
                <div className="table-byid">
                    <ImportModal
                        show={viewerBtn && viewerBtn.import}
                        setShow={setViewerBtn}
                        csvToJson={CSVToJSON}
                        selectedItem={selectedItem}
                        datasource={
                            selectedItem.datasource
                                ? selectedItem.datasource
                                : selectedForm.datasource
                        }
                        getForm={getDatalistData}
                    />
                    <ModalComponent
                        state={delModal}
                        message="Are you sure to delete this item?"
                        operation={handleDelete}
                        header="Confirm"
                        setState={setDelModal}
                        modalType="deleteModal"
                    />
                    <ModalComponent
                        state={editModal}
                        message="Are you sure to delete this item?"
                        dialogClassName="s2a-modal-confirm"
                        operation={handleEdit}
                        header="Confirm"
                        setState={setEditModal}
                        modalType="editModal"
                        editModalSize={editModalSize}
                    />
                    <ModalComponent
                        state={delAllModal}
                        message="Are you sure to delete all items?"
                        operation={multiDelete}
                        header="Confirm"
                        setState={setDellAllModal}
                        modalType="deleteAllModal"
                    />
                    {(tableColumns.length > 0 ||
                        tableColumns !== undefined) && (
                        <>
                            <Modal
                                show={formAndModalConfig.show}
                                className="s2a-modal data-list-modal"
                                dialogClassName="modal-style"
                                size={
                                    currentAction.modal_size
                                        ? currentAction.modal_size
                                        : "lg"
                                }
                                fullscreen={
                                    currentAction.modal_size === "xxl-down"
                                        ? true
                                        : false
                                }
                                backdrop={"static"}
                                onEntered={element =>
                                    element.removeAttribute("tabindex")
                                }
                                onHide={handleClose}>
                                <Modal.Header>
                                    <Modal.Title className="s2a-form-title">
                                        <span>{ModalTitle()}</span>
                                        <div className="flex-between">
                                            <div
                                                className="me-2"
                                                style={{
                                                    textAlign: "right",
                                                    paddingRight: "16px",
                                                    fontSize: "14px",
                                                }}></div>
                                            <i
                                                className="fa-solid fa-xmark modal-close"
                                                onClick={handleClose}></i>
                                        </div>
                                    </Modal.Title>
                                </Modal.Header>

                                <Modal.Body className="">
                                    <>
                                        {formAndModalConfig.show && (
                                            <FormViewerWrap
                                                formKey={FormKey()}
                                                businessKey={BusinessKey()}
                                                handleActions={handleActions}
                                                fkColumn={fkColumn}
                                                fkValue={fkValue}
                                                nextElementId={allowId}
                                                handleClose={handleClose}
                                                mode={
                                                    formAndModalConfig.mode
                                                        ? formAndModalConfig.mode
                                                        : undefined
                                                }
                                                showTitle={false}
                                                tenantIdMain={tenantId}
                                                confirmationMessage={
                                                    currentAction.enable_modal
                                                        ? currentAction.confirmation_message
                                                        : ""
                                                }
                                                formVars={
                                                    formAndModalConfig?.formVars
                                                }
                                            />
                                        )}
                                    </>
                                </Modal.Body>
                            </Modal>
                            <div className={tableAndFormClass()}>
                                {formAndModalConfig.type !== "switch" && (
                                    <div
                                        className={`datalist-table ${
                                            formAndModalConfig.type
                                        } ${
                                            formAndModalConfig?.aside_position
                                        } ${tableClasses()}`}>
                                        {checkArray(tableColumns) && (
                                            <>
                                                <DatalistHeader
                                                    selectedItem={selectedItem}
                                                    viewerBtn={viewerBtn}
                                                    mode={mode}
                                                    modeType={modeType}
                                                    selectedRowsLength={
                                                        selectedRowsLength
                                                    }
                                                    hideLabel={hideLabel}
                                                    hideFormDatalistLabel={
                                                        hideFormDatalistLabel
                                                    }
                                                    rows={dbData ? dbData : []}
                                                />

                                                <DatalistSqlFilters
                                                    selectedItem={selectedItem}
                                                    setFilter={setFilter}
                                                    getDatalistData={
                                                        getDatalistData
                                                    }
                                                />
                                                <>
                                                    {/* <PivotTable
                                                        data={
                                                            dbData
                                                        }></PivotTable> */}
                                                    {selectedItem.datalist_type ===
                                                        "TABLE" && (
                                                        <ReactTable
                                                            columns={
                                                                tableColumns
                                                            }
                                                            data={
                                                                dbData
                                                                    ? dbData
                                                                    : []
                                                            }
                                                            flag={flag}
                                                            setViewerBtn={
                                                                setViewerBtn
                                                            }
                                                            setFlag={setFlag}
                                                            setSelectedRowsLength={
                                                                setSelectedRowsLength
                                                            }
                                                            selectedItem={
                                                                selectedItem
                                                            }
                                                            selectedObject={
                                                                selectedObject
                                                            }
                                                            updateMyData={
                                                                updateMyData
                                                            }
                                                            EditableCell={
                                                                EditableCell
                                                            }
                                                            deleteAllAction={
                                                                deleteAll
                                                            }
                                                            selectedExportAction={
                                                                selectedExport
                                                            }
                                                            resetAllFiltersAction={
                                                                resetAllFilters
                                                            }
                                                            handleAddNewAction={
                                                                handleAddNew
                                                            }
                                                            handleListEdit={
                                                                handleListEdit
                                                            }
                                                            viewerBtnAction={
                                                                viewerBtn
                                                            }
                                                            setViewerBtnAction={
                                                                setViewerBtn
                                                            }
                                                            apiResponse={
                                                                apiResponse
                                                            }
                                                            mode={mode}
                                                        />
                                                    )}
                                                </>
                                                <>
                                                    {selectedItem.datalist_type ===
                                                        "EDITABLE-GRID" &&
                                                        !isEmpty(
                                                            formComponets,
                                                        ) && (
                                                            <ReactTable
                                                                columns={
                                                                    tableColumns
                                                                }
                                                                data={
                                                                    dbData
                                                                        ? dbData
                                                                        : []
                                                                }
                                                                flag={flag}
                                                                setViewerBtn={
                                                                    setViewerBtn
                                                                }
                                                                setFlag={
                                                                    setFlag
                                                                }
                                                                setSelectedRowsLength={
                                                                    setSelectedRowsLength
                                                                }
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                updateMyData={
                                                                    updateMyData
                                                                }
                                                                EditableCell={
                                                                    EditableCell
                                                                }
                                                                deleteAllAction={
                                                                    deleteAll
                                                                }
                                                                selectedExportAction={
                                                                    selectedExport
                                                                }
                                                                resetAllFiltersAction={
                                                                    resetAllFilters
                                                                }
                                                                handleAddNewAction={
                                                                    handleAddNew
                                                                }
                                                                viewerBtnAction={
                                                                    viewerBtn
                                                                }
                                                                setViewerBtnAction={
                                                                    setViewerBtn
                                                                }
                                                                apiResponse={
                                                                    apiResponse
                                                                }
                                                                mode={mode}
                                                            />
                                                        )}
                                                </>
                                            </>
                                        )}
                                    </div>
                                )}
                                {
                                    <div
                                        id="form-viewer"
                                        className={formClasses()}
                                        ref={asideFormRef}>
                                        {dbData?.length > 0 &&
                                            (formAndModalConfig.type ===
                                                "aside" ||
                                                formAndModalConfig.type ===
                                                    "switch") && (
                                                <div className="form-view-border">
                                                    <FormViewerWrap
                                                        formKey={
                                                            formAndModalConfig.form
                                                        }
                                                        businessKey={
                                                            formAndModalConfig.formId
                                                        }
                                                        fkColumn={fkColumn}
                                                        fkValue={fkValue}
                                                        handleClose={
                                                            handleClose
                                                        }
                                                        handleActions={
                                                            handleActions
                                                        }
                                                        nextElementId={allowId}
                                                        mode={
                                                            formAndModalConfig.mode
                                                                ? formAndModalConfig.mode
                                                                : undefined
                                                        }
                                                        showTitle={true}
                                                        formVars={
                                                            formAndModalConfig?.formVars
                                                        }
                                                    />
                                                </div>
                                            )}
                                    </div>
                                }
                            </div>
                        </>
                    )}
                </div>
            </SqlServiceParams.Provider>
        );
    else return <Messsage message="Datalist Viewer" />;
}

function Delayed({ children, waitBeforeShow = 200 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : "Loading...";
}

function DatalistHeader(_props) {
    const {
        mode,
        modeType,
        selectedItem,
        viewerBtn,
        selectedRowsLength,
        hideLabel,
        hideFormDatalistLabel,
        rows,
    } = _props;
    return (
        <div className="s2a-datalist-header row">
            {modeType.preview === mode ||
            modeType.render === mode ||
            modeType.readonly === mode ? (
                <>
                    <div className="datalist-title col-sm">
                        {!hideLabel ? (
                            <div className="col title-text">
                                <span>
                                    {!Boolean(hideFormDatalistLabel) &&
                                        selectedItem &&
                                        (selectedItem?.title ||
                                            selectedItem?.name)}
                                </span>
                            </div>
                        ) : (
                            <div></div>
                        )}

                        <div className="col-sm-1 refresh-count">
                            {selectedItem && selectedItem.refresh_interval && (
                                <div className="refresh ps-2">
                                    <i
                                        title={`Refresh in ${selectedItem?.refresh_interval} Second`}
                                        className="fa-solid fa-arrows-rotate"></i>
                                </div>
                            )}
                        </div>
                    </div>
                    {viewerBtn &&
                        viewerBtn.flag &&
                        viewerBtn.flag.search === true && (
                            <div className="datalist-search flex-between col-sm-4 ms-auto">
                                <div className="count pe-2">
                                    {viewerBtn && viewerBtn?.listLength
                                        ? selectedRowsLength
                                        : 0}{" "}
                                    /{" "}
                                    {viewerBtn && viewerBtn?.listLength
                                        ? viewerBtn?.listLength
                                        : 0}
                                </div>
                                <GlobalFilter
                                    preGlobalFilteredRows={
                                        viewerBtn.preGlobalFilteredRows
                                    }
                                    globalFilter={viewerBtn.globalFilter}
                                    setGlobalFilter={viewerBtn.setGlobalFilter}
                                />
                                <div className="fw-bold refresh-json-btn"></div>
                            </div>
                        )}
                </>
            ) : (
                <></>
            )}
        </div>
    );
}

function DatalistSqlFilters(props) {
    //shahzad

    const { selectedItem, setFilter, getDatalistData } = props;
    const { serviceparams = "" } = selectedItem;
    const [parsedServiceParams, setParsedServiceParams] = useState([]);

    useEffect(() => {
        try {
            var _parsedServiceParams = [];
            var paramsFields = {};

            if (serviceparams) {
                _parsedServiceParams = JSON.parse(serviceparams);
                var components = _parsedServiceParams;
                const requiredFilterTypes = [
                    "checklist",
                    "radio",
                    "select",
                    "checkbox",
                ];
                for (let key in components) {
                    if (
                        components[key].selected &&
                        requiredFilterTypes.includes(
                            components[key].type.toLowerCase(),
                        )
                    )
                        if (components[key].use_static === "YES") {
                            components[key].options = tryToParse(
                                components[key].options,
                            );
                        } else {
                            const field = {};

                            field.id = key;
                            field.data = components[key];
                            field.optionType = "dynamic";
                            paramsFields[key] = field;
                        }
                }
            }
            if (paramsFields && !isEmpty(paramsFields)) {
                const keys = [];

                getKeysForAllField(paramsFields, keys);
                getDBParams(_parsedServiceParams, paramsFields, keys).then(
                    () => {
                        // console.log(_parsedServiceParams);
                        setParsedServiceParams(_parsedServiceParams);
                        setFilter(_parsedServiceParams);
                    },
                );
            } else {
                setParsedServiceParams(_parsedServiceParams);
                setFilter(_parsedServiceParams);
            }
        } catch (error) {
            console.log(error);
        }
    }, [serviceparams]);

    function getKeysForAllField(formFields, keys) {
        for (let key in formFields) {
            if (formFields[key].optionType === "dynamic") {
                const data = formFields[key].data;

                let obj = {
                    params: "",
                    dataKey: key,
                    serviceKey: data.serviceKey,
                    datasource: data?.datasource ?? "",
                    mode: "formData",
                };
                if (obj.serviceKey) keys.push(obj);
            }
        }
        return keys;
    }
    async function getDBParams(_parsedServiceParams, paramsFields, keys) {
        const url = API_URL + "?service.key=tenant.data";
        if (keys && keys.length > 0) {
            var res = await getData({
                url,
                keys: keys,
            });
            console.log(JSON.stringify(res));
            let data = res.data.C_DATA;
            for (let key in data) {
                _parsedServiceParams[key].options = data[key];
            }
            return _parsedServiceParams;
            // paramsFields[key].data.options = res[key].C_DATA;
        }
    }
    return (
        parsedServiceParams &&
        parsedServiceParams.length > 0 && (
            <div className="row m-2 datalist-service-params">
                {/* <code>{JSON.stringify(parsedServiceParams)}</code> */}
                {Array.isArray(parsedServiceParams) &&
                    parsedServiceParams?.map(serviceparam => (
                        <RenderFilter
                            key={serviceparam?.id}
                            serviceParam={serviceparam}
                        />
                    ))}
                <div className="col-sm-2">
                    <button
                        className="btn btn-sm button-theme mb-1 mt-3"
                        onClick={getDatalistData}>
                        Apply Filter
                    </button>
                </div>
            </div>
        )
    );
}

const serviceParamsFilters = {
    "DATE-RANGE": DateRangeWrapper,
    TEXT: TextFieldWrapper,
    NUMBER: NumberFieldWrapper,
    SELECT: SelectWrapper,
    RADIO: RadioWrapper,
    CHECKBOX: CheckboxWrapper,
};

function RenderFilter(props) {
    const { serviceParam } = props;
    const { type = "", selected, classes = "" } = serviceParam;
    if (!type) return <span className="me-3">{`${type} not found`}</span>;

    if (!serviceParamsFilters[type])
        return <span className="m-3">{`${type} not found`}</span>;

    if (!selected) return null;

    const component = serviceParamsFilters[type];
    //shahzad
    return (
        // <div className={`col-sm-10 ${classes}`}>
        <>
            {/* {JSON.stringify(serviceParam)} */}
            {React.createElement(component, {
                disablePreviousDates: false,
                ...serviceParam,
            })}
        </>
        // </div>
    );
}

function DateRangeWrapper(props) {
    const {
        label,
        disablePreviousDates,
        id,
        type,
        start_default_value,
        end_default_value,
        is_expression,
    } = props;
    // const [date, setDate] = useState({
    //     start: null,
    //     end: null,
    // });

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _start_default_value = evaluateExpressionDefault(
                { expression: start_default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            let _end_default_value = evaluateExpressionDefault(
                { expression: end_default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            handleDateChange({
                startDate: moment(_start_default_value),
                endDate: moment(_end_default_value),
            });
        } else if (start_default_value || end_default_value) {
            handleDateChange({
                startDate: moment(start_default_value),
                endDate: moment(end_default_value),
            });
        }
    }, []);

    const handleDateChange = selectedDate => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: {
                type: type,
                start: selectedDate?.startDate,
                end: selectedDate?.endDate,
            },
        }));
    };

    const date = sqlServiceParams[id];

    return (
        <div className="col-sm-4">
            <DateRange
                startDate={date?.start}
                endDate={date?.end}
                handleDateChange={handleDateChange}
                label={label}
                disablePreviousDates={disablePreviousDates}
            />
        </div>
    );
}

function TextFieldWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        default_value,
        is_expression,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            handleOnChange({ target: { value: _default_value } });
        } else if (default_value) {
            handleOnChange({ target: { value: default_value } });
        }
    }, []);

    function handleOnChange(e) {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type: type, text: e?.target?.value },
        }));
    }

    return (
        <TextField
            key={id}
            placeholder={label}
            name={id}
            value={sqlServiceParams?.[id]?.text}
            label={label}
            type={type?.toLowerCase()}
            onChange={handleOnChange}
        />
    );
}

function NumberFieldWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        default_value,
        is_expression,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            handleOnChange({ target: { value: _default_value } });
        } else if (default_value) {
            handleOnChange({ target: { value: +default_value } });
        }
    }, []);

    function handleOnChange(e) {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type: type, text: e?.target?.value },
        }));
    }

    return (
        <TextField
            key={id}
            placeholder={label}
            name={id}
            value={sqlServiceParams?.[id]?.text}
            label={label}
            type={type?.toLowerCase()}
            onChange={handleOnChange}
        />
    );
}

function SelectWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        options,
        mapLabel,
        mapValue,
        default_value,
        is_expression,
        use_static,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const [selectedOption, setSelectedOption] = useState({});
    const expressionProps = useGlobalData();

    useEffect(() => {
        let _mapValue = mapValue && use_static !== "YES" ? mapValue : "value";
        let _default_value = default_value;
        if (is_expression) {
            _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
        }
        let selectedOptionIndex = options?.findIndex(
            option => option?.[_mapValue] === _default_value,
        );
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, [_mapValue]: _default_value },
        }));
        let _selectedOption = options[selectedOptionIndex];
        if (_selectedOption) {
            setSelectedOption(_selectedOption);
        }
    }, []);

    const onChange = item => {
        let temp = sqlServiceParams;
        let _options = options;
        let _mapValue = mapValue && use_static !== "YES" ? mapValue : "value";
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, [_mapValue]: item[_mapValue] },
        }));
        let selectedOptionIndex = options?.findIndex(
            option => option?.option_id === item?.["option_id"],
        );

        let _selectedOption = options[selectedOptionIndex];

        setSelectedOption(_selectedOption);
    };

    return (
        <div className="col-sm-2">
            {label && <label>{label}</label>}
            {/* {JSON.stringify(sqlServiceParams)} */}
            <ReactSelect
                options={options}
                fieldLabel={
                    mapLabel && use_static !== "YES" ? mapLabel : "label"
                }
                fieldValue={
                    mapValue && use_static !== "YES" ? mapValue : "value"
                }
                handleChange={onChange}
                selectedOption={selectedOption}
            />
        </div>
    );
}

function RadioWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        options,
        mapLabel,
        mapValue,
        default_value,
        is_expression,
        use_static,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            onChange(_default_value);
        } else if (default_value) {
            onChange(default_value);
        }
    }, []);

    const onChange = selectedOption => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, value: selectedOption },
        }));
    };

    return (
        <div className="col-sm-2">
            {label && <label className="mb-1">{label}</label>}
            <DynamicRadio
                items={options}
                mapLabel={mapLabel && use_static !== "YES" ? mapLabel : "label"}
                mapValue={mapValue && use_static !== "YES" ? mapValue : "value"}
                handleChange={onChange}
                selectedItem={sqlServiceParams?.[id]?.value}
                classes={{
                    main: "d-flex gap-2 flex-wrap align-items-center",
                }}
            />
        </div>
    );
}

function CheckboxWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        options,
        mapLabel = "label",
        mapValue = "value",
        default_value,
        is_expression,
        use_static,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            onChange(_default_value);
        } else if (default_value) {
            onChange(default_value);
        }
    }, []);

    const onChange = selectedOption => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, values: selectedOption },
        }));
    };

    return (
        <>
            {label && <label>{label}</label>}
            <DynamicCheckBoxs
                items={options}
                mapLabel={mapLabel && use_static !== "YES" ? mapLabel : "label"}
                mapValue={mapValue && use_static !== "YES" ? mapValue : "value"}
                handleChange={onChange}
                selectedItem={sqlServiceParams?.[id]?.values}
                classes={{
                    main: "d-flex flex-wrap gap-2 align-items-center my-2",
                }}
            />
        </>
    );
}

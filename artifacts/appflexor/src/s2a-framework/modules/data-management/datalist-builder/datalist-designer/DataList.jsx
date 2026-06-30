import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import { getData as _Data } from "../../../../components/CrudApiCall";
import { ExportForm } from "../../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../../components/Modal/Modal";
import Scroll from "../../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../../components/SearchAndBtns/SearchAndBtns";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import {
    JsonToCsv,
    deleteItem,
    filterArrayByTerms,
    insertItem,
    updateItem,
} from "../../../../utils/utils";
import { tryToParse } from "../../form-builder/Forms/FormViewer/utils";
import DataListForm from "../datalist-form/form/DataListForm";
import DataListModal from "../datalist-preview/DataListModal";
import DatalistImport from "./DatalistImportForm";
import { DEFAULTACTIONS } from "./DefaultActions";
import Listing from "./Listing";

function DataList(props) {
    const initialState = {
        id: "",
        db_column: "",
        name: "",
        form_id: "",
        table: "",
        layout: {
            selected_fields: [],
            actions: DEFAULTACTIONS,
        },
        type: "FORM",
        sql: "",
        primary_key: "",
        orderby: "",
        orderbyfield: "",
        defaultpage: "",
        datasource: "",
        filter_condition: "",
        selected: false,
        datalist_type: "TABLE",
        refresh_interval: "",
        full_refresh: true,
        tags: "",
        view: "TABLE",
        gallery_columns: "4",
        datalist_export_type: "JSON",
    };

    let Orders = [
        { code: "asc", label: "Ascending" },
        { code: "desc", label: "Descending" },
    ];

    let initialType = [
        {
            id: "1",
            title: "Form",
            name: "FORM",
            selected: false,
        },
        { id: "2", title: "Sql", name: "SQL", selected: false },
    ];
    let initialDatalistType = [
        {
            id: "1",
            title: "Readonly",
            name: "TABLE",
            selected: true,
        },
        {
            id: "2",
            title: "Editable",
            name: "EDITABLE-GRID",
            selected: false,
        },
    ];
    const inputRef = useRef(null);
    const [formList, setFormList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [selectedForm, setSelectedForm] = useState({});
    const [dataList, setDataList] = useState([]);
    const [filteredDataList, setFilteredDataList] = useState([]);
    const [instanceItems, setInstanceItems] = useState([]);
    const [emailService, setEmailService] = useState([]);
    const [processCategory, setProcessCategory] = useState([]);
    const [error, setError] = useState([]);
    const [designMode, setDesignMode] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [defaultAction, setDefaultAction] = useState(false);
    const [customAction, setCustomAction] = useState(false);
    const [formFieldCheck, setFormFieldCheck] = useState(false);
    const types = [...initialType];
    const [datalistType, setDatalistType] = useState(initialDatalistType);
    const [showAction, setShowAction] = useState({
        showModal: false,
    });
    const [showBulkAction, setShowBulkAction] = useState({
        showModal: false,
    });
    const [exportFile, setExportFile] = useState([]);
    const modalRef = useRef(null);
    const [selectedDatalist, setSelectedDatalist] = useState({});

    const importModalRef = useRef(null);
    const Pages = ["default page", 5, 10, 20, 30, 40, 50, 100];
    const [showModalComp, setShowModalComp] = useState({
        show: false,
        item: {},
    });
    const handleShowCsv = () => importModalRef.current.show();
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const activeTab = props.activeTab;

    useEffect(() => {
        if (activeTab === "DATALIST_BUILDER") {
            getData("FIRST_RENDER");
            setShowModal(false);
            setError([]);
        }
    }, [activeTab]);

    function resetDatalist() {
        const showType = selectedItem.type;
        if (showType && showType !== "") {
            if (showType === "SQL") {
                setSelectedItem(prev => ({
                    ...prev,
                    form_id: "",
                    datalist_type: "TABLE",
                    layout: {
                        ...prev.layout,
                        selected_fields: [],
                    },
                }));
            } else if (showType === "FORM") {
                setSelectedItem(prev => ({
                    ...prev,
                    sql: "",
                    primary_key: "",
                    form_id: "",
                    layout: {
                        ...prev.layout,
                        selected_fields: [],
                    },
                }));
            }
            setDefaultAction(false);
            setCustomAction(false);
            setFormFieldCheck(false);
        }
    }

    function addNewItem() {
        let initial = { ...initialState };
        setError([]);
        setCustomAction(false);
        setDefaultAction(false);
        setFormFieldCheck(false);
        setSelectedItem(initial);
        setDatalistType(initialDatalistType);
        setSelectedDatalist({});
    }

    function clearFields() {
        addNewItem();
    }

    // event handlers
    function handleInputField(event) {
        const { value, name } = event.target;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleType(event) {
        const { value, name } = event.target;

        const requiredActions = {
            edit: true,
            add: true,
            delete: true,
            export: true,
            import: true,
            search: true,
            refresh: true,
            pagination: true,
            resetfilter: true,
            allowall: true,
            // save: true,
        };

        if (value === "SQL") {
            let actions = [];
            if (!selectedItem.form_id) {
                actions = [...selectedItem.layout.actions];
            } else {
                actions = [...DEFAULTACTIONS];
                actions = actions.filter(
                    action => requiredActions[action.code],
                );
            }
            actions = actions.map(action => {
                action.selected = false;
                return action;
            });
            setSelectedItem(prev => ({
                ...prev,
                [name]: value,
                datalist_type: "TABLE",
                form_id: "",
                layout: {
                    actions: actions,
                    selected_fields: [],
                },
            }));
            setDatalistType(initialDatalistType);
        } else {
            const defaultActions = [...DEFAULTACTIONS];
            const actions = defaultActions.filter(item => {
                item.selected = false;
                return requiredActions[item.code];
            });
            setSelectedItem(prev => ({
                ...prev,
                [name]: value,
                form_id: "",
                layout: {
                    ...prev.layout,
                    actions: [...actions],
                },
            }));
        }
    }

    function handleDatalistType(event) {
        const { value, name } = event.target;
        if (name === "datalist_type") {
            let _type = [...datalistType];
            _type.forEach(item => {
                if (item.name === value) {
                    item.selected = true;
                } else {
                    item.selected = false;
                }
            });
            setDatalistType(_type);
        }
        const actions = filterActions(value);

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
            layout: {
                ...prev.layout,
                actions: actions,
            },
        }));
        setDefaultAction(false);
        setCustomAction(false);
        // checkBoxesSelection(selectedItem);
        // resetDatalist();
    }

    function handleDatalistExportType(event) {
        const { value, name } = event.target;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
            layout: {
                ...prev.layout,
                datalist_export_type: value,
            },
        }));
        setDefaultAction(false);
        setCustomAction(false);
    }

    function filterActions(value) {
        let _actions;

        if (value === "EDITABLE-GRID" && selectedItem.type === "FORM") {
            const actions = selectedItem.layout.actions.filter(
                item => item.code !== "edit" && item.code !== "save",
            );
            _actions = AddAction("save", "Save", actions);
        } else if (value === "TABLE" && selectedItem.type === "FORM") {
            const actions = selectedItem.layout.actions.filter(
                item => item.code !== "edit" && item.code !== "save",
            );
            _actions = AddAction("edit", "Edit", actions);
        }
        return _actions;
    }

    function AddAction(code, title, actions) {
        let action = {
            code: code,
            title: title,
            selected: false,
            type: "default",
        };
        const _actions = [];

        actions.forEach(item => {
            item.selected = false;
            _actions.push(item);
        });

        _actions.push(action);

        return _actions;
    }

    function deleteExtraField(obj, term) {
        try {
            let fields = term === "save" ? obj.layout.selected_fields : obj;
            if (checkObject(fields)) {
                let types = [
                    "richtext",
                    "imageview",
                    "signature",
                    "select",
                    "subform",
                    "carousel",
                    "fileuploader",
                    "HTML",
                ];
                let requiredFields = [];

                fields.forEach(item => {
                    if (item)
                        if (types.includes(item.type)) {
                            requiredFields.push(item);
                        } else {
                            requiredFields.push(item);
                        }
                });
                term === "save"
                    ? (obj.layout.selected_fields = requiredFields)
                    : (obj = requiredFields);
                return obj;
            }
        } catch (error) {
            console.log(error);
        }
    }

    function checkObject(object) {
        let flag = false;
        try {
            for (let key in object) {
                if (key) {
                    flag = true;
                    break;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return flag;
    }
    // API calls

    function addedFields(obj) {
        obj = [
            ...obj,
            {
                db_column: "datecreated",
                label: "Date Created",
                selected: false,
                disabled: false,
                type: "datetime",
                id: `${uuidv4()}`,
                include: true,
                isHtml: false,
                serviceParam: false,
                expression: "",
            },
            {
                db_column: "datemodified",
                label: "Date Modified",
                selected: false,
                disabled: false,
                type: "datetime",
                id: `${uuidv4()}`,
                include: true,
                isHtml: false,
                serviceParam: false,
                expression: "",
            },
            {
                db_column: "createdby",
                label: "Created By",
                selected: false,
                disabled: false,
                type: "textfield",
                id: `${uuidv4()}`,
                include: true,
                isHtml: false,
                serviceParam: false,
                expression: "",
            },
            {
                db_column: "modifiedby",
                label: "Modified By",
                selected: false,
                disabled: false,
                type: "textfield",
                id: `${uuidv4()}`,
                include: true,
                isHtml: false,
                serviceParam: false,
                expression: "",
            },
        ];
        return obj;
    }

    function saveData(datalist, condition) {
        if (handleValidation(datalist)) {
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "app_datalist"; //"formid"
            entityForm.entity = "app_datalist"; //Db- "table name"
            entityForm.action = "update";

            if (datalist.id == "" || datalist.id == "new") {
                entityForm.id = "new";
                datalist.id = "new";
            } else {
                entityForm.id = datalist.id;
            }

            if (datalist.type === "SQL") {
                datalist.sql = datalist.sql.replaceAll(";", "");
            }
            delete datalist.selected;

            entityForm.formData = datalist;
            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                        if (response.data.C_STATUS === "SUCCESS") {
                            if (
                                selectedItem.id === "new" ||
                                selectedItem.id === ""
                            ) {
                                setSelectedItem(prev => ({
                                    ...prev,
                                    id: response.data.C_DATA[0].formData.id,
                                }));
                            }
                            toastEmitter(
                                `Datalist ${
                                    selectedItem.id !== "new"
                                        ? "Updated"
                                        : "Saved"
                                } Successfully`,
                                true,
                                "success",
                            );
                            if (condition === "sql") {
                                getFields(
                                    response.data.C_DATA[0].formData.id,
                                    response.data.C_DATA[0].formData,
                                );
                            } else {
                                const datalist =
                                    response.data.C_DATA[0].formData;
                                if (
                                    selectedItem.id === "new" ||
                                    selectedItem === ""
                                ) {
                                    insertItem(setDataList, datalist);
                                    insertItem(setFilteredDataList, datalist);
                                } else {
                                    updateItem(setDataList, datalist);
                                    updateItem(setFilteredDataList, datalist);
                                }
                            }
                        } else if (response.data.C_STATUS === "FAIL") {
                            toastEmitter(
                                `${selectedForm.name} ${response.data.C_MESSAGE}`,
                                false,
                                "error",
                            );
                        }
                    }
                });
            } catch (e) {
                console.log("saveData error:" + e);
            }
        }
    }

    function deleteData(item, condition) {
        if (condition === undefined) {
            setShowModalComp(prev => ({
                ...prev,
                show: true,
                item: item,
            }));
        }
        if (condition === true) {
            let fieldsData = item;
            // let deleteRecordChannelId = fieldsData.channel

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_datalist";
            entityForm.entity = "app_datalist";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        deleteItem(setDataList, item);
                        deleteItem(setFilteredDataList, item);
                        // getData();
                        toastEmitter(`Datalist Deleted Successfully`, true);
                        setShowModalComp(prev => ({
                            ...prev,
                            show: false,
                            item: {},
                        }));
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    const typeChecker = item => {
        return typeof item;
    };

    function getData(condition) {
        if (condition === "FIRST_RENDER") {
            var dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "formList",
                        serviceKey: "sys.datalist.forms",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dataList",
                        serviceKey: "sys.datalist.list",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "instance",
                        serviceKey: "sys.module.instances",
                        mode: "formData",
                    },
                    // {
                    //     serviceParams: "",
                    //     dataKey: "emailServices",
                    //     serviceKey: "sys.email.services",
                    //     mode: "formData",
                    // },
                    {
                        serviceParams: "",
                        dataKey: "processCategory",
                        serviceKey: "process.category",
                        mode: "formData",
                    },
                ],
            };
        } else {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "formList",
                        serviceKey: "sys.datalist.forms",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dataList",
                        serviceKey: "sys.datalist.list",
                        mode: "formData",
                    },
                ],
            };
        }

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(async response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.dataList) {
                        let list = response.data.C_DATA.dataList;
                        const keysToSearch = [
                            "name",
                            "db_column",
                            "_form_name",
                        ];
                        if (
                            typeChecker(response.data.C_DATA.formList) ===
                            "object"
                        ) {
                            setFormList(response.data.C_DATA.formList);
                        } else {
                            setFormList([]);
                        }

                        if (typeChecker(list) === "object") {
                            setDataList(list);
                        }

                        if (typeChecker(response.data.C_DATA.processCategory)) {
                            setProcessCategory(
                                response.data.C_DATA.processCategory,
                            );
                        } else if (condition === "FIRST_RENDER") {
                            setProcessCategory([]);
                        }
                        if (inputRef.current && inputRef.current.value) {
                            let result = filterArrayByTerms(
                                list,
                                inputRef.current.value,
                                keysToSearch,
                            );
                            setFilteredDataList(result);
                        } else {
                            setFilteredDataList(list);
                        }
                        // setSelectedItem(formData);
                    } else {
                        console.log(
                            `Either sys.forms does not exists or SQL query returns no result.`,
                        );
                    }
                }
                if (response.data.C_DATA.instance) {
                    setInstanceItems(response.data.C_DATA.instance);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getFields(datalist_id, datalist) {
        var dataRequest = {
            // datasource: datalist.datasource ? datalist.datasource : "",
            tenant_id: tenantId,
            dataKeys: [
                {
                    dataKey: "formData",
                    dataListId: datalist_id,
                    mode: "formData",
                    limit: "1",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=dataList.sqlData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.formData) {
                        let fields = response.data.C_DATA.formData[0];
                        const existingFields = datalist.layout.selected_fields;
                        let arr = [];
                        let id = 0;

                        let notInclude = [
                            "richtext",
                            "imageview",
                            "signature",
                            "select",
                            "subform",
                            "carousel",
                            "fileuploader",
                            "HTML",
                            `${selectedItem.primary_key}`,
                        ];

                        for (let key in fields) {
                            if (!notInclude.includes(key)) {
                                let obj = {};
                                obj.id = id += 1;
                                obj.db_column = key;
                                obj.label = `${key
                                    .charAt(0)
                                    .toUpperCase()}${key.slice(1, key.length)}`;
                                obj.selected = false;
                                obj.disabled = false;
                                obj.include = true;
                                obj.isHtml = false;
                                obj.isFilter = false;
                                obj.serviceParam = false;
                                obj.expression = "";
                                obj.type = "textfield";
                                arr.push(obj);
                            }
                        }

                        let notIncludedType = ["HTML", "imageview"];
                        // if duplicate field found discard one of them
                        if (datalist?.layout?.selected_fields)
                            arr = uniqueFields(
                                datalist?.layout?.selected_fields,
                                fields,
                            );

                        // filter field which is not required in field
                        let arr1 = arr.filter(
                            item =>
                                !notIncludedType.includes(item.type) ||
                                item.label !== undefined,
                        );
                        const selected = {
                            ...selectedItem,
                            layout: {
                                ...selectedItem.layout,
                                selected_fields: arr1,
                            },
                        };
                        setSelectedItem(selected);
                    } else {
                        console.log(
                            `Either group data does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function uniqueFields(datalistFields, sqlFields) {
        let arr = [];
        let _datalistFields = {};
        let _sqlFieldsKeys = [];
        datalistFields.forEach(item => {
            _datalistFields[item.db_column] = item;
        });
        _sqlFieldsKeys = Object.keys(sqlFields);

        _sqlFieldsKeys.forEach(item => {
            try {
                if (
                    _datalistFields[item] &&
                    item === _datalistFields[item]["db_column"]
                ) {
                    arr.push(_datalistFields[item]);
                } else {
                    let obj = {};
                    obj.id = `${uuidv4()}`;
                    obj.db_column = item;
                    obj.label = `${item.charAt(0).toUpperCase()}${item.slice(
                        1,
                        item.length,
                    )}`;
                    obj.selected = false;
                    obj.disabled = false;
                    obj.include = true;
                    obj.isHtml = false;
                    obj.isFilter = false;
                    obj.serviceParam = false;
                    obj.expression = "";
                    obj.type = "textfield";
                    arr.push(obj);
                }
            } catch (error) {
                console.log(error);
            }
        });
        return arr;
    }

    function handleSetSelectedDataList(data, event) {
        const actionNotRequired = [
            "fa-trash-can",
            "fa-clone",
            "form-check-input",
        ];
        const bool = actionNotRequired.some(item =>
            event.target.classList.contains(item),
        );
        if (!bool) {
            // Call the function here
            setSelectedDatalist(data);
        }
    }
    useEffect(() => {
        if (selectedDatalist?.id) {
            getSelectedDataList(selectedDatalist);
        }
    }, [selectedDatalist?.id]);

    function handleSetSelectedFormOrData(
        selectedFields,
        actions,
        selectedForm,
        _selectedItem,
    ) {
        let layout = {
            selected_fields: selectedFields,
            actions: actions,
        };

        setSelectedItem(prev => ({
            ...prev,
            ..._selectedItem,
            layout: layout,
            form_id: selectedForm.id,
            table: selectedForm.table,
            form_key: selectedForm.form_key,
            datasource: selectedForm.datasource,
        }));
    }

    function getSelectedDataList(selectedItem) {
        setError([]);
        var dataRequest = {};
        const serviceKey =
            selectedItem.type === "FORM"
                ? "sys.selected.datalist"
                : "sys.selected.datalist.sql";
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedItem.id,
                    dataKey: "selectedDataList",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };
        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        resolve(response);
                        const res = response.data.C_DATA.selectedDataList;
                        const datalist = res[0];
                        checkBoxesSelection(datalist);
                        if (response.data.C_DATA && datalist.type === "FORM") {
                            let _selectedItem = { ...datalist };
                            if (res.length > 0) {
                                try {
                                    let parseDataListLayout = tryToParse(
                                        _selectedItem.layout,
                                    );

                                    parseDataListLayout.actions =
                                        customActionFilter(
                                            parseDataListLayout?.actions,
                                        );

                                    parseDataListLayout = actionFilteredOrAdd(
                                        parseDataListLayout,
                                        _selectedItem,
                                    );
                                    getSelectedDatalistForm(
                                        _selectedItem,
                                        parseDataListLayout,
                                    );
                                } catch (error) {
                                    toastEmitter(error, true, "error");
                                    console.log(error);
                                }
                            } else {
                                setSelectedItem({});
                            }
                        } else {
                            let _selectedItem = { ...datalist };
                            if (_selectedItem.type === "SQL") {
                                _selectedItem.layout = tryToParse(
                                    _selectedItem.layout,
                                );
                                try {
                                    _selectedItem.serviceparams = JSON.parse(
                                        _selectedItem?.serviceparams,
                                    );
                                } catch (error) {
                                    console.log(error);
                                    _selectedItem.serviceparams = [];
                                }

                                let _newActionUpdate = {};
                                _selectedItem.layout.actions.forEach(action => {
                                    _newActionUpdate[action.code] = action;
                                });

                                _selectedItem.layout = actionFilteredOrAdd(
                                    _selectedItem.layout,
                                    _selectedItem,
                                );

                                if (selectedItem.form_id) {
                                    getSelectedDatalistForm(
                                        _selectedItem,
                                        _selectedItem.layout,
                                    );
                                }
                                setSelectedItem(_selectedItem);

                                typeOrDatalistType(_selectedItem);
                            }
                        }
                    } else {
                        toastEmitter(response.data.C_MESSAGE, true);
                    }
                })
                .catch(error => {
                    reject(false);
                    console.error(error);
                });
        });
    }

    function getSelectedDatalistForm(selectedItem, parseDataListLayout) {
        let dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedItem.form_id,
                    dataKey: "selectedForm",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
        };

        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        let selectedForm;
                        if (response?.data?.C_DATA?.selectedForm) {
                            selectedForm = response.data.C_DATA.selectedForm[0];
                            resolve(selectedForm);
                            if (selectedItem.type === "FORM" && selectedForm) {
                                formDesign(
                                    selectedForm,
                                    selectedItem,
                                    parseDataListLayout,
                                );
                                setSelectedForm(selectedForm);
                            } else if (!selectedForm) {
                                // if form is  deleted than run this
                                const layout = tryToParse(selectedItem.layout);
                                // delete layout.selected_fields;
                                // selectedItem.layout = layout;
                                selectedItem.form_id = "";
                                selectedItem.form_key = "";
                                setSelectedItem(selectedItem);
                                typeOrDatalistType(selectedItem);
                                toastEmitter("Select Form", true, "warning");
                            }
                        } else {
                            toastEmitter(
                                "Form is not selected in this datalist",
                            );
                        }
                    }
                });
        });
    }

    function formDesign(selectedForm, _selectedItem, parseDataListLayout) {
        try {
            let parseFormLayout;
            let newFormFields;
            if (selectedForm.enable_multipage === "YES") {
                const multiFormArray = tryToParse(
                    selectedForm.multipage_design,
                );
                const components = {};
                for (let singleForm of multiFormArray) {
                    if (singleForm?.design?.components)
                        for (let key in singleForm.design.components) {
                            components[key] = singleForm.design.components[key];
                        }
                }
                // multiFormArray.forEach(singleForm => {

                // });
                newFormFields = getNewAddFieldFromForm(components);
            } else {
                parseFormLayout = tryToParse(selectedForm.design);

                newFormFields = getNewAddFieldFromForm(
                    parseFormLayout.components,
                );
            }

            let dataListSelectedField = returnDatalistOrFormUpdatedFields(
                parseDataListLayout.selected_fields,
                newFormFields,
            );

            setSelectedForm(selectedForm);
            const afterFilteredFiedls = deleteExtraField(dataListSelectedField);

            handleSetSelectedFormOrData(
                afterFilteredFiedls,
                parseDataListLayout.actions,
                selectedForm,
                _selectedItem,
            );
            typeOrDatalistType(_selectedItem);
        } catch (error) {
            toastEmitter(error, true, "error");
            console.log(error);
        }
    }

    function checkBoxesSelection(selected) {
        let selectedItem = structuredClone(selected);
        let customChecked;
        let defaultChecked;
        let fieldsChecked;
        let layout =
            typeof selectedItem.layout === "string"
                ? JSON.parse(selectedItem.layout)
                : selectedItem.layout;
        let allActions = structuredClone(layout?.actions);
        let formFields = structuredClone(layout?.selected_fields);

        if (Array.isArray(allActions) && allActions.length > 0) {
            const defaultAction = allActions.filter(
                item => item.type === "default",
            );
            const customAction = allActions.filter(
                item => item?.type === "custom",
            );

            if (defaultAction && defaultAction.length < 1) {
                defaultChecked = false;
            } else {
                defaultChecked = defaultAction.every(item => item.selected);
            }

            if (customAction && customAction.length < 1) {
                customChecked = false;
            } else {
                customChecked = customAction.every(item => item.selected);
            }
        }

        if (formFields && formField.length > 0) {
            if (formFields && formFields.length < 1) {
                fieldsChecked = false;
            } else {
                fieldsChecked = formFields.every(item => item.selected);
            }
        }

        setDefaultAction(defaultChecked);
        setCustomAction(customChecked);
        setFormFieldCheck(fieldsChecked);
    }

    function customActionFilter(actions) {
        let updatedCustomActions = [];
        actions.forEach(action => {
            if (action.type !== "default") {
                action.code = action.id;
                updatedCustomActions.push(action);
            }
        });
        let defaultActions = actions.filter(
            action => action.type === "default",
        );

        return [...defaultActions, ...updatedCustomActions];
    }

    function actionFilteredOrAdd(parseDataListLayout, selectedItem) {
        let _newActionUpdate = {};
        parseDataListLayout.actions.forEach(action => {
            _newActionUpdate[action.code] = action;
        });

        DEFAULTACTIONS.forEach((item, i) => {
            if (_newActionUpdate[item.code] === undefined) {
                parseDataListLayout.actions.push(item);
            }
        });

        if (
            selectedItem.datalist_type === "TABLE" ||
            selectedItem.datalist_type === "" ||
            selectedItem.datalist_type === undefined
        ) {
            parseDataListLayout.actions = parseDataListLayout.actions.filter(
                item => item.code !== "save",
            );
        } else if (selectedItem.datalist_type !== "TABLE") {
            parseDataListLayout.actions = parseDataListLayout.actions.filter(
                item => item.code !== "edit",
            );
        }

        if (selectedItem.type === "SQL") {
            let excludeActions = selectedItem.form_id
                ? ["save"]
                : ["edit", "add", "delete", "save"];
            parseDataListLayout.actions = parseDataListLayout.actions.filter(
                item => !excludeActions.includes(item.code),
            );
        }

        parseDataListLayout.actions.forEach((item, index) => {
            item.type = item.type === undefined ? "default" : item.type;
        });

        parseDataListLayout.actions;

        return parseDataListLayout;
    }

    function typeOrDatalistType(selectedItem) {
        let _datalistType = [...datalistType];
        _datalistType.forEach(item => {
            if (item.name === selectedItem.datalist_type) {
                item.selected = true;
            } else {
                item.selected = false;
            }
        });

        setDatalistType(_datalistType);
    }

    function returnDatalistOrFormUpdatedFields(datalistFields, formFields) {
        const datalistFieldMap = new Map();
        const formFieldMap = new Map();
        const resultFields = [];
        const notIncludeFields = [
            "datecreated",
            "datemodified",
            "createdby",
            "modifiedby",
        ];
        formFields.forEach(field => {
            formFieldMap.set(field.id, field);
        });

        datalistFields.forEach((item, index) => {
            const formField = formFieldMap.get(item.id);
            if (formField) {
                // updated case of field in datalist
                if (formField?.type !== "daterange") {
                    item.label = item.label ? item.label : formField.label;
                    item.db_column = formField.db_column;
                    datalistFieldMap.set(item.id, item);
                } else {
                    item.label = item.label ? item.label : formField.label;
                    item.db_column = formField.db_column;
                    datalistFieldMap.set(item.id, item);
                }
            } else if (
                !formField &&
                notIncludeFields.includes(item.db_column)
            ) {
                datalistFieldMap.set(item.id, item);
            } else {
                datalistFields.splice(index, 1);
            }
        });

        for (const [key, value] of formFieldMap.entries()) {
            if (!datalistFieldMap.get(key)) {
                const field = makeFormField(value);
                datalistFieldMap.set(key, field);
            }
        }

        for (const [key, value] of datalistFieldMap.entries()) {
            resultFields.push(value);
            // if (key && key.length > 5) resultFields.push(value);
        }

        return resultFields;
    }

    function makeFormField(value) {
        try {
            let deSelect = value.selected ? value.selected : false;
            var formField = {
                db_column: value.db_column,
                disabled: value.disabled,
                id: value.id,
                label: value.label,
                selected: deSelect,
                type: value.type,
                include: "",
                serviceParam: "",
                expression: "",
                isHtml: "",
                isFilter: "",
                aggregate: "",
            };
        } catch (error) {
            console.log(error);
        }

        return formField;
    }

    function getNewAddFieldFromForm(formFields) {
        let filterFields = [];
        const deletedFormKeys = ["max_characters", "value"];
        const deletedDatalistKeys = ["max_characters"];
        const notAllowField = [
            "datalist",
            "HTML",
            "datetime",
            "carousel",
            // "daterange",
            "imageview",
            "fileuploader",
            "hiddenfield",
        ];

        for (let key in formFields) {
            let formField = formFields[key].data;
            formField.type = formFields[key].type;
            formField.id = key;
            formField.selected = false;

            if (formField && notAllowField.includes(formField.type)) {
                formField.disabled = true;
                formField.selected = false;
                filterFields.push(formField);
            } else if (
                formField &&
                formField.db_column &&
                formField.label &&
                formField.type !== "datalist"
            ) {
                for (let key of deletedFormKeys) {
                    delete formField[key];
                }

                formField.disabled = false;
                filterFields.push(formField);
            } else if (formField.type === "datalist") {
                for (let key of deletedDatalistKeys) {
                    delete formField[key];
                }

                try {
                    let datalistObj = JSON.parse(formField.value);
                    formField.label = datalistObj.name;
                    formField.disabled = true;
                    filterFields.push(formField);
                } catch (error) {
                    console.log(error);
                }
            } else if (formField.type === "daterange") {
                let startDate = {
                    id: `${key}:start`,
                    db_column: formField.start_db_column,
                    selected: false,
                    isHtml: false,
                    isFilter: false,
                    serviceParam: false,
                    expression: "",
                    aggregate: "",
                    type: formField.type,
                    include: true,
                    disabled: true,
                    label: formField.start_db_column,
                };
                let endDate = {
                    id: `${key}:end`,
                    db_column: formField.end_db_column,
                    selected: false,
                    isHtml: false,
                    isFilter: false,
                    serviceParam: false,
                    expression: "",
                    aggregate: "",
                    type: formField.type,
                    include: true,
                    disabled: true,
                    label: formField.end_db_column,
                };
                filterFields.push(startDate);
                filterFields.push(endDate);
            }
        }

        return filterFields ? filterFields : [];
    }

    function handleSelectedFormFieds(selectedKey) {
        let arr = [];
        let selectedForm = selectedItem.layout.selected_fields;
        let actions = selectedItem.layout.actions;
        selectedForm.forEach(form => {
            if (form.id === selectedKey) {
                form.selected = !form.selected;
                arr.push(form);
            } else {
                arr.push(form);
            }
        });
        let layout = {
            selected_fields: arr,
            actions: actions,
        };

        setSelectedItem(prev => ({
            ...prev,
            layout: layout,
        }));
        checkBoxesSelection(selectedItem);
    }

    function handleAction(code, checked) {
        let selected_fields =
            selectedItem && selectedItem.layout.selected_fields
                ? [...selectedItem.layout.selected_fields]
                : [];
        let _actions =
            selectedItem && selectedItem.layout.actions
                ? [...selectedItem.layout.actions]
                : DEFAULTACTIONS;

        _actions.forEach(act => {
            if (act.code === code) {
                act.selected = checked;
            }
        });
        let layout = {
            selected_fields: selected_fields,
            actions: _actions,
        };

        setSelectedItem(prev => ({
            ...prev,
            layout: layout,
        }));
        checkBoxesSelection(selectedItem);
    }

    function selectedFormData(id, actions) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "selectedform",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.selectedform) {
                        onFormChange(
                            response.data.C_DATA.selectedform,
                            actions,
                        );
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function handleSelectedForms(e) {
        setDefaultAction(false);
        setCustomAction(false);
        setFormFieldCheck(false);
        const layout = tryToParse(selectedItem.layout);
        let actions = layout.actions;
        let value = e.target.value;
        let selected = { ...selectedItem };
        let formFetch = true;
        if (selectedItem.type === "FORM" || selectedItem.type === "") {
            if (value === "") {
                selected = {
                    ...selectedItem,
                    layout: {
                        ...prev.layout,
                        selected_fields: [],
                    },
                    form_id: "",
                };
            } else {
                selectedFormData(value, actions);
                formFetch = false;
            }
        } else {
            if (selectedItem.type === "SQL" && value) {
                actions = [...initialState.layout.actions];
                // actions = actions.filter(item => item.code !== "save");
            }

            if (value === "") {
                selected = {
                    ...selectedItem,
                    form_id: "",
                };
                // addNewItem();
            } else {
                let layout = {
                    selected_fields: selectedItem.layout.selected_fields,
                    actions: actions,
                };
                const _selectedForm = await getFormById(value);
                selected = {
                    ...selectedItem,
                    form_id: value,
                    form_key: _selectedForm.form_key,
                    table: _selectedForm.table,
                    layout: layout,
                };
            }
        }
        if (formFetch) {
            setSelectedItem(selected);
            // saveData(selected);
        }
    }

    const getFormById = async id => {
        let obj = {
            keys: [
                {
                    params: id,
                    dataKey: "form",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
            url: API_URL + "?service.key=masterKey.tenantData",
            datasource: "",
            tenant_id: tenantId,
        };
        const res = await _Data(obj);
        return res?.data?.C_DATA?.form[0];
    };

    function onFormChange(formObj, actions) {
        let types = [
            "richtext",
            "imageview",
            "signature",
            "select",
            "subform",
            "carousel",
            "fileuploader",
            "HTML",
        ];
        let parseFormData;
        let components = {};
        let table = "";
        try {
            let _selectedForm = formObj;
            if (_selectedForm[0].enable_multipage === "YES") {
                _selectedForm[0].multipage_design = tryToParse(
                    _selectedForm[0].multipage_design,
                );
                _selectedForm[0].multipage_design.forEach(single_design => {
                    for (let key in single_design.design.components) {
                        components[key] = single_design.design.components[key];
                    }
                });
            } else {
                let design = _selectedForm[0].design;
                parseFormData = JSON.parse(design);
                components = parseFormData.components;
            }
            table = _selectedForm[0].table;
        } catch (error) {
            console.log(error);
        }
        let arr = [];
        for (let key in components) {
            if (components[key].type !== "daterange") {
                var obj = formField(
                    key,
                    components[key].data,
                    components[key].type,
                );
            }
            if (types.includes(components[key].type)) {
                arr.push(obj);
            } else if (components[key].type === "daterange") {
                const userInputConfig = components[key].data;
                let startObj = formField(
                    `${key}:start`,
                    {
                        db_column: userInputConfig.start_db_column,
                        label: userInputConfig.start_db_column,
                    },
                    "daterange",
                );
                let endObj = formField(
                    `${key}:end`,
                    {
                        db_column: userInputConfig.end_db_column,
                        label: userInputConfig.end_db_column,
                    },
                    "daterange",
                );
                arr.push(startObj);
                arr.push(endObj);
            } else {
                if (components[key].type === "datalist") {
                    try {
                        let _formDatalist = tryToParse(
                            components[key].data.value,
                        );
                        obj.label = _formDatalist.name;
                        arr.push(obj);
                    } catch (error) {}
                } else {
                    obj.disabled = false;
                    arr.push(obj);
                }
            }
        }
        let newFields = addedFields(arr);
        arr = [...newFields];

        let layout = {
            selected_fields: arr,
            actions: actions,
        };
        const selected = {
            ...selectedItem,
            form_id: formObj[0].id,
            form_key: formObj[0].form_key,
            form_name: formObj[0].name,
            layout: layout,
            table: table,
        };
        setSelectedItem(selected);
        // saveData(selected);
    }

    function formField(key, item, type) {
        return {
            id: key,
            db_column: item.db_column,
            selected: false,
            isHtml: false,
            isFilter: false,
            serviceParam: false,
            expression: "",
            aggregate: "",
            type: type,
            include: true,
            disabled: true,
            label: item.label,
        };
    }

    async function updateFormFields() {
        let components = {};

        const req = {
            dataKeys: [
                {
                    serviceParams: selectedItem.form_id,
                    dataKey: "selectedform",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
        };
        const url = API_URL + "?service.key=masterKey.tenantData";

        const res = await axios.post(url, req);

        // request end

        if (res?.data?.C_DATA?.selectedform) {
            // convert fields to components
            components = singleOrMultiForm(res.data.C_DATA.selectedform);
        }
        const layout = tryToParse(selectedItem.layout);
        const datalistFields = layout.selected_fields;
        let formFields = [];

        formFields = getNewAddFieldFromForm(components);

        const result = returnDatalistOrFormUpdatedFields(
            datalistFields,
            formFields,
        );
        setSelectedItem(prev => ({
            ...prev,
            layout: {
                ...prev.layout,
                selected_fields: result,
            },
        }));
        toastEmitter("Fields updated", true);
    }

    function singleOrMultiForm(formObj) {
        let _selectedForm = formObj;
        let components = {};
        let parseFormData;
        let design;
        if (_selectedForm[0].enable_multipage === "YES") {
            _selectedForm[0].multipage_design = tryToParse(
                _selectedForm[0].multipage_design,
            );
            _selectedForm[0].multipage_design.forEach(single_design => {
                for (let key in single_design?.design?.components) {
                    components[key] = single_design.design.components[key];
                }
            });
        } else {
            design = _selectedForm[0].design;
            parseFormData = JSON.parse(design);
            components = parseFormData.components;
        }
        return components;
    }

    function handleValidation(selectedItem) {
        let _error = [];
        const showType = selectedItem.type;

        let keys = [
            "id",
            "table",
            "sql",
            "form_id",
            "primary_key",
            "orderby",
            "orderbyfield",
            "defaultpage",
            "orderby",
            "datasource",
            "filter_condition",
            "refresh_interval",
            "full_refresh",
            "tags",
            "view",
            "gallery_columns",
            "datalist_export_type",
        ];
        if (selectedItem.type === "SQL") {
            let index = keys.findIndex(item => item === "datalist_type");
            if (index === -1) keys.push("datalist_type");
        }
        let sqlKeys = ["sql", "primary_key"];
        if (selectedItem) {
            let _selectedItem = structuredClone(selectedItem);
            let reqFieldsOnly = Object.keys(initialState);
            for (let key in _selectedItem) {
                if (!reqFieldsOnly.includes(key)) {
                    delete _selectedItem[key];
                }
            }
            selectedItem = _selectedItem;
        }

        let formKeys = ["form_id", "datalist_type"];
        for (let key in selectedItem) {
            if (selectedItem[key] === "" && !keys.includes(key)) {
                _error.push(key);
            } else if (
                showType === "SQL" &&
                sqlKeys.includes(key) &&
                selectedItem[key] === ""
            ) {
                _error.push(key);
            } else if (
                showType === "FORM" &&
                formKeys.includes(key) &&
                selectedItem[key] === ""
            ) {
                _error.push(key);
            }
        }

        setError(_error);
        console.log(_error);
        return checkValidateOrNot(_error);
    }

    function checkValidateOrNot(object) {
        let flag = true;
        try {
            for (let key in object) {
                if (key) {
                    flag = false;
                    break;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return flag;
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputRef.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        const keysToSearch = ["name", "db_column", "_form_name"];
        let result = [];
        result = filterArrayByTerms(dataList, textToSearch, keysToSearch);
        setFilteredDataList(result);
    };

    function defaultActions(term) {
        if (
            selectedItem &&
            selectedItem.layout &&
            selectedItem.layout.selected_fields
        ) {
            let selectedFields = [...selectedItem.layout.selected_fields];
            let selectedActions = [...selectedItem.layout.actions];
            const sqlHideDefaulAction = selectedItem.form_id
                ? ["save"]
                : ["add", "edit", "delete", "save"];
            const formHideDefaulAction = ["save"];
            const gridHideDefaulAction = ["edit"];
            {
                if (
                    selectedItem.type === "FORM" &&
                    selectedItem.datalist_type === "TABLE"
                ) {
                    selectedActions = selectedActions.filter(
                        item => !formHideDefaulAction.includes(item.code),
                    );
                    selectedActions.forEach(field => {
                        if (field.type === "default") {
                            field.selected = term;
                        }
                    });
                } else if (selectedItem.type === "SQL") {
                    selectedActions = selectedActions.filter(
                        item => !sqlHideDefaulAction.includes(item.code),
                    );
                    selectedActions.forEach(field => {
                        if (field.type === "default") {
                            field.selected = term;
                        }
                        // else {
                        //     field.selected = false;
                        // }
                    });
                } else if (selectedItem.datalist_type === "EDITABLE-GRID") {
                    selectedActions = selectedActions.filter(
                        item => !gridHideDefaulAction.includes(item.code),
                    );
                    selectedActions.forEach(field => {
                        if (field.type === "default") {
                            field.selected = term;
                        }
                    });
                }

                let layout = {
                    selected_fields: [...selectedFields],
                    actions: [...selectedActions],
                };
                setSelectedItem(prev => ({
                    ...prev,
                    layout: layout,
                }));
            }
        }
    }

    function customActions(term) {
        if (
            selectedItem &&
            selectedItem.layout &&
            selectedItem.layout.selected_fields
        ) {
            let selectedFields = [...selectedItem.layout.selected_fields];
            let selectedActions = [...selectedItem.layout.actions];
            {
                selectedActions.forEach(field => {
                    if (field.type === "custom") {
                        field.selected = term;
                    }
                });

                let layout = {
                    selected_fields: [...selectedFields],
                    actions: [...selectedActions],
                };
                setSelectedItem(prev => ({
                    ...prev,
                    layout: layout,
                }));
            }
        }
    }

    function formFieldSelection(term) {
        if (
            selectedItem &&
            selectedItem.layout &&
            selectedItem.layout.selected_fields
        ) {
            let selectedFields = [...selectedItem.layout.selected_fields];
            let selectedActions = [...selectedItem.layout.actions];
            const notIncludedType = {
                datalist: true,
                HTML: true,
                imageview: true,
                // daterange: true,
            };
            {
                selectedFields.forEach(field => {
                    if (notIncludedType[field.type]) {
                        field.selected = false;
                        field.disabled = true;
                    } else {
                        field.selected = term;
                    }
                });

                let layout = {
                    selected_fields: [...selectedFields],
                    actions: [...selectedActions],
                };
                setSelectedItem(prev => ({
                    ...prev,
                    layout: layout,
                }));
            }
        }
    }

    function handleSelectedExport(selectedItem, check) {
        let _datalist = [...filteredDataList];
        let index = _datalist.findIndex(item => item.id === selectedItem.id);
        let _selectedItem = _datalist[index];
        _selectedItem.selected = check;
        _datalist[index] = _selectedItem;
        setFilteredDataList(_datalist);
    }

    async function selectedRecordExport() {
        let selectedDatalistFormIds = [];
        let selectedDatalistIds = [];
        const selectedDatalistForms = [];
        const _selectedDatalists = [];
        const _selectedDatalistForms = [];

        const selectedDatalists = filteredDataList.filter(
            datalist => datalist.selected === true,
        );

        const ids = getIds(selectedDatalists);

        selectedDatalistFormIds = ids.formIds;
        selectedDatalistIds = ids.datalistIds;
        const res = await getItems(
            selectedDatalistFormIds,
            selectedDatalistIds,
        );
        for (let key in res.data.C_DATA) {
            const item = res.data.C_DATA[key][0];
            if (key.includes("datalist:")) {
                delete item.selected;
                _selectedDatalists.push(item);
            } else {
                selectedDatalistForms.push(item);
            }
        }

        selectedDatalistForms.forEach(form => {
            delete form.selected;
            _selectedDatalistForms.push(form);
        });
        if (selectedDatalists && selectedDatalists.length === 1) {
            const title = selectedDatalists[0].name;

            JsonToCsv(
                [
                    {
                        datalists: _selectedDatalists,
                        forms: _selectedDatalistForms,
                    },
                ],
                title + "_datalist",
            );
        } else if (_selectedDatalists && _selectedDatalists.length > 1) {
            setExportFile([
                {
                    datalists: _selectedDatalists,
                    forms: _selectedDatalistForms,
                },
            ]);
            modalRef.current.show();
        } else {
            toastEmitter("Select atleast one datalist", true, "warning");
        }
    }

    function getIds(selectedDatalists) {
        const missingFormDatalists = {};
        const selectedDatalistFormIds = [];
        const datalistIds = [];

        selectedDatalists.forEach(datalist => {
            datalistIds.push(datalist.id);
            if (datalist.type === "FORM" && datalist.form_id) {
                selectedDatalistFormIds.push({
                    datalistId: datalist.id,
                    form_id: datalist.form_id,
                });
            } else if (datalist.type === "SQL" && datalist.form_id)
                selectedDatalistFormIds.push({
                    datalistId: datalist.id,
                    form_id: datalist.form_id,
                });
            if (datalist.type === "FORM" && datalist.form_id === "") {
                missingFormDatalists[datalist.db_column] = datalist.name;
            }
        });
        return {
            datalistIds,
            formIds: selectedDatalistFormIds,
            missingForms: missingFormDatalists,
        };
    }

    function getItems(formIds, datalistIds) {
        const request = {
            keys: [],
            url: API_URL + "?service.key=masterKey.tenantData",
            datasource: "",
            tenant_id: tenantId,
        };

        datalistIds.forEach(id => {
            let config = {
                params: id,
                dataKey: `datalist:${id}`,
                serviceKey: "sys.datalist.export",
                mode: "formData",
            };
            request.keys.push(config);
        });
        formIds.forEach(form => {
            let config = {
                params: form.form_id,
                dataKey: `form:${form.datalistId}`,
                serviceKey: "sys.form",
                mode: "formData",
            };
            request.keys.push(config);
        });
        return new Promise((resolve, reject) => {
            const formsRes = _Data(request);
            resolve(formsRes);
        });
    }

    const getSelectedItem = item => {
        var dataRequest = {};
        const serviceKey =
            item.type === "FORM"
                ? "sys.selected.datalist"
                : "sys.selected.datalist.sql";
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: item.id,
                    dataKey: "selectedDataList",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };
        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        resolve(response);
                    } else {
                        resolve(false);
                    }
                });
        });
    };

    async function cloneDatalist(item) {
        try {
            let res = await getSelectedItem(item);
            const _selectedItem = res.data.C_DATA.selectedDataList[0];
            _selectedItem.layout = tryToParse(_selectedItem.layout);
            if (res) {
                setSelectedItem({
                    ..._selectedItem,
                    id: "",
                    name: "",
                    db_column: "",
                });
            }
        } catch (error) {
            console.log(error);
        }
    }

    function nameExport(title) {
        JsonToCsv(exportFile, title + "_datalist");
        modalRef.current.close();
    }

    return (
        <div className="datalist s2a-datalist-designer">
            <ChildrenModal
                ref={modalRef}
                header="Export Datalists">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <ModalBox
                header="Confirm"
                state={showModalComp}
                message={`Are you sure to delete ${showModalComp.item.name}?`}
                operation={deleteData}
                setState={setShowModalComp}
            />
            <ChildrenModal
                ref={importModalRef}
                header="Import Datalist">
                <DatalistImport
                    importModalRef={importModalRef}
                    getData={getData}
                />
            </ChildrenModal>
            <div className="">
                {/* Header */}
                {designMode === true ? (
                    <div className="col-sm-9 d-flex align-self-center p-2 ps-0">
                        <div className="col-sm-6 fw-bold">
                            {selectedItem.name}
                        </div>
                    </div>
                ) : (
                    <></>
                )}
                {/* Views */}
                {!designMode && (
                    <>
                        <div className="row m-0">
                            <div className="col-sm-3 listing-col s2a-border-right">
                                <SearchAndBtns
                                    title={
                                        `Datalists (` +
                                        filteredDataList?.length +
                                        ")"
                                    }
                                    handleImport={handleShowCsv}
                                    handleExport={selectedRecordExport}
                                    addNewItem={addNewItem}
                                    handleSearch={handleSearch}
                                    inputRef={inputRef}
                                    SearchPlaceHolder="Search id, name & form"
                                />
                                <Scroll height="48vh">
                                    <Listing
                                        items={filteredDataList}
                                        selectedItem={selectedItem}
                                        handleSetSelectedDataList={
                                            handleSetSelectedDataList
                                        }
                                        deleteData={deleteData}
                                        handleSelectedExport={
                                            handleSelectedExport
                                        }
                                        cloneDatalist={cloneDatalist}
                                    />
                                </Scroll>
                            </div>
                            <div className="col-sm-9 p-0">
                                <DataListForm
                                    tenantId={tenantId}
                                    selectedItem={selectedItem}
                                    handleInputField={handleInputField}
                                    formList={formList}
                                    handleSelectedFormFieds={
                                        handleSelectedFormFieds
                                    }
                                    handleAction={handleAction}
                                    saveData={saveData}
                                    handleSelectedForms={handleSelectedForms}
                                    setShowModal={setShowModal}
                                    setDesignMode={setDesignMode}
                                    clearFields={clearFields}
                                    error={error}
                                    defaultActions={defaultActions}
                                    types={types}
                                    setSelectedItem={setSelectedItem}
                                    orders={Orders}
                                    pages={Pages}
                                    instanceItems={instanceItems}
                                    checkObject={checkObject}
                                    handleType={handleType}
                                    showAction={showAction}
                                    setShowAction={setShowAction}
                                    showBulkAction={showBulkAction}
                                    setShowBulkAction={setShowBulkAction}
                                    setDefaultAction={setDefaultAction}
                                    defaultAction={defaultAction}
                                    customActions={customActions}
                                    customAction={customAction}
                                    setCustomAction={setCustomAction}
                                    setFormFieldCheck={setFormFieldCheck}
                                    formFieldCheck={formFieldCheck}
                                    formFieldSelection={formFieldSelection}
                                    emailService={emailService}
                                    processCategory={processCategory}
                                    handleDatalistType={handleDatalistType}
                                    handleDatalistExportType={
                                        handleDatalistExportType
                                    }
                                    datalistType={datalistType}
                                    dataList={dataList}
                                    updateFormFields={updateFormFields}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showModal === true && (
                <>
                    <DataListModal
                        selectedItem={selectedItem}
                        selectedForm={selectedForm}
                        showModal={showModal}
                        setShowModal={setShowModal}
                        // getData={getData}
                        // datalist_id={selectedItem && selectedItem.id}
                        // type={selectedItem && selectedItem.type}
                    />
                </>
            )}
        </div>
    );
}

export default DataList;

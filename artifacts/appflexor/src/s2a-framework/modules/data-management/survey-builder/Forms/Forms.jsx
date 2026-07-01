import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../Config";
import { TablePagination } from "../../../../components/TablePagination/TablePagination";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    JsonToCsv,
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
} from "../../../../utils/utils";
import CsvModal from "../../datalist-builder/custom-action-modal/CsvModal";
import FormContext from "../Context/FormContext";
import Designer from "../Designer";
import { modeType } from "../Designer/Designer";
import RenderPreview from "../Designer/RenderPreview";

const INITIAL_STATE = {
    id: "new",
    form_key: "",
    name: "",
    table: "",
    design: {
        layout: [],
        components: {},
        images: {},
        htmlCollection: {},
    },
    datasource: "",
    schema: [],
    create_sequence: "NO",
    useprefix: "YES",
};

function Survey(props) {
    const [layout, setLayout] = useState([]);
    const [formList, setFormList] = useState([]);
    const [components, setComponents] = useState({});
    const [images, setImages] = useState({});
    const [htmlCollection, setHtmlCollection] = useState({});
    const [selectedForm, setSelectedForm] = useState(INITIAL_STATE);
    const [filteredFormList, setFilteredFormList] = useState([]);
    const [createSequence, setCreateSequence] = useState(false);
    const [usePrefix, setUsePrefix] = useState(true);
    const [instanceItems, setInstanceItems] = useState([]);
    const [mode, setMode] = useState(modeType.render);
    const [error, setError] = useState([]);
    const [message, setMessage] = useState("");
    const [canDesign, setCanDesign] = useState("");
    const [designMode, setDesignMode] = useState(false);
    const [renderPreview, setRenderPreview] = useState(false);
    const [formTab, setFormTab] = useState("");
    const [current, setCurrent] = useState(1);
    const [searchField, setSearchField] = useState("");
    const [csvModal, setCsvModal] = useState(false);
    const [showDatasource, setShowDatasource] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);

    const inputRef = useRef(null);

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        if (props && props.mode) {
            setMode(props.mode);
        } else {
            setMode(modeType.render);
        }

        if (props && props.activeTab && props.activeTab.forms === "true") {
            setFormTab(props.activeTab.forms);
        } else if (
            props &&
            props.activeTab &&
            props.activeTab.forms === "false"
        ) {
            setFormTab(props.activeTab.forms);
        }
    }, [props]);

    useEffect(() => {
        if (formTab) {
            setDesignMode(false);
            getData();
        }
    }, [formTab]);

    function addNewItem() {
        setLayout([]);
        setComponents({});
        setImages({});
        setHtmlCollection({});
        setError([]);
        setSelectedForm(INITIAL_STATE);
        setCanDesign("");
        setCreateSequence(false);
        setUsePrefix(true);
        setShowDatasource(false);
    }

    function clearFields() {
        addNewItem();
    }

    function validation(selectedForm) {
        let _error = [];

        let keysToCheck = ["name", "form_key", "table"];

        keysToCheck.map(key => {
            if (selectedForm[key] === "") {
                _error.push(key);
            }
        });

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function handleUpdateData() {
        let temp = { ...selectedForm };
        temp.design = {};

        temp.design = {
            layout: layout,
            components: components,
            images: images,
            htmlCollection: htmlCollection,
        };
        setSelectedForm(temp);
        saveData(temp);
    }

    // event handlers
    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedForm(prev => ({
            ...prev,
            [name]: value,
        }));
        if (name === "datasource") {
            if (value === "") {
                setUsePrefix(true);
            }

            if (value !== "") {
                setShowDatasource(true);
            } else {
                setShowDatasource(false);
            }
        }
    }

    function handleCheckBoxEvents(event) {
        let name = event.target.name;
        let checked = event.target.checked;
        if (name == "create_sequence") {
            setCreateSequence(checked);
        } else if (name == "useprefix") {
            setUsePrefix(checked);
        }
    }

    function getUpdatedState(id, arr) {
        let obj = {};
        let foundObj = arr.filter(el => el.id === id);

        if (foundObj.length > 0) {
            obj = foundObj[0];
        }
        return obj;
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputRef.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        setSearchField(event.target.value);
        const keysToSearch = ["name", "table", "form_key"];
        let result = [];
        result = filterArrayByTerms(formList, textToSearch, keysToSearch);
        setFilteredFormList(result);
        if (textToSearch.length > 2) {
            setCurrent(1);
        }
    };

    function handleFormSelect(form) {
        setError([]);
        // form.table_prefix = form.table_prefix ? form.table_prefix : "app_fd_";
        // form.column_prefix = form.column_prefix ? form.column_prefix : "c_";
        setSelectedForm(form);
        setImages(form.design.images);
        setHtmlCollection(form.design.htmlCollection);
        setLayout(form.design.layout);
        setComponents(form.design.components);

        if (form.datasource === "" || form.datasource === undefined) {
            setShowDatasource(false);
        } else {
            setShowDatasource(true);
        }

        if (
            form.create_sequence === undefined ||
            form.create_sequence === "" ||
            form.create_sequence === "NO"
        ) {
            setCreateSequence(false);
        } else if (form.create_sequence === "YES") {
            setCreateSequence(true);
        }

        if (
            form.useprefix === undefined ||
            form.useprefix === "" ||
            form.useprefix === "YES"
        ) {
            setUsePrefix(true);
        } else if (form.useprefix === "NO") {
            setUsePrefix(false);
        }
    }

    function handleCanDesign() {
        if (selectedForm.id === "" || selectedForm.id === "new") {
            setCanDesign("Form needs to be saved first before designing.");
            setDesignMode(false);

            setTimeout(() => {
                setCanDesign("");
            }, 3000);
        } else {
            setCanDesign("");
            setDesignMode(true);
        }
    }

    function duplicateSelectedForm(form) {
        const _layout = [...form.design.layout];
        const _components = { ...form.design.components };
        const _images = { ...form.design.images };
        const _htmlCollection = { ...form.design.htmlCollection };
        const _duplicatedFrom = {
            id: "new",
            form_key: "",
            name: "",
            datasource: form.datasource,
            table_prefix: form.table_prefix,
            column_prefix: form.column_prefix,
            table: form.table,
            design: {
                layout: _layout,
                components: _components,
                images: _images,
                htmlCollection: _htmlCollection,
            },
        };
        if (form.datasource === "" || form.datasource === undefined) {
            setShowDatasource(false);
        } else {
            setShowDatasource(true);
        }
        setLayout(_layout);
        setComponents(_components);
        setImages(_images);
        setHtmlCollection(_htmlCollection);
        setSelectedForm(_duplicatedFrom);

        setMessage("Form duplicated successfully!");
        setTimeout(() => {
            setMessage("");
        }, 3000);
    }

    // utils

    function filterIt(arr = [], terms = "", keysToSearch = []) {
        if (terms.length < 3) return arr;

        const onlyAlphabetsAndPeriod = /^[a-zA-Z\s\.\_]+$/;
        const regexExp = new RegExp(onlyAlphabetsAndPeriod);

        let strToValidate = terms;
        let strIsValid = regexExp.test(strToValidate);

        if (strIsValid) {
            let words = terms.match(/\w+|"[^"]+"/g);
            if (words) {
                words.push(terms);
                let searchResults = arr.filter(currentObj => {
                    let tempObj = {};
                    for (const property in currentObj) {
                        if (keysToSearch.includes(property)) {
                            tempObj[property] = currentObj[property];
                        }
                    }
                    const allValues = Object.values(tempObj);
                    const f = JSON.stringify(allValues).toLowerCase();
                    let hasValue = words.every(val => f.includes(val));
                    return hasValue;
                });
                return searchResults;
            }
        }

        return arr;
    }

    function generateSchema(components, currentSchema = []) {
        // let updatedSchema = [...currentSchema];
        let updatedSchema = [];

        for (const property in components) {
            let currentComonent = components[property];
            let temp = {};
            temp.name = currentComonent.data.db_column;
            temp.type = currentComonent.type;
            if (updatedSchema.filter(e => e.name === temp.name).length === 0) {
                if (temp.name !== undefined) {
                    updatedSchema.push(temp);
                }
            }
        }

        return updatedSchema;
    }

    const isObjectEmpty = objectName => {
        return Object.keys(objectName).length === 0;
    };

    // API calls

    function saveData(_obj) {
        let obj = { ..._obj };
        // checks if value of `createSequence` is "YES" from DB and not from state
        if (obj.create_sequence === undefined || obj.create_sequence === "") {
            if (createSequence) {
                obj.create_sequence = "YES";
            } else {
                obj.create_sequence = "NO";
            }
        } else {
            obj.create_sequence = createSequence ? "YES" : "NO";
        }

        // checks if value of `usePrefix` is "YES" from DB and not from state
        if (obj.useprefix === undefined || obj.useprefix === "") {
            if (usePrefix) {
                obj.useprefix = "YES";
            } else {
                obj.useprefix = "NO";
            }
        } else {
            obj.useprefix = usePrefix ? "YES" : "NO";
        }

        if (obj.design.components) {
            obj.schema = generateSchema(obj.design.components, obj.schema);
        }

        if (validation(obj)) {
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "app_survey"; //"formid"
            entityForm.entity = "app_survey"; //Db- "table name"
            entityForm.action = "update";

            if (!obj.id || obj.id == "" || obj.id == "new") {
                entityForm.id = "new";
                obj.id = "new";
            } else {
                entityForm.id = obj.id;
            }

            entityForm.formData = obj;
            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                        let formId = response.data.C_DATA[0].formData.id;

                        validateSchema(formId);

                        if (
                            (selectedForm.id === "new" ||
                                selectedForm.id === "") &&
                            formId
                        ) {
                            setSelectedForm(prev => ({
                                ...prev,
                                id: formId,
                            }));
                        }

                        toastEmitter(
                            `${selectedForm.name} saved successfully.`,
                            3000,
                            "warn",
                        );

                        getData();
                    }
                });
            } catch (e) {
                console.log("saveData error:" + e);
            }
        } else {
            return;
        }
    }

    function deleteData(item) {
        if (window.confirm("Are you sure to delete?") == true) {
            let fieldsData = item;
            // let deleteRecordChannelId = fieldsData.channel

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_survey";
            entityForm.entity = "app_survey";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "surveyList",
                    serviceKey: "sys.survey",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.instance",
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
                    if (response.data.C_DATA.surveyList) {
                        let _surveyList = response.data.C_DATA.surveyList;

                        _surveyList.map(item => {
                            if (item.design) {
                                let _design = tryParseJSONObject(item.design, {
                                    layout: [],
                                    components: {},
                                    images: {},
                                    htmlCollection: {},
                                });

                                item.design = _design;

                                // setLayout(_design.layout);
                                // setComponents(_design.components);
                            }
                        });

                        setFormList(_surveyList);
                        const keysToSearch = ["name", "table", "form_key"];
                        if (
                            inputRef &&
                            inputRef.current &&
                            inputRef.current.value
                        ) {
                            let result = filterArrayByTerms(
                                _surveyList,
                                inputRef.current.value,
                                keysToSearch,
                            );
                            setFilteredFormList(result);
                        } else {
                            setFilteredFormList(_surveyList);
                        }
                        if (selectedForm.id && selectedForm.id !== "new") {
                            let updatedState = getUpdatedState(
                                selectedForm.id,
                                _surveyList,
                            );

                            if (isObjectEmpty(updatedState)) {
                                setSelectedForm(INITIAL_STATE);
                                setCreateSequence(false);
                                setUsePrefix(true);
                                setLayout([]);
                                setComponents({});
                                setImages({});
                                setHtmlCollection({});
                            } else {
                                setSelectedForm(updatedState);
                                setCreateSequence(
                                    updatedState.create_sequence === "YES"
                                        ? true
                                        : false,
                                );
                                setUsePrefix(
                                    updatedState.useprefix === "YES"
                                        ? true
                                        : false,
                                );
                                setLayout(updatedState.design.layout);
                                setComponents(updatedState.design.components);
                                setImages(updatedState.design.images);
                                setHtmlCollection(
                                    updatedState.design.htmlCollection,
                                );
                            }
                        }
                    } else {
                        console.log(
                            `Either list.all.forms does not exists or SQL query returns no result.`,
                        );
                    }
                    if (response.data.C_DATA.instance) {
                        setInstanceItems(response.data.C_DATA.instance);
                    } else {
                        setInstanceItems([]);
                        console.log(
                            `Either instance does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function validateSchema(id) {
        const url = API_URL + "?service.key=validate.schema";

        let request = {
            formId: id,
        };

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        console.log("Schema validation was successfull");
                    } else {
                        console.log("Schema validation failed");
                    }
                }
            });
        } catch (e) {
            console.log("validateSchema error:" + e);
        }
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    return (
        <ErrorBoundary>
            <FormContext.Provider
                value={{
                    layout,
                    components,
                    images,
                    htmlCollection,
                    selectedForm,
                    renderPreview,
                    setLayout,
                    setComponents,
                    setImages,
                    setHtmlCollection,
                    setSelectedForm,
                    setRenderPreview,
                }}>
                <CsvModal
                    csvModal={csvModal}
                    handleClose={handleCloseCsv}
                    getData={getData}
                    tableName="app_survey"
                    title={"Form Builder Import"}
                />
                <div
                    id="form-builder"
                    className="form-builder">
                    {mode === modeType.design || mode === modeType.preview ? (
                        <div className="d-flex justify-content-center align-items-center form-dnd-preview">
                            <div>
                                <span className="text-danger">
                                    Form builder
                                </span>{" "}
                                added successfully.
                            </div>
                        </div>
                    ) : null}
                    {mode === modeType.render && (
                        <div className="">
                            <div className="">
                                {!designMode ? (
                                    <FormList
                                        addNewItem={addNewItem}
                                        searchField={searchField}
                                        handleSearch={handleSearch}
                                        inputRef={inputRef}
                                        filteredFormList={filteredFormList}
                                        handleFormSelect={handleFormSelect}
                                        duplicateSelectedForm={
                                            duplicateSelectedForm
                                        }
                                        deleteData={deleteData}
                                        error={error}
                                        selectedForm={selectedForm}
                                        message={message}
                                        canDesign={canDesign}
                                        layout={layout}
                                        components={components}
                                        images={images}
                                        handleCanDesign={handleCanDesign}
                                        handleInputField={handleInputField}
                                        handleCheckBoxEvents={
                                            handleCheckBoxEvents
                                        }
                                        createSequence={createSequence}
                                        usePrefix={usePrefix}
                                        saveData={saveData}
                                        current={current}
                                        setCurrent={setCurrent}
                                        formList={formList}
                                        setFormList={setFormList}
                                        handleShowCsv={handleShowCsv}
                                        instanceItems={instanceItems}
                                        showDatasource={showDatasource}
                                    />
                                ) : (
                                    <Designer
                                        designMode={designMode}
                                        setDesignMode={setDesignMode}
                                        selectedForm={selectedForm}
                                        updateData={handleUpdateData}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </FormContext.Provider>
        </ErrorBoundary>
    );
}

function FormList(props) {
    const [size, setSize] = useState(5);
    // const [current, setCurrent] = useState(1);

    const getPaginateData = (current, pageSize) => {
        return props.filteredFormList.slice(
            (props.current - 1) * pageSize,
            props.current * pageSize,
        );
    };

    function selectItemsForExport(selectedItem, check) {
        let _items = [...props.formList];

        let index = _items.findIndex(item => item.id === selectedItem.id);
        _items[index].selected = check;
        props.setFormList(_items);
    }

    function selectedRecordExport() {
        // ;
        try {
            let _selectedItem = [];
            props.formList.forEach(item => {
                if (item.selected === true) {
                    _selectedItem.push(item);
                }
            });
            // let fetchRecords = await getSelectedRecords(ids);
            JsonToCsv(_selectedItem, "Form");
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="container-fluid px-0">
            {/* Views */}
            <div className="row search-actions border-bottom">
                <div className="col-sm-3 ps-0">
                    <div className="input-group">
                        <input
                            ref={props.inputRef}
                            type="text"
                            className="form-control"
                            placeholder="Search name, keys & table"
                            value={props.searchField}
                            onChange={props.handleSearch}
                        />
                        <span className="input-group-text">
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </span>
                    </div>
                </div>
                <div className="col-sm-3">
                    <div className="row">
                        <div className="col-sm-3 p-0 add-btn-width">
                            <div className="">
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => props.addNewItem()}>
                                    <i className="fa-solid fa-plus pe-1"></i>
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="col-sm-3 p-0">
                            <div className="">
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => props.handleShowCsv()}>
                                    <i className="fa-solid fa-file-import pe-1"></i>
                                    Import
                                </button>
                            </div>
                        </div>
                        <div className="col-sm-3 p-0">
                            <div className="">
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => selectedRecordExport()}>
                                    <i className="fa-solid fa-file-export pe-1"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className="col-sm-3">
                    <div className="row">
                        <div className="form-add-btn">
                            <button
                                className="btn btn-sm button-theme "
                                onClick={() => props.addNewItem()}>
                                <i className="fa-solid fa-plus pe-1"></i>
                                Add Form
                            </button>
                        </div>
                        <div className="form-import-btn">
                            <button
                                className="btn btn-sm button-theme"
                                onClick={() => props.handleShowCsv()}>
                                <i className="fa-solid fa-file-import pe-1"></i>
                                Import
                            </button>
                        </div>
                        <div className="form-export-btn">
                            <button
                                className="btn btn-sm button-theme"
                                onClick={() => selectedRecordExport()}>
                                <i className="fa-solid fa-file-export pe-1"></i>
                                Export
                            </button>
                        </div>
                    </div>
                </div> */}
                <div className="col-sm-6">
                    <span className="fw-bold form-builder-title">
                        Manage Forms
                    </span>
                </div>
            </div>
            <div className="row m-0 py-2">
                <div className="col-sm-3 ps-0 formlist-col">
                    <ul className="list-group list-group-flush formlist-listing">
                        {getPaginateData(props.current, size).map(form => {
                            return (
                                <li
                                    key={form.id}
                                    className={`list-group-item d-flex justify-content-between align-items-start
                                    ${
                                        props.selectedForm &&
                                        props.selectedForm["id"] === form["id"]
                                            ? "bg-light"
                                            : ""
                                    }
                                                `}>
                                    <input
                                        className="form-check-input me-2"
                                        type="checkbox"
                                        checked={form.selected}
                                        onChange={e =>
                                            selectItemsForExport(
                                                form,
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <div
                                        className="pointer me-auto flex-grow-1"
                                        onClick={() =>
                                            props.handleFormSelect(form)
                                        }>
                                        {form.name}
                                    </div>
                                    <div
                                        className="d-block pointer form-duplicate-icon"
                                        title="Duplicate"
                                        onClick={() =>
                                            props.duplicateSelectedForm(form)
                                        }>
                                        <i className="px-1 fa-regular fa-clone"></i>
                                    </div>
                                    <div
                                        className="d-block pointer form-delete-icon"
                                        onClick={() => props.deleteData(form)}
                                        title="Delete">
                                        <i className="px-1 fa-regular fa-trash-can"></i>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="p-0 col-sm-12">
                        <TablePagination
                            size={size}
                            setSize={setSize}
                            current={props.current}
                            setCurrent={props.setCurrent}
                            tableData={props.filteredFormList}
                        />
                    </div>
                </div>
                <div className="col-sm-4 mb-2 pe-0">
                    <div className="form-background">
                        <div className="row">
                            <div className="mb-2 form-group">
                                <label className="mt-1 d-flex justify-content-between">
                                    <span className="d-inline-block fw-bold">
                                        Key&nbsp;
                                        <span className="text-danger">*</span>
                                    </span>
                                    <span
                                        className={`text-danger ${
                                            props.error.indexOf("form_key") > -1
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        Key cannot be empty.
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="form_key"
                                    value={
                                        props.selectedForm &&
                                        props.selectedForm["form_key"]
                                    }
                                    onChange={e => props.handleInputField(e)}
                                />
                            </div>
                        </div>
                        <div className="row ">
                            <div className="mb-2 form-group">
                                <label className="mt-1 d-flex justify-content-between">
                                    <span className="d-inline-block fw-bold">
                                        Name&nbsp;
                                        <span className="text-danger">*</span>
                                    </span>
                                    <span
                                        className={`text-danger ${
                                            props.error.indexOf("name") > -1
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        Name cannot be empty.
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={
                                        props.selectedForm &&
                                        props.selectedForm["name"]
                                    }
                                    onChange={e => props.handleInputField(e)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="mb-2 ">
                                <div className="form-group">
                                    <label className="mt-1 d-flex justify-content-between">
                                        <span className="d-inline-block fw-bold">
                                            Table&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        <span
                                            className={`text-danger ${
                                                props.error.indexOf("table") >
                                                -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Table cannot be empty.
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="table"
                                        value={
                                            props.selectedForm &&
                                            props.selectedForm["table"]
                                        }
                                        onChange={e =>
                                            props.handleInputField(e)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="mb-2 ">
                                <div className="form-group">
                                    <label className="mt-1 d-flex justify-content-between">
                                        <span className="d-inline-block fw-bold">
                                            Datasource&nbsp;
                                        </span>
                                    </label>
                                    <select
                                        // placeholder="Select Option"
                                        className="form-select"
                                        name="datasource"
                                        value={
                                            props.selectedForm &&
                                            props.selectedForm["datasource"]
                                        }
                                        onChange={e =>
                                            props.handleInputField(e)
                                        }>
                                        <option value="">Default</option>
                                        {props.instanceItems &&
                                            props.instanceItems !== undefined &&
                                            props.instanceItems.map(
                                                instance => {
                                                    return (
                                                        <option
                                                            key={instance.id}
                                                            value={
                                                                instance.code
                                                            }>
                                                            {instance.name}
                                                        </option>
                                                    );
                                                },
                                            )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* {true && ( */}
                        {/* {JSON.stringify(props.instanceItems)} */}
                        {props.showDatasource && (
                            <div className="">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="useprefix"
                                        onChange={e =>
                                            props.handleCheckBoxEvents(e)
                                        }
                                        checked={props.usePrefix}
                                        // disabled={
                                        //     props.selectedForm["id"] &&
                                        //     props.selectedForm["id"] !==
                                        //         "new" &&
                                        //     props.selectedForm["useprefix"] ===
                                        //         "YES"
                                        // }
                                    />
                                    <label className="form-check-label">
                                        Use prefix
                                    </label>
                                </div>
                                {/* <div className="col-sm-6">
                                    <div className="mb-2 form-group">
                                        <label className="mt-1 d-flex justify-content-between">
                                            <span className="d-inline-block fw-bold">
                                                Table Prefix&nbsp;
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="table_prefix"
                                            value={
                                                props.selectedForm &&
                                                props.selectedForm[
                                                    "table_prefix"
                                                ]
                                            }
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="mb-2 form-group">
                                        <label className="mt-1 d-flex justify-content-between">
                                            <span className="d-inline-block fw-bold">
                                                Column Prefix&nbsp;
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="column_prefix"
                                            value={
                                                props.selectedForm &&
                                                props.selectedForm[
                                                    "column_prefix"
                                                ]
                                            }
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }
                                        />
                                    </div>
                                </div> */}
                            </div>
                        )}
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="create_sequence"
                                onChange={e => props.handleCheckBoxEvents(e)}
                                checked={props.createSequence}
                                disabled={
                                    props.selectedForm["id"] &&
                                    props.selectedForm["id"] !== "new" &&
                                    props.selectedForm["create_sequence"] ===
                                        "YES"
                                }
                            />
                            <label className="form-check-label">
                                Create sequence
                            </label>
                        </div>
                        <div className="row">
                            <div className="col">
                                <button
                                    className="m-2 ms-0 btn button-theme btn-sm"
                                    onClick={() =>
                                        props.saveData(props.selectedForm)
                                    }>
                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                                <button
                                    className="m-2 btn button-theme  btn-sm ms-0"
                                    onClick={() => {
                                        props.handleCanDesign();
                                    }}
                                    title="The form needs to be saved before designing.">
                                    <i className="fa-solid fa-pen-nib pe-1"></i>
                                    Design Form
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            {props.canDesign !== "" && (
                                <div
                                    className="alert alert-danger mb-0 p-1"
                                    role="alert">
                                    {props.canDesign}
                                </div>
                            )}
                            {props.message !== "" && (
                                <div
                                    className="alert alert-info mb-0 p-1"
                                    role="alert">
                                    {props.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-sm-5 pe-0">
                    <div className="form-background mb-2 enable-scroll builder-render">
                        <div className="field-padding">
                            <RenderPreview
                                layout={props.layout}
                                components={props.components}
                                images={props.images}
                                mode={modeType.readonly}
                                modeType={modeType}></RenderPreview>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Survey;

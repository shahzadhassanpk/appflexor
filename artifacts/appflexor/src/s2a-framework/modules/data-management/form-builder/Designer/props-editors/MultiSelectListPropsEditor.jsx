import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../../../AppContext";
import { API_URL } from "../../../../../Config";
import { getData } from "../../../../../components/CrudApiCall";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { DndCard } from "../../../../../components/drag-and-drop-listing/Card";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid, tryParseJSONObject } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import { moveChecker } from "./utils";

export default function MultiSelectListPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const appContext = useContext(AppContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [options, setOptions] = useState([]);
    const [invalidFields, setInvalidFields] = useState({});
    const [dataSources, setDataSources] = useState([]);
    const [moveCard, setMoveCard] = useState(true);
    const collapseAccordionRef = useRef(null);

    useEffect(() => {
        getDataSources();
    }, []);

    async function getDataSources() {
        try {
            let dataKeys = [
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.instance",
                    mode: "formData",
                },
            ];

            const res = await getData({
                keys: dataKeys,
                tenant_id: appContext?.tenantSubscription?.datasource,
                datasource: "",
                url: API_URL + "?service.key=masterKey.tenantData",
            });
            const list = res.data.C_DATA.instance;
            list.unshift({ name: "Default", code: "" });
            setDataSources(list);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            componentData.datasource = componentData.datasource ?? "";
            setInputField(componentData);
        }
        // else {
        //     setInputField({});
        //     setCurrentComponent({});
        // }
    }, [context.selectedComponent]);

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            let props = context.selectedComponent.props;
            parseOptionsFromProps(props);
        }
    }, [context.selectedComponent.props]);

    // useEffect(() => {
    //     console.log(context.components);
    // }, [context.components]);

    useEffect(() => {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;
        if (inputField["db_column"] === "") {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (inputField["use_static"] === "YES") {
            if (invalid["serviceKey"]) {
                delete invalid.serviceKey;
            }
            if (invalid["mapValue"]) {
                delete invalid.mapValue;
            }
            if (invalid["mapLabel"]) {
                delete invalid.mapLabel;
            }
            if (invalid["filter_by"]) {
                delete invalid.mapLabel;
            }
        } else {
            if (inputField["serviceKey"] === "") {
                invalid["serviceKey"] = true;
            } else delete invalid.serviceKey;

            if (inputField["mapLabel"] === "") {
                invalid["mapLabel"] = true;
            } else delete invalid.mapLabel;

            if (inputField["mapValue"] === "") {
                invalid["mapValue"] = true;
            } else delete invalid.mapValue;

            if (inputField["filter_by"] === "") {
                invalid["filter_by"] = true;
            } else delete invalid.mapValue;
        }

        setInvalidFields(invalid);
    }, [inputField]);

    useEffect(() => {
        if (inputField["use_static"] === "YES") {
            let invalid = { ...invalidFields };
            delete invalid.serviceKey;

            delete invalid.mapLabel;
            delete invalid.mapValue;
            // setInputField(prev => ({
            //     ...prev,
            //     serviceKey: "",
            //     serviceParams: "",
            //     mapLabel: "",
            //     mapValue: "",
            // }));
        }
    }, [inputField["use_static"]]);

    function parseOptionsFromProps(array) {
        let options = [];
        array &&
            array.map(item => {
                if (item.type === "array") {
                    try {
                        options = tryParseJSONObject(item.options, []);
                    } catch (error) {
                        console.log();
                    }
                }
            });
        setOptions(options);
    }

    const handleInputField = event => {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        let _inputField = { ...inputField, [key]: value };
        setInputField(_inputField);

        // this will imediatly update context but we need to update them on Click event thus moved this logic to `handleUpdateComponentData`

        // let _components = { ...context.components };
        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        if (inputField.use_static === "YES") {
            // drag and drop options by haider
            var props = currentComponent.props;
            props[0].options = JSON.stringify(options);
        }

        let strToValidate = inputField["db_column"];
        if (strToValidate) {
            strToValidate = strToValidate.replaceAll(/[^A-Z0-9]+/gi, "_");
        }

        tempData = { ...tempData, ...inputField, db_column: strToValidate };
        _components[currentComponent.id].data = tempData;
        if (inputField.use_static === "YES") {
            // drag and drop options by haider
            _components[currentComponent.id].props = props;
        }
        context.setComponents(_components);
    };

    function addRadioOption() {
        let currentState = [...options];
        let newOption = {
            id: makeid(4),
            label: `Value ${currentState.length + 1}`,
            value: `value${currentState.length + 1}`,
        };
        currentState.push(newOption);

        setOptions(currentState);
        let fieldId = "array";

        let str = JSON.stringify(currentState);
        handleRadioOptions(str, fieldId);
    }

    function handleRadioOptions(radioList) {
        // let _radioList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });
        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        if (isEmpty(componentProps)) {
            let prop = {
                id: "options",
                label: "Static Options",
                type: "array",
                value: "",
                options: "",
                hidden: false,
            };
            let temp = prop;
            temp.options = radioList;
            newProps.push(temp);
        } else {
            componentProps &&
                componentProps.map(props => {
                    let temp = props;
                    temp.options = radioList;
                    newProps.push(temp);
                });
        }

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    function handleOptionsChange(e, fieldId) {
        // ;
        let id = e.target.getAttribute("data-id");
        let value = e.target.value;
        let name = e.target.name;

        let _updatedArr = [];

        options &&
            options.map(opt => {
                if (opt.id === id) {
                    let obj = opt;
                    obj[name] = value;

                    _updatedArr.push(obj);
                } else {
                    _updatedArr.push(opt);
                }
            });
        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function handleRadioOptDelete(option, fieldId) {
        let _updatedArr = [];

        _updatedArr = options.filter(opt => opt.id !== option.id);

        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function handleCheckListOptions(checkList, fieldId) {
        // let _checkList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });
        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        componentProps &&
            componentProps.map(props => {
                if (props.type === fieldId) {
                    let temp = props;
                    temp.options = checkList;
                    newProps.push(temp);
                } else {
                    newProps.push(props);
                }
            });

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (inputField["db_column"] === "") {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (inputField["serviceParams"] !== "" && !inputField.filter_by) {
            invalid["filter_by"] = true;
        } else delete invalid.filter_by;

        if (inputField["use_static"] === "YES") {
            if (invalid["serviceKey"]) {
                delete invalid.serviceKey;
            }
            if (invalid["mapValue"]) {
                delete invalid.mapValue;
            }
            if (invalid["mapLabel"]) {
                delete invalid.mapLabel;
            }
            if (invalid["filter_by"]) {
                delete invalid.filter_by;
            }
        } else {
            if (inputField["serviceKey"] === "") {
                invalid["serviceKey"] = true;
            } else delete invalid.serviceKey;

            if (inputField["mapLabel"] === "") {
                invalid["mapLabel"] = true;
            } else delete invalid.mapLabel;

            if (inputField["mapValue"] === "") {
                invalid["mapValue"] = true;
            } else delete invalid.mapValue;

            if (inputField["filter_by"] === "") {
                invalid["filter_by"] = true;
            } else delete invalid.filter_by;
        }

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const handleChangeDataSource = item => {
        setInputField({ ...inputField, datasource: item.code });
    };

    return (
        <ErrorBoundary>
            <form>
                <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">
                            Field Label{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <input
                            type="text"
                            name="label"
                            className={`form-control form-control-sm ${
                                invalidFields["label"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.label}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">
                            DB Column{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <input
                            type="text"
                            name="db_column"
                            className={`form-control form-control-sm ${
                                invalidFields["db_column"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.db_column}
                        />
                    </div>
                    <div className="col-sm-4 mb-3">
                        <label className="form-label">
                            Map Process Variable
                        </label>
                        <input
                            type="text"
                            name="process_variable"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.process_variable}
                        />
                    </div>
                    <div className="col-sm-12 mb-3">
                        <label className="form-label">Default Value</label>
                        <textarea
                            type="text"
                            name="value"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.value}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">Classes</label>
                        <input
                            type="text"
                            name="classes"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.classes}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">Disable Expression</label>
                        <input
                            type="text"
                            name="disabled"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.disabled}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">Hide Expression</label>
                        <input
                            type="text"
                            name="condition"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.condition}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="required"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.required === "YES" ? true : false
                                }
                            />
                            <span className="ms-2">Required</span>
                        </label>
                    </div>
                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="readonly"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.readonly === "YES" ? true : false
                                }
                            />
                            <span className="ms-2">Readonly</span>
                        </label>
                    </div>

                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="use_static"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.use_static === "YES"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2"> Use Static Options</span>
                        </label>
                    </div>
                </div>

                <div className="row">
                    {inputField.use_static !== "YES" && (
                        <div className="col mb-3">
                            <label className="form-label">Service Key</label>
                            <input
                                type="text"
                                name="serviceKey"
                                className={`form-control form-control-sm ${
                                    invalidFields["serviceKey"] !== undefined
                                        ? "form-control-danger"
                                        : ""
                                }`}
                                onChange={e => handleInputField(e)}
                                value={inputField.serviceKey}
                            />
                        </div>
                    )}
                    <div className="col-sm-6 mb-3">
                        <label className="form-label">
                            Form Field Group Filter
                        </label>
                        <input
                            type="text"
                            name="serviceParams"
                            className={`form-control form-control-sm `}
                            onChange={e => handleInputField(e)}
                            value={inputField.serviceParams}
                        />
                    </div>
                    {inputField.use_static !== "YES" && (
                        <div className="col mb-3">
                            <label className="form-label">Filter By</label>
                            <input
                                type="text"
                                name="filter_by"
                                value={inputField.filter_by}
                                className={`form-control form-control-sm ${
                                    invalidFields["filter_by"] !== undefined
                                        ? "form-control-danger"
                                        : ""
                                }`}
                                onChange={e => handleInputField(e)}
                            />
                        </div>
                    )}
                </div>
                {inputField.use_static === "YES" && (
                    <div className="row">
                        <div className="col-sm-6">
                            <div>
                                <label className="form-label">
                                    Static Values
                                    <span className="text-danger">&nbsp;*</span>
                                </label>
                                <span className="float-end">
                                    <span className="me-1 px-2 rounded-circle">
                                        {options.length}
                                    </span>
                                    <span
                                        className="float-end pointer"
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Create new list item"
                                        onClick={addRadioOption}>
                                        <i className="fs-5 fa-solid fa-plus"></i>
                                    </span>
                                </span>
                            </div>
                            <div
                                id={`array-selection`}
                                className="form-accordion accordion accordion-flush">
                                {options &&
                                    options.map((option, index) => {
                                        const accordionId =
                                            "accord" + option?.id;
                                        return (
                                            <DndCard
                                                id={option.id}
                                                index={index}
                                                setItems={setOptions}
                                                move={moveCard}>
                                                <div key={option.id}>
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header">
                                                            <button
                                                                id={accordionId}
                                                                ref={
                                                                    collapseAccordionRef
                                                                }
                                                                className="accordion-button p-2 collapsed"
                                                                type="button"
                                                                onClick={() =>
                                                                    moveChecker(
                                                                        accordionId,
                                                                        setMoveCard,
                                                                    )
                                                                }
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={`#a${index}`}>
                                                                {option.label}
                                                            </button>
                                                        </h2>
                                                        <div
                                                            id={`a${index}`}
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent={`#array-selection`}>
                                                            <div className="accordion-body py-1 px-2 d-flex gap-2">
                                                                <div className="">
                                                                    <label className="mb-0 form-label">
                                                                        Label
                                                                    </label>
                                                                    <input
                                                                        className="form-control form-control-sm "
                                                                        type="text"
                                                                        data-id={
                                                                            option.id
                                                                        }
                                                                        name="label"
                                                                        value={
                                                                            option.label
                                                                        }
                                                                        onChange={e =>
                                                                            handleOptionsChange(
                                                                                e,
                                                                                "array",
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="">
                                                                    <label className="mb-0 form-label">
                                                                        Value
                                                                    </label>
                                                                    <input
                                                                        className="form-control form-control-sm"
                                                                        type="text"
                                                                        name="value"
                                                                        data-id={
                                                                            option.id
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                        onChange={e =>
                                                                            handleOptionsChange(
                                                                                e,
                                                                                "array",
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="">
                                                                    <label className="mb-0 form-label">
                                                                        Group
                                                                    </label>
                                                                    <input
                                                                        className="form-control form-control-sm"
                                                                        type="text"
                                                                        name="group"
                                                                        data-id={
                                                                            option.id
                                                                        }
                                                                        value={
                                                                            option.group
                                                                        }
                                                                        onChange={e =>
                                                                            handleOptionsChange(
                                                                                e,
                                                                                "array",
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <div
                                                                    onClick={() =>
                                                                        handleRadioOptDelete(
                                                                            option,
                                                                            "array",
                                                                        )
                                                                    }
                                                                    className="pointer mt-4">
                                                                    <i className=" fa-solid fa-trash text-danger ps-2"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DndCard>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}
                <div className="row">
                    {(inputField.use_static === undefined ||
                        inputField.use_static === "" ||
                        inputField.use_static === "NO") && (
                        <>
                            <div className="col-sm-4 mb-3">
                                <label className="form-label">Map Label</label>
                                <input
                                    type="text"
                                    name="mapLabel"
                                    className={`form-control form-control-sm ${
                                        invalidFields["mapLabel"] !== undefined
                                            ? "form-control-danger"
                                            : ""
                                    }`}
                                    onChange={e => handleInputField(e)}
                                    value={inputField.mapLabel}
                                />
                            </div>
                            <div className="col-sm-4 mb-3">
                                <label className="form-label">Map Value</label>
                                <input
                                    type="text"
                                    name="mapValue"
                                    className={`form-control form-control-sm ${
                                        invalidFields["mapValue"] !== undefined
                                            ? "form-control-danger"
                                            : ""
                                    }`}
                                    onChange={e => handleInputField(e)}
                                    value={inputField.mapValue}
                                />
                            </div>

                            {inputField.mapValue && (
                                <div className="col-sm-4 mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="datasource">
                                        Datasource
                                    </label>
                                    <ReactSelect
                                        options={dataSources}
                                        fieldLabel="name"
                                        fieldValue="code"
                                        handleChange={handleChangeDataSource}
                                        selectedOption={dataSources.find(
                                            item =>
                                                item.code ===
                                                inputField?.datasource,
                                        )}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="d-flex flex-row justify-content-end">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                checkValidations();
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </ErrorBoundary>
    );
}

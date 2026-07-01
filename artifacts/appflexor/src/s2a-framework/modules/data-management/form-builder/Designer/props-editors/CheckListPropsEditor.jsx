import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../../../AppContext";
import { API_URL } from "../../../../../Config";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid, tryParseJSONObject } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import { DndCard } from "../../../../../components/drag-and-drop-listing/Card";
import DndWrapper from "../../../../../components/drag-and-drop-listing";
import { moveChecker } from "./utils";

export default function CheckListPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [options, setOptions] = useState([]);
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [invalidFields, setInvalidFields] = useState({});
    const [moveCard, setMoveCard] = useState(true);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
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
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;
        if (inputField.use_static === "YES") {
            // drag and drop options by haider
            // var is required for global use

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
        const count = currentState.filter(item => item.value !== "").length;

        let newOption = {
            id: makeid(4),
            label: `Value ${count + 1}`,
            value: `value${count + 1}`,
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

        let currentSelectionStr = clone(inputField.value);
        let currentSelectionArr = currentSelectionStr
            ? JSON.parse(currentSelectionStr)
            : [];
        currentSelectionArr = currentSelectionArr.filter(
            v => v !== option.value,
        );

        let str2 = JSON.stringify(currentSelectionArr);
        let _inputField = { ...inputField, value: str2 };
        setInputField(_inputField);
    }

    const clone = x => JSON.parse(JSON.stringify(x));

    function handleDefaultValues(event) {
        let id = event.target.id;
        let isChecked = event.target.checked;
        let currentSelectionStr = clone(inputField.value);
        let currentSelectionArr = currentSelectionStr
            ? JSON.parse(currentSelectionStr)
            : [];

        options &&
            options.map(op => {
                if (op.id === id) {
                    if (isChecked) {
                        currentSelectionArr.push(op.value);
                    } else {
                        currentSelectionArr = currentSelectionArr.filter(
                            v => v !== op.value,
                        );
                    }
                }
            });

        let validOptions = currentSelectionArr.filter(selection => {
            let isValid = false;

            options &&
                options.map(option => {
                    if (option.value === selection) {
                        isValid = true;
                    }
                });

            return isValid;
        });

        let str = JSON.stringify(validOptions);
        let _inputField = { ...inputField, value: str };
        setInputField(_inputField);
    }

    function handleDynamicDefaultValues(event) {
        let id = event.target.id;
        let isChecked = event.target.checked;
        let currentSelectionStr = clone(inputField.value);
        let currentSelectionArr = currentSelectionStr
            ? JSON.parse(currentSelectionStr)
            : [];

        dynamicOptions &&
            dynamicOptions.map(op => {
                if (op.id === id) {
                    if (isChecked) {
                        currentSelectionArr.push(op.value);
                    } else {
                        currentSelectionArr = currentSelectionArr.filter(
                            v => v !== op.value,
                        );
                    }
                }
            });
        let validOptions = currentSelectionArr.filter(selection => {
            let isValid = false;

            dynamicOptions &&
                dynamicOptions.map(option => {
                    if (option.value === selection) {
                        isValid = true;
                    }
                });

            return isValid;
        });

        let str = JSON.stringify(validOptions);

        let _inputField = { ...inputField, value: str };

        setInputField(_inputField);
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
        }

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    async function fetchDynamicOptions() {
        let serviceKey = inputField.serviceKey;
        let serviceParams = inputField.serviceParams
            ? inputField.serviceParams
            : "";
        let mapLabel = inputField.mapLabel;
        let mapValue = inputField.mapValue;

        var dataRequest = {
            tenant_id: tenantId,

            dataKeys: [
                {
                    serviceParams: serviceParams,
                    dataKey: "list",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };

        let response = await axios.post(
            API_URL + "?service.key=tenant.data",
            dataRequest,
        );

        if (response.data && response.data.C_STATUS === "SUCCESS") {
            let list = response.data.C_DATA.list;

            // API returns response in string when data request is invalid
            if (typeof list === "object") {
                let _options =
                    list &&
                    list.map(item => {
                        return {
                            id: item.id ? item.id : makeid(4),
                            label: item[mapLabel],
                            value: item[mapValue],
                        };
                    });

                setDynamicOptions(_options);
            } else {
                setDynamicOptions([]);
            }
        } else {
            setDynamicOptions([]);
        }
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary>
            <form>
                <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">
                            Label <span className="text-danger">&nbsp;*</span>
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
                    <div className="col mb-3">
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
                    {/* <div className="col mb-3">
                        <label className="form-label">Default Value</label>
                        <input
                            type="text"
                            name="value"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.value}
                        />
                    </div> */}
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
                {/* <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">Regex</label>
                        <input
                            type="text"
                            name="regex"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.regex}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">Regex Info</label>
                        <input
                            type="text"
                            name="regexinfo"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.regexinfo}
                        />
                    </div>
                </div> */}
                <div className="row">
                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="inline"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.inline === "YES" ? true : false
                                }
                            />
                            <span className="ms-2"> View inline</span>
                        </label>
                    </div>

                    <div className="col-auto mb-3">
                        {inputField.inline !== "YES" && (
                            <>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="inlineRadioOptions"
                                        id="inlineRadio1"
                                        value="option1"
                                        checked
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="inlineRadio1">
                                        Auto
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="inlineRadioOptions"
                                        id="inlineRadio2"
                                        value="option2"
                                        disabled
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="inlineRadio2">
                                        2
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="inlineRadioOptions"
                                        id="inlineRadio3"
                                        value="option3"
                                        disabled
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="inlineRadio3">
                                        3
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="inlineRadioOptions"
                                        id="inlineRadio3"
                                        value="option4"
                                        disabled
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="inlineRadio3">
                                        4
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

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

                {/* <code>{JSON.stringify(inputField, null, 2)}</code> */}

                {inputField.use_static !== "YES" && (
                    <div className="row">
                        <div className="col-sm-7">
                            <div className="row">
                                <div className="col mb-3">
                                    <label className="form-label">
                                        Service Key
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceKey"
                                        className={`form-control form-control-sm ${
                                            invalidFields["serviceKey"] !==
                                            undefined
                                                ? "form-control-danger"
                                                : ""
                                        }`}
                                        onChange={e => handleInputField(e)}
                                        value={inputField.serviceKey}
                                    />
                                </div>
                                <div className="col mb-3">
                                    <label className="form-label">
                                        Service Params
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceParams"
                                        className={`form-control form-control-sm `}
                                        onChange={e => handleInputField(e)}
                                        value={inputField.serviceParams}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col mb-3">
                                    <label className="form-label">
                                        Map Label
                                    </label>
                                    <input
                                        type="text"
                                        name="mapLabel"
                                        className={`form-control form-control-sm ${
                                            invalidFields["mapLabel"] !==
                                            undefined
                                                ? "form-control-danger"
                                                : ""
                                        }`}
                                        onChange={e => handleInputField(e)}
                                        value={inputField.mapLabel}
                                    />
                                </div>
                                <div className="col mb-3">
                                    <label className="form-label">
                                        Map Value
                                    </label>
                                    <input
                                        type="text"
                                        name="mapValue"
                                        className={`form-control form-control-sm ${
                                            invalidFields["mapValue"] !==
                                            undefined
                                                ? "form-control-danger"
                                                : ""
                                        }`}
                                        onChange={e => handleInputField(e)}
                                        value={inputField.mapValue}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-5">
                            <div className="d-flex justify-content-between">
                                <label className="form-label">
                                    Default Values{" "}
                                    <span className="me-1 px-2 rounded-circle">
                                        {dynamicOptions.length}
                                    </span>
                                </label>

                                <button
                                    className="btn btn-sm button-theme"
                                    type="button"
                                    disabled={
                                        !inputField["mapValue"] ||
                                        !inputField["mapLabel"] ||
                                        !inputField["serviceKey"]
                                    }
                                    onClick={fetchDynamicOptions}>
                                    <i className="fa-solid fa-bolt"></i>
                                </button>
                            </div>
                            <div>
                                {dynamicOptions &&
                                    dynamicOptions.map((option, index) => {
                                        return (
                                            <div key={option.id}>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={option.value}
                                                        id={option.id}
                                                        checked={inputField.value.includes(
                                                            option.value,
                                                        )}
                                                        onChange={
                                                            handleDynamicDefaultValues
                                                        }
                                                    />
                                                    <label className="form-check-label">
                                                        {option.label}
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {inputField.use_static === "YES" && (
                    <div className="row">
                        <div className="col-sm-6">
                            <div>
                                <label className="form-label">
                                    Static Values
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
                            <DndWrapper>
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
                                                                    id={
                                                                        accordionId
                                                                    }
                                                                    onClick={() =>
                                                                        moveChecker(
                                                                            accordionId,
                                                                            setMoveCard,
                                                                        )
                                                                    }
                                                                    className="accordion-button p-2 collapsed"
                                                                    type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target={`#a${index}`}>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </button>
                                                            </h2>
                                                            <div
                                                                id={`a${index}`}
                                                                className="accordion-collapse collapse"
                                                                data-bs-parent={`#array-selection`}>
                                                                <div className="accordion-body py-1 px-2 d-flex">
                                                                    <div className="me-1">
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
                                                                    <div
                                                                        onClick={() =>
                                                                            handleRadioOptDelete(
                                                                                option,
                                                                                "array",
                                                                            )
                                                                        }
                                                                        className="d-flex justify-content-center align-items-center pointer">
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
                            </DndWrapper>
                        </div>
                        <div className="col-sm-6">
                            <div>
                                <label className="form-label">
                                    Default Values
                                </label>
                                <span className="float-end">
                                    <span className="me-1 px-2 rounded-circle">
                                        {options.length}
                                    </span>
                                </span>
                            </div>
                            <div>
                                {options &&
                                    options.map((option, index) => {
                                        return (
                                            <div key={option.id}>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={option.value}
                                                        id={option.id}
                                                        checked={inputField.value.includes(
                                                            option.value,
                                                        )}
                                                        onChange={
                                                            handleDefaultValues
                                                        }
                                                    />
                                                    <label className="form-check-label">
                                                        {option.label}
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

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

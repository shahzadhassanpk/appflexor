import React, { useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import DesignerContext from "../../Context/DesignerContext";

export default function NumberPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            // if (!componentData.min_decimals) componentData.min_decimals = 0;
            // if (!componentData.max_decimals) componentData.max_decimals = 10000;
            setInputField(componentData);
        }
        // else {
        //     setInputField({});
        //     setCurrentComponent({});
        // }
    }, [context.selectedComponent]);

    useEffect(() => {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (inputField["db_column"] === "") {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (inputField["min_decimals"] === "") {
            invalid["min_decimals"] = true;
        } else delete invalid.min_decimals;

        if (inputField["max_decimals"] === "") {
            invalid["max_decimals"] = true;
        } else delete invalid.max_decimals;

        setInvalidFields(invalid);
    }, [inputField]);

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

        let strToValidate = inputField["db_column"];
        if (strToValidate) {
            strToValidate = strToValidate.replaceAll(/[^A-Z0-9]+/gi, "_");
        }

        tempData = { ...tempData, ...inputField, db_column: strToValidate };
        _components[currentComponent.id].data = tempData;

        context.setComponents(_components);
    };

    function checkValidations() {
        let invalid = { ...invalidFields };
        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (inputField["db_column"] === "") {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (inputField["min_decimals"] === "") {
            // invalid["min_decimals"] = false;
            delete invalid.min_decimals;
        } else delete invalid.min_decimals;

        if (inputField["max_decimals"] === "") {
            // invalid["max_decimals"] = false;
            delete invalid.max_decimals;
        } else delete invalid.max_decimals;

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
                    <div className="col-sm-4 mb-3">
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
                        <label className="form-label">Process Variable</label>
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
                        <label className="form-label">
                            Minimum Value{" "}
                            {/* <span className="text-danger">&nbsp;*</span> */}
                        </label>
                        <input
                            type="number"
                            name="min_decimals"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.min_decimals}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">
                            Maximum Value{" "}
                            {/* <span className="text-danger">&nbsp;*</span> */}
                        </label>
                        <input
                            type="number"
                            name="max_decimals"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.max_decimals}
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

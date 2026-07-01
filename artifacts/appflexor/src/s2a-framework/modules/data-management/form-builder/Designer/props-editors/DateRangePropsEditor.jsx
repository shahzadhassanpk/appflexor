import React, { useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import DesignerContext from "../../Context/DesignerContext";

export default function DateRangePropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});

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
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (inputField["start_db_column"] === "") {
            invalid["start_db_column"] = true;
        } else delete invalid.start_db_column;

        if (inputField["end_db_column"] === "") {
            invalid["end_db_column"] = true;
        } else delete invalid.end_db_column;

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

        let startDbColumn = inputField["start_db_column"];
        if (startDbColumn) {
            startDbColumn = startDbColumn.replaceAll(/[^A-Z0-9]+/gi, "_");
        }
        let endDbColumn = inputField["end_db_column"];
        if (endDbColumn) {
            endDbColumn = endDbColumn.replaceAll(/[^A-Z0-9]+/gi, "_");
        }

        tempData = {
            ...tempData,
            ...inputField,
            start_db_column: startDbColumn,
            end_db_column: endDbColumn,
        };
        _components[currentComponent.id].data = tempData;

        context.setComponents(_components);
    };

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (
            inputField["start_db_column"] === "" ||
            inputField["start_db_column"] === "start" ||
            inputField["start_db_column"] === "end"
        ) {
            invalid["start_db_column"] = true;
        } else delete invalid.start_db_column;

        if (
            inputField["end_db_column"] === "" ||
            inputField["end_db_column"] === "start" ||
            inputField["end_db_column"] === "end"
        ) {
            invalid["end_db_column"] = true;
        } else delete invalid.end_db_column;

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
                        <label className="form-label">Label</label>
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
                            Start Date DB Column
                        </label>
                        {invalidFields["start_db_column"] !== undefined &&
                            inputField.start_db_column !== "" && (
                                <label className="float-end text-danger">
                                    Cannot use reserved keywords
                                </label>
                            )}
                        <input
                            type="text"
                            name="start_db_column"
                            className={`form-control form-control-sm ${
                                invalidFields["start_db_column"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.start_db_column}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">End Date DB Column</label>

                        {invalidFields["end_db_column"] !== undefined &&
                            inputField.end_db_column !== "" && (
                                <label className="float-end text-danger">
                                    Cannot use reserved keywords
                                </label>
                            )}

                        <input
                            type="text"
                            name="end_db_column"
                            className={`form-control form-control-sm ${
                                invalidFields["end_db_column"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.end_db_column}
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
                        <label className="form-label">Process Variable</label>
                        <input
                            type="text"
                            name="process_variable"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.process_variable}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="current_date_as_start_date"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.current_date_as_start_date ===
                                    "YES"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2">
                                {" "}
                                Set current date to start date
                            </span>
                        </label>
                    </div>

                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="show_days"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.show_days === "YES"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2"> Show selected days</span>
                        </label>
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
                </div>

                <div className="row">
                    {inputField.current_date_as_start_date === "YES" && (
                        <div className="col-auto mb-3">
                            <label className="form-label">
                                Start date delay
                            </label>
                            <input
                                type="number"
                                name="start_date_delay"
                                className={`form-control form-control-sm`}
                                onChange={e => handleInputField(e)}
                                value={inputField.start_date_delay}
                            />
                        </div>
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

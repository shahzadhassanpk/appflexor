import React, { useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import DesignerContext from "../../Context/DesignerContext";

export default function TagListPropsEditor({ setShow }) {
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

        if (inputField["db_column"] === "") {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (inputField["category"] === "") {
            invalid["category"] = true;
        } else delete invalid.category;

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

        if (inputField["category"] === "") {
            invalid["category"] = true;
        } else delete invalid.category;

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
            <form className="s2a-props-editor-taglist">
                <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">
                            Label&nbsp;
                            <span className="text-danger">*</span>
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
                            DB Column&nbsp;
                            <span className="text-danger">*</span>
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
                            Category&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="category"
                            className={`form-control form-control-sm ${
                                invalidFields["category"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.category}
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

import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../../../../../Config";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import DesignerContext from "../../Context/DesignerContext";
const INITIAL_SELECTED_COLUMN = {
    label: "Select existing column",
    value: "SELECT_COLUMN",
};

export default function CheckboxPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});
    const [toggleLookup, setToggleLookup] = useState("INPUT");
    const [selectedColumn, setSelectedColumn] = useState(
        INITIAL_SELECTED_COLUMN,
    );
    const [columns, setColumns] = useState([{ ...INITIAL_SELECTED_COLUMN }]);

    const [columnAlreadyExists, setColumnAlreadyExists] = useState("NO");

    useEffect(() => {
        if (context.formTable) {
            getData(context.formTable);
        }
    }, [context]);

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

        // if (id === "new") {
        //     setSelectedColumn(INITIAL_SELECTED_TABLE);
        //     setToggleLookup("INPUT");
        // } else {
        //     if (selectedForm.table !== "") {
        //         let _result = tables.filter(
        //             table => table.value === selectedForm.table,
        //         );
        //         setSelectedColumn({
        //             label: selectedForm.table,
        //             value: selectedForm.table,
        //         });
        //         // if (_result && _result.length > 0) {
        //         //     setTableAlreadyExists("YES");
        //         // } else {
        //         //     setTableAlreadyExists("NO");
        //         // }
        //     }
        //     setToggleLookup("INPUT");
        // }

        // setTableAlreadyExists("NO");
    }, [context.selectedComponent]);

    useEffect(() => {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (toggleLookup === "LOOKUP") {
            if (selectedColumn.value === INITIAL_SELECTED_COLUMN.value) {
                invalid["db_column"] = true;
            } else {
                delete invalid.db_column;
                // form.table = selectedTable.value;
            }
        } else {
            if (inputField["db_column"] === "") {
                invalid["db_column"] = true;
            } else delete invalid.db_column;
        }

        if (inputField["use_custom"] !== "true") {
            if (invalid["checkedValue"]) {
                delete invalid.checkedValue;
            }
            if (invalid["uncheckValue"]) {
                delete invalid.uncheckValue;
            }
        }

        setInvalidFields(invalid);
    }, [inputField]);

    useEffect(() => {
        if (inputField["use_custom"] !== "true") {
            let invalid = { ...invalidFields };

            delete invalid.checkedValue;
            delete invalid.uncheckValue;
            // setInputField(prev => ({
            //     ...prev,
            //     serviceKey: "",
            //     serviceParams: "",
            //     mapLabel: "",
            //     mapValue: "",
            // }));
        }
    }, [inputField["use_custom"]]);

    const handleInputField = event => {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
            // if (inputField.use_custom === "true") {
            //     value = event.target.checked
            //         ? inputField.checkedValue
            //         : inputField.uncheckValue;
            // } else {
            //     value = event.target.checked ? "YES" : "NO";
            // }
        } else {
            value = event.target.value;
        }

        let _inputField = { ...inputField, [key]: value };
        setInputField(_inputField);
    };

    const handleDefaultCheckbox = event => {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            if (inputField.use_custom === "true") {
                value = event.target.checked
                    ? inputField.checkedValue
                    : inputField.uncheckValue;
            } else {
                value = event.target.checked ? "true" : "false";
            }
        } else {
            value = event.target.value;
        }
        let _inputField = { ...inputField, [key]: value };
        setInputField(_inputField);
    };

    const handleCustomInputCheckbox = event => {
        let key = event.target.name;
        let value = event.target.checked ? "true" : "false";
        let currentValue = inputField.value;
        let defVal = "";

        if (event.target.checked) {
            defVal = inputField.uncheckValue ? inputField.uncheckValue : "";
        } else {
            defVal = "false";
        }

        let _inputField = { ...inputField, [key]: value, value: defVal };
        setInputField(_inputField);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        if (toggleLookup === "LOOKUP") {
            tempData.db_column = selectedColumn.value;
            setToggleLookup("INPUT");
        }

        let strToValidate = inputField["db_column"];

        if (strToValidate) {
            strToValidate = strToValidate.replaceAll(/[^A-Z0-9]+/gi, "_");
        }

        // ;
        let value = inputField["value"];
        let checkedValue = "";
        let uncheckValue = "";
        let useCustom = "";
        if (inputField["use_custom"] === "true") {
            checkedValue = inputField["checkedValue"];
            uncheckValue = inputField["uncheckValue"];

            if (value === "true") {
                value = checkedValue;
            }

            if (value === "false") {
                value = uncheckValue;
            }
            useCustom = "true";
        } else {
            useCustom = "false";
        }

        if (!inputField["checkedValue"]) {
            checkedValue = "";
        }

        if (!inputField["uncheckValue"]) {
            uncheckValue = "";
        }

        if (value === "") {
            value =
                inputField["use_custom"] === "true"
                    ? inputField["checkedValue"]
                    : "false";
        }

        tempData = {
            ...tempData,
            ...inputField,
            db_column: strToValidate,
            value: value,
            checkedValue,
            uncheckValue,
            use_custom: useCustom,
        };
        _components[currentComponent.id].data = tempData;

        context.setComponents(_components);
    };

    function checkIfColumnExists() {
        // if (selectedForm.table !== "") {
        //     let _result = tables.filter(
        //         table => table.value === selectedForm.table,
        //     );
        //     if (_result && _result.length > 0) {
        //         setTableAlreadyExists("YES");
        //     } else {
        //         setTableAlreadyExists("NO");
        //     }
        // }
    }

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;

        if (toggleLookup === "LOOKUP") {
            if (selectedColumn.value === INITIAL_SELECTED_COLUMN.value) {
                invalid["db_column"] = true;
            } else {
                delete invalid.db_column;
            }
        } else {
            if (inputField["db_column"] === "") {
                invalid["db_column"] = true;
            } else delete invalid.db_column;
        }

        if (inputField["use_custom"] !== "true") {
            if (invalid["checkedValue"]) {
                delete invalid.checkedValue;
            }
            if (invalid["uncheckValue"]) {
                delete invalid.uncheckValue;
            }
        }

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    function handleSelectionChange(obj) {
        setSelectedColumn(obj);
    }

    function getData(tableName) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: `app_fd_${tableName}`,
                    dataKey: "columns",
                    serviceKey: "sys.get.all.columns",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA && response.data.C_DATA.columns) {
                        const list = response.data.C_DATA.columns;
                        const _list = list.map(item => {
                            let name = item.column_name;
                            let newName = name.replace("c_", "");

                            return {
                                value: newName,
                                label: newName,
                            };
                        });
                        setColumns([{ ...INITIAL_SELECTED_COLUMN }, ..._list]);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
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
                    <div className="col-sm-4 mb-3">
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

                    <div className="col-sm-5 mb-3">
                        <div className="form-group">
                            <label className="form-label d-flex justify-content-between">
                                <span className="d-inline-block fw-bold">
                                    DB Column&nbsp;
                                    <span className="text-danger">*</span>
                                </span>
                                {columnAlreadyExists === "YES" ? (
                                    <span>Column already exists ✔</span>
                                ) : (
                                    <span
                                        className={`text-danger ${
                                            invalidFields["label"] !== undefined
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        {toggleLookup === "INPUT"
                                            ? "Column cannot be empty."
                                            : "Please select a column."}
                                    </span>
                                )}
                                {/* {toggleLookup === "INPUT" && (
                                            <>

                                            </>
                                        )} */}
                            </label>

                            {toggleLookup === "INPUT" && (
                                <div className="input-group mb-3">
                                    <input
                                        type="text"
                                        name="db_column"
                                        className={`form-control form-control-sm ${
                                            invalidFields["db_column"] !==
                                            undefined
                                                ? "form-control-danger"
                                                : ""
                                        }`}
                                        onChange={e => handleInputField(e)}
                                        value={inputField.db_column}
                                        onBlur={() => checkIfColumnExists()}
                                    />
                                    <span
                                        className={`input-group-text d-flex pointer `}
                                        onClick={() => {
                                            setToggleLookup("LOOKUP");
                                        }}>
                                        <span className="fa-solid fa-search me-1"></span>{" "}
                                    </span>
                                </div>
                            )}

                            {toggleLookup === "LOOKUP" && (
                                <div>
                                    <div>
                                        <ReactSelect
                                            options={columns}
                                            selectedOption={selectedColumn}
                                            handleChange={handleSelectionChange}
                                        />
                                    </div>

                                    <div className="d-flex justify-content-end align-items-center mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setToggleLookup("INPUT");
                                                // setSelectedTable(
                                                //     prev => ({
                                                //         label: selectedForm.table,
                                                //         value: selectedForm.table,
                                                //     }),
                                                // );

                                                // tableLookupModalRef.current.close();
                                            }}
                                            className="ms-2 btn button-theme btn-sm">
                                            <span className="fa-solid fa-edit"></span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
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
                    </div> */}
                </div>
                <div className="row">
                    <div className="col-sm-3 mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="value"
                                className={`form-check-input `}
                                onChange={handleDefaultCheckbox}
                                checked={
                                    inputField.use_custom === "true"
                                        ? inputField.value ===
                                          inputField.checkedValue
                                            ? true
                                            : false
                                        : inputField.value === "true"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2"> Checked by default </span>
                        </label>
                    </div>
                    <div className="col-sm-3 mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="use_custom"
                                className={`form-check-input `}
                                onChange={handleCustomInputCheckbox}
                                checked={
                                    inputField.use_custom === "true"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2"> Use custom values </span>
                        </label>
                    </div>
                </div>
                {inputField.use_custom === "true" && (
                    <div className="row">
                        <div className="col-sm-4 mb-3">
                            <label className="form-label">Checked Value</label>
                            <input
                                type="text"
                                name="checkedValue"
                                className={`form-control form-control-sm ${
                                    invalidFields["checkedValue"] !== undefined
                                        ? "form-control-danger"
                                        : ""
                                }`}
                                onChange={e => handleInputField(e)}
                                value={inputField.checkedValue}
                            />
                        </div>
                        <div className="col-sm-4 mb-3">
                            <label className="form-label">Uncheck Value</label>
                            <input
                                type="text"
                                name="uncheckValue"
                                className={`form-control form-control-sm `}
                                onChange={e => handleInputField(e)}
                                value={inputField.uncheckValue}
                            />
                        </div>
                    </div>
                )}

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

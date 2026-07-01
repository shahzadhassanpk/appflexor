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

export default function TextAreaPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});
    const [toggleLookup, setToggleLookup] = useState("INPUT");
    const [message, setMessage] = useState("");
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

            if (!componentData.max_characters)
                componentData.max_characters = "";

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

        // if (inputField["max_characters"] === "") {
        //     invalid["max_characters"] = true;
        // } else delete invalid.max_characters;

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

    const modeHandler = e => {
        const { name, value } = e.target;
        setInputField(prev => ({
            ...prev,
            [name]: value,
        }));
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

        tempData = { ...tempData, ...inputField, db_column: strToValidate };
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

        // if (inputField["max_characters"] === "") {
        //     invalid["max_characters"] = true;
        // } else delete invalid.max_characters;

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

        let isMinMaxValid = true;

        if (
            inputField["min_characters"] !== "" &&
            inputField["max_characters"] !== ""
        ) {
            let minCharacters = parseInt(inputField["min_characters"]);
            let maxCharacters = parseInt(inputField["max_characters"]);

            if (minCharacters > maxCharacters) {
                isMinMaxValid = false;
            }
        }

        if (isMinMaxValid) {
            if (isEmpty(invalid)) {
                handleUpdateComponentData();
                setShow(false);
            }
            setMessage("");
        } else {
            setMessage("Minimum Characters cannot exceed Maximum Characters.");
        }

        setInvalidFields(invalid);
    }

    function handleSelectionChange(selection) {
        setSelectedColumn(selection);

        if (selection.value === INITIAL_SELECTED_COLUMN.value) {
            setInvalidFields(prev => ({ ...prev, db_column: true }));
        } else {
            setInputField(prev => ({ ...prev, db_column: selection.value }));
        }
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

                    <div className="col-sm-4 mb-3">
                        <div className="form-group">
                            <label className="form-label d-flex justify-content-between">
                                <span className="d-inline-block">
                                    DB Column&nbsp;
                                    <span className="text-danger">*</span>
                                </span>
                                {columnAlreadyExists === "YES" ? (
                                    <span>Column already exists ✔</span>
                                ) : (
                                    <span
                                        className={`text-danger ${
                                            invalidFields["db_column"] !==
                                            undefined
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
                </div>
                <div className="row">
                    <div className="col-sm-12 mb-3">
                        <label className="form-label">Default Value{" "}<input
                                type="checkbox"
                                name="isExpression"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField.isExpression === "YES" ? true : false
                                }
                            />
                            <span className="ms-2"> is expression</span></label>
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
                    <div className="col-sm-4 mb-3">
                        <label className="form-label">Minimum Characters</label>
                        <input
                            type="number"
                            min={0}
                            name="min_characters"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.min_characters}
                        />
                    </div>
                    <div className="col-sm-4 mb-3">
                        <label className="form-label">
                            Maximum Characters{" "}
                            {/* <span className="text-danger">*</span> */}
                        </label>
                        <input
                            type="number"
                            min={1}
                            name="max_characters"
                            className={`form-control form-control-sm ${
                                invalidFields["max_characters"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.max_characters}
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
                        <label className="form-label">Data Validation Expression (Regex)</label>
                        <textarea
                            type="text"
                            name="regex"
                            rows={1}
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.regex}
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">Data Validation Fail Message</label>
                        <textarea
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

                <div className="d-flex flex-row justify-content-between">
                    <div></div>
                    <span className="text-danger">{message}</span>
                    <div>
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

import React, { useContext, useEffect, useState } from "react";
import ReactSelect from "react-select";
import DesignerContext from "../../Context/DesignerContext";
import axios from "axios";
import { API_URL } from "../../../../../Config";
import { isEmpty } from "../../Forms/FormViewer/utils";
const INITIAL_SELECTED_COLUMN = {
    label: "Select existing column",
    value: "SELECT_COLUMN",
};

const JsonPropsEditor = props => {
    const { setShow } = props;
    const [invalidFields, setInvalidFields] = useState({});
    const [toggleLookup, setToggleLookup] = useState("INPUT");
    const [inputField, setInputField] = useState({});
    const [columnAlreadyExists, setColumnAlreadyExists] = useState("NO");
    const [columns, setColumns] = useState([{ ...INITIAL_SELECTED_COLUMN }]);
    const [selectedColumn, setSelectedColumn] = useState(
        INITIAL_SELECTED_COLUMN,
    );
    const [currentComponent, setCurrentComponent] = useState({});
    const context = useContext(DesignerContext);

    useEffect(() => {
        if (context.formTable) {
            getData(context.formTable);
        }
    }, [context]);

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

        setInvalidFields(invalid);
    }, [inputField]);

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;

            if (!componentData.max_characters)
                componentData.max_characters = 255;

            setInputField(componentData);
        }
    }, [context.selectedComponent]);

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

    function handleSelectionChange(obj) {
        setSelectedColumn(obj);
        setInputField(prev => ({
            ...prev,
            db_column: obj.value,
        }));
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
        console.log(inputField);
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

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    return (
        <div className="s2a-json-prop-editor">
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
                                            onChange={obj =>
                                                handleSelectionChange(obj)
                                            }
                                        />
                                    </div>

                                    <div className="d-flex justify-content-end align-items-center mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setToggleLookup("INPUT");
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
                        <label className="form-label">Classes</label>
                        <input
                            type="text"
                            name="classes"
                            className={`form-control form-control-sm ${
                                invalidFields["classes"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.classes}
                        />
                    </div>
                </div>
            </form>
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
        </div>
    );
};

export default JsonPropsEditor;

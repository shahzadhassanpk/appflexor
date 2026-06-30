import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../../../../../Config";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";

export default function DropBoxPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});
    const [formList, setFormList] = useState([]);
    const [selectedForm, setSelectedForm] = useState({});
    const [processList, setProcessList] = useState([]); // ✅ new state
    const [selectedProcess, setSelectedProcess] = useState({}); // ✅ selected process
    const [metaList, setMetaList] = useState([]);

    useEffect(() => {
        getFormList();
        getProcessList(); // ✅ fetch process list
    }, []);

    useEffect(() => {
        if (
            context.selectedComponent &&
            !isEmpty(context.selectedComponent) &&
            formList.length > 0
        ) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            setInputField(componentData);

            let _value = tryParseJSONObject(componentData.value, {});
            let _form = getObjectById(formList, "id", _value.id);
            let _process = getObjectById(processList, "id", _value.process_id);
            setSelectedForm(_form);
            setSelectedProcess(_process);
            setMetaList(_value.meta || []);
        }
    }, [context.selectedComponent, formList, processList]);

    function getObjectById(arr, idField, idValue) {
        return arr.find(obj => obj[idField] === idValue);
    }

    const handleInputField = event => {
        const key = event.target.name;
        const value =
            event.target.type === "checkbox"
                ? event.target.checked
                    ? "YES"
                    : "NO"
                : event.target.value;
        setInputField(prev => ({ ...prev, [key]: value }));
    };

    const handleFormSelection = item => setSelectedForm(item);
    const handleProcessSelection = item => setSelectedProcess(item); // ✅ process dropdown handler

    const handleAddMeta = () => {
        setMetaList(prev => [...prev, { db_column: "", default_value: "" }]);
    };

    const handleRemoveMeta = index => {
        setMetaList(prev => prev.filter((_, i) => i !== index));
    };

    const handleMetaChange = (index, key, value) => {
        const updated = [...metaList];
        updated[index][key] = value;
        setMetaList(updated);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let componentId = currentComponent.id;
        let tempData = _components[componentId].data;
        let db_column = inputField.db_column;

        let obj = {
            id: selectedForm?.id,
            name: selectedForm?.name,
            entity: selectedForm?.table,
            db_column,
            run_process: inputField.run_process === "YES",
            process_id: selectedProcess?.id || null,
            process_def_key: selectedProcess?.process_def_key || "",
            process_title: selectedProcess?.title || "",
            meta: metaList,
        };

        tempData = {
            ...tempData,
            ...inputField,
            db_column,
            value: JSON.stringify(obj),
        };

        _components[componentId].data = tempData;
        context.setComponents(_components);
    };

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (isEmpty(selectedForm)) {
            invalid["db_column"] = true;
        } else delete invalid.db_column;

        if (!inputField.max_file_size || inputField.max_file_size <= 0) {
            invalid["max_file_size"] = true;
        } else {
            delete invalid.max_file_size;
        }

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    function getFormList() {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "list",
                    serviceKey: "sys.forms",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setFormList(response.data.C_DATA.list || []);
                }
            })
            .catch(error => console.error(error));
    }

    // ✅ Fetch process list
    function getProcessList() {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "list",
                    serviceKey: "sys.tenant.process",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setProcessList(response.data.C_DATA.list || []);
                }
            })
            .catch(error => console.error(error));
    }

    function isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
    }

    return (
        <ErrorBoundary>
            <form>
                <div className="row">
                    <div className="col mb-3">
                        <label className="form-label">
                            Select Form <span className="text-danger">*</span>
                        </label>
                        <ReactSelect
                            placeholder="Choose Form"
                            options={formList}
                            selectedOption={selectedForm}
                            handleChange={handleFormSelection}
                            fieldLabel="name"
                            fieldValue="id"
                        />
                    </div>
                    <div className="col mb-3">
                        <label className="form-label">
                            DB Column <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="db_column"
                            value={inputField.db_column || ""}
                            className="form-control"
                            placeholder="Enter DB Column"
                            onChange={handleInputField}
                        />
                    </div>
                </div>
                <div className="col mb-3">
                    <label className="form-label">
                        Title <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        min="1"
                        value={inputField.title ?? ""}
                        className="form-control"
                        placeholder="Title to display"
                        onChange={e =>
                            setInputField(prev => ({
                                ...prev,
                                title:
                                    e.target.value === "" ? "" : e.target.value, // ✅ parse number safely
                            }))
                        }
                    />
                    {invalidFields.title && (
                        <small className="text-danger">
                            Please enter a valid title.
                        </small>
                    )}
                </div>
<div className="col mb-3">
                    <label className="form-label">
                        Tag Line <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        name="tag_line"
                        value={inputField.tag_line ?? ""}
                        className="form-control"
                        placeholder="Tag line to display"
                        onChange={e =>
                            setInputField(prev => ({
                                ...prev,
                                tag_line:
                                    e.target.value === "" ? "" : e.target.value, // ✅ parse number safely
                            }))
                        }
                    />
                    {invalidFields.title && (
                        <small className="text-danger">
                            Please enter a valid tag line.
                        </small>
                    )}
                </div>
                <div className="col mb-3">
                    <label className="form-label">
                        Max File Size (MB){" "}
                        <span className="text-danger">*</span>
                    </label>
                    <input
                        type="number"
                        name="max_file_size"
                        min="1"
                        value={inputField.max_file_size ?? ""}
                        className="form-control"
                        placeholder="Enter max file size in MB"
                        onChange={e =>
                            setInputField(prev => ({
                                ...prev,
                                max_file_size:
                                    e.target.value === ""
                                        ? ""
                                        : Number(e.target.value), // ✅ parse number safely
                            }))
                        }
                    />
                    {invalidFields.max_file_size && (
                        <small className="text-danger">
                            Please enter a valid file size.
                        </small>
                    )}
                </div>
                
                {/* ✅ Run Process Checkbox */}
                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="run_process"
                        name="run_process"
                        checked={inputField.run_process === "YES"}
                        onChange={handleInputField}
                    />
                    <label
                        className="form-check-label"
                        htmlFor="run_process">
                        Run Process
                    </label>
                </div>

                {/* ✅ Process + Meta Fields Section */}
                {inputField.run_process === "YES" && (
                    <div className="border rounded p-2 mb-3">
                        <div className="col mb-3">
                            <label className="form-label">
                                Select Process{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <ReactSelect
                                placeholder="Choose Process"
                                options={processList}
                                selectedOption={selectedProcess}
                                handleChange={handleProcessSelection}
                                fieldLabel="title"
                                fieldValue="id"
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Process Variables</strong>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={handleAddMeta}>
                                + Add Meta
                            </button>
                        </div>

                        {metaList.length === 0 && (
                            <div className="text-muted">
                                No meta fields added yet.
                            </div>
                        )}

                        {metaList.map((meta, index) => (
                            <div
                                className="row mb-2 align-items-end"
                                key={index}>
                                <div className="col">
                                    <label className="form-label">
                                        Variable Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={meta.db_column}
                                        onChange={e =>
                                            handleMetaChange(
                                                index,
                                                "db_column",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label">
                                        Default Value{" "}
                                        <input
                                            type="checkbox"
                                            name="isExpression"
                                            className={`form-check-input `}
                                            onChange={e =>
                                                handleMetaChange(
                                                    index,
                                                    "isExpression",
                                                    e.target.checked
                                                        ? "YES"
                                                        : "NO",
                                                )
                                            }
                                            checked={
                                                meta?.isExpression === "YES"
                                                    ? true
                                                    : false
                                            }
                                        />
                                        <span className="ms-2">
                                            {" "}
                                            is expression
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={meta.default_value}
                                        onChange={e =>
                                            handleMetaChange(
                                                index,
                                                "default_value",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-auto">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleRemoveMeta(index)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="d-flex justify-content-end">
                    <button
                        className="btn btn-sm button-theme mx-1"
                        type="button"
                        onClick={checkValidations}>
                        OK
                    </button>
                    <button
                        className="btn btn-sm button-theme mx-1"
                        type="button"
                        onClick={() => setShow(false)}>
                        Cancel
                    </button>
                </div>
            </form>
        </ErrorBoundary>
    );
}

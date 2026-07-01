import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../../../../../Config";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import DynamicCheckBoxs from "../../../../../components/dynamic-checkbox/Checkbox";

export default function DataListPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});

    const [dataList, setDataList] = useState([]);
    const [selectedDataList, setSelectedDataList] = useState({});

    useEffect(() => {
        getDataList();
    }, []);

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            setInputField(componentData);
            let _value = tryParseJSONObject(componentData.value, {});
            setSelectedDataList(_value);
        }
        // else {
        //     setInputField({});
        //     setCurrentComponent({});
        // }
    }, [context.selectedComponent]);

    useEffect(() => {
        let invalid = { ...invalidFields };
        if (
            inputField["foreign_key_column"] === "" ||
            inputField["foreign_key_column"] === true ||
            inputField["foreign_key_column"] === undefined
        ) {
            invalid["foreign_key_column"] = true;
        } else delete invalid.foreign_key_column;

        if (isEmpty(selectedDataList)) {
            invalid["selected_datalist"] = true;
        } else delete invalid.selected_datalist;

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

    function handleDataListSelection(item) {
        setInputField({ ...inputField, label: item.name });
        setSelectedDataList(item);
    }

    const handleUpdateComponentData = () => {
        // debugger
        let _components = { ...context.components };
        let componentId = currentComponent.id;
        let tempData = _components[componentId].data;
        let db_column = "data_list";
        let str = JSON.stringify(selectedDataList);

        tempData = {
            ...tempData,
            ...inputField,
            db_column,
            value: str,
        };
        _components[componentId].data = tempData;
        context.setComponents(_components);
    };

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (
            inputField["foreign_key_column"] === "" ||
            inputField["foreign_key_column"] === true ||
            inputField["foreign_key_column"] === undefined
        ) {
            invalid["foreign_key_column"] = true;
        } else delete invalid.foreign_key_column;

        if (
            inputField["master_key_column"] === "" ||
            inputField["master_key_column"] === true ||
            inputField["master_key_column"] === undefined
        ) {
            invalid["master_key_column"] = true;
        } else delete invalid.master_key_column;

        if (isEmpty(selectedDataList)) {
            invalid["selected_datalist"] = true;
        } else delete invalid.selected_datalist;

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    function getDataList() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "dataList",
                    serviceKey: "sys.datalist.viewer.list",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.dataList) {
                        setDataList(response.data.C_DATA.dataList);
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
                {/* <div className="row">
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
                        <label className="form-label">Default Value</label>
                        <input
                            type="text"
                            name="value"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.value}
                        />
                    </div>
                </div> */}
                <div className="row mb-2">
                    <div className="col mb-6">
                        <label className="form-label">
                            Label
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <input
                            disabled
                            type="text"
                            name="label"
                            className={`form-control form-control-sm ${
                                invalidFields["label"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            value={inputField.label}
                        />
                    </div>
                    <div className="col mb-6">
                        <label className="form-label">
                            Select Datalist{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>

                        <ReactSelect
                            placeholder="Choose Data list"
                            options={dataList}
                            selectedOption={selectedDataList}
                            handleChange={handleDataListSelection}
                            fieldLabel="name"
                            fieldValue="id"></ReactSelect>
                    </div>
                </div>
                <div className="row">
                    <div className="col mb-6">
                        <label className="form-label">
                            Foreign key column{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <input
                            type="text"
                            name="foreign_key_column"
                            className={`form-control form-control-sm ${
                                invalidFields["foreign_key_column"] !==
                                undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.foreign_key_column}
                        />
                    </div>
                    <div className="col mb-6">
                        <label className="form-label">
                            Master key column{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <input
                            type="text"
                            name="master_key_column"
                            className={`form-control form-control-sm ${
                                invalidFields["master_key_column"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            // defaultValue="id"
                            onChange={e => handleInputField(e)}
                            value={inputField.master_key_column}
                        />
                    </div>
                    <div className="my-2">
                        {inputField && (
                            <DynamicCheckBoxs
                                items={[
                                    {
                                        code: "true",
                                        label: "Hide Label",
                                    },
                                ]}
                                selectedItem={inputField["hide_label"]}
                                handleChange={item =>
                                    setInputField(prev => ({
                                        ...prev,
                                        hide_label: item,
                                    }))
                                }
                            />
                        )}
                        {inputField && (
                            <DynamicCheckBoxs
                                items={[
                                    {
                                        code: "true",
                                        label: "Show Maximize Button",
                                    },
                                ]}
                                selectedItem={inputField["maximize_button"]}
                                handleChange={item =>
                                    setInputField(prev => ({
                                        ...prev,
                                        maximize_button: item,
                                    }))
                                }
                            />
                        )}
                    </div>
                </div>
                <div className="row">
                    <div className="col mb-6">
                        <label className="form-label">Data Key</label>
                        <input
                            type="text"
                            name="dataKey"
                            className={`form-control form-control-sm ${
                                invalidFields["dataKey"] !== undefined
                                    ? "form-control-danger"
                                    : ""
                            }`}
                            onChange={e => handleInputField(e)}
                            value={inputField.dataKey}
                        />
                    </div>
                    <div className="col mb-6"></div>
                </div>
                <div className="d-flex flex-row justify-content-end my-2">
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

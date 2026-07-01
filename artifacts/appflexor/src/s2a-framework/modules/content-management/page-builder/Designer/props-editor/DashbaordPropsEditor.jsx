import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../../../../../Config";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";

export default function DashboardPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [invalidFields, setInvalidFields] = useState({});

    const [dashboardList, setDashboardList] = useState([]);
    const [selectedDashboard, setSelectedDashboard] = useState({});

    useEffect(() => {
        getDashboardList();
    }, []);

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            setInputField(componentData);
            let _value = tryParseJSONObject(componentData.value, {});
            setSelectedDashboard(_value);
        }
        // else {
        //     setInputField({});
        //     setCurrentComponent({});
        // }
    }, [context.selectedComponent]);

    useEffect(() => {
        let invalid = { ...invalidFields };

        if (isEmpty(selectedDashboard)) {
            invalid["selected_dashboard"] = true;
        } else delete invalid.selected_dashboard;

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

    function handleDashboardSelection(item) {
        setSelectedDashboard(item);
    }

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let componentId = currentComponent.id;
        let tempData = _components[componentId].data;
        let db_column = "dashboard";
        let obj = {
            id: selectedDashboard.id,
            name: selectedDashboard.name,
        };

        let str = JSON.stringify(obj);

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

        if (isEmpty(selectedDashboard)) {
            invalid["selected_dashboard"] = true;
        } else delete invalid.selected_dashboard;

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            handleUpdateComponentData();
            setShow(false);
        }
    }

    function getDashboardList() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "list",
                    serviceKey: "sys.dashboards",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.list) {
                        setDashboardList(response.data.C_DATA.list);
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
                    <div className="col mb-3">
                        <label className="form-label">
                            Select Dashboard{" "}
                            <span className="text-danger">&nbsp;*</span>
                        </label>
                        <ReactSelect
                            placeholder="Choose Dashboard"
                            options={dashboardList}
                            selectedOption={selectedDashboard}
                            handleChange={handleDashboardSelection}
                            fieldLabel="name"
                            fieldValue="id"></ReactSelect>
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

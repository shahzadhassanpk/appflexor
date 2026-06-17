import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";

import { API_URL } from "../../Config";

const SOURCE = {
    CAMUNDA_SEVEN: "CAMUNDA_SEVEN",
    CAMUNDA_EIGHT: "CAMUNDA_EIGHT",
};

const processEngineInitState = {
    id: "",
    source_engine: SOURCE.CAMUNDA_EIGHT,
};

function ProcessEngine({ activeTab }) {
    const [selectedItem, setSelectedItem] = useState(processEngineInitState);
    const [showPassword, setShowPassword] = useState(false);
    const appContext = useContext(AppContext);
    const { tenantSubscription } = appContext;

    useEffect(() => {
        if (activeTab === "PROCESS_ENGINE") {
            // getData();
        }
    }, [activeTab]);

    function handleChange(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "engine",
                    serviceKey: "bpm.process.engine",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    try {
                        let data = response.data.C_DATA.engine;
                        if (data && data.length > 0) {
                            setSelectedItem(data[0]);
                        } else {
                            setSelectedItem({});
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "process_engine"; //"formid"
        entityForm.entity = "process_engine"; //Db- "table name"
        entityForm.action = "update";

        if (
            !selectedItem.id ||
            selectedItem.id == "" ||
            selectedItem.id == "new"
        ) {
            entityForm.id = "new";
            selectedItem.id = "new";
        } else {
            entityForm.id = selectedItem.id;
        }

        entityForm.formData = selectedItem;
        request.data.push(entityForm);

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        selectedItem.id = response.data.C_NEW_RECORD_ID;
                    }
                    getData();
                }
            });
        } catch (e) {
            console.log("save processCategory error:" + e);
        }
    }

    return (
        <div className="process-configuration-engine">
            <div className="row py-2 m-0">
                <div className="form col-sm-12 form-background py-2 px-3">
                    <div className="row">
                        <div className="col-sm-6 mb-2">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Engine Type&nbsp;
                                    {/* <span className="text-danger"></span> */}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="source_engine"
                                    disabled={true}
                                    value={tenantSubscription.process_engine}
                                />
                                {/* <select
                                    placeholder="Select Form"
                                    className="form-select"
                                    name="source_engine"
                                    value={tenantSubscription.process_engine}
                                    disabled={true}
                                    onChange={e => handleChange(e)}>
                                    <option value="">Select Engine Type</option>
                                    <option value="CAMUNDA_SEVEN">
                                        Camunda v7
                                    </option>
                                    <option value="CAMUNDA_EIGHT">
                                        Camunda v8
                                    </option>
                                    <option value="JOGET">Joget</option>
                                </select> */}
                            </div>
                        </div>
                        <div className="col-sm-6 mb-2"></div>
                        <div className="col-sm-12 mb-2">
                            <h4>Process Monitor</h4>
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    URL&nbsp;
                                    {/* <span className="text-danger"></span> */}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="monitor_url"
                                    value={tenantSubscription.monitor_url}
                                    onChange={handleChange}
                                    readOnly={true}
                                />
                            </div>
                        </div>
                        <div className="col-sm-6 mb-2">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Username&nbsp;
                                    {/* <span className="text-danger"></span> */}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="monitor_username"
                                    value={tenantSubscription.monitor_username}
                                    onChange={handleChange}
                                    readOnly={true}
                                />
                            </div>
                        </div>

                        <div className="col-sm-6 mb-3 pass-input">
                            <label className="mt-1 fw-bold">Password</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    name="monitor_password"
                                    value={tenantSubscription.monitor_password}
                                    onChange={handleChange}
                                    readOnly={true}
                                    required
                                />

                                <span
                                    className="input-group-text pointer"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }>
                                    {showPassword ? (
                                        <i
                                            className="fa-regular fa-eye"
                                            title="Hide Password"></i>
                                    ) : (
                                        <i
                                            className="fa-regular fa-eye-slash"
                                            title="Show Password"></i>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer pe-0">
                    {/* {selectedItem.id === "" && (
                        <button
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => saveData()}
                            // disabled={saveIsDisabled}
                        >
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Save
                        </button>
                    )}
                    {selectedItem.id !== "" && (
                        <button
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => saveData()}
                            // disabled={saveIsDisabled}
                        >
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Update
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    );
}

export { SOURCE, ProcessEngine as default };

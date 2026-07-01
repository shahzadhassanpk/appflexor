import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";

import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import DesignerContext from "../../../Context/DesignerContext";
import { API_URL } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import RepositoryViewer from "./RepositoryViewer";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";
import useInput from "../../../../../../hooks/useInput";

/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function DmsRepository(props) {
    const [componentData, setComponentData] = useState({});

    const dmsModalRef = useRef(null);
    const handleShow = () => dmsModalRef?.current?.show();
    const handleClose = () => dmsModalRef?.current?.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;

            setComponentData(temObj);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);

    // utils
    const Error = () => {
        return (
            <div>
                <center className="text-danger">
                    Error occurred in Repository Viewer.
                </center>
            </div>
        );
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 ">
                <label className="form-label">Repository Viewer.</label>
            </div>
        );

    const EmptyDMS = () => (
        <div
            style={{ minHeight: "100px" }}
            className="d-flex align-items-center justify-content-center">
            <span className="text-muted">
                No <span className="text-danger">Repository</span> selected for
                this Repository Viewer.
            </span>
        </div>
    );

    return (
        <ErrorBoundary render={() => Error}>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {componentData.repositoryId ? (
                            <RepositoryViewer componentData={componentData} />
                        ) : (
                            <EmptyDMS />
                        )}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {componentData.repositoryId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    Selected{" "}
                                    <span className="text-danger">
                                        {componentData.repositoryTitle}
                                    </span>{" "}
                                    for Repository Viewer.
                                </span>
                            </div>
                        ) : (
                            <EmptyDMS />
                        )}
                    </>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div
                        className={` p-3 position-relative `}
                        onClick={() => setShow(true)}>
                        {componentData.repositoryId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    Selected{" "}
                                    <span className="text-danger">
                                        {componentData.name}
                                    </span>{" "}
                                    for Repository Viewer.
                                </span>
                            </div>
                        ) : (
                            <EmptyDMS />
                        )}
                    </div>
                )}

            <ChildrenModal
                ref={dmsModalRef}
                header="Repository Viewer Settings">
                <UpdateText setShow={setShow} />
            </ChildrenModal>
        </ErrorBoundary>
    );
}

function UpdateText({ setShow }) {
    const context = useContext(DesignerContext);

    const [repositoryList, setRepositoryList] = useState([]);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);

            setInputField(context.selectedComponent.data);
        } else {
            setInputField({});
            setCurrentComponent({});
        }
    }, [context]);

    const handleInputField = event => {
        let name = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        const selectedRepo = repositoryList.filter(
            r => r.id == inputField["repositoryId"],
        );
        const temp = { repositoryTitle: selectedRepo[0].title };

        tempData = {
            ...tempData,
            ...inputField,
            ...temp,
        };

        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "repositoryList",
                    serviceKey: "dms.list.repository",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setRepositoryList(response.data.C_DATA.repositoryList);
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

    function handleActionChange(val, event) {
        setInputField({
            ...inputField,
            actions: val,
        });
    }

    return (
        <ErrorBoundary>
            <div className="p-2">
                <div className="row mb-3">
                    <div className="col">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            className={`form-control`}
                            onChange={handleInputField}
                            value={inputField["name"]}
                        />
                    </div>
                    <div className="col">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Select Repository
                        </label>
                        <select
                            className="form-select"
                            name="repositoryId"
                            onChange={handleInputField}
                            value={inputField["repositoryId"]}>
                            <option defaultValue="">Select an option</option>
                            {repositoryList.map(repo => (
                                <option
                                    key={repo.id}
                                    value={repo.id}>
                                    {repo.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="row mb-3">
                    <div className="col">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Enable:
                        </label>
                        <DynamicCheckBoxs
                            classes={{
                                main: "d-flex gap-2 my-2",
                            }}
                            selectedItem={inputField.actions}
                            handleChange={handleActionChange}
                            items={[
                                {
                                    code: "LIKES",
                                    label: "Likes",
                                },
                                {
                                    code: "FAVOURITES",
                                    label: "Favorites",
                                },
                                {
                                    code: "COMMENTS",
                                    label: "Comments",
                                },
                            ]}
                        />
                    </div>
                </div>

                <div className="d-flex flex-row justify-content-end mt-2">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                handleUpdateComponentData();
                                setShow(false);
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default DmsRepository;

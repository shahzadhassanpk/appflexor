import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import TextEditor from "../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import DesignerContext from "../../content-management/page-builder/Context/DesignerContext";
import ProcessStatFormSelection from "./ProcessStatFormSelection";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function ProcessStartForm(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const processModalRef = useRef(null);
    const handleShow = () => processModalRef?.current?.show();
    const handleClose = () => processModalRef?.current?.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;
            // temObj.id = makeid(5);
            setComponentData(temObj);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });

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
                    Error occurred in Process Viewer.
                </center>
            </div>
        );
    };

    function getCategoryName(type = "") {
        let name = "";
        try {
            name = type
                .replace(/_/g, " ")
                .replace(
                    /(^\w|\s\w)(\S*)/g,
                    (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase(),
                );
        } catch (error) {
            console.error(error);
        }

        return name;
    }

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
                <label className="form-label">Process Viewer.</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {componentData.category ? (
                            <ProcessStatFormSelection
                                componentData={componentData}
                            />
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No{" "}
                                    <span className="text-danger">
                                        process form
                                    </span>{" "}
                                    selected for this Process.
                                </span>
                            </div>
                        )}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {componentData.category ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    Selected{" "}
                                    <span className="text-danger">
                                        {getCategoryName(
                                            componentData.category,
                                        )}
                                    </span>{" "}
                                    catergory for Process.
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No{" "}
                                    <span className="text-danger">
                                        category
                                    </span>{" "}
                                    selected for this Process.
                                </span>
                            </div>
                        )}
                    </>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div
                        className={` p-3 position-relative `}
                        onClick={() => setShow(true)}>
                        {componentData.category ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-database icon-space"></span>
                                    Selected{" "}
                                    <span className="text-danger">
                                        {componentData.process_title}
                                    </span>{" "}
                                    Process from{" "}
                                    <span className="text-danger">
                                        {getCategoryName(
                                            componentData.category,
                                        )}
                                    </span>{" "}
                                    catergory.
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted cursor-pointer">
                                    <span className="fa-solid fa-database icon-space"></span>
                                    No{" "}
                                    <span className="text-danger">
                                        category
                                    </span>{" "}
                                    selected for this Process.
                                </span>
                            </div>
                        )}

                        {/* <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}
                                >
                                <i className="m-2 fa-solid fa-gear d-block"></i>{" "}
                            </div>
                        </div> */}
                    </div>
                )}

            <ChildrenModal
                ref={processModalRef}
                size="xl"
                header="Process Start Form Settings">
                <UpdateText setShow={setShow} />
            </ChildrenModal>
        </ErrorBoundary>
    );
}

function UpdateText({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});
    const [categoryList, setCategoryList] = useState([]);
    const [processList, setProcessList] = useState([]);

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        let category = inputField["category"];
        if (category) {
            getProcessList(category);
        }
    }, [inputField["category"]]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(context.selectedComponent.props);
            setInputField(context.selectedComponent.data);
        } else {
            setInputField({});
            setPropsFromComponent([]);
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

        // old
        // setInputField((prev) => ({
        //     ...prev,
        //     [name]: value,
        // }));

        // new
        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);

        // let _components = { ...context.components };

        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;
        let selectedProcess = processList.filter(
            p => p.id === inputField.process_id,
        );

        let process_title = selectedProcess[0]
            ? selectedProcess[0].process_title
            : "";

        tempData = {
            ...tempData,
            ...inputField,
            process_title,
        };
        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "processCategory",
                    serviceKey: "process.category",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setCategoryList(response.data.C_DATA.processCategory);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getProcessList(category) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: category,
                    dataKey: "process",
                    serviceKey: "sys.process.cat",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setProcessList(response.data.C_DATA.process);
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
            <div className="p-2">
                <div className="row mb-3">
                    <div className="col-sm-4">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            className={`form-control`}
                            onChange={handleInputField}
                            value={inputField["title"]}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Select Category
                        </label>
                        <select
                            className="form-select"
                            name="category"
                            onChange={handleInputField}
                            value={inputField["category"]}>
                            <option defaultValue="">Select an option</option>
                            {categoryList.map(category => (
                                <option value={category.key}>
                                    {category.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-sm-4">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Select Process
                        </label>
                        <select
                            className="form-select"
                            name="process_id"
                            onChange={handleInputField}
                            value={inputField["process_id"]}>
                            <option defaultValue="">Select a process</option>
                            {processList.map(process => (
                                <option value={process.id}>
                                    {process.process_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-sm-4">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Form action button label
                        </label>
                        <input
                            type="text"
                            name="formActionLabel"
                            className={`form-control`}
                            onChange={handleInputField}
                            value={inputField["formActionLabel"]}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <label
                            className="mt-2 d-block"
                            htmlFor="">
                            Form submission message
                        </label>

                        {/* <textarea
                            type="textarea"
                            name="formSubmission"
                            className={`form-control mb-2`}
                            rows="10"
                            onChange={handleInputField}
                            value={inputField["formSubmission"]}
                        /> */}
                        <TextEditor
                            name="formSubmission"
                            value={inputField["formSubmission"]}
                            height="400px"
                            onChange={handleInputField}
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

export default ProcessStartForm;

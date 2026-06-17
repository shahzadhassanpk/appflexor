import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL } from "../../../Config";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import DesignerContext from "../../content-management/page-builder/Context/DesignerContext";
import ProcessSelection from "./ProcessSelection";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function ProcessViewer(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

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
                            <ProcessSelection componentData={componentData} />
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

            <Modal
                className="s2a-modal"
                size="lg"
                show={show}
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Process List Settings</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UpdateText setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function UpdateText({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});
    const [categoryList, setCategoryList] = useState([]);
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
        tempData = { ...tempData, ...inputField };
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
                    <div className="col-sm-6">
                        <div className="form-group mb-2">
                            <label
                                htmlFor=""
                                className="mb-1">
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
                        <div className="form-group mb-2">
                            <label
                                htmlFor=""
                                className="mb-1">
                                Select Category
                            </label>
                            <select
                                className="form-select"
                                name="category"
                                onChange={handleInputField}
                                value={inputField["category"]}>
                                <option defaultValue="">
                                    Select an option
                                </option>
                                {categoryList.map(category => (
                                    <option value={category.key}>
                                        {category.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-2">
                            <label
                                htmlFor=""
                                className="mb-1">
                                Label for Action Button
                            </label>
                            <input
                                type="text"
                                name="actionLabel"
                                className={`form-control`}
                                onChange={handleInputField}
                                value={inputField["actionLabel"]}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label
                                htmlFor=""
                                className="mb-1">
                                Form submission message
                            </label>
                            <input
                                type="text"
                                name="formSubmission"
                                className={`form-control`}
                                onChange={handleInputField}
                                value={inputField["formSubmission"]}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label
                                htmlFor=""
                                className="mb-1">
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
                    <div className="col-sm-6">
                        <label
                            htmlFor=""
                            className="show-process-column-selection">
                            Show Column
                        </label>
                        <div className="row">
                            {" "}
                            <div className="col">
                                <input
                                    type="checkbox"
                                    name="showTitle"
                                    className="form-check-input me-2"
                                    onChange={handleInputField}
                                    checked={
                                        inputField["showTitle"] === "YES"
                                            ? true
                                            : false
                                    }
                                />
                                <label htmlFor="">Title</label>
                            </div>{" "}
                        </div>
                        <div className="row">
                            {" "}
                            <div className="col">
                                <input
                                    type="checkbox"
                                    name="showProcess"
                                    className="form-check-input me-2"
                                    onChange={handleInputField}
                                    checked={
                                        inputField["showProcess"] === "YES"
                                            ? true
                                            : false
                                    }
                                />
                                <label htmlFor="">Process</label>
                            </div>{" "}
                        </div>
                        <div className="row">
                            {" "}
                            <div className="col">
                                <input
                                    type="checkbox"
                                    name="showForm"
                                    className="form-check-input me-2"
                                    onChange={handleInputField}
                                    checked={
                                        inputField["showForm"] === "YES"
                                            ? true
                                            : false
                                    }
                                />
                                <label htmlFor="">Form</label>
                            </div>{" "}
                        </div>
                        <div className="row">
                            {" "}
                            <div className="col">
                                <input
                                    type="checkbox"
                                    name="showCategory"
                                    className="form-check-input me-2"
                                    onChange={handleInputField}
                                    checked={
                                        inputField["showCategory"] === "YES"
                                            ? true
                                            : false
                                    }
                                />
                                <label htmlFor="">Category</label>
                            </div>{" "}
                        </div>
                    </div>
                </div>
                <div className="d-flex flex-row justify-content-end">
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

export default ProcessViewer;

import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../../../../../AppContext";
import { API_URL } from "../../../../../../Config";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DesignerContext from "../../../Context/DesignerContext";
import FormSelection from "./FormSelection";
import { makeid } from "../../../../../../utils/utils";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Form(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    // const [show, setShow] = useState(false);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const formModalRef = useRef(null);
    const handleShow = () => formModalRef.current.show();
    const handleClose = () => formModalRef.current.close();
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
                <center className="text-danger">Error occurred in Form.</center>
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
                <label className="form-label">Form.</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {componentData.formId ? (
                            <FormSelection componentData={componentData} />
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No <span className="text-danger">form</span>{" "}
                                    selected.
                                </span>
                            </div>
                        )}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {componentData.formId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    Selected{" "}
                                    <span className="text-danger">
                                        {componentData.formName}
                                    </span>{" "}
                                    for Form.
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No <span className="text-danger">form</span>{" "}
                                    selected.
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
                        {componentData.formId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-database icon-space"></span>
                                    Selected{" "}
                                    <span className="text-danger">
                                        {componentData.formName}
                                    </span>{" "}
                                    for Form.
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted cursor-pointer">
                                    <span className="fa-solid fa-database icon-space"></span>
                                    No <span className="text-danger">form</span>{" "}
                                    selected.
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
                ref={formModalRef}
                size="xl"
                header="Form Settings">
                <UpdateText
                    setShow={setShow}
                    tenantId={tenantId}
                />
            </ChildrenModal>
        </ErrorBoundary>
    );
}

function UpdateText({ setShow, tenantId }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});
    const [formList, setFormList] = useState([]);

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

        let selectedForm = formList.filter(f => f.id === inputField.formId);

        let formName = selectedForm[0] ? selectedForm[0].name : "";

        tempData = {
            ...tempData,
            ...inputField,
            formName,
        };
        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "forms",
                    serviceKey: "sys.forms",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setFormList(response.data.C_DATA.forms);
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
                            Select Form
                        </label>
                        <select
                            className="form-select"
                            name="formId"
                            onChange={handleInputField}
                            value={inputField["formId"]}>
                            <option defaultValue="">Select an option</option>
                            {formList &&
                                formList.map(form => (
                                    <option value={form.id}>{form.name}</option>
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

export default Form;

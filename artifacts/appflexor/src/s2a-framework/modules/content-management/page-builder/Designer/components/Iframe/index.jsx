import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../../utils/utils";
import DesignerContext from "../../../Context/DesignerContext";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Iframe(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;
            temObj.id = makeid(5);

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

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;

        if (componentData.regex && componentData.regex.length > 0) {
            const regexExp = new RegExp(componentData.regex);
            let strToValidate = value;
            let strIsValid = regexExp.test(strToValidate);

            if (!strIsValid) {
                let regexInfo = `Field must match regex pattern.`;
                if (props.component.data.regexinfo) {
                    regexInfo = props.component.data.regexinfo;
                }
                setMessage(regexInfo);
            } else {
                setMessage("");
            }
        }

        setObj(prev => ({
            ...prev,
            [key]: value,
        }));

        props.handleInputFields(componentData.db_column, value);
    }

    const Error = () => {
        return (
            <div>
                <center className="text-danger">
                    Error occurred in Iframe.
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
                <label className="form-label">Iframe</label>
            </div>
        );

    function resizeIframe() {
        try {
            if (typeof document !== "undefined") {
                let obj = document.getElementById(componentData.id);

                if (obj.contentWindow) {
                    let height =
                        obj.contentWindow.document.documentElement.scrollHeight;
                    obj.style.height = height + "px";
                    // console.log("************* height:" + height);
                    //obj.contentWindow.top = obj;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    const { height, width } = props && props.component && props.component.data;

    return (
        <ErrorBoundary render={() => Error}>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {componentData.url ? (
                            <div>
                                <iframe
                                    id={componentData.id}
                                    onLoad={resizeIframe}
                                    src={
                                        componentData.url
                                            ? componentData.url
                                            : ""
                                    }
                                    className="iframe-body"
                                    frameBorder="0"
                                    scrolling="no"
                                    style={{
                                        height: `${height}px`,
                                        width: `${width}px`,
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-crop-simple icon-space"></span>
                                    No <span className="text-danger">URL</span>{" "}
                                    provided.
                                </span>
                            </div>
                        )}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {componentData.url ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-crop-simple icon-space"></span>
                                    Points to this URL{" "}
                                    <span className="text-danger">
                                        {componentData.url}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-crop-simple icon-space"></span>
                                    No <span className="text-danger">URL</span>{" "}
                                    provided.
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
                        {componentData.url ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    <span className="fa-solid fa-crop-simple icon-space"></span>
                                    Points to this URL{" "}
                                    <span className="text-danger">
                                        {componentData.url}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted cursor-pointer">
                                    <span className="fa-solid fa-crop-simple icon-space"></span>
                                    No{" "}
                                    <span className="text-danger">
                                        IFrame URL
                                    </span>{" "}
                                    provided.
                                </span>
                            </div>
                        )}

                        {/* <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}>
                                <i className="m-2 fa-regular fa-pen-to-square d-block"></i>{" "}
                            </div>
                        </div> */}
                    </div>
                )}

            <Modal
                className="s2a-modal"
                show={show}
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Edit URL</span>
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
                                onClick={() => {
                                    setShow(false);
                                }}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UpdateRichText setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function UpdateRichText({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});

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
                <div className="mb-3">
                    <RenderFormFields
                        fieldsArr={propsFromComponent}
                        inputField={inputField}
                        handleInputField={handleInputField}
                    />
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

export function RenderFormFields({ fieldsArr, inputField, handleInputField }) {
    return (
        <div className="row">
            {fieldsArr &&
                fieldsArr.map(field => {
                    return (
                        <React.Fragment key={field.id}>
                            {field.type === "text" && (
                                <div className="col-sm-12">
                                    <div className="mb-3">
                                        <label htmlFor="">{field.label}</label>
                                        <input
                                            type={field.type}
                                            name={field.id}
                                            className={`form-control form-control-sm`}
                                            rows="10"
                                            onChange={e => handleInputField(e)}
                                            value={
                                                inputField[field.id]
                                                    ? inputField[field.id]
                                                    : ""
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
        </div>
    );
}

export default Iframe;

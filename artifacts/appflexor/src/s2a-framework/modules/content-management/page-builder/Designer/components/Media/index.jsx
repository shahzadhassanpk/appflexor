import { Interweave } from "interweave";
import React, { useContext, useEffect, useState, useRef } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DesignerContext from "../../../Context/DesignerContext";
import { makeid } from "../../../../../../utils/utils";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Media(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const videoEl = useRef(null);

    const attemptPlay = () => {
        videoEl &&
            videoEl.current &&
            videoEl.current.play().catch(error => {
                console.error("Error attempting to play", error);
            });
    };

    useEffect(() => {
        attemptPlay();
    }, []);

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
        let obj = document.getElementById(componentData.id);
        let height = obj.contentWindow.document.documentElement.scrollHeight;
        obj.style.height = height + "px";
        // console.log("************* height:" + height);
        //obj.contentWindow.top = obj;
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
                            <>
                                <iframe
                                    style={{
                                        height: `${height}`,
                                        width: `${width}`,
                                    }}
                                    allowfullscreen="allowfullscreen"
                                    mozallowfullscreen="mozallowfullscreen"
                                    msallowfullscreen="msallowfullscreen"
                                    oallowfullscreen="oallowfullscreen"
                                    webkitallowfullscreen="webkitallowfullscreen"
                                    
                                    src={
                                        componentData.url
                                            ? componentData.url + "?autoplay=1"
                                            : ""
                                    }
                                    ref={videoEl}></iframe>
                            </>
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
                                    Video Points to this URL{" "}
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
                                    <label>Video Link</label>
                                    <div>
                                        <span className="fa-solid fa-crop-simple icon-space"></span>
                                        Video Points to this URL{" "}
                                        <span className="text-danger">
                                            {componentData.url}
                                        </span>
                                    </div>
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
                                        Media URL
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
                        <span>Video Link</span>
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
                    <UpdateProps setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function UpdateProps({ setShow }) {
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
                {/* <p>
                    Following extension are supported:<br></br> .wav, .mp3,
                    .mp4, .mpg, .wmv, and .avi.
                </p> */}
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

export default Media;

import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import SignatureCanvas from "react-signature-canvas";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import "./styles.css";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
function Signature(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const previewModeSignature = useRef();
    // const [data, setData] = obj[componentData.db_column];
    const [showCanvas, setShowCanvas] = useState(false);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;
                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression(
                            { expression: disableExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        setData(props.formData);
    }, [props.formData]);

    function getSignature() {
        const URL = previewModeSignature.current
            .getTrimmedCanvas()
            .toDataURL("image/png");
        // setImageURL(URL);

        return URL;
    }

    function handleChange() {
        let key = componentData.db_column;
        let value = getSignature();
        let isValid = true;
        // TODO: check for isRequired & maxLength

        if (
            componentData.required === "YES" &&
            value.trim().length === 0 &&
            isValid
        ) {
            isValid = false;
        }

        setObj(prev => ({
            ...prev,
            [key]: value,
        }));

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, value, isValid);
        }

        setShowCanvas(false);
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
            <div className="mb-3 p-3">
                <label className="form-label">Signature</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                />
            </div>
        );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary>
            {visible && (
                <div
                    className={
                        "field-padding s2a-signature " + userDefineClasses()
                    }>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <div className="d-flex flex-column align-items-center">
                                <div>
                                    <i className="fas fa-signature"></i>
                                </div>
                                <div>
                                    {componentData.label
                                        ? componentData.label
                                        : "Signature"}
                                    {componentData.required &&
                                        componentData.required === "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}
                                </div>
                            </div>
                        )}
                    {props.mode === props.modeType.readonly && (
                        <div>
                            <div className="d-flex justify-content-center">
                                <img
                                    className="disable-drag"
                                    src={obj[componentData.db_column]}
                                    alt=""
                                />
                            </div>
                            <hr />
                            <center>
                                {componentData.label
                                    ? componentData.label
                                    : "Signature"}
                            </center>
                            <p className="text-danger">
                                {message && <span>{message}</span>}
                            </p>
                        </div>
                    )}
                    {(props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <div>
                            <div className="d-flex flex-row">
                                {props.component.data.disabled === "true" ||
                                props.component.data.readonly === "YES" ? (
                                    <></>
                                ) : (
                                    <div
                                        className={`ms-auto mx-1 pointer ${
                                            !showCanvas ? "" : "visually-hidden"
                                        } `}
                                        title="Edit signature"
                                        onClick={() => setShowCanvas(true)}>
                                        <i className="fa-regular fa-pen-to-square "></i>
                                    </div>
                                )}
                                <div
                                    className={`ms-auto mx-1 pointer ${
                                        showCanvas ? "" : "visually-hidden"
                                    } `}
                                    title="Save signature"
                                    onClick={handleChange}>
                                    <i className="fa-solid fa-check "></i>
                                </div>
                                <div
                                    className={`mx-1 pointer ${
                                        showCanvas ? "" : "visually-hidden"
                                    } `}
                                    title="Clear Canvas"
                                    onClick={() => {
                                        previewModeSignature.current.clear();
                                    }}>
                                    <i className="fa-solid fa-ban "></i>
                                </div>
                                <div
                                    className={`mx-1 pointer ${
                                        showCanvas ? "" : "visually-hidden"
                                    } `}
                                    title="Cancel"
                                    onClick={() => setShowCanvas(false)}>
                                    <i className="fa-solid fa-xmark "></i>
                                </div>
                            </div>
                            {showCanvas ? (
                                <div className="border">
                                    <SignatureCanvas
                                        penColor="black"
                                        canvasProps={{
                                            style: {
                                                width: "100%",
                                                height: 100,
                                            },
                                        }}
                                        ref={previewModeSignature}
                                    />
                                </div>
                            ) : (
                                <div className="d-flex justify-content-center">
                                    <img
                                        className="disable-drag"
                                        src={obj[componentData.db_column]}
                                        alt=""
                                    />
                                </div>
                            )}

                            <hr />
                            {!props.isInDatalistMode && (
                                <center>
                                    {componentData.label
                                        ? componentData.label
                                        : "Signature"}
                                    {props.component.data.required &&
                                        props.component.data.required ===
                                            "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}
                                </center>
                            )}
                            <p className="text-danger">
                                {message && <span>{message}</span>}
                            </p>
                        </div>
                    )}
                </div>
            )}
            <Modal
                className="s2a-modal"
                show={show}
                size="lg"
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Edit Signature</span>
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
                    <TextPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default Signature;

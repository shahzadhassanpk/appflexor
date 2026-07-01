import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import MDEditor from "@uiw/react-md-editor";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import RichTextPropsEditor from "../../props-editors/RichTextPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import { AppContext } from "../../../../../../../AppContext";
import useGlobalData from "../../../../../../components/useGlobal";
// import { makeid } from "../../../../../utils/utils";
/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function RichTextEditor(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
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
            let data = { ...props.component.data, id: props.component.id };
            setComponentData(data);
        }

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }

        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));

        if (
            props.isFormSaved ||
            (props.formData.id && props.formData.id !== "new")
        ) {
            let isStringValid = true;
            let stringToValidate = props.formData[key];
            let lengthOfString = stringToValidate && stringToValidate.length;

            let _message = "";

            let minCharacters = parseInt(componentData.min_characters);
            let maxCharacters = parseInt(componentData.max_characters);

            if (!minCharacters) minCharacters = -1; // backtrack compatibility
            if (!maxCharacters) maxCharacters = 1000000000; // backtrack compatibility

            if (
                lengthOfString >= minCharacters &&
                lengthOfString <= maxCharacters
            ) {
                isStringValid = true;
                _message = "";
            } else {
                isStringValid = false;
                _message =
                    minCharacters > 0
                        ? `Letter count must stay between ${minCharacters} and ${maxCharacters}`
                        : `Letter count cannot exceed ${maxCharacters}`;
            }

            if (
                isStringValid &&
                props.component.data.regex &&
                props.component.data.regex.length > 0
            ) {
                const regexExp = new RegExp(props.component.data.regex);
                let strToValidate = props.formData[key];
                let strIsValid = regexExp.test(strToValidate);

                if (!strIsValid) {
                    let regexInfo = `Field must match regex pattern.`;
                    if (props.component.data.regexinfo) {
                        regexInfo = props.component.data.regexinfo;
                    }
                    _message = regexInfo;
                } else {
                    _message = "";
                }
            }

            setMessage(_message);
        }

        setData(props.formData);
    }, [props.formData, props.component, props.isFormSaved]);

    function handleChange(e) {
        let type = componentData.type
        let key = componentData.db_column;
        let stringToValidate = (type=='MARKDOWN'?e:e.target.value);
        let isStringValid = true;
        let lengthOfString = stringToValidate.length;

        let _message = "";

        let minCharacters = parseInt(componentData.min_characters);
        let maxCharacters = parseInt(componentData.max_characters);

        if (!minCharacters) minCharacters = -1; // backtrack compatibility
        if (!maxCharacters) maxCharacters = 1000000000; // backtrack compatibility

        if (
            lengthOfString >= minCharacters &&
            lengthOfString <= maxCharacters
        ) {
            isStringValid = true;
            _message = "";
        } else {
            isStringValid = false;
            _message =
                minCharacters > 0
                    ? `Letter count must stay between ${minCharacters} and ${maxCharacters}`
                    : `Letter count cannot exceed ${maxCharacters}`;
        }

        if (
            isStringValid &&
            componentData.regex &&
            componentData.regex.length > 0
        ) {
            const regexExp = new RegExp(componentData.regex);
            let validationPassed = regexExp.test(stringToValidate);

            if (!validationPassed) {
                let regexInfo = `Field must match regex pattern.`;
                if (componentData.regexinfo) {
                    regexInfo = componentData.regexinfo;
                }
                isStringValid = false;
                _message = regexInfo;
            } else {
                _message = "";
            }
        }

        setIsValidField(isStringValid);
        setMessage(_message);

        setObj(prev => ({
            ...prev,
            [key]: stringToValidate,
        }));

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(
                componentData.db_column,
                stringToValidate,
                isStringValid,
            );
        }
    }

    const Error = () => {
        return <div>Error occurred in Text Field.</div>;
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
            <div className="form-group">
                <label className="form-label">Text Area</label>
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
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div
                    className={`form-group s2a-rich-text ${userDefineClasses()}`}>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}

                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.design ||
                            props.mode === props.modeType.readonly) && (
                            <>
                                <label className="form-label pe-2 w-100 text-center">
                                    {componentData.label
                                        ? componentData.label
                                        : "Rich Text Editor"}
                                    {componentData.required &&
                                        componentData.required === "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}{" "}
                                    {componentData?.type}
                                </label>
                                {/* <TextEditor
                                    id={componentData.db_column}
                                    value={obj[componentData.db_column]}
                                    onChange={handleChange}
                                    height={
                                        componentData?.height
                                            ? componentData.height
                                            : 300
                                    }
                                    disabled={true}
                                    mode={componentData.mode}
                                /> */}
                            </>
                        )}
                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.preview ||
                            props.mode === props.modeType.render) && (
                            <div className="position-relative">
                                {!props?.isInDatalistMode && (
                                    <label className="form-label">
                                        {componentData.label
                                            ? componentData.label
                                            : "Rich Text Editor"}
                                        {componentData.required &&
                                            componentData.required ===
                                                "YES" && (
                                                <span className="text-danger">
                                                    &nbsp;*
                                                </span>
                                            )}
                                    </label>
                                )}
                                <div>
                                    {(!componentData?.type ||
                                        componentData.type === "HTML") && (
                                        <TextEditor
                                            id={componentData.db_column}
                                            value={obj[componentData.db_column]}
                                            onChange={handleChange}
                                            onFocus={handleChange}
                                            height={
                                                componentData?.height
                                                    ? componentData.height
                                                    : 300
                                            }
                                            disabled={
                                                props.mode ===
                                                props.modeType.design
                                                    ? true
                                                    : componentData.readonly ===
                                                      "YES"
                                                    ? true
                                                    : disable
                                                    ? true
                                                    : false
                                            }
                                            mode={componentData.mode}
                                            componentData={componentData}
                                        />
                                    )}
                                    {componentData?.type &&
                                        componentData.type === "MARKDOWN" && (
                                            <MDEditor
                                                id={componentData.db_column}
                                                value={
                                                    obj[componentData.db_column]
                                                }
                                                onChange={handleChange}
                                            />
                                        )}
                                </div>
                                {message && (
                                    <div className="fa-3xl">
                                        <i
                                            title={message}
                                            className="richtexteditor-error-icon position-absolute translate-middle-y fa-fade text-danger fa-solid fa-circle-question"></i>
                                    </div>
                                )}
                                {/* <p className="text-danger">
                                    {message && <span>{message}</span>}
                                </p> */}
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
                        <span>Edit RichtextEditor</span>
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
                    <RichTextPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default RichTextEditor;

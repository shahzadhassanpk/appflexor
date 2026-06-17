import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import PasswordPropsEditor from "../../props-editors/PasswordPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function PasswordField(props) {
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
    const [showPassword, setShowPassword] = useState(false);

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
        try {
            if (props.component && props.component.data) {
                setComponentData(props.component.data);
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
                let stringToValidate = props.formData[key];

                let isStringValid = true;
                let lengthOfString = (""+stringToValidate).length;

                let _message = "";

                let minCharacters = parseInt(
                    props.component.data.min_characters,
                );
                let maxCharacters = parseInt(
                    props.component.data.max_characters,
                );

                if (!minCharacters) minCharacters = -1; // backtrack compatibility
                if (!maxCharacters) maxCharacters = 255; // backtrack compatibility

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
                            ? `Letter count should be ${minCharacters} to ${maxCharacters}`
                            : `Letter count cannot exceed ${maxCharacters}`;
                }

                if (isStringValid && props.component.data.required === "YES") {
                    if (lengthOfString > 0) {
                        isStringValid = true;
                        _message = "";
                    } else {
                        isStringValid = false;
                        _message = "Required field.";
                    }
                }

                if (
                    props.component.data.regex &&
                    props.component.data.regex.length > 0
                ) {
                    const regexExp = new RegExp(props.component.data.regex);

                    let strToValidate = stringToValidate;
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
        } catch (e) {
            console.log("***********" + e);
        }
    }, [props.formData, props.component.data, props.isFormSaved]);

    function handleChange(e) {
        let key = e.target.id;
        let stringToValidate = e.target.value;
        let isStringValid = true;
        let lengthOfString = stringToValidate.length;

        let _message = "";

        let minCharacters = parseInt(componentData.min_characters);
        let maxCharacters = parseInt(componentData.max_characters);

        if (!minCharacters) minCharacters = -1; // backtrack compatibility
        if (!maxCharacters) maxCharacters = 255; // backtrack compatibility

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
                    ? `Letter count should be ${minCharacters} to ${maxCharacters}`
                    : `Letter count cannot exceed ${maxCharacters}`;
        }

        if (isStringValid && componentData.required === "YES") {
            if (lengthOfString > 0) {
                isStringValid = true;
                _message = "";
            } else {
                isStringValid = false;
                _message = "Required field.";
            }
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

    function handleOnBlur(event) {
        if (props.handleOnFieldBlur) {
            let value = event.target.value;
            props.handleOnFieldBlur(value);
        } else {
            handleChange(event);
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

    // if (isEmpty(componentData))
    //     return (
    //         <div className="mb-3 p-3">
    //             <label className="form-label">Text Field</label>
    //             <input
    //                 type="text"
    //                 className="form-control form-control-sm"
    //                 disabled
    //             />
    //         </div>
    //     );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {/* {props.mode === props.modeType.render && (
                <pre>
                    <code>{JSON.stringify(componentData, null, 2)}</code>
                </pre>
            )} */}
            <div className={`form-group s2a-passfield ${userDefineClasses()}`}>
                {visible && (
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        {!props.isInDatalistMode && (
                            <>
                                <div className="flex-between">
                                    <label className="form-label">
                                        {componentData.label
                                            ? componentData.label
                                            : "Password Field"}
                                        {componentData.required &&
                                            componentData.required ===
                                                "YES" && (
                                                <span className="text-danger">
                                                    &nbsp;*
                                                </span>
                                            )}
                                    </label>
                                    {message && (
                                        <div className="fa-3xl">
                                            <i
                                                title={message}
                                                className="pe-2 fa-fade text-danger fa-regular fa-circle-question"></i>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.design ||
                        props.mode === props.modeType.readonly) && (
                        <input
                            type="password"
                            className="form-control form-control-sm"
                            value={obj[componentData.db_column]}
                            disabled
                        />
                    )}
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <>
                            {visible && (
                                <div className="position-relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        className={`form-control  form-control-sm ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? isValidField
                                                    ? ""
                                                    : "form-control-danger"
                                                : ""
                                        } `}
                                        id={
                                            componentData.db_column &&
                                            componentData.db_column
                                        }
                                        pattern={
                                            props &&
                                            props.component &&
                                            props.component.data &&
                                            props.component.data.regex
                                        }
                                        required
                                        // value={obj[obj.key] ? obj[obj.key] : ""}

                                        value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        onFocus={handleChange}
                                        onBlur={e => handleOnBlur(e)}
                                        disabled={
                                            props.mode === props.modeType.design
                                                ? true
                                                : componentData.readonly ===
                                                  "YES"
                                                ? true
                                                : disable
                                                ? true
                                                : false
                                        }
                                    />
                                    <div
                                        className="show-pass"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }>
                                        {showPassword ? (
                                            <i className="fa-regular fa-eye"></i>
                                        ) : (
                                            <i className="fa-regular fa-eye-slash"></i>
                                        )}
                                    </div>

                                    {/* <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p> */}
                                </div>
                            )}
                        </>
                    )}
            </div>
            {/* <code>{JSON.stringify(obj)}</code> */}
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
                        <span>Edit Password Field</span>
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
                    <PasswordPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default PasswordField;

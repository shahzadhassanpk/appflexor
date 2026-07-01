import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { TIME_FORMAT_FOR_USER_VIEW } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { formatTimeForDataBase, parseDBDateTime, parseDBTime } from "../../../../../../utils/utils";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import useGlobalData from "../../../../../../components/useGlobal";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import {
    formatTimeForUserViewLocale,
    formatTimeForUserView,
    localToUTCDateTime,
    formatDateTimeToISO,
} from "../../../../../../utils/utils";

/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Time(props) {
    const [obj, setObj] = useState({});
    const [data, setData] = useState({});
    const [componentData, setComponentData] = useState({});

    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });
        }
    }, [props.component.data]);

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

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;
        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        setData(props.formData);
    }, [props.formData, props.component.data]);

    function handleClear(e) {
        let key = e.target.name;
        let isValid = true;

        if (componentData.required === "YES" && isValid) {
            isValid = false;
        }

        setIsValidField(isValid);

        setObj(prev => ({
            ...prev,
            [key]: "",
        }));

        props.handleInputFields(componentData.db_column, "", isValid);
    }

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;
        let isValid = true;
        let today = new Date();

        if (value) {
            if (
                componentData.required === "YES" &&
                value.trim().length === 0 &&
                isValid
            ) {
                isValid = false;
            }
            let dbFormat = value;
            try {
                let arrTime = value.split(":");
                console.log("************ value:"+value);
                today.setHours(arrTime[0]);
                today.setMinutes(arrTime[1]);
                let local = formatDateTimeToISO(today);
                console.log("************ local:"+local);
                let utc = localToUTCDateTime(local);                
                dbFormat = formatTimeForDataBase(utc);
                console.log("************ dbFormat:"+local);
                // setObj(prev => ({
                //     ...prev,
                //     [key]: utc,
                // }));
            } catch (e) {}
            setIsValidField(isValid);
            
            if (props.handleInputFields) {
                props.handleInputFields(
                    componentData.db_column,
                    dbFormat,
                    isValid,
                );
            }
        }
    }

    function handleOnBlur(event) {
        // if (props.handleOnFieldBlur) {
        //     let value = event.target.value;
        //     props.handleOnFieldBlur(value);
        // } else {
        // }
        // handleChange(event);
    }

    const Error = () => {
        return <div>Error occurred in Time.</div>;
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
            <div className="mb-3 p-3">
                <label className="form-label">Time</label>
                <input
                    type="time"
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
            <div className={`form-group s2a-time ${userDefineClasses()}`}>
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
                            <label className="form-label">
                                {componentData.label
                                    ? componentData.label
                                    : "Time"}
                                {componentData.required &&
                                    componentData.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}
                            </label>
                        )}
                    </>
                )}

                {props.mode === props.modeType.design && (
                    <input
                        type="time"
                        className="form-control  form-control-sm"
                        value={obj[componentData.db_column]}
                        disabled
                    />
                )}

                {(props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) && (
                    <>
                        {visible && (
                            <>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="time"
                                        className={`input-group date-time-picker form-control  ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? !isValidField
                                                    ? "form-control-danger"
                                                    : ""
                                                : ""
                                        } `}
                                        name={
                                            componentData.db_column &&
                                            componentData.db_column
                                        }
                                        data={formatTimeForUserView(
                                            obj[componentData.db_column],
                                        )}
                                        value={parseDBTime(obj[componentData.db_column])}
                                        onChange={(e)=>handleChange(e)}
                                        // onBlur={e => handleOnBlur(e)}
                                        disabled={
                                            props.mode ===
                                                props.modeType.design ||
                                            props.mode ===
                                                props.modeType.readonly ||
                                            props.mode ===
                                                props.modeType.preview
                                                ? true
                                                : componentData.readonly ===
                                                      "YES" || disable
                                                ? true
                                                : false
                                        }
                                    />
                                    <span className="input-group-text">
                                        <div
                                            name={componentData.db_column}
                                            className="text-decoration-none pointer"
                                            onClick={handleClear}>
                                            clear
                                        </div>
                                    </span>
                                </div>
                                {/* <p className="text-danger">
                                    {message && <span>{message}</span>}
                                </p> */}
                            </>
                        )}
                    </>
                )}
            </div>
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
                        <span>Edit Time</span>
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

export default Time;

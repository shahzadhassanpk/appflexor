import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
import {
    formatDateForUserView,
    localToUTCDateTime,
    formatDateTimeToISO,
    formatDateTimeForDataBase,
    detectDeviceType,
    parseDBDateTime,
} from "../../../../../../utils/utils";

function DateField(props) {
    const [obj, setObj] = useState({});
    const [data, setData] = useState({});
    const [componentData, setComponentData] = useState({});
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const expressionProps = useGlobalData();
    const deviceType = detectDeviceType();

    useEffect(() => {
        if (props.component?.data) {
            setComponentData(props.component.data);
            const key = props.component.data.db_column;
            const value = props.component.data.value;
            setObj({ [key]: value });
        }
    }, [props.component.data]);

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                const visibleExp = props.component.data.condition;
                const disableExp = props.component.data.disabled;

                if (disableExp) {
                    setDisable(
                        evaluateExpression(
                            { expression: disableExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
                if (visibleExp) {
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
        if (props.component?.data) {
            setComponentData(props.component.data);
        }
        if (!props.formData) return;

        const key = props.component.data.db_column;
        setObj(prev => ({ ...prev, [key]: props.formData[key] }));
        setData(props.formData);
    }, [props.formData, props.component.data]);

    const handleChange = e => {
        const key = e.target.id;
        const value = e.target.value;
        let isValid = !(
            componentData.required === "YES" && value.trim().length === 0
        );
        setIsValidField(isValid);

        const localISO = formatDateTimeToISO(value);
        const utc = localToUTCDateTime(localISO);
        const dbFormat = formatDateTimeForDataBase(utc);

        if (props.handleInputFields) {
            props.handleInputFields(key, value, isValid);
        }
        setObj(prev => ({ ...prev, [key]: value }));
    };

    const handleOnBlur = event => {
        if (props.handleOnFieldBlur) {
            props.handleOnFieldBlur("DATE", event.target.value);
        }
        handleChange(event);
    };

    const userDefineClasses = () =>
        props.mode !== props.modeType.design
            ? `${classes} ${dbColumnAsClass}`
            : "";

    // if (!componentData.db_column) {
    //     return (
    //         <div className="mb-3 p-3">                
    //             <label className="form-label">Date</label>
    //             <input
    //                 type="date"
    //                 className="form-control form-control-sm"
    //                 disabled
    //             />
    //         </div>
    //     );
    // }

    const Error = () => <div>Error occurred in Date.</div>;

    return (
        <ErrorBoundary render={() => Error}>
            <div className={`form-group s2a-date ${userDefineClasses()}`}>
                {visible && (
                    <>
                        {props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}
                            />
                        )}
                        {!props.isInDatalistMode && (
                            <label
                                className="form-label"
                                title={componentData?.date_format}>
                                {componentData.label || "Date"}
                                {componentData.required === "YES" && (
                                    <span className="text-danger"> *</span>
                                )}
                            </label>
                        )}
                    </>
                )}

                {props.mode === props.modeType.design && (
                    <input
                        type="date"
                        title={componentData?.date_format}
                        className="form-control form-control-sm"
                        value={obj[componentData.db_column]}
                        disabled
                    />
                )}

                {(props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) &&
                    visible && (
                        <>
                            {deviceType !== "mobile" ? (
                                <input
                                    type="date"
                                    title={componentData?.date_format}
                                    data={formatDateForUserView(
                                        obj[componentData.db_column],
                                    )}
                                    // value={obj[componentData.db_column] || ""}
                                    className={`form-control date-time-picker form-control-sm ${componentData.required === "YES" &&
                                            !isValidField
                                            ? "form-control-danger"
                                            : ""
                                        }`}
                                    id={componentData.db_column}
                                    onChange={handleChange}
                                    onBlur={handleOnBlur}
                                    disabled={
                                        props.mode === props.modeType.design ||
                                        props.mode ===
                                        props.modeType.readonly ||
                                        // props.mode === props.modeType.preview ||
                                        componentData.readonly === "YES" ||
                                        disable
                                    }
                                    style={{
                                        minWidth:
                                            deviceType === "mobile"
                                                ? "100%"
                                                : "auto",
                                        fontSize:
                                            deviceType === "mobile"
                                                ? "16px"
                                                : "14px",
                                    }}
                                />
                            ) : (
                                <input
                                    type="date"
                                    title={formatDateForUserView(
                                        obj[componentData.db_column],
                                    )}
                                    // data={obj[componentData.db_column] || ""}
                                    value={obj[componentData.db_column] || ""}
                                    className={`form-control date-time-picker form-control-sm ${componentData.required === "YES" &&
                                            !isValidField
                                            ? "form-control-danger"
                                            : ""
                                        }`}
                                    id={componentData.db_column}
                                    onChange={handleChange}
                                    onBlur={handleOnBlur}
                                    disabled={
                                        props.mode === props.modeType.design ||
                                        props.mode ===
                                        props.modeType.readonly ||
                                        props.mode === props.modeType.preview ||
                                        componentData.readonly === "YES" ||
                                        disable
                                    }
                                    style={{
                                        minWidth:
                                            deviceType === "mobile"
                                                ? "100%"
                                                : "auto",
                                        fontSize:
                                            deviceType === "mobile"
                                                ? "16px"
                                                : "14px",
                                    }}
                                />
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
                        <span>Edit Date</span>
                        <div className="d-flex">
                            <div
                                className={
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                }
                                onClick={() =>
                                    setToggleModalWindow("maximize")
                                }>
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                }
                                onClick={() => setToggleModalWindow("restore")}>
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

export default DateField;

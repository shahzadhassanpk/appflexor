import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
import {
    formatDateForFormView,
    formatDateTimeForDataBase,
    detectDeviceType,
} from "../../../../../../utils/utils";

function isValidIanaTimezone(value) {
    if (!value || typeof value !== "string") return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

function formatDateTimeForTimezone(value, timeZone) {
    if (!value || typeof value === "boolean") return "";

    try {
        const rawValue = String(value).trim();

        // Database values are always UTC.
        const normalizedValue = rawValue.includes("T")
            ? rawValue
            : rawValue.replace(" ", "T");

        const date = moment.utc(normalizedValue);

        if (!date.isValid()) return "";

        // Use browser timezone when no timezone is provided.
        const targetTimezone =
            timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: targetTimezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(date.toDate());

        const values = {};

        parts.forEach(({ type, value }) => {
            if (type !== "literal") {
                values[type] = value;
            }
        });

        return `${values.year}-${values.month}-${values.day}`;

    } catch (e) {
        console.error("Timezone conversion error:", e);
        return "";
    }
}



function normalizeTimezoneValue(value) {
    const timezone = String(value || "").trim();
    if (isValidIanaTimezone(timezone)) return timezone;
    const rawTimezone = timezone.split(" (")[0].trim();
    return isValidIanaTimezone(rawTimezone) ? rawTimezone : "";
}

function getBrowserTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidIanaTimezone(timezone) ? timezone : "UTC";
}

function getTimezoneOffsetMs(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date).reduce((result, part) => {
        if (part.type !== "literal") result[part.type] = Number(part.value);
        return result;
    }, {});

    return (
        Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second,
        ) - date.getTime()
    );
}

function localDateToUtc(value, timeZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const [, year, month, day] = match;
    const wallClockAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day));
    const firstOffset = getTimezoneOffsetMs(new Date(wallClockAsUtc), timeZone);
    let utc = wallClockAsUtc - firstOffset;
    const secondOffset = getTimezoneOffsetMs(new Date(utc), timeZone);
    if (secondOffset !== firstOffset) utc = wallClockAsUtc - secondOffset;
    return new Date(utc);
}

function formatDateForTimezone(value, timeZone) {
    if (!value) return "";
    const date = moment.utc(value);
    if (!date.isValid()) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date.toDate()).reduce((result, part) => {
        if (part.type !== "literal") result[part.type] = part.value;
        return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
}

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
    const formDataSnapshot = JSON.stringify(props.formData || {});

    function resolveTimezone() {
        const configuredTimezone = String(componentData.timezone || "").trim();
        const expressionData = {
            ...data,
            ...(props.formData || {}),
        };

        if (configuredTimezone) {
            const evaluated = evaluateExpression(
                { expression: configuredTimezone },
                expressionData,
                ...expressionProps,
            );
            const evaluatedTimezone = normalizeTimezoneValue(evaluated);
            if (evaluatedTimezone) return evaluatedTimezone;

            const literalTimezone = normalizeTimezoneValue(configuredTimezone);
            if (literalTimezone) return literalTimezone;
        }

        // An empty timezone property means display DB values in the browser's
        // timezone. Form data is only consulted when explicitly referenced by
        // the configured timezone expression above.
        return getBrowserTimezone();
    }

    function getInputValue(value) {
        const key = componentData?.db_column;

        const storedValue = [
            value,
            props.formData?.[key],
            componentData?.value,
        ].find(
            candidate =>
                candidate !== null &&
                candidate !== undefined &&
                candidate !== "" &&
                typeof candidate !== "boolean"
        );

        if (storedValue === undefined) return "";

        return formatDateTimeForTimezone(
            storedValue,
            resolveTimezone()
        );
    }

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
    }, [formDataSnapshot, props.component.data]);

    const handleChange = e => {
        const key = e.target.id;
        const value = e.target.value;

        const isValid = !(
            componentData.required === "YES" &&
            value.trim().length === 0
        );

        setIsValidField(isValid);

        const utcDate = localDateToUtc(
            value,
            resolveTimezone()
        );

        const dbFormat = utcDate
            ? formatDateTimeForDataBase(moment.utc(utcDate))
            : "";

        // Update UI immediately.
        setObj(prev => ({
            ...prev,
            [key]: dbFormat
        }));

        // Update parent form data.
        if (props.handleInputFields) {
            props.handleInputFields(key, dbFormat, isValid);
        }
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
                                {resolveTimezone() && ` (${resolveTimezone()})`}
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
                        value={getInputValue(obj[componentData.db_column])}
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
                                    value={getInputValue(
                                        obj[componentData.db_column],
                                    )}
                                    data={formatDateForFormView(obj[componentData.db_column], resolveTimezone(), componentData?.date_format)}
                                    name={componentData.db_column}
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
                                    value={getInputValue(
                                        obj[componentData.db_column],
                                    )}
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

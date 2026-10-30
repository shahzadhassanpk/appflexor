import moment from "moment";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import {
    formatTimeForDataBase,
    parseDBTime,
} from "../../../../../../utils/utils";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import useGlobalData from "../../../../../../components/useGlobal";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import {
    localToUTCDateTime,
    formatDateTimeToISO,
} from "../../../../../../utils/utils";

/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function isTimeInputValue(value) {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
        String(value || ""),
    );
    if (!match) return false;

    const [, hours, minutes, seconds = "00"] = match;
    return (
        Number(hours) >= 0 &&
        Number(hours) <= 23 &&
        Number(minutes) >= 0 &&
        Number(minutes) <= 59 &&
        Number(seconds) >= 0 &&
        Number(seconds) <= 59
    );
}

function parseDatabaseTime(value) {
    if (!value) return "";
    const parsed = parseDBTime(value);
    return isTimeInputValue(parsed) ? parsed : "";
}

function getTimeOnlyValue(value) {
    const match = /^(\d{2}:\d{2}(?::\d{2})?)(?:Z|[+-]\d{2}(?::?\d{2})?)?$/.exec(
        String(value || "").trim(),
    );
    return match && isTimeInputValue(match[1]) ? match[1] : "";
}

function isValidIanaTimezone(value) {
    if (!value || typeof value !== "string") return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

function normalizeTimezoneValue(value) {
    const timezone = String(value || "").trim();
    if (isValidIanaTimezone(timezone)) return timezone;

    // Timezone selectors may submit a label like
    // "Africa/Abidjan (00:00:00 UTC)" instead of the raw IANA ID.
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

    const zonedAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
    );

    return zonedAsUtc - date.getTime();
}

function zonedTimeToUtc(timeValue, timeZone) {
    const [hour = "0", minute = "0", second = "0"] = String(timeValue).split(":");
    const today = new Date();
    const wallClockAsUtc = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        Number(hour),
        Number(minute),
        Number(second),
    );
    const firstOffset = getTimezoneOffsetMs(new Date(wallClockAsUtc), timeZone);
    let utc = wallClockAsUtc - firstOffset;
    const secondOffset = getTimezoneOffsetMs(new Date(utc), timeZone);
    if (secondOffset !== firstOffset) {
        utc = wallClockAsUtc - secondOffset;
    }
    return new Date(utc);
}

function formatDateInTimezoneForInput(value, timeZone) {
    if (!value) return "";
    const timeOnlyValue = getTimeOnlyValue(value);
    if (!isValidIanaTimezone(timeZone)) {
        return timeOnlyValue
            ? timeOnlyValue.slice(0, 5)
            : parseDatabaseTime(value);
    }

    const date = timeOnlyValue
        ? moment.utc(
              `${moment().format("YYYY-MM-DD")} ${timeOnlyValue}`,
              "YYYY-MM-DD HH:mm:ss",
          )
        : moment.utc(value);
    if (!date.isValid()) return parseDatabaseTime(value);

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(date.toDate()).reduce((result, part) => {
        if (part.type !== "literal") result[part.type] = part.value;
        return result;
    }, {});

    const result = `${parts.hour || "00"}:${parts.minute || "00"}`;
    return isTimeInputValue(result) ? result : "";
}

function currentTimeInTimezone(timeZone) {
    if (!isValidIanaTimezone(timeZone)) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(new Date()).reduce((result, part) => {
        if (part.type !== "literal") result[part.type] = part.value;
        return result;
    }, {});

    return `${parts.hour || "00"}:${parts.minute || "00"}`;
}

function TimePickerControl({
    value,
    name,
    disabled,
    isInvalid,
    onChange,
    onOpen,
}) {
    return (
        <input
            type="time"
            name={name}
            value={isTimeInputValue(value) ? String(value).slice(0, 5) : ""}
            onChange={event => onChange(event.target.value)}
            onFocus={onOpen}
            disabled={disabled}
            className={`form-control form-control-sm ${
                isInvalid ? "form-control-danger" : ""
            }`}
        />
    );
}

function Time(props) {
    const [obj, setObj] = useState({});
    const [displayValues, setDisplayValues] = useState({});
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
    function resolveTimezone() {
        const rawTimezone = String(componentData.timezone || "").trim();

        try {
            // Form data can be updated in place by the form viewer, so the
            // local `data` state may still contain the previous timezone.
            // Prefer the current prop value when resolving expressions.
            const expressionData = {
                ...data,
                ...(props.formData || {}),
            };

            if (rawTimezone) {
                const evaluated = evaluateExpression(
                    { expression: rawTimezone },
                    expressionData,
                    ...expressionProps,
                );
                const evaluatedTimezone = normalizeTimezoneValue(evaluated);
                if (evaluatedTimezone) return evaluatedTimezone;

                const literalTimezone = normalizeTimezoneValue(rawTimezone);
                if (literalTimezone) return literalTimezone;
            }

            // Optional fallback for components that do not use an expression.
            return (
                normalizeTimezoneValue(
                    expressionData.timezone || expressionData.time_zone || "",
                ) || getBrowserTimezone()
            );
        } catch {
            return "";
        }
    }

    function formatInputValue(value) {
        return formatDateInTimezoneForInput(value, resolveTimezone());
    }

    function getDisplayValue(key) {
        if (Object.prototype.hasOwnProperty.call(displayValues, key)) {
            return displayValues[key];
        }
        return formatInputValue(obj[key]);
    }

    function clearDisplayValue(key) {
        setDisplayValues(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    function getTimezoneLabel() {
        const timezone = resolveTimezone();
        return timezone ? ` (${timezone})` : "";
    }

    const resolvedTimezone = resolveTimezone();

    // The form viewer may mutate and reuse the same formData object. Track
    // its contents so synchronization still runs when its reference is stable.
    const formDataSnapshot = JSON.stringify(props.formData || {});

    useEffect(() => {
        // A timezone change invalidates the locally formatted display value.
        // Let getDisplayValue format the stored UTC value for the new zone.
        setDisplayValues({});
    }, [resolvedTimezone]);

    function formatInputForDatabase(value) {
        const timezone = resolveTimezone();
        if (timezone) {
            return formatTimeForDataBase(moment.utc(zonedTimeToUtc(value, timezone)));
        }

        const today = new Date();
        const arrTime = value.split(":");
        today.setHours(arrTime[0]);
        today.setMinutes(arrTime[1]);
        today.setSeconds(arrTime[2] || 0);
        today.setMilliseconds(0);
        const local = formatDateTimeToISO(today);
        return formatTimeForDataBase(localToUTCDateTime(local));
    }

    function seedConfiguredTimezoneNow(key = componentData.db_column) {
        if (getDisplayValue(key)) return;
        const timezone = resolveTimezone();
        if (!timezone) return;
        const pickerValue = currentTimeInTimezone(timezone);
        if (!pickerValue) return;
        const dbFormat = formatInputForDatabase(pickerValue);

        setObj(prev => ({
            ...prev,
            [key]: dbFormat,
        }));
        setDisplayValues(prev => ({
            ...prev,
            [key]: pickerValue,
        }));
        setIsValidField(true);

        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, dbFormat, true);
        }
    }

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });
            // Recalculate the displayed value when component settings,
            // including a data-driven timezone, change.
            setDisplayValues({});
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
            setData({});
            setDisplayValues({});
            return;
        }
        let key = props.component.data.db_column;
        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        setData({ ...props.formData });
        // The timezone may be an expression backed by formData. Do not keep
        // the previous timezone's formatted value in the display cache.
        setDisplayValues({});
    }, [formDataSnapshot, props.component.data]);

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
        clearDisplayValue(key);

        props.handleInputFields(componentData.db_column, "", isValid);
    }

    function handleChange(value, key = componentData.db_column) {
        let isValid = true;
        const nextValue = value || "";
        setDisplayValues(prev => ({
            ...prev,
            [key]: nextValue,
        }));

        if (nextValue) {
            if (
                componentData.required === "YES" &&
                nextValue.trim().length === 0 &&
                isValid
            ) {
                isValid = false;
            }
            let dbFormat = nextValue;
            try {
                dbFormat = formatInputForDatabase(nextValue);
            } catch (error) {
                console.error("Unable to format time input", error);
            }
            setObj(prev => ({
                ...prev,
                [key]: dbFormat,
            }));
            setIsValidField(isValid);

            if (props.handleInputFields) {
                props.handleInputFields(
                    componentData.db_column,
                    dbFormat,
                    isValid,
                );
            }
        } else {
            setObj(prev => ({
                ...prev,
                [key]: "",
            }));
            setIsValidField(componentData.required !== "YES");
            props.handleInputFields?.(
                componentData.db_column,
                "",
                componentData.required !== "YES",
            );
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
            <style>{`
                .s2a-time .s2a-react-time-picker {
                    display: flex;
                    align-items: center;
                    flex: 1 1 auto;
                    min-width: 0;
                    height: auto;
                    padding: 0;
                    position: relative;
                    z-index: 2;
                }
                .s2a-time .s2a-react-time-picker .react-time-picker__wrapper {
                    width: 100%;
                    min-height: calc(1.5em + .5rem + 2px);
                    border: 0;
                    padding: .25rem .5rem;
                }
                .s2a-time .react-time-picker__inputGroup {
                    min-width: 0;
                }
                .s2a-time .react-time-picker__inputGroup__input {
                    color: inherit;
                    outline: 0;
                }
                .s2a-time .react-time-picker__clock {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    width: 220px;
                    height: 220px;
                    padding: 25px;
                    background: #fff;
                    border: 1px solid var(--bs-border-color, #ced4da);
                    border-radius: .375rem;
                    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15);
                    z-index: 1055;
                }
                .s2a-time .react-time-picker__clock--closed {
                    display: none;
                }
            `}</style>
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
                                {getTimezoneLabel()}
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
                        value={getDisplayValue(componentData.db_column)}
                        disabled
                    />
                )}

                {(props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) && (
                    <>
                        {visible && (
                            <div className="input-group input-group-sm">
                                <TimePickerControl
                                    name={componentData.db_column}
                                    value={getDisplayValue(componentData.db_column)}
                                    isInvalid={
                                        componentData.required === "YES" &&
                                        !isValidField
                                    }
                                    onOpen={() => seedConfiguredTimezoneNow(componentData.db_column)}
                                    onChange={value => handleChange(value, componentData.db_column)}
                                    disabled={
                                        props.mode === props.modeType.design ||
                                        props.mode === props.modeType.readonly ||
                                        props.mode === props.modeType.preview
                                            ? true
                                            : componentData.readonly === "YES" || disable
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

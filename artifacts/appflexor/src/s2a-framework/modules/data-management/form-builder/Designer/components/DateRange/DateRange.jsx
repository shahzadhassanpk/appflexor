import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import {
    DATE_FORMAT_FOR_DATABASE,
    DATE_FORMAT_FOR_USER_VIEW,
    DATE_TIME_FORMAT_FOR_DATABASE,
} from "../../../../../../Config";
import {
    DateRangePicker,
    formatDateForDataBase,
} from "../../../../../../components/DatePicker/DatePicker";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DateRangePropsEditor from "../../props-editors/DateRangePropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function DateRange(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [newDate, setNewDate] = useState();
    const [userDate, setUserDate] = useState();
    const [delayedStartDate, setDelayedStartDate] = useState(null);
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        if (userDate) {
            var dateValue = moment(userDate).format(DATE_FORMAT_FOR_USER_VIEW);
        } else if (props.component.data.value) {
            var dateValue = moment(props.component.data.value).format(
                DATE_FORMAT_FOR_USER_VIEW,
            );
        } else {
            var dateValue = moment(new Date()).format(
                DATE_FORMAT_FOR_USER_VIEW,
            );
        }
        setNewDate(dateValue);
    }, [userDate, props]);

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
        let startDateKey = props.component.data.start_db_column;
        let endDateKey = props.component.data.end_db_column;

        let startDateValue = props.formData[startDateKey];
        let endDateValue = props.formData[endDateKey];

        let currentDateToStartDate = false;

        currentDateToStartDate =
            props.component.data.current_date_as_start_date === "YES"
                ? true
                : false;

        let startDateDelay = 0;

        startDateDelay = props.component.data.start_date_delay
            ? +props.component.data.start_date_delay
            : 0;

        if (currentDateToStartDate) {
            if (props.formData.business_key) {
                // } else if (startDateValue === "") {
            } else {
                // let currentDate = new Date();
                // startDateValue = moment(currentDate)
                //     .add(startDateDelay, "days")
                //     .format(DATE_FORMAT_FOR_DATABASE);
                // endDateValue = moment(currentDate)
                //     .add(startDateDelay, "days")
                //     .format(DATE_FORMAT_FOR_DATABASE);
                // setDelayedStartDate(startDateValue);

                let currentDate = new Date();
                let _startDateValue = moment(currentDate)
                    .add(startDateDelay, "days")
                    .format(DATE_FORMAT_FOR_DATABASE);

                setDelayedStartDate(_startDateValue);
            }
        }

        let tempObj = {
            [startDateKey]: startDateValue,
            [endDateKey]: endDateValue,
        };

        setObj(prev => ({
            ...prev,
            ...tempObj,
        }));

        setData(props.formData);
    }, [props.formData, props.component.data]);

    function handleChange(startDate, endDate) {
        console.log(startDate, endDate);

        let isValid = true;

        let startDateKey = props.component.data.start_db_column;
        let endDateKey = props.component.data.end_db_column;
        let startDateValue = startDate;
        let endDateValue = endDate;

        let tempObj = {
            [startDateKey]: startDateValue,
            [endDateKey]: endDateValue,
        };

        let stringifiedObj = JSON.stringify(tempObj);

        setObj(prev => ({
            ...prev,
            ...tempObj,
        }));

        if (
            componentData.required === "YES" &&
            startDateValue.trim().length === 0 &&
            endDateValue.trim().length === 0 &&
            isValid
        ) {
            isValid = false;
        }

        setIsValidField(isValid);

        // this `handleInputFields` will be provided by Parent component

        // key = "",
        // value = "",
        // isValid = false,
        // type = "text",

        if (props.handleInputFields) {
            props.handleInputFields("", stringifiedObj, isValid, "daterange");
        }
    }

    const Error = () => {
        return <div>Error occurred in Date.</div>;
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
                <label className="form-label">Date Range</label>
                <input
                    type="date"
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
            <div className={`form-group s2a-daterange ${userDefineClasses()}`}>
                {visible && (
                    <>
                        {" "}
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        <label className="form-label">
                            {componentData.label
                                ? componentData.label
                                : "Date range"}
                            {componentData.required &&
                                componentData.required === "YES" && (
                                    <span className="text-danger">&nbsp;*</span>
                                )}
                        </label>
                    </>
                )}
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.design ||
                        props.mode === props.modeType.readonly) && (
                        // <input
                        //     type="date"
                        //     className="form-control form-control-sm"
                        //     value={obj[componentData.db_column]}
                        //     disabled
                        // />

                        <>
                            <DateRangePicker
                                startDate={
                                    obj[props.component.data.start_db_column]
                                }
                                endDate={
                                    obj[props.component.data.end_db_column]
                                }
                                handleDateRange={handleChange}
                                setMinDate={true}
                                enableBackDays={true}
                                disabled={true}
                            />
                            {props.component.data.show_days === "YES" && (
                                <SelectedDaysCount
                                    obj={obj}
                                    start={props.component.data.start_db_column}
                                    end={props.component.data.end_db_column}
                                />
                            )}
                        </>
                    )}
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <>
                            {visible && (
                                <>
                                    <DateRangePicker
                                        startDate={
                                            obj[
                                                props.component.data
                                                    .start_db_column
                                            ]
                                        }
                                        endDate={
                                            obj[
                                                props.component.data
                                                    .end_db_column
                                            ]
                                        }
                                        handleDateRange={handleChange}
                                        numberOfMonths={2}
                                        disableDaysFrom={delayedStartDate}
                                        disabled={
                                            props.component.data.disabled ||
                                            props.component.data.readonly ===
                                                "YES"
                                        }
                                    />
                                    {props.component.data.show_days ===
                                        "YES" && (
                                        <SelectedDaysCount
                                            obj={obj}
                                            start={
                                                props.component.data
                                                    .start_db_column
                                            }
                                            end={
                                                props.component.data
                                                    .end_db_column
                                            }
                                        />
                                    )}
                                    {/* <input
                                        type="date"
                                        data={newDate ? newDate : ""}
                                        className={`date-time-picker form-control form-control-sm ${
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
                                        // value={obj[obj.key] ? obj[obj.key] : ""}
                                        value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        onBlur={e => handleChange(e, "blur")}
                                        // min={
                                        //     new Date()
                                        //         .toISOString()
                                        //         .split("T")[0]
                                        // }
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
                                    /> */}
                                    <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p>
                                </>
                            )}
                        </>
                    )}
                {/* <code>{JSON.stringify(obj)}</code> */}
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
                        <span>Edit DateRange</span>
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
                    <DateRangePropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function SelectedDaysCount({ obj, start, end }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setSelectedDaysCount();
    }, [obj]);

    function setSelectedDaysCount() {
        let startDate = obj[start];
        let endDate = obj[end];

        let momentStartDate = moment(startDate);
        let momentEndDate = moment(endDate);

        let count = momentEndDate.diff(momentStartDate, "days"); // 1

        setCount(count);
    }

    return count > 0 ? <span> Days : {count} </span> : null;
}

export default DateRange;

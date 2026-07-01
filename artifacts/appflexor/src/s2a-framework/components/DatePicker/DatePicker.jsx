import React, { useEffect, useState } from "react";
import {
    DateRangePicker as _DateRangePicker,
    SingleDatePicker as _SingleDatePicker,
} from "react-dates";
import "react-dates/initialize";
// import { DateTimePickerComponent } from "@syncfusion/ej2-react-calendars";
import moment from "moment";
import "react-dates/lib/css/_datepicker.css";
import {
    DATE_FORMAT_FOR_DATABASE,
    DATE_FORMAT_FOR_DATE_PICKER_VIEW,
    DATE_FORMAT_FOR_USER_VIEW,
    DATE_TIME_FORMAT_FOR_DATABASE,
    DATE_TIME_FORMAT_FOR_USER_VIEW,
    TIME_FORMAT_FOR_USER_VIEW,
} from "../../Config";

import { formatDateTimeForDataBase } from "../../utils/utils";

import "./DatePicker.css";

/**
 * This DatePicker will take
 *
 * date = In DB format for SingleDatePicker
 * startDate = In DB format for DateRangePicker
 * endDate =  In DB format for DateRangePicker
 *
 * @param {date} for SingleDatePicker
 * @param {startDate} for DateRangePicker
 * @param {endDate} for DateRangePicker
 * @param handleDates to set dates
 * @returns dates in DB format
 */

function DateRangePicker(props) {
    // console.log(`Data sent to Date Picker `);
    // console.log(props);

    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [focusedInput, setFocusedInput] = useState(null);

    useEffect(() => {
        let _endDate = "";
        let _startDate = "";

        if (props.startDate) {
            if (
                moment(
                    props.startDate,
                    DATE_FORMAT_FOR_DATABASE,
                    true,
                ).isValid()
            ) {
                _startDate = moment(props.startDate);
            }
            // else {
            //     _startDate = moment(formatDateForDataBase(props.startDate));
            // }
        }
        // else {
        //     _startDate = moment();
        // }

        if (props.endDate) {
            if (
                moment(props.endDate, DATE_FORMAT_FOR_DATABASE, true).isValid()
            ) {
                _endDate = moment(props.endDate);
            }
            // else {
            //     _endDate = moment(formatDateForDataBase(props.endDate));
            // }
        }
        // else {
        //     _endDate = moment();
        // }

        setStartDate(_startDate);
        setEndDate(_endDate);
    }, [props.startDate, props.endDate]);

    const handleDatesChange = ({ startDate, endDate }) => {
        setStartDate(startDate);
        setEndDate(endDate);
        props.onDatesChange(
            formatDateForDataBase(startDate),
            formatDateForDataBase(endDate),
        );
    };

    function disableDay(day) {
        let bool;
        if (props.disableDaysFrom) {
            bool = moment(day).isBefore(moment(props.disableDaysFrom));
        } else {
            bool = false;
        }
        return bool;
    }

    return (
        <_DateRangePicker
            startDateId="startDateId"
            endDateId="endDateId"
            startDate={startDate}
            endDate={endDate}
            onDatesChange={handleDatesChange}
            focusedInput={focusedInput}
            onFocusChange={focusedInput => setFocusedInput(focusedInput)}
            numberOfMonths={+props.numberOfMonths}
            daySize={30}
            displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
            block
            minimumNights={1}
            disabled={props.disabled}
            showDefaultInputIcon
            showClearDates
            enableOutsideDays
            isOutsideRange={day => disableDay(day)}
            renderMonthElement={({ month, onMonthSelect, onYearSelect }) => (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "4px",
                    }}>
                    <select
                        value={month.month()}
                        onChange={e => onMonthSelect(month, e.target.value)}
                        style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontSize: "13px",
                        }}>
                        {moment.months().map((label, value) => (
                            <option
                                value={value}
                                key={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={month.year()}
                        onChange={e => onYearSelect(month, e.target.value)}
                        style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontSize: "13px",
                        }}>
                        {Array.from(
                            { length: 10 },
                            (_, i) => moment().year() - 5 + i,
                        ).map(year => (
                            <option
                                value={year}
                                key={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        />
    );
}
// Takes 2 parameters
// 1st date
// 2nd handle date function to set new date
// 3rd optional enableBackDays
function SingleDatePicker(props) {
    let _date;
    if (props.date !== null) {
        _date = moment(props.date);
    } else {
        _date = null;
    }
    const [date, setDate] = useState(_date);
    const [focus, setFocus] = useState(false);

    const handleDatesChange = ({ focused }) => {
        setFocus(focused);
    };

    useEffect(() => {
        let _data = formatDateForDataBase(date);
        props.handlePickedDate(_data);
    }, [date]);

    function handleDate(day) {
        let result = _date.diff(day) > 0;
        return result;
    }

    return (
        <_SingleDatePicker
            date={date}
            onDateChange={date => setDate(date)}
            focused={focus}
            onFocusChange={handleDatesChange}
            numberOfMonths={1}
            displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
            showClearDate={true}
            isOutsideRange={
                props.enableBackDays ? day => handleDate(day) : () => {}
            }
        />
    );
}

// function DateTimePicker(props) {
//   let newDate = new Date();

//   return (
//     <div>
//       <DateTimePickerComponent
//         value={newDate}
//         format={DATE_TIME_FORMAT_FOR_USER_VIEW}
//         step={60}
//       ></DateTimePickerComponent>
//     </div>
//   );
// }

function DateTimeHTML({ data, id, name, onDateChange }) {
    const $ = window.$;

    let date = new Date();
    let min_date = moment(date).format("YYYY-MM-DDThh:mm");

    let now_utc = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    );

    // console.log(`UTC`);
    // console.log(now_utc);

    // 2015:12:12T11:12 "2017-06-01T08:30"
    // 2022-03-24T16:49

    const [newDate, setNewDate] = useState();

    useEffect(() => {
        let dateValue = moment(data).format(DATE_TIME_FORMAT_FOR_USER_VIEW);
        setNewDate(dateValue);
    }, [data]);

    function onChange(event) {
        var dateValue = moment(event.target.value).format(
            DATE_TIME_FORMAT_FOR_USER_VIEW,
        );
        setNewDate(dateValue);
        onDateChange(event);
    }

    if (data) {
        return (
            <input
                className="date-time-picker form-control"
                type="datetime-local"
                name={name}
                data={newDate}
                min={min_date}
                id={id}
                onChange={event => onChange(event)}
            />
        );
    } else {
        return <div>No Params passed to Date Time Component</div>;
    }
}

function DateHTML({ data, id, onDateChange }) {
    const [newDate, setNewDate] = useState();

    useEffect(() => {
        var dateValue = moment(data).format(DATE_FORMAT_FOR_USER_VIEW);
        setNewDate(dateValue);
    }, [data]);

    function onChange(event) {
        let dateValue = moment(event.target.value).format(
            DATE_FORMAT_FOR_USER_VIEW,
        );
        let dateName = event.target.name;

        setNewDate(dateValue);
        onDateChange(event);
    }
    if (data) {
        return (
            <input
                className="date-time-picker form-control"
                type="date"
                data={newDate}
                id={id}
                min={new Date().toISOString().split("T")[0]}
                onChange={event => onChange(event)}
            />
        );
    } else {
        return <div>No Params passed to Date Time Component</div>;
    }
}

function TimeHTML({ data, id, onDateChange }) {
    if (data) {
        return (
            <input
                className="form-control"
                type="time"
                value={data}
                id={id}
                onChange={event => onDateChange(event)}
            />
        );
    } else {
        return <div>No Params passed to Time Component</div>;
    }
}
let isValidDate = _date => {
    return _date instanceof Date && !isNaN(_date);
};

let formatDateForDataBase = date => {
    let tempDate = "";
    if (date) {
        try {
            tempDate = moment(date).format(DATE_FORMAT_FOR_DATABASE);
        } catch (error) {
            console.log("Unable to format date for data base : " + error);
        }
    }
    return tempDate;
};

let formatDateForUserView = date => {
    let tempDate = "";
    if (date) {
        try {
            tempDate = moment(date).format(DATE_FORMAT_FOR_USER_VIEW);
        } catch (error) {
            console.log("Unable to format date for user view : " + error);
        }
    }
    return tempDate;
};
export {
    DateHTML,
    DateRangePicker,
    DateTimeHTML,
    SingleDatePicker,
    TimeHTML,
    // DateTimePicker,
    formatDateForDataBase,
    formatDateForUserView,
    isValidDate,
};

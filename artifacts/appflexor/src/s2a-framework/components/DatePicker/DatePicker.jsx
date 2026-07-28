import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import { Box } from "@mui/material";
// import {
//     DateRangePicker as _DateRangePicker,
//     SingleDatePicker as _SingleDatePicker,
// } from "react-dates";
// import "react-dates/initialize";
// import { DateTimePickerComponent } from "@syncfusion/ej2-react-calendars";
import moment from "moment";
// import "react-dates/lib/css/_datepicker.css";
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
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const parseIncomingDate = value => {
        if (!value) {
            return null;
        }

        // Keep compatibility with DB-format strings used across older screens.
        const parsedByMoment = moment(
            value,
            DATE_FORMAT_FOR_DATABASE,
            true,
        );
        if (parsedByMoment.isValid()) {
            return dayjs(parsedByMoment.toDate());
        }

        const parsedByDayjs = dayjs(value);
        return parsedByDayjs.isValid() ? parsedByDayjs : null;
    };

    useEffect(() => {
        setStartDate(parseIncomingDate(props.startDate));
        setEndDate(parseIncomingDate(props.endDate));
    }, [props.startDate, props.endDate]);

    const notifyParent = (start, end) => {
        const s = formatDateForDataBase(start);
        const e = formatDateForDataBase(end);

        if (props.handleDateRange) {
            props.handleDateRange(s, e);
        } else if (props.onDatesChange) {
            // Keep backward compatibility with older react-dates handlers
            // that expect a single object: { startDate, endDate }.
            if (props.onDatesChange.length <= 1) {
                props.onDatesChange({ startDate: s, endDate: e });
            } else {
                props.onDatesChange(s, e);
            }
        }
    };

    const handleStartDateChange = newValue => {
        setStartDate(newValue);
        notifyParent(newValue, endDate);
    };

    const handleEndDateChange = newValue => {
        setEndDate(newValue);
        notifyParent(startDate, newValue);
    };

    const shouldDisableDate = day => {
        if (!props.disableDaysFrom) {
            return false;
        }

        return day.isBefore(
            dayjs(props.disableDaysFrom, DATE_FORMAT_FOR_DATABASE),
            "day"
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="date-range-picker d-flex justify-content-between gap-2 mt-2">
                <MuiDatePicker
                    label="Start Date"
                    value={startDate}
                    format={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                    disabled={props.disabled}
                    shouldDisableDate={shouldDisableDate}
                    onChange={handleStartDateChange}
                    slotProps={{
                        textField: {
                            size: "small",
                            fullWidth: true,
                        },
                    }}
                />

                <MuiDatePicker
                    label="End Date"
                    value={endDate}
                    format={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                    disabled={props.disabled}
                    shouldDisableDate={shouldDisableDate}
                    minDate={startDate}
                    onChange={handleEndDateChange}
                    slotProps={{
                        textField: {
                            size: "small",
                            fullWidth: true,
                        },
                    }}
                />
            </div>
        </LocalizationProvider>
    );
}
// Takes 2 parameters
// 1st date
// 2nd handle date function to set new date
// 3rd optional enableBackDays
function SingleDatePicker(props) {
    const [date, setDate] = useState(
        props.date ? dayjs(props.date, DATE_FORMAT_FOR_DATABASE) : null
    );

    useEffect(() => {
        setDate(
            props.date
                ? dayjs(props.date, DATE_FORMAT_FOR_DATABASE)
                : null
        );
    }, [props.date]);

    useEffect(() => {
        if (props.handlePickedDate) {
            props.handlePickedDate(formatDateForDataBase(date));
        }
    }, [date]);

    const shouldDisableDate = day => {
        if (!props.enableBackDays || !props.date) {
            return false;
        }

        return day.isBefore(dayjs(props.date, DATE_FORMAT_FOR_DATABASE), "day");
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiDatePicker
                value={date}
                onChange={newValue => setDate(newValue)}
                format={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                disabled={props.disabled}
                shouldDisableDate={shouldDisableDate}
                slotProps={{
                    textField: {
                        size: "small",
                        fullWidth: true,
                        variant: "outlined",
                    },
                }}
            />
        </LocalizationProvider>
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
            if (dayjs.isDayjs(date)) {
                tempDate = date.format(DATE_FORMAT_FOR_DATABASE);
            } else {
                tempDate = moment(date).format(DATE_FORMAT_FOR_DATABASE);
            }
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

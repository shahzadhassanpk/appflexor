import React, { useContext, useState } from "react";
// import { DateRangePicker } from "react-dates";
import {DateRangePicker} from "../DatePicker/DatePicker.jsx";
import { AppContext } from "../../../AppContext";
import { DATE_FORMAT_FOR_DATE_PICKER_VIEW } from "../../Config";
import moment from "moment";

const DateRange = props => {
    const {
        label = "",
        startDate = null,
        endDate = null,
        disabled = false,
        handleDateChange,
        disablePreviousDates = true,
    } = props;
    const appContext = useContext(AppContext);
    const [focusedInput, setFocusedInput] = useState(null);

    return (
        <div className="s2a-date-range">
            {label && <label>{label}</label>}
            {disablePreviousDates ? (
                <DateRangePicker
                    startDate={startDate}
                    startDateId="startDateId"
                    endDate={endDate}
                    endDateId="endDateId"
                    startDatePlaceholderText="From"
                    endDatePlaceholderText="To"
                    onDatesChange={handleDateChange}
                    focusedInput={focusedInput}
                    onFocusChange={focusedInput =>
                        setFocusedInput(focusedInput)
                    }
                    numberOfMonths={appContext.screenView === "lg" ? 2 : 1}
                    daySize={30}
                    displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                    block
                    showDefaultInputIcon
                    disabled={disabled}
                    isOutsideRange={day =>
                        day.isBefore(moment().startOf("day"))
                    } // Disable dates before today
                />
            ) : (
                <DateRangePicker
                    startDate={startDate}
                    startDateId="startDateId"
                    endDate={endDate}
                    endDateId="endDateId"
                    startDatePlaceholderText="From"
                    endDatePlaceholderText="To"
                    isOutsideRange={() => false}
                    onDatesChange={handleDateChange}
                    focusedInput={focusedInput}
                    onFocusChange={focusedInput =>
                        setFocusedInput(focusedInput)
                    }
                    numberOfMonths={appContext.screenView === "lg" ? 2 : 1}
                    daySize={30}
                    displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                    block
                    showDefaultInputIcon
                    disabled={disabled}
                />
            )}
        </div>
    );
};

export default DateRange;

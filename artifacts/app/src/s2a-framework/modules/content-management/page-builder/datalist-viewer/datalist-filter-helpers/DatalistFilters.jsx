import React, { useState, useEffect, useContext, useRef } from "react";
import moment from "moment";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import { DATE_FORMAT_FOR_USER_VIEW, FILE_URL } from "../../../../../Config";
import { API_URL } from "../../../../../Config";
import axios from "axios";
import { JsonTable } from "react-json-to-html";
import { eventBus } from "../../../../../eventBus";

import Scroll from "../../../../../components/Scroll/Scroll";
import {
    DateRangePicker as DateRangePickerComp,
    SingleDatePicker as _SingleDatePicker,
} from "react-dates";

import {
    DATE_FORMAT_FOR_DATABASE,
    DATE_FORMAT_FOR_DATE_PICKER_VIEW,
} from "../../../../../Config";
import {
    formatDateForDataBase,
    formatDateForUserViewDatalist,
    formatDateTimeForUserViewDatalist,
    formatToCurrency,
    formatTimeForUserView,
    numberFormat,
} from "../../../../../utils/utils";
import { Interweave } from "interweave";
import { AppContext } from "../../../../../../AppContext";
import { matchSorter } from "match-sorter";
import { tryToParse } from "../datalist-helper/DatalistHelpers";
import ChildrenModal from "../../../../../components/ChildrenModal/ChildrenModal";
import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import DynamicRadio from "../../../../../components/dynamic-radio/radio";
import DynamicCheckBoxs from "../../../../../components/dynamic-checkbox/Checkbox";

function NumberRangeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
    const [value, setValue] = useState({
        min: filterValue[0],
        max: filterValue[1],
    });

    useEffect(() => {
        const min = value?.min;
        const max = value?.max;
        setFilter([min, max]);
    }, [value?.min, value?.max]);

    return (
        <div>
            <div className="d-flex align-items-center">
                <div className="pe-2">
                    <input
                        value={value?.min || ""}
                        className="form-control"
                        type="number"
                        placeholder="Min"
                        onChange={e => {
                            const val = e.target.value;
                            setValue({
                                ...value,
                                min: val ? parseInt(val, 10) : undefined,
                            });
                        }}
                    />
                </div>
                to
                <div className="ps-2">
                    <input
                        value={value?.max || ""}
                        type="number"
                        className="form-control ps-2"
                        placeholder="Max"
                        onChange={e => {
                            const val = e.target.value;
                            setValue({
                                ...value,
                                max: val ? parseInt(val, 10) : undefined,
                            });
                        }}
                    />
                </div>
            </div>
            <button
                className="button-theme mt-2 float-end"
                onClick={() =>
                    setValue({
                        min: "",
                        max: "",
                    })
                }>
                Clear
            </button>
        </div>
    );
}

function SliderColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
}) {
    // Calculate the min and max
    // using the preFilteredRows

    const [min, max] = React.useMemo(() => {
        let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        preFilteredRows.forEach(row => {
            min = Math.min(row.values[id], min);
            max = Math.max(row.values[id], max);
        });
        return [min, max];
    }, [id, preFilteredRows]);

    return (
        <div className="s2a-slider-filter">
            <div className="row">
                <div className="col-sm-3">
                    <input
                        className="form-range"
                        type="range"
                        min={min}
                        max={max}
                        value={filterValue || min}
                        onChange={e => {
                            setFilter(parseInt(e.target.value, 10));
                        }}
                    />
                </div>
            </div>
            <button
                className="btn btn-sm button-theme my-2"
                onClick={() => setFilter(undefined)}>
                Off
            </button>
        </div>
    );
}

function SelectColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
}) {
    // Calculate the options for filtering
    // using the preFilteredRows
    const options = React.useMemo(() => {
        const options = new Set();
        preFilteredRows.forEach(row => {
            options.add(row.values[id]);
        });
        return [...options.values()];
    }, [id, preFilteredRows]);

    // Render a multi-select box
    return (
        <select
            className="form-select form-select-sm s2a-select-filter"
            value={filterValue}
            onChange={e => {
                setFilter(e.target.value || undefined);
            }}>
            <option value="">All</option>
            {options.map((option, i) => (
                <option
                    key={i}
                    value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

const DefaultColumnFilter = ({
    column: {
        filterValue = [],
        setFilter,
        preFilteredRows: { length },
    },
}) => {
    const [value, setValue] = useState("");
    const handleFilter = e => {
        const { value } = e.target;
        setFilter(value || undefined);
        setValue(value || undefined);
    };

    useEffect(() => {
        if (filterValue) {
            setValue(filterValue || undefined);
        }
    }, []);

    return (
        <input
            className="form-control form-control-sm s2a-default-filter"
            value={value || ""}
            onChange={handleFilter}
            placeholder={`Search (${length}) ...`}
        />
    );
};

function dateBetweenFilterFn(rows, id, filterValues, _id) {
    const sd = filterValues[0] ? new Date(filterValues[0]) : undefined;
    const ed = filterValues[1] ? new Date(filterValues[1]) : undefined;
    if (ed || sd) {
        return rows.filter(r => {
            var date = r.original[_id];

            const cellDate = moment(date).format(DATE_FORMAT_FOR_DATABASE);
            let startDate = moment(sd).format(DATE_FORMAT_FOR_DATABASE);
            let endDate = moment(ed).format(DATE_FORMAT_FOR_DATABASE);
            if (startDate && endDate) {
                return cellDate >= startDate && cellDate <= endDate;
            } else if (startDate) {
                return cellDate >= startDate;
            } else {
                return cellDate <= endDate;
            }
        });
    } else {
        return rows;
    }
}
function timeBetween(rows, id, filterValues, db_col) {
    const sd = filterValues.startTime;
    const ed = filterValues.endTime;

    if (ed || sd) {
        return rows.filter(r => {
            var time = r.original[db_col];

            const cellTime = time;
            let startDate = sd;
            let endDate = ed;
            if (startDate && endDate) {
                return cellTime >= startDate && cellTime <= endDate;
            } else if (startDate) {
                return cellTime >= startDate;
            } else {
                return cellTime <= endDate;
            }
        });
    } else {
        return rows;
    }
}

function DateRangeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
    const appcontext = useContext(AppContext);
    let _startDate;
    let _endDate;

    const [startDate, setStartDate] = useState(_startDate);
    const [endDate, setEndDate] = useState(_endDate);
    const [focusedInput, setFocusedInput] = useState(null);

    useEffect(() => {
        if (filterValue === undefined) {
            setStartDate(undefined);
            setEndDate(undefined);
        } else if (filterValue[0] && filterValue[1]) {
            setStartDate(moment(filterValue[0]));
            setEndDate(moment(filterValue[1]));
        }
    }, [filterValue]);

    if (startDate !== null) {
        if (moment(startDate, DATE_FORMAT_FOR_DATABASE, true).isValid()) {
            _startDate = moment(startDate);
        } else {
            _startDate = moment(formatDateForDataBase(startDate));
        }
    } else {
        _startDate = null;
    }

    if (endDate !== null) {
        if (moment(endDate, DATE_FORMAT_FOR_DATABASE, true).isValid()) {
            _endDate = moment(endDate);
        } else {
            _endDate = moment(formatDateForDataBase(endDate));
        }
    } else {
        _endDate = null;
    }

    const handleDatesChange = ({ startDate = "", endDate = "" }) => {
        setStartDate(startDate);
        setEndDate(endDate);
        setFilter([startDate?._d, endDate?._d]);
    };

    const handleClear = () => {
        setFilter();
        setStartDate();
        setEndDate();
    };

    return (
        <div className="">
            <DateRangePickerComp
                startDate={startDate}
                startDateId="startDateId"
                endDate={endDate}
                endDateId="endDateId"
                startDatePlaceholderText="From"
                endDatePlaceholderText="To"
                isOutsideRange={() => false}
                onDatesChange={handleDatesChange}
                focusedInput={focusedInput}
                onFocusChange={focusedInput => setFocusedInput(focusedInput)}
                numberOfMonths={appcontext.screenView === "lg" ? 2 : 1}
                daySize={30}
                displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                block
                showDefaultInputIcon
                renderMonthElement={({
                    month,
                    onMonthSelect,
                    onYearSelect,
                }) => (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            margin: "8px 0",
                        }}>
                        {/* Month dropdown */}
                        <select
                            value={month.month()}
                            onChange={e => onMonthSelect(month, e.target.value)}
                            style={{
                                padding: "4px 8px",
                                fontSize: "14px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                            }}>
                            {moment.months().map((label, value) => (
                                <option
                                    value={value}
                                    key={value}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        {/* Year dropdown */}
                        <select
                            value={month.year()}
                            onChange={e => onYearSelect(month, e.target.value)}
                            style={{
                                padding: "4px 8px",
                                fontSize: "14px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                            }}>
                            {Array.from(
                                { length: 30 },
                                (_, i) => moment().year() - 15 + i,
                            ).map(yr => (
                                <option
                                    value={yr}
                                    key={yr}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            />
            <button
                className="btn btn-sm button-theme my-2"
                onClick={() => handleClear()}>
                Clear
            </button>
        </div>
    );
}

function DateColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
    resetAll,
}) {
    const [newDate, setNewDate] = useState();
    const [userDate, setUserDate] = useState();

    useEffect(() => {
        if (
            filterValue === undefined ||
            (filterValue && filterValue.length === 0)
        ) {
            setFilter(undefined);
            setNewDate(undefined);
        }
    }, [filterValue]);

    useEffect(() => {
        var dateValue = moment(userDate).format(DATE_FORMAT_FOR_USER_VIEW);
        setNewDate(dateValue);
    }, [userDate]);

    function minChange(e) {
        const val = e.target.value;
        setUserDate(val);
        setFilter(val || undefined);
    }

    return (
        <div className="row s2a-date-filter">
            <div className="col-sm-6">
                <input
                    type="date"
                    className="date-time-picker form-control"
                    data={newDate}
                    value={userDate}
                    id="date"
                    // min={new Date().toISOString().split("T")[0]}
                    onChange={minChange}
                />
            </div>
        </div>
    );
}

function TimeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
    // const [con, setCon] = useState(false);
    const [value, setValue] = useState();

    function minChange(e) {
        const val = e.target.value;
        setFilter(prev => ({
            ...prev,
            startTime: val,
        }));
        setValue(prev => ({
            ...prev,
            startTime: val,
        }));
    }
    function maxChange(e) {
        const val = e.target.value;
        setFilter(prev => ({
            ...prev,
            endTime: val,
        }));
        setValue(prev => ({
            ...prev,
            endTime: val,
        }));
    }

    useEffect(() => {
        if (filterValue) {
            setValue(prev => ({
                startTime: filterValue.startTime,
                endTime: filterValue.endTime,
            }));
        }
    }, [filterValue]);

    function reset() {
        setFilter(undefined);
        // setCon(true);
    }

    return (
        <div className="row s2a-time-filter">
            <div className="col-sm-6">
                <input
                    className="form-control"
                    value={(value && value.startTime) || ""}
                    id={id}
                    name={id}
                    type="time"
                    onChange={minChange}
                />
            </div>
            <div className="col-sm-6">
                <input
                    className="form-control"
                    value={(value && value.endTime) || ""}
                    id={id}
                    name={id}
                    type="time"
                    onChange={maxChange}
                />
            </div>
            <div className="col-sm-6">
                <button
                    className="btn btn-sm button-theme my-2"
                    onClick={reset}>
                    Clear
                </button>
            </div>
        </div>
    );
}

function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
}) {
    function handleSearch(e) {
        const val = e.target.value;
        setGlobalFilter(val);
    }

    return (
        <div className="search-input input-group s2a-global-filter">
            <i className="input-search-icon fa-solid fa-magnifying-glass"></i>
            <input
                type="text"
                className="form-control"
                onChange={handleSearch}
                placeholder="Search..."
            />
        </div>
    );
}

function SpecificSearch(
    { column: { filterValue = [], preFilteredRows, setFilter, id } },
    resetAll,
) {
    const [value, setValue] = useState("");
    function handleSearch(e) {
        const val = e.target.value;
        setFilter(val);
        setValue(val);
    }

    useEffect(() => {
        if (filterValue) {
            setValue(val);
        }
    }, []);

    return (
        <div className="search-input input-group s2a-specific-search">
            <i className="input-search-icon fa-solid fa-magnifying-glass"></i>
            <input
                type="text"
                className="form-control"
                onChange={handleSearch}
                value={value}
                placeholder="Search..."
            />
        </div>
    );
}

function FilterModalWrapper(props) {
    const { header, id, column, dataListLabel, uuid } = props;
    return (
        <div
            className="modal fade s2a-filter-modal"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            id={"a" + id + uuid}
            aria-hidden="true"
            tabIndex="-1">
            <div className="modal-dialog s2a-filter-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1
                            className="modal-title fs-5"
                            id="exampleModalToggleLabel">
                            Filter {dataListLabel} by {header?.Header}
                        </h1>
                        <div
                            className=""
                            data-bs-dismiss="modal"
                            data-bs-toggle="tooltip"
                            data-bs-title="Close"
                            aria-label="Close">
                            <i className="fa-solid fa-x modal-close"></i>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div className="filterBy">
                            {column.canFilter ? column.render("Filter") : null}
                        </div>
                    </div>
                    <div className="modal-footer"></div>
                </div>
            </div>
        </div>
    );
}

function multiDelete(items, flag, condition) {
    if (condition === undefined) {
        let obj = {
            items: items,
            flag: flag,
        };
        flag.deleteAllData(prev => ({
            ...prev,
            show: true,
            item: obj,
        }));
    }

    if (condition === true) {
        let request = {
            datasource: flag.selectedItem?.datasource,
            usePrefix: flag.selectedItem?.useprefix,
        };
        let pkField = "id";
        let type = flag.selectedItem.type;
        let table = flag.selectedItem.table;
        let primaryKey = flag.selectedItem.primary_key;

        // if(flag.selectedItem.type==="SQL"){
        //     pkField = flag.selectedItem.primary_key;
        // }
        request.data = [];
        try {
            items.forEach(item => {
                let selectedItem = item.original;
                let entityForm = {};
                if (type === "FORM" || pkField === "id") {
                    entityForm.formId = table;
                    entityForm.entity = table;
                    entityForm.action = "delete";
                    entityForm.id = selectedItem[pkField];
                } else if (type === "SQL") {
                    entityForm.formId = table;
                    entityForm.entity = table;
                    pkField = primaryKey;
                    entityForm.id = selectedItem[pkField];
                    entityForm.action = "fk_delete";
                    entityForm.fk_id = selectedItem[pkField];
                    entityForm.fk_name = pkField; // SQL delete will always require exact key column
                }
                request.data.push(entityForm);
            });
        } catch (error) {}

        let url = API_URL + "?service.key=update.formData";

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    setTimeout(() => {
                        eventBus.emit("update", flag.selectedItem.id);
                    }, 1000);

                    flag.selectedItem.type === "FORM"
                        ? flag.getAllData(flag.selectedItem.form_Id)
                        : flag.getAllData(null, flag.selectedItem.id);
                    flag.deleteAllData(prev => ({
                        ...prev,
                        show: false,
                        item: false,
                    }));
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }
}

function formatDate(date) {
    var d = new Date(date || Date.now()),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    let hour = d.getHours();
    let minutes = d.getMinutes();
    let seconds = d.getSeconds();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day, hour, minutes, seconds].join("-");
}

function validJson(value) {
    let flag = false;
    try {
        var parseValue = JSON.parse(value);
        flag = typeof parseValue === "object" ? true : false;
    } catch (error) {
        flag = false;
    }
    return flag;
}
// function validJson(value) {
//     let flag = false;
//     try {
//         if ((value && value.includes("[")) || value.includes(",")) {
//             let parsed = JSON.parse(value);
//             if (typeof parsed === "object") {
//                 flag = false;
//             } else {
//                 flag = true;
//             }
//         } else {
//             flag = true;
//         }
//     } catch (e) {
//         flag = true;
//     }
//     return flag;
// }

function selectedJsonExport(dbData, flag) {
    if (dbData !== undefined && dbData.length > 0) {
        let selectedColumns = ["id"];
        let _selectedColumns = ["id"];
        let fieldTypes = {};

        flag.tableColumns[0].columns.forEach(item => {
            selectedColumns.push(item.accessor.toLowerCase());
            _selectedColumns.push(item.accessor);
            fieldTypes[item.accessor] = item.datatype;
        });

        let header = selectedColumns;
        let headerString = _selectedColumns.join(",");
        // handle null or undefined values here
        const rowItems = dbData.map(
            row =>
                header
                    .map(fieldName => {
                        let item;
                        if (fieldTypes[fieldName] && row?.original[fieldName]) {
                            let type = fieldTypes[fieldName];
                            let fieldData = row?.original[fieldName];
                            switch (type) {
                                case "checklist":
                                    fieldData =
                                        fieldData &&
                                        typeof fieldData === "string" &&
                                        JSON.parse(fieldData);
                                    item = fieldData.join(";");
                                    break;
                                case "taglist":
                                    if (fieldData) {
                                        fieldData =
                                            typeof fieldData === "string" &&
                                            JSON.parse(fieldData);
                                        const data = fieldData.map(
                                            item => item.id,
                                        );
                                        const _data = data.join(";");
                                        item = _data;
                                    }
                                    break;
                                case "richtexteditor":
                                    item = JSON.stringify({
                                        img: `${fieldData}`.replaceAll(
                                            ",",
                                            "c*ma",
                                        ),
                                    });
                                    break;
                                default:
                                    item = fieldData;
                                    break;
                            }
                        }
                        if (!item) item = row.original[fieldName];
                        return item;
                    })
                    .join(","),
            // header
            //     .map(fieldName =>
            //         JSON.stringify(row.original[fieldName], replacer),
            //     )
            //     .join(","),
        );
        // join header and body, and break into separate lines
        const csv = [headerString, ...rowItems].join("\r\n");

        //Generate a file name
        let queryName = flag.selectedItem.name.toLowerCase();

        var fileName = queryName + "_" + formatDate();
        //this will remove the blank-spaces from the title and replace it with an underscore
        fileName = `${fileName}`.replace(/ /g, "_");

        //Initialize file format you want csv or xls
        var uri = "data:text/csv;charset=utf-8," + escape(csv);

        // Now the little tricky part.
        // you can use either>> window.open(uri);
        // but this will not work in some browsers
        // or you will not get the correct file extension

        //this trick will generate a temp <a /> tag
        var link = document.createElement("a");
        link.href = uri;

        //set the visibility hidden so it will not effect on your web-layout
        link.style = "visibility:hidden";
        link.download = fileName + ".csv";

        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function jsonToCsv(dbData) {
    try {
        if (dbData !== undefined && dbData.length > 0) {
            let str = "";
            const Data = JSON.parse(dbData);
            const Length = Data.length - 1;
            if (dbData) {
                Data.forEach((item, i) => {
                    if (typeof item === "string") {
                        Length !== i ? (str += `${item},`) : (str += item);
                    } else {
                        Length !== i
                            ? (str += `${item["id"]},`)
                            : (str += item["id"]);
                    }
                });
            }
            str = `"${str}"`;
            return str;
        }
    } catch (error) {}
}

function jsonExportAll(dbData, flag, name) {
    if (dbData !== undefined && dbData.length > 0) {
        let selectedColumns = ["id"];
        let _selectedColumns = ["id"];

        flag[0].columns.forEach(item => {
            selectedColumns.push(item.accessor.toLowerCase());
            _selectedColumns.push(item.accessor);
        });

        let header = selectedColumns;
        let headerString = _selectedColumns.join(",");

        // handle null or undefined values here
        const replacer = (key, value) => (value ? value : "");
        const rowItems = dbData.map(
            row =>
                header
                    .map(fieldName => {
                        return validJson(row[fieldName])
                            ? jsonExportAllHelper(row[fieldName], fieldName)
                            : JSON.stringify(row[fieldName], replacer);
                    })
                    .join(","),
            // header
            //     .map(fieldName =>
            //         JSON.stringify(row.original[fieldName], replacer),
            //     )
            //     .join(","),
        );

        // join header and body, and break into separate lines
        const csv = [headerString, ...rowItems].join("\r\n");

        //Generate a file name
        let queryName = name.toLowerCase();

        var fileName = queryName + "_" + formatDate();
        //this will remove the blank-spaces from the title and replace it with an underscore
        fileName = `${fileName}`.replace(/ /g, "_");

        //Initialize file format you want csv or xls
        var uri = "data:text/csv;charset=utf-8," + escape(csv);

        // Now the little tricky part.
        // you can use either>> window.open(uri);
        // but this will not work in some browsers
        // or you will not get the correct file extension

        //this trick will generate a temp <a /> tag
        var link = document.createElement("a");
        link.href = uri;

        //set the visibility hidden so it will not effect on your web-layout
        link.style = "visibility:hidden";
        link.download = fileName + ".csv";

        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function jsonExportAllHelper(dbData) {
    try {
        if (dbData !== undefined && dbData.length > 0) {
            let str = "";
            const Data = JSON.parse(dbData);
            const Length = Data.length - 1;
            if (dbData) {
                Data.forEach((item, i) => {
                    if (typeof item === "string") {
                        Length !== i ? (str += `${item},`) : (str += item);
                    } else {
                        Length !== i
                            ? (str += `${item["id"]},`)
                            : (str += item["id"]);
                    }
                });
            }
            str = `"${str}"`;
            return str;
        }
    } catch (error) {}
}

function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [row => row.values[id]] });
}

const datalistDataTypes = {
    currency: {
        code: "currency",
        operation: (column, { datalist_type }) =>
            CURRENCY(column, datalist_type),
    },
    datetime: {
        code: "datetime",
        operation: (column, { datalist_type }) =>
            DATEANDTIME(column, datalist_type),
    },
    date: {
        code: "date",
        operation: (column, type) => DATE(column, type),
    },
    daterange: {
        code: "date",
        operation: (column, type) => DATE(column, type),
    },
    number: {
        code: "number",
        operation: (column, { type, datalist_type }) =>
            NUMBER(column, datalist_type),
    },
    time: {
        code: "time",
        operation: (column, type) => TIME(column, type),
    },
    taglist: {
        code: "taglist",
        operation: (column, { type, datalist_type }) =>
            TAGANDCHECKLIST(column, datalist_type),
    },
    checklist: {
        code: "checklist",
        operation: (
            column,
            { type, datalist_type },
            dynamicLists,
            formFields,
        ) => CHECKLIST(column, datalist_type, dynamicLists, formFields),
    },
    expression: {
        code: "expression",
        operation: (column, { type, datalist_type }) =>
            EXPRESSION(column, datalist_type),
    },
    textfield: {
        code: "textfield",
        operation: (column, { type, datalist_type }) =>
            TEXT(column, datalist_type),
    },
    autoincrement: {
        code: "autoincrement",
        operation: (column, { type, datalist_type }) =>
            AUTOINCREMENT(column, datalist_type),
    },
    hiddenfield: {
        code: "hiddenfield",
        operation: (column, { type, datalist_type }) =>
            HIDDENFIELD(column, datalist_type),
    },
    textarea: {
        code: "textarea",
        operation: (column, { type, datalist_type }) =>
            TEXT(column, datalist_type),
    },
    richtext: {
        code: "richtext",
        operation: (column, { type, datalist_type }) =>
            RICHTEXT(column, datalist_type),
    },
    richtexteditor: {
        code: "richtexteditor",
        operation: (column, { type, datalist_type }) =>
            RICHTEXT(column, datalist_type),
    },
    // datalist: { code: "datalist" },
    datecreated: {
        code: "datecreated",
        operation: (column, { type, datalist_type }) =>
            DATECREATEDORMODIFIED(column, datalist_type),
    },
    datemodified: {
        code: "datemodified",
        operation: (column, { type, datalist_type }) =>
            DATECREATEDORMODIFIED(column, datalist_type),
    },
    HTML: { code: "HTML", operation: (column, type) => {} },
    createdby: {
        code: "createdby",
        operation: (column, { type, datalist_type }) =>
            CREATEDORMODIFIEDBY(column, datalist_type),
    },
    modifiedby: {
        code: "modifiedby",
        operation: (column, { type, datalist_type }) =>
            CREATEDORMODIFIEDBY(column, datalist_type),
    },
    undefined: {
        code: undefined,
        operation: (column, { type, datalist_type }) =>
            otherComponents(column, datalist_type),
    },
    radio: {
        code: "radio",
        operation: (
            column,
            { type, datalist_type },
            dynamicLists,
            formFields,
        ) => RADIO(column, datalist_type, dynamicLists, formFields),
    },
    checkbox: {
        code: "checkbox",
        operation: (
            column,
            { type, datalist_type },
            dynamicLists,
            formFields,
        ) => CHECKBOX(column, datalist_type, dynamicLists, formFields),
    },
    select: {
        code: "select",
        operation: (
            column,
            { type, datalist_type },
            dynamicLists,
            formFields,
        ) => SELECT(column, datalist_type, dynamicLists, formFields),
    },
    signature: {
        code: "signature",
        operation: (column, { type, datalist_type }) =>
            SIGNATURE(column, datalist_type),
    },
    fileuploader: {
        code: "fileuploader",
        operation: (column, { type, table, datalist_type }) =>
            fileUploader(column, type, table, datalist_type),
    },
    json: {
        code: "json",
        operation: (column, { type, datalist_type }) =>
            json(column, datalist_type),
    },
};

const json = (column, type) => {
    return {
        Header: column.label,
        Footer: () => null,
        datatype: column.type,
        hideFilter: column.isFilter || false,
        accessor: column.db_column.toLowerCase(),
        id: column.id,
        className: `header_${column.db_column.toLowerCase()}`,
        Cell: ({ value }) => {
            return (
                <div className="s2a-jsonviewer">
                    <JsonViewer
                        json={value}
                        column={column}
                    />
                </div>
            );
        },
    };
};

function JsonViewer(props) {
    const { json, column } = props;
    var editor;
    let type = column?.type;
    let parsedJson;
    if (type === "json") {
        try {
            parsedJson = JSON.parse(json);
        } catch (error) {
            parsedJson = json;
        }
        var _json = JSON.stringify(parsedJson, null, 2);
        editor = [javascript({ jsx: true })];
    } else {
        _json = json;
    }
    const childModal = useRef(null);

    return (
        <>
            <button
                className="btn btn-sm button-theme"
                onClick={() => childModal.current.show()}>
                Show json
            </button>
            <ChildrenModal
                className="s2a-jsonviewer-editor-modal"
                size="lg"
                ref={childModal}
                header={column.title}>
                {type === "json_to_html" && <JsonToHtml json={_json} />}
                {type === "json" && (
                    <CodeMirror
                        value={_json}
                        height="50vh"
                        theme="dark"
                        extensions={editor}
                    />
                )}
            </ChildrenModal>
        </>
    );
}

class JsonToHtml extends React.Component {
    render() {
        const parsedJson =
            typeof this.props.json === "string"
                ? JSON.parse(this.props.json)
                : [];
        const Css = {
            jsonTr: {
                height: "25px",
            },
            jsonTd: {
                padding: "5px",
                borderSpacing: "5px",
                borderRadius: "0px",
            },
            rowSpacer: {
                height: "2px",
            },
            rootElement: {
                padding: "5px",
                borderSpacing: "5px",
                backgroundColor: "#BBBBBB",
                fontWeight: "bold",
                fontFamily: "Arial",
                borderRadius: "0px",
            },
            subElement: {
                padding: "5px",
                borderSpacing: "5px",
                backgroundColor: "#DDDDDD",
                fontWeight: "bold",
                fontFamily: "Arial",
                borderRadius: "0px",
            },
            dataCell: {
                borderSpacing: "5px",
                backgroundColor: "#F1F1F1",
                fontFamily: "Arial",
                borderRadius: "0px",
            },
        };
        return (
            <Scroll
                height={"50vh"}
                width={"50vw"}>
                <div
                    id="json_html"
                    style={{ color: "black" }}>
                    <JsonTable
                        json={parsedJson}
                        css={Css}
                    />
                </div>
            </Scroll>
        );
    }
}

const RADIO = (column, datalistType, lists, formFields) => {
    const resultList = {};
    let options = [];
    let length = 0;
    if (datalistType === "TABLE") {
        const itemWithOption = formFields[column.id];
        const { optionType, data } = itemWithOption;
        if (optionType === "dynamic") {
            var { mapValue, mapLabel } = data;
            options = lists[column.id];
            column.list = options;
            length = options.length;
            for (let i = 0; i < length; i++) {
                const option = options[i];
                const value = option[mapValue];
                const label = option[mapLabel];

                resultList[value] = label;
            }
        } else {
            options = formFields[column.id].options;
            column.list = options;
            length = options.length;

            for (let i = 0; i < length; i++) {
                const item = options[i];
                const { label, value } = item;

                resultList[value] = label;
            }
        }
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            Filter: item =>
                RadioFilter({
                    column,
                    item,
                    optionType,
                    mapValue,
                    mapLabel,
                }),
            filter: (a, b, c) => filterBySameValue(a, b, c, column),
            Cell: ({ value }) => {
                if (value) return <div>{resultList[value]}</div>;
            },
        };
    } else {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            filter: "includes",

            // filter: "fuzzyText",
        };
    }
};

const CHECKBOX = (column, datalistType, lists, formFields) => {
    if (datalistType === "TABLE") {
        const field = formFields[column.id];
        const { data } = field;

        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            Filter: item => CheckBoxFilter({ item, data }),
            // filter: "includes",
            filter: (a, b, c) => filterBySameValue(a, b, c, column),
            Cell: ({ value }) => {
                if (value) {
                    return <div className="s2a-checklist-items">{value}</div>;
                }
            },
        };
    } else {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            filter: "includes",

            // filter: "fuzzyText",
        };
    }
};
const CHECKLIST = (column, datalistType, lists, formFields) => {
    const resultList = {};
    let options = [];
    let length = 0;
    if (datalistType === "TABLE") {
        const itemWithOption = formFields[column.id];
        const { optionType, data } = itemWithOption;
        if (optionType === "dynamic") {
            var { mapValue, mapLabel } = data;
            options = lists[column.id];
            column.list = options;
            length = options.length;
            for (let i = 0; i < length; i++) {
                const option = options[i];
                const value = option[mapValue];
                const label = option[mapLabel];

                resultList[value] = label;
            }
        } else {
            options = formFields[column.id].options;
            column.list = options;
            length = options.length;

            for (let i = 0; i < length; i++) {
                const item = options[i];
                const { label, value } = item;

                resultList[value] = label;
            }
        }
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            Filter: item =>
                ChecklistFilter({
                    column,
                    item,
                    optionType,
                    mapValue,
                    mapLabel,
                }),
            filter: (a, b, c) => filterByMultiValue(a, b, c, column),
            Cell: ({ value }) => {
                if (value) {
                    const newValue = JSON.parse(value);
                    if (newValue)
                        return (
                            <div className="s2a-checklist-items">
                                {newValue.map(item => {
                                    return (
                                        <span className="badge s2a-badge">
                                            {resultList[item]}
                                        </span>
                                    );
                                })}
                            </div>
                        );
                }
            },
        };
    } else {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
            hideFilter: column.isFilter || false,
            filter: "includes",

            // filter: "fuzzyText",
        };
    }
};

const otherComponents = column => {
    return {
        Header: column.label,
        Footer:
            column.type === "number"
                ? value => {
                      const total = React.useMemo(() => {
                          if (
                              aggregateTypeKeys[column.aggregate] &&
                              aggregateTypeKeys[column.aggregate].code
                          ) {
                              return aggregateTypeKeys[
                                  column.aggregate
                              ].operation(value, column);
                          }
                      }, [value.rows]);

                      return (
                          column.includeAggregate && (
                              <div className="s2a-datalist-footer">
                                  {column.aggregate}: {total ? total : ""}
                              </div>
                          )
                      );
                  }
                : () => null,
        datatype: column.type,
        hideFilter: column.isFilter || false,
        id: column.id,
        accessor: column.db_column.toLowerCase(),
        className: `header_${column.db_column.toLowerCase()}`,
    };
};

const SIGNATURE = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            id: column.id,
            accessor: column.db_column.toLowerCase(),
            hideFilter: column.isFilter || false,
            // filter: "includes",
            className: `header_${column.db_column.toLowerCase()}`,
            // Filter: NumberRangeColumnFilter,
            Cell: ({ value }) => {
                return (
                    <img
                        height="20px"
                        className="disable-drag s2a-datalist-img"
                        src={value}
                        alt=""
                    />
                );
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            id: column.id,
            accessor: column.db_column.toLowerCase(),
            hideFilter: column.isFilter || false,
            // filter: "includes",
            className: `header_${column.db_column.toLowerCase()}`,
            // Filter: NumberRangeColumnFilter,
        };
    }
};
const CURRENCY = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            hideFilter: column.isFilter || false,
            filter: "includes",
            className: `header_${column.db_column.toLowerCase()} s2a-datalist-currency`,
            Filter: NumberRangeColumnFilter,
            Cell: ({ value }) => {
                value = value === "" ? "" : parseInt(value);
                return formatToCurrency(value);
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            hideFilter: column.isFilter || false,
            filter: "includes",
            className: `header_${column.db_column.toLowerCase()} s2a-datalist-currency`,
            Filter: NumberRangeColumnFilter,
        };
    }
};

const DATEANDTIME = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-dateandtime-field`,
            hideFilter: column.isFilter || false,
            Filter: DateRangeColumnFilter,
            filter: (rows, columnId, filterValue) =>
                dateBetweenFilterFn(
                    rows,
                    columnId,
                    filterValue,
                    column.db_column,
                ),
            Cell: ({ value }) => {
                if (!value || value === "") {
                    return "";
                }
                return formatDateTimeForUserViewDatalist(value);
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-dateandtime-field`,
            hideFilter: column.isFilter || false,
            Filter: DateRangeColumnFilter,
            filter: (rows, columnId, filterValue) =>
                dateBetweenFilterFn(
                    rows,
                    columnId,
                    filterValue,
                    column.db_column,
                ),
        };
    }
};

const NUMBER = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: value => {
                const total = React.useMemo(() => {
                    if (
                        aggregateTypeKeys[column.aggregate] &&
                        aggregateTypeKeys[column.aggregate].code
                    ) {
                        return aggregateTypeKeys[column.aggregate].operation(
                            value,
                            column,
                        );
                    }
                }, [value.rows]);

                return (
                    column.includeAggregate && (
                        <>
                            <div
                                title={column.aggregate}
                                className="s2a-aggregation">
                                {column.aggregate == "SUM" ? "SUM" : ""}{" "}
                                {total ? total : ""}
                            </div>
                        </>
                    )
                );
            },
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-number-field`,
            hideFilter: column.isFilter || false,
            Filter: NumberRangeColumnFilter,
            filter: "between",
            Cell: ({ value }) => {
                value =
                    typeof value === "string" && value !== ""
                        ? parseFloat(value)
                        : "";
                return value;
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: value => {
                const total = React.useMemo(() => {
                    if (
                        aggregateTypeKeys[column.aggregate] &&
                        aggregateTypeKeys[column.aggregate].code
                    ) {
                        return aggregateTypeKeys[column.aggregate].operation(
                            value,
                            column,
                        );
                    }
                }, [value.rows]);

                return (
                    column.includeAggregate && (
                        <div className="s2a-number-field">
                            {column.aggregate == "SUM" ? "SUM" : ""} :{" "}
                            {total ? total : ""}
                        </div>
                    )
                );
            },
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()}`,
            hideFilter: column.isFilter || false,
            Filter: NumberRangeColumnFilter,
            filter: "between",
        };
    }
};

const TIME = (column, { datalist_type: type }) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-time-field`,
            // filter: "includes",
            hideFilter: column.isFilter || false,
            Filter: TimeColumnFilter,
            filter: (rows, id, filterValues) =>
                timeBetween(rows, id, filterValues, column.db_column),
            Cell: ({ value }) => {
                return formatTimeForUserView(value);
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-time-field`,
            // filter: "includes",
            hideFilter: column.isFilter || false,
            Filter: TimeColumnFilter,
            filter: (rows, id, filterValues) =>
                timeBetween(rows, id, filterValues, column.db_column),
        };
    }
};

const DATE = (column, { datalist_type: type }) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-date-field`,
            hideFilter: column.isFilter || false,
            // Filter: DateColumnFilter,
            // filter: "fuzzyText",
            Filter: DateRangeColumnFilter,
            filter: (rows, columnId, filterValue) =>
                dateBetweenFilterFn(
                    rows,
                    columnId,
                    filterValue,
                    column.db_column,
                ),
            Cell: ({ value }) => {
                if (!value || value === "") {
                    return "";
                }
                return formatDateForUserViewDatalist(value);
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            accessor: column.db_column.toLowerCase(),
            Footer: () => null,
            datatype: column.type,
            className: `header_${column.db_column.toLowerCase()} s2a-date-field`,
            hideFilter: column.isFilter || false,
            Filter: DateRangeColumnFilter,
            filter: (rows, columnId, filterValue) =>
                dateBetweenFilterFn(
                    rows,
                    columnId,
                    filterValue,
                    column.db_column,
                ),
        };
    }
};

const TAGANDCHECKLIST = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()}`,
            hideFilter: column.isFilter || false,
            Filter: DefaultColumnFilter,
            filter: "includes",

            // filter: "fuzzyText",
            Cell: ({ value }) => {
                value = handleTagFormat(value, column.type);
                return (value = value && typeof value === "object" && (
                    <div className="s2a-taglist">
                        {value.map((value, index) => (
                            <div
                                className="badge tag-badge mx-1 s2a-taglist-checklist"
                                key={index}>
                                {value.name ? value.name : value}
                            </div>
                        ))}
                    </div>
                ));
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-taglist-checklist`,
            hideFilter: column.isFilter || false,
            Filter: DefaultColumnFilter,
            filter: "includes",

            // filter: "fuzzyText",
        };
    }
};

function handleTagFormat(selectedItem, type) {
    if (selectedItem !== "") {
        return type === "taglist"
            ? tryToParse(selectedItem)
            : checklistFormat(selectedItem);
        // return type === "taglist"
        //     ? tryToParse(selectedItem)
        //     : selectedItem.replace(/['"]+/g, "");
        // }
    } else {
        return [];
    }
}

function checklistFormat(selectedItem) {
    try {
        selectedItem = selectedItem.includes("[")
            ? JSON.parse(selectedItem)
            : selectedItem.split(",");
    } catch (error) {
        // console.log(error);
    }
    return selectedItem;
}

const EXPRESSION = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()}`,
            filter: "includes",

            // filter: "fuzzyText",
            hideFilter: column.isFilter || false,
            Cell: ({ value }) => {
                const db_column = column.db_column;
                const data = { [db_column]: value };
                return column.isHtml ? (
                    <div className="s2a-expression">
                        <Interweave
                            content={evaluateExpression(
                                column,
                                data,
                            )}></Interweave>
                    </div>
                ) : (
                    evaluateExpression(column, data)
                );
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-expression`,
            filter: "includes",

            // filter: "fuzzyText",
            hideFilter: column.isFilter || false,
        };
    }
};

const RICHTEXT = (column, type) => {
    if (type !== "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-richtext-field`,
            hideFilter: column.isFilter || false,
            filter: "includes",

            // filter: "fuzzyText",
            Cell: ({ value }) => {
                return <Interweave content={value}></Interweave>;
            },
        };
    } else if (type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-richtext-field`,
            hideFilter: column.isFilter || false,
            filter: "includes",

            // filter: "fuzzyText",
        };
    }
};

const HIDDENFIELD = (column, type) => {
    return {
        id: column.id,
        Header: column.label,
        Footer: () => null,
        datatype: column.type,
        accessor: column.db_column.toLowerCase(),
        className: `header_${column.db_column.toLowerCase()} s2a-hidden-field`,
        hideFilter: column.isFilter || false,
        filter: "includes",
        Cell: ({ value }) => {
            // return numberFormat("###", value);
            return value;
        },
        // filter: "fuzzyText",
    };
};

const AUTOINCREMENT = (column, type) => {
    return {
        id: column.id,
        Header: column.label,
        Footer: () => null,
        datatype: "autoincrement",
        accessor: column.db_column.toLowerCase(),
        className: `header_${column.db_column.toLowerCase()} s2a-text-field`,
        hideFilter: column.isFilter || false,
        // filter: "includes",
        filter: "fuzzyText",
        Cell: ({ value }) => {
            // return numberFormat("###", value);
            return value;
        },
    };
};

const TEXT = (column, type) => {
    return {
        id: column.id,
        Header: column.label,
        Footer: () => null,
        datatype: column.type,
        accessor: column.db_column.toLowerCase(),
        className: `header_${column.db_column.toLowerCase()} s2a-text-field`,
        hideFilter: column.isFilter || false,
        // filter: "includes",
        filter: "fuzzyText",
    };
};

const filterBySameValue = (rows, columnId, filterValue, column) => {
    if (filterValue === "Default" || filterValue === "") return rows;
    else if (filterValue)
        return rows.filter(
            item => item.original[column.db_column] === filterValue,
        );
};

const parseList = items => {
    try {
        let _items = [];
        if (typeof items === "string" && items) {
            _items = JSON.parse(items);
        } else {
            _items = [];
        }

        return _items;
    } catch (error) {
        // console.log(error);
    }
};

const filterByMultiValue = (rows, columnId, filterValue, column) => {
    try {
        if (filterValue)
            return rows.filter(item => {
                const list = filterValue.split(";");
                const parseOption = parseList(item.original[column.db_column]);
                const optionString = parseOption.join(";");
                return list.every(_item => optionString.includes(_item));
            });
        else return rows;
    } catch (error) {
        // console.log(error);
    }
};

const ReactSelectFilter = ({
    column,
    item,
    optionType,
    mapLabel,
    mapValue,
}) => {
    const { filterValue = [], preFilteredRows, setFilter, id } = item.column;
    let initialState =
        optionType === "static"
            ? {
                  label: "Default",
                  value: "",
                  id: "default",
              }
            : {
                  id: "default",
                  [mapValue]: "",
                  [mapLabel]: "Default",
              };
    const [selectedItem, setSelectedItem] = useState(initialState);

    useEffect(() => {
        if (optionType === "dynamic") {
            const item = column.list.find(
                item => item[mapValue] === filterValue,
            );
            if (item) setSelectedItem(item);
        } else if (optionType === "static") {
            const item = column.list.find(item => item.value === filterValue);
            if (item) setSelectedItem(item);
        }
    }, []);

    const handleChange = item => {
        if (optionType === "dynamic") {
            setFilter(item[mapValue]);
            setSelectedItem(item);
        } else if (optionType === "static") {
            setFilter(item.value);
            setSelectedItem(item);
        }
    };

    const clearFilter = () => {
        setFilter(undefined);
        setSelectedItem(initialState);
    };

    return (
        <div className="s2a-datalist-select-filter">
            <ReactSelect
                options={column.list}
                fieldLabel={mapLabel}
                fieldValue={mapValue}
                selectedOption={selectedItem}
                handleChange={handleChange}
            />
            <button
                onClick={clearFilter}
                className="btn btn-sm button-theme float-end my-2">
                Clear
            </button>
        </div>
    );
};

const RadioFilter = ({ column, item, optionType, mapLabel, mapValue }) => {
    const { filterValue = [], preFilteredRows, setFilter, id } = item.column;

    const [selectedItem, setSelectedItem] = useState(filterValue);

    const handleChange = item => {
        setFilter(item);
        setSelectedItem(item);
    };

    const clearFilter = () => {
        setFilter(undefined);
        setSelectedItem(undefined);
    };

    return (
        <div className="s2a-datalist-select-filter">
            <DynamicRadio
                items={column.list}
                selectedItem={selectedItem}
                handleChange={handleChange}
                mapLabel={mapLabel ?? "label"}
                mapValue={mapValue ?? "value"}
                classes={{ main: "d-flex gap-2 flex-wrap" }}
            />
            <button
                onClick={clearFilter}
                className="btn btn-sm button-theme float-end my-2">
                Clear
            </button>
        </div>
    );
};
const ChecklistFilter = ({ column, item, optionType, mapLabel, mapValue }) => {
    const { filterValue = "", preFilteredRows, setFilter, id } = item.column;

    const [selectedItem, setSelectedItem] = useState(filterValue);

    const handleChange = item => {
        setFilter(item);
        setSelectedItem(item);
    };

    const clearFilter = () => {
        setFilter(undefined);
        setSelectedItem(undefined);
    };

    return (
        <div className="s2a-datalist-select-filter">
            <DynamicCheckBoxs
                items={column.list}
                selectedItem={selectedItem}
                handleChange={handleChange}
                mapLabel={mapLabel ?? "label"}
                mapValue={mapValue ?? "value"}
                classes={{ main: "d-flex gap-2 flex-wrap" }}
            />
            <button
                onClick={clearFilter}
                className="btn btn-sm button-theme float-end my-2">
                Clear
            </button>
        </div>
    );
};
const CheckBoxFilter = ({ item, data }) => {
    const { filterValue = "", setFilter } = item.column;

    const [selectedItem, setSelectedItem] = useState(filterValue);
    const { use_custom, label, uncheckValue, checkedValue } = data;

    const list = [];
    const useCustomStaticMap = {
        undefined: "false",
        null: "false",
        "": "false",
        false: "false",
    };

    if (use_custom === "false" && useCustomStaticMap[use_custom] === "false") {
        list.push({ label: "true", value: "true" });
        list.push({ label: "false", value: "false" });
    } else {
        list.push({ label: checkedValue, value: checkedValue });
        list.push({ label: uncheckValue, value: uncheckValue });
    }

    const handleChange = (item, e) => {
        if (item) {
            setFilter(item);
            setSelectedItem(item);
        } else {
            clearFilter();
        }
    };

    const clearFilter = () => {
        setFilter(undefined);
        setSelectedItem(undefined);
    };

    return (
        <div className="s2a-datalist-select-filter">
            <DynamicRadio
                items={list}
                selectedItem={selectedItem}
                handleChange={handleChange}
                mapLabel="label"
                mapValue="value"
                classes={{ main: "d-flex gap-2 flex-wrap" }}
            />
            <button
                onClick={clearFilter}
                className="btn btn-sm button-theme float-end my-2">
                Clear
            </button>
        </div>
    );
};

const SELECT = (column, datalistType, lists, formFields) => {
    const resultList = {};
    let options = [];
    let length = 0;

    try {
        if (datalistType === "TABLE") {
            const itemWithOption = formFields[column.id];

            const { optionType, data } = itemWithOption;
            if (optionType === "dynamic") {
                var { mapValue, mapLabel } = data;
                options = lists[column.id];
                options.unshift({
                    [mapValue]: "",
                    [mapLabel]: "Default",
                });

                column.list = options;
                length = options.length;
                for (let i = 0; i < length; i++) {
                    const option = options[i];
                    const value = option[mapValue];
                    const label = option[mapLabel];

                    resultList[value] = label;
                }
            } else {
                options = formFields[column.id].options;
                options.unshift({
                    label: "Default",
                    value: "",
                    id: "default",
                });

                column.list = options;
                length = options.length;

                for (let i = 0; i < length; i++) {
                    const item = options[i];
                    var { label, value } = item;

                    resultList[value] = label;
                }
            }

            return {
                id: column.id,
                Header: column.label,
                Footer: () => null,
                datatype: column.type,
                accessor: column.db_column.toLowerCase(),
                className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
                hideFilter: column.isFilter || false,
                Filter: item =>
                    ReactSelectFilter({
                        column,
                        item,
                        optionType,
                        mapLabel,
                        mapValue,
                    }),
                filter: (a, b, c) => filterBySameValue(a, b, c, column),
                Cell: ({ value }) => {
                    if (value) return <div>{resultList[value]}</div>;
                },
            };
        } else {
            return {
                id: column.id,
                Header: column.label,
                Footer: () => null,
                datatype: column.type,
                accessor: column.db_column.toLowerCase(),
                className: `header_${column.db_column.toLowerCase()} s2a-select-field`,
                hideFilter: column.isFilter || false,
                filter: "includes",

                // filter: "fuzzyText",
            };
        }
    } catch (error) {
        // console.log(error);
    }
};

const fileUploader = (column, type, table, datalist_type) => {
    // console.log(type);
    // Replace 'your_file_url' with the actual URL of the file you want to download
    if (datalist_type === "EDITABLE-GRID") {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-file-uploader`,
            hideFilter: column.isFilter || false,
            filter: "fuzzyText",
            Cell: cell => {
                const files = cell?.value?.split(";");
                const recordId = cell.row.original["id"];
                return files?.map(
                    file =>
                        file && (
                            <a
                                href={`${FILE_URL}/${table}/${recordId}/${file}`}>
                                {file}
                                <br></br>
                            </a>
                        ),
                );
            },
        };
    } else {
        return {
            id: column.id,
            Header: column.label,
            Footer: () => null,
            datatype: column.type,
            accessor: column.db_column.toLowerCase(),
            className: `header_${column.db_column.toLowerCase()} s2a-file-uploader`,
            hideFilter: column.isFilter || false,
            filter: "fuzzyText",
            Cell: cell => {
                const files = cell?.value?.split(";");
                const recordId = cell.row.original["id"];
                return files?.map(
                    file =>
                        file && (
                            <a
                                href={`${FILE_URL}/${table}/${recordId}/${file}`}>
                                {file}
                                <br></br>
                            </a>
                        ),
                );
            },
        };
    }
};

const DATECREATEDORMODIFIED = column => {
    // id need for those component which exist in form field not db generated fields
    return {
        id: column.id,
        accessor: column.db_column.toLowerCase(),
        db_col: true,
        Header: column.label,
        Footer: () => null,
        datatype: column.type,
        className: `header_${column.db_column.toLowerCase()}`,
        hideFilter: column.isFilter || false,
        Filter: DateRangeColumnFilter,
        filter: (rows, columnId, filterValue) =>
            dateBetweenFilterFn(rows, columnId, filterValue, column.db_column),
        Cell: ({ value }) => {
            return (
                <div className="s2a-date-field">
                    {formatDateTimeForUserViewDatalist(value)}
                </div>
            );
        },
    };
};

const CREATEDORMODIFIEDBY = (column, type) => {
    return {
        id: column.id,
        Header: column.label,
        accessor: column.db_column.toLowerCase(),
        datatype: column.type,
        db_col: true,
        className: `header_${column.db_column.toLowerCase()} s2a-create-modify-by`,
        hideFilter: column.isFilter || false,
        filter: "includes",

        // filter: "fuzzyText",
        Footer: () => null,
        Cell: ({ value }) => {
            return value;
        },
    };
};
const sumOf = (data, column) => {
    let sumOfValues = 0;
    data.forEach(item => {
        if (item[column]) {
            sumOfValues += parseFloat(item[column]);
        }
    });
    if (sumOfValues) return sumOfValues.toLocaleString();
};

function evaluateExpression(
    item,
    data,
    channel,
    userGroups,
    userProfile,
    isAuthorized,
    tenantSubscription,
) {
    let expressionResult = false;

    try {
        const exp = new Function(
            "item",
            "data",
            "channel",
            "userGroups",
            "userProfile",
            "isAuthorized",
            "tenantSubscription",
            "return " + item.expression,
        );
        expressionResult = exp(
            item,
            data,
            channel,
            userGroups,
            userProfile,
            isAuthorized,
            tenantSubscription,
        );
    } catch (error) {
        // console.log(error);
    }
    return expressionResult;
}

function evaluateExpressionDefault(
    item,
    data,
    dataKeys,
    channel,
    userGroups,
    orgContext,
    userProfile,
    isAuthorized,
    tenantSubscription,
    sumOf = (dataKeys, dataKey, column) => {
        let sumOfValues = 0;
        let data = dataKeys[dataKey];
        if (!data || data.length == 0) {
            return 0;
        }
        data.forEach(item => {
            if (item[column]) {
                sumOfValues += parseFloat(item[column]);
            }
        });
        if (sumOfValues) return sumOfValues.toLocaleString();
        else return 0;
    },
) {
    let expressionResult = false;
    try {
        const exp = new Function(
            "item",
            "data",
            "dataKeys",
            "channel",
            "userGroups",
            "orgContext",
            "userProfile",
            "isAuthorized",
            "tenantSubscription",
            "sumOf",
            "return " + item.expression,
        );
        expressionResult = exp(
            item,
            data,
            dataKeys,
            channel,
            userGroups,
            orgContext,
            userProfile,
            isAuthorized,
            tenantSubscription,
            sumOf,
        );
    } catch (error) {
        // console.log(error);
    }
    // console.log("************* expressionResult:>"+expressionResult);
    return expressionResult;
}

const sumOfNumbers = (value, column) => {
    let sumOfValues = 0;
    value.rows.forEach(item => {
        if (item.original[column.db_column]) {
            // sumOfValues += parseInt(item.original[column.db_column]);
            sumOfValues += parseFloat(item.original[column.db_column]);
        }
    });
    if (sumOfValues) return sumOfValues.toLocaleString();
};

const averageOfNos = (value, column) => {
    let sumOfValues = 0;
    let countNOFields = 0;
    value.data.forEach(item => {
        if (item.original[column.db_column]) {
            countNOFields++;
            sumOfValues += parseInt(item.original[column.db_column]);
        }
    });
    if (sumOfValues && countNOFields) {
        return (sumOfValues / countNOFields).toFixed(2).toLocaleString();
    }
};

const minNumber = (value, column) => {
    const arr = [];
    value.data.forEach(item => {
        if (item.original[column.db_column]) {
            arr.push(parseInt(item.original[column.db_column]));
        }
    });
    if (arr && arr.length) {
        const minNO = Math.min(...arr);
        return minNO.toLocaleString();
    }
};

const maxNumber = (value, column) => {
    const arr = [];
    value.data.forEach(item => {
        if (item.original[column.db_column]) {
            arr.push(parseInt(item.original[column.db_column]));
        }
    });
    if (arr && arr.length) {
        const maxNO = Math.max(...arr);
        return maxNO.toLocaleString();
    }
};

const aggregateTypeKeys = {
    MAX: {
        code: "MAX",
        operation: (value, column) => maxNumber(value, column),
    },
    MIN: {
        code: "MIN",
        operation: (value, column) => minNumber(value, column),
    },
    SUM: {
        code: "SUM",
        operation: (value, column) => sumOfNumbers(value, column),
    },
    AVG: {
        code: "AVG",
        operation: (value, column) => averageOfNos(value, column),
    },
};

export {
    NumberRangeColumnFilter,
    SliderColumnFilter,
    SelectColumnFilter,
    DefaultColumnFilter,
    DateRangeColumnFilter,
    FilterModalWrapper,
    DateColumnFilter,
    TimeColumnFilter,
    dateBetweenFilterFn,
    GlobalFilter,
    multiDelete,
    selectedJsonExport,
    fuzzyTextFilterFn,
    SpecificSearch,
    jsonExportAll,
    sumOfNumbers,
    minNumber,
    maxNumber,
    aggregateTypeKeys,
    datalistDataTypes,
    evaluateExpression,
    evaluateExpressionDefault,
};

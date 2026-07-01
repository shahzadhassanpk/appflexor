import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL, REPORT_URL } from "../../../../../../Config";
import { getData } from "../../../../../../components/CrudApiCall";

import { AppContext } from "../../../../../../../AppContext";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import {
    makeShortId,
    tryParseJSONObject,
    formatDateForDataBase,
} from "../../../../../../utils/utils";
import { isEmpty } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";

import DateRange from "../../../../../../components/DateRange";
import { SqlServiceParams } from "./context/SqlServiceParams";
import TextField from "../../../../../../components/Textfield";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";
import DynamicRadio from "../../../../../../components/dynamic-radio/radio";
import useGlobalData from "../../../../../../components/useGlobal";
import {
    GlobalFilter,
    datalistDataTypes,
    evaluateExpression,
    evaluateExpressionDefault,
    multiDelete,
} from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import moment from "moment";
import RenderIframe from "./RenderIframe";

function PreviewReport({ reportId }) {
    const [report, setReport] = useState({});
    const [commonFilters, setCommonFilters] = useState({});

    const [isLoaded, setIsLoaded] = useState(false);
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (reportId) {
            getData(reportId);
        }
    }, [reportId]);

    async function getData(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "report",
                    serviceKey: "sys.report",
                    mode: "formData",
                },
            ],
        };

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const _report = response.data.C_DATA.report[0];
                if (_report) {
                    setReport(_report);
                    const filters = tryParseJSONObject(_report.filters);
                    getFilters(filters);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function getFilters(filters) {
        const tenantId = appContext?.tenantSubscription?.tenant_id;

        const filterMappingList = {};
        const dataRequest = {
            tenant_id: tenantId,
            dataKeys: [],
        };

        filters.map(filter => {
            if (
                filter.filter_type === "SELECT" &&
                filter.use_static !== "YES"
            ) {
                const serviceKey = filter.service_key;
                const serviceParams = filter.service_params;
                const mapLabel = filter.map_label;
                const mapValue = filter.map_value;
                const filterKey = filter.key;

                filterMappingList[filterKey] = {
                    mapLabel,
                    mapValue,
                    defaultValue: filter.default_value,
                };

                let key = {
                    serviceParams: serviceParams ? serviceParams : "",
                    dataKey: filterKey,
                    serviceKey: serviceKey,
                    mode: "formData",
                };

                dataRequest.dataKeys.push(key);
            }
        });

        if (dataRequest.dataKeys.length === 0) {
            setIsLoaded(true);
        } else {
            let response = await axios.post(
                API_URL + "?service.key=tenant.data",
                dataRequest,
            );

            if (response.data.C_STATUS === "FAIL") {
                toastEmitter(`${response.data.C_MESSAGE}`, true, "error");
            }

            if (response.data && response.data.C_STATUS === "SUCCESS") {
                let data = response.data.C_DATA;
                let _commonFilters = {};

                for (const key in data) {
                    if (typeof filterMappingList[key] !== "undefined") {
                        const list = data[key];
                        const { mapLabel, mapValue, defaultValue } =
                            filterMappingList[key];

                        let _options = list.map(item => {
                            const id = item.id ? item.id : makeShortId(5);
                            const obj = {
                                id: id,
                                [mapLabel]: item[mapLabel],
                                [mapValue]: item[mapValue],
                                label: item[mapLabel],
                                value: item[mapValue],
                            };

                            return obj;
                        });

                        _options.unshift({
                            id: makeShortId(5),
                            [mapLabel]: "Defalut",
                            [mapValue]: "",
                            label: "Defalut",
                            value: "",
                        });

                        console.log(_options);
                        _commonFilters[key] = [..._options];
                    }
                }

                setCommonFilters(_commonFilters);

                setIsLoaded(true);
            }
        }
    }

    function refreshFilsters() {
        const filters = tryParseJSONObject(report.filters);
        getFilters(filters);
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <div>
            {isEmpty(report) ? (
                <span>Loading...</span>
            ) : (
                <RenderReport
                    filteresLoaded={isLoaded}
                    report={report}
                    commonFilters={commonFilters}
                    refreshFilsters={refreshFilsters}
                />
            )}
        </div>
    );
}

function RenderReport({
    filteresLoaded,
    report,
    commonFilters,

    refreshFilsters,
}) {
    const [reportConfig, setReportConfig] = useState({});
    const [renderIframe, setRenderIframe] = useState(true);
    const [reportUrl, setReportUrl] = useState("");
    const [dynamicFilters, setDynamicFilters] = useState({});
    const [dynamicFiltersFiltered, setDynamicFiltersFiltered] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [inputFields, setInputFields] = useState({});
    const [selectedDynamicOptions, setSelectedDynamicOptions] = useState({});

    const authKey = localStorage.getItem("AUTH_KEY");
    const [sqlServiceParams, setSqlServiceParams] = useState({});
    const [filter, setFilter] = useState({});

    useEffect(() => {
        if (!isEmpty(report) && filteresLoaded) {
            let obj = {};
            let url = `${REPORT_URL}?service.key=report&AUTH_KEY=${authKey}&reportKey=${report.report_key}`;

            const parsedFilters = tryParseJSONObject(report.filters, []);

            parsedFilters.map(filter => {
                obj[filter.key] = filter.default_value;

                if (filter.default_value !== "") {
                    url = url + `&${filter.key}=${filter.default_value}`;
                }

                if (
                    filter.filter_type === "SELECT" &&
                    filter.use_static === "YES"
                ) {
                    let parsedOptions = tryParseJSONObject(filter.options, []);

                    typeof parsedOptions == "object" &&
                        parsedOptions.map(item => {
                            if (
                                filter.default_value !== "" &&
                                filter.default_value === item.value
                            ) {
                                setSelectedDynamicOptions(prev => {
                                    return {
                                        ...prev,
                                        [filter.id]: item,
                                    };
                                });
                            }

                            return item;
                        });

                    setDynamicFilters(prev => {
                        return { ...prev, [filter.id]: parsedOptions };
                    });
                    setDynamicFiltersFiltered(prev => {
                        return { ...prev, [filter.id]: parsedOptions };
                    });
                }

                if (
                    filter.filter_type === "SELECT" &&
                    filter.use_static !== "YES"
                ) {
                    const filterKey = filter.key;
                    const mapLabel = filter.map_label;
                    const mapValue = filter.map_value;
                    const list = commonFilters[filterKey];
                    let _options = list.map(item => {
                        const id = item.id ? item.id : makeShortId(5);
                        const obj = {
                            id: id,
                            [mapLabel]: item[mapLabel],
                            [mapValue]: item[mapValue],
                            label: item[mapLabel],
                            value: item[mapValue],
                        };

                        if (
                            filter.default_value !== "" &&
                            filter.default_value === item[mapValue]
                        ) {
                            setSelectedDynamicOptions(prev => {
                                return {
                                    ...prev,
                                    [filter.id]: obj,
                                };
                            });
                        }

                        return obj;
                    });

                    setDynamicFilters(prev => {
                        return { ...prev, [filter.id]: _options };
                    });
                    setDynamicFiltersFiltered(prev => {
                        return { ...prev, [filter.id]: _options };
                    });
                }
            });

            setInputFields(obj);
            setReportConfig({ ...report, filters: parsedFilters });
            setReportUrl(url);
            setIsLoaded(true);
        }
    }, [filteresLoaded, report, commonFilters]);

    useEffect(() => {
        if (isLoaded) {
            reportConfig.filters.map(filter => {
                if (filter.filter_type === "SELECT") {
                    if (
                        typeof filter["form_field"] !== "undefined" &&
                        typeof filter["filter_by"] !== "undefined"
                    ) {
                        let id = filter.id;
                        let listToFilter = dynamicFilters[id];

                        if (typeof listToFilter !== "undefined") {
                            let filteredList = [];

                            let hasDefaultValue =
                                inputFields[filter.form_field];

                            if (hasDefaultValue !== "") {
                                filteredList = listToFilter.filter(
                                    el => el.value === hasDefaultValue,
                                );
                            }

                            setDynamicFiltersFiltered(prev => ({
                                ...prev,
                                [id]: filteredList,
                            }));
                        }
                    }
                }
            });
        }
    }, [isLoaded, inputFields, selectedDynamicOptions, reportConfig]);

    function refreshData() {
        refreshFilsters();
    }

    function downloadExcelFile() {
        let url = `${REPORT_URL}?service.key=report&mode=xls&AUTH_KEY=${authKey}&reportKey=${reportConfig.report_key}`;

        reportConfig.filters.map(filter => {
            if (filter.filter_type === "TEXT") {
                url = url + `&${filter.key}=${inputFields[filter.key]}`;
            }

            if (filter.filter_type === "SELECT") {
                let option = selectedDynamicOptions[filter.id];
                if (typeof option !== "undefined") {
                    url = url + `&${filter.key}=${option.value}`;
                }
            }
        });

        // alert(url);
        window.open(url);
    }

    function applyNewFilter(params) {
        setRenderIframe(false);

        let url = `${REPORT_URL}?service.key=report&AUTH_KEY=${authKey}&reportKey=${reportConfig.report_key}`;

        // reportConfig.filters.map(filter => {
        //     if (filter.filter_type === "TEXT") {
        //         url = url + `&${filter.key}=${inputFields[filter.key]}`;
        //     }

        //     if (filter.filter_type === "SELECT") {
        //         let option = selectedDynamicOptions[filter.id];
        //         if (typeof option !== "undefined") {
        //             url = url + `&${filter.key}=${option.value}`;
        //         }
        //     }
        // });
        Object.keys(params).forEach(key => {
            let a = params[key];

            if (a.type === "DATE-RANGE") {
                let startField = "start_" + a.db_column;
                let endField = "end_" + a.db_column;
                let startValue = formatDateForDataBase(a?.start);
                let endValue = formatDateForDataBase(a?.end);
                url = url + `&${startField}=${startValue}`;
                url = url + `&${endField}=${endValue}`;
            } else {
                let field = a.db_column;
                let value = a.value;
                if (!value) {
                    value = "";
                }
                url = url + `&${field}=${value}`;
            }

            // if (filter.filter_type === "SELECT") {
            //     let option = selectedDynamicOptions[filter.id];
            //     if (typeof option !== "undefined") {
            //         url = url + `&${filter.key}=${option.value}`;
            //     }
            // }
        });

        setReportUrl(url);
        setTimeout(() => {
            setRenderIframe(true);
        }, [200]);
    }

    return (
        <div className="container-fluid px-0">
            {reportConfig.show_filters !== "YES" &&
                reportConfig.show_links !== "YES" && (
                    <RenderIframe
                        reportUrl={reportUrl}
                        renderIframe={renderIframe}
                    />
                )}
            {reportConfig.show_filters === "YES" &&
                reportConfig.filters_position === "TOP" && (
                    <>
                        <div className="row">
                            <RenderFilters
                                filters={reportConfig.filters}
                                selectedItem={reportConfig}
                                setFilter={setFilter}
                                filter={filter}
                                setInputFields={setInputFields}
                                inputFields={inputFields}
                                selectedDynamicOptions={selectedDynamicOptions}
                                setSelectedDynamicOptions={
                                    setSelectedDynamicOptions
                                }
                                dynamicFiltersFiltered={dynamicFiltersFiltered}
                                applyNewFilter={applyNewFilter}
                                col={"col-sm-4"}
                                isLoaded={renderIframe}
                                refreshData={refreshData}
                            />
                        </div>
                        {reportConfig.show_links === "YES" &&
                            reportConfig.links_position === "TOP" && (
                                <RenderLinks
                                    downloadExcel={downloadExcelFile}
                                />
                            )}

                        <RenderIframe
                            reportUrl={reportUrl}
                            renderIframe={renderIframe}
                        />
                    </>
                )}
            {reportConfig.show_filters === "YES" &&
                reportConfig.filters_position === "LEFT" && (
                    <div className="row">
                        <div className="container d-flex">
                            <div className="col-sm-4">
                                <div className="row">
                                    <div className="container">
                                        <RenderFilters
                                            filters={reportConfig.filters}
                                            selectedItem={reportConfig}
                                            setFilter={setFilter}
                                            filter={filter}
                                            setInputFields={setInputFields}
                                            inputFields={inputFields}
                                            selectedDynamicOptions={
                                                selectedDynamicOptions
                                            }
                                            setSelectedDynamicOptions={
                                                setSelectedDynamicOptions
                                            }
                                            dynamicFiltersFiltered={
                                                dynamicFiltersFiltered
                                            }
                                            applyNewFilter={applyNewFilter}
                                            col={"col-sm-12"}
                                            isLoaded={renderIframe}
                                            refreshData={refreshData}
                                        />
                                        {reportConfig.show_links === "YES" &&
                                            reportConfig.links_position ===
                                                "LEFT" && (
                                                <RenderLinks
                                                    downloadExcel={
                                                        downloadExcelFile
                                                    }
                                                />
                                            )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-8">
                                {reportConfig.show_links === "YES" &&
                                    reportConfig.links_position === "TOP" && (
                                        <RenderLinks
                                            downloadExcel={downloadExcelFile}
                                        />
                                    )}
                                <RenderIframe
                                    reportUrl={reportUrl}
                                    renderIframe={renderIframe}
                                />
                            </div>
                        </div>
                    </div>
                )}

            {reportConfig.show_filters !== "YES" &&
                reportConfig.show_links === "YES" &&
                reportConfig.links_position === "TOP" && (
                    <>
                        <RenderLinks downloadExcel={downloadExcelFile} />
                        <RenderIframe
                            reportUrl={reportUrl}
                            renderIframe={renderIframe}
                        />
                    </>
                )}
            {reportConfig.show_filters !== "YES" &&
                reportConfig.show_links === "YES" &&
                reportConfig.links_position === "LEFT" && (
                    <div className="row">
                        <div className="col-sm-4">
                            <RenderLinks downloadExcel={downloadExcelFile} />
                        </div>
                        <div className="col-sm-8">
                            <RenderIframe
                                reportUrl={reportUrl}
                                renderIframe={renderIframe}
                            />
                        </div>
                    </div>
                )}
        </div>
    );
}

function RenderLinks({ downloadExcel }) {
    return (
        <div className="d-flex w-100 align-items-center col-auto d-flex justify-content-end mb-2">
            <button
                className="btn button-theme"
                onClick={() => {
                    downloadExcel();
                }}>
                <i
                    title="Download Repot in Xls format"
                    className="fa-solid fa-download p-2 pointer"></i>
                Download XLS
            </button>
        </div>
    );
}

function RenderFilters({
    filters = [],
    selectedItem,
    setFilter,
    filter = { filter },
    selectedDynamicOptions,
    setSelectedDynamicOptions,
    inputFields,
    setInputFields,
    dynamicFiltersFiltered,
    appyNewFilter,
    col,
    isLoaded,
    refreshData,
    applyNewFilter,
}) {
    const [showloading, setShowloading] = useState(false);
    const [sqlServiceParams, setSqlServiceParams] = useState({});
    function onChange(event) {
        let key = event.target.name;
        let value = event.target.value;

        setInputFields(prev => {
            return {
                ...prev,
                [key]: value,
            };
        });
    }

    function onSelectionChange(selection, filter) {
        let _currentState = { ...selectedDynamicOptions };
        _currentState[filter.id] = selection;
        setSelectedDynamicOptions(_currentState);

        setInputFields(prev => {
            return {
                ...prev,
                [filter.key]: selection.value,
            };
        });
    }

    return (
        <>
            {/* <code>{JSON.stringify(inputFields, null, 2)}</code>
            <code>{JSON.stringify(selectedDynamicOptions, null, 2)}</code> */}
            <div className="report-filters col-sm-12">
                <div className="listing-header">Report Filters</div>
                <div className="row s2a-border m-1">
                    {/* <code>{JSON.stringify(sqlServiceParams)}</code> */}
                    <SqlServiceParams.Provider
                        value={{ sqlServiceParams, setSqlServiceParams }}>
                        <DatalistSqlFilters
                            selectedItem={selectedItem}
                            setFilter={setFilter}
                            applyNewFilter={applyNewFilter}
                        />
                        <div
                            className={`${
                                selectedItem?.filters_position == "TOP"
                                    ? "col-sm-4"
                                    : "col-sm-12"
                            } mt-2`}>
                            <button
                                className="btn btn-sm button-theme mb-1 mt-3"
                                onClick={() =>
                                    applyNewFilter(sqlServiceParams)
                                }>
                                Apply Filter
                            </button>
                        </div>
                    </SqlServiceParams.Provider>

                    {/* {filters.map(filter => {
                        if (filter.filter_type === "TEXT") {
                            return (
                                <div className={`${col} form-group`}>
                                    <label className="mt-1 fw-bold">
                                        {filter.name}
                                        &nbsp;
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name={filter.key}
                                        value={inputFields[filter.key]}
                                        onChange={onChange}
                                    />
                                </div>
                            );
                        }

                        if (filter.filter_type === "SELECT") {
                            let parsedOptions =
                                dynamicFiltersFiltered[filter.id];

                            return (
                                <div className={`${col} form-group`}>
                                    <label className="mt-1 fw-bold">
                                        {filter.name}
                                        &nbsp;
                                    </label>

                                    <ReactSelect
                                        options={parsedOptions}
                                        selectedOption={
                                            selectedDynamicOptions[filter.id]
                                        }
                                        handleChange={selection => {
                                            onSelectionChange(
                                                selection,
                                                filter,
                                            );
                                        }}
                                    />
                                </div>
                            );
                        }
                    })} */}
                    {/* <div className="col-sm d-flex w-100 align-items-center col-auto d-flex justify-content-end">
                        <button
                            className="btn btn-sm button-theme my-2 me-1"
                            title="Filter"
                            onClick={() => {
                                setShowloading(true);
                                setTimeout(() => setShowloading(false), 300);
                                refreshData();
                            }}>
                            {showloading ? (
                                <span
                                    className="spinner-border spinner-border-sm label"
                                    role="status"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-redo"></i> Refresh
                                </>
                            )}
                        </button>
                        <button
                            className="btn btn-sm button-theme my-2"
                            title="Filter"
                            onClick={() => appyNewFilter()}>
                            {!isLoaded ? (
                                <span
                                    className="spinner-border spinner-border-sm label"
                                    role="status"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-filter"></i> Apply
                                    Filters
                                </>
                            )}
                        </button>
                    </div> */}
                </div>
            </div>
        </>
    );
}

function DatalistSqlFilters(props) {
    //shahzad

    const { selectedItem, setFilter, applyNewFilter } = props;
    const { serviceparams = "" } = selectedItem;
    const [parsedServiceParams, setParsedServiceParams] = useState([]);

    useEffect(() => {
        try {
            var _parsedServiceParams = [];
            var paramsFields = {};

            if (serviceparams) {
                _parsedServiceParams = JSON.parse(serviceparams);
                var components = _parsedServiceParams;
                const requiredFilterTypes = [
                    "checklist",
                    "radio",
                    "select",
                    "checkbox",
                ];
                for (let key in components) {
                    if (
                        components[key].selected &&
                        requiredFilterTypes.includes(
                            components[key].type.toLowerCase(),
                        )
                    )
                        if (components[key].use_static === "YES") {
                            components[key].options = tryParseJSONObject(
                                components[key].options,
                            );
                        } else {
                            const field = {};

                            field.id = key;
                            field.data = components[key];
                            field.optionType = "dynamic";
                            paramsFields[key] = field;
                        }
                }
            }
            if (paramsFields && !isEmpty(paramsFields)) {
                const keys = [];

                getKeysForAllField(paramsFields, keys);
                getDBParams(_parsedServiceParams, paramsFields, keys).then(
                    () => {
                        // console.log(_parsedServiceParams);
                        setParsedServiceParams(_parsedServiceParams);
                        setFilter(_parsedServiceParams);
                    },
                );
            } else {
                setParsedServiceParams(_parsedServiceParams);
                setFilter(_parsedServiceParams);
            }
        } catch (error) {
            console.log(error);
        }
    }, [serviceparams]);

    function getKeysForAllField(formFields, keys) {
        for (let key in formFields) {
            if (formFields[key].optionType === "dynamic") {
                const data = formFields[key].data;

                let obj = {
                    params: "",
                    dataKey: key,
                    serviceKey: data.serviceKey,
                    mode: "formData",
                };
                if (obj.serviceKey) keys.push(obj);
            }
        }
        return keys;
    }
    async function getDBParams(_parsedServiceParams, paramsFields, keys) {
        const url = API_URL + "?service.key=tenant.data",
            datasource = "";
        if (keys && keys.length > 0) {
            var res = await getData({
                url,
                keys: keys,
            });
            // console.log(JSON.stringify(res));
            let data = res.data.C_DATA;
            for (let key in data) {
                _parsedServiceParams[key].array = data[key];
            }
            return _parsedServiceParams;
            // paramsFields[key].data.options = res[key].C_DATA;
        }
    }
    return (
        parsedServiceParams &&
        parsedServiceParams.length > 0 && (
            <div className="row datalist-service-params">
                {/* <code>{JSON.stringify(parsedServiceParams)}</code> */}
                {Array.isArray(parsedServiceParams) &&
                    parsedServiceParams?.map(serviceparam => (
                        <RenderFilter
                            key={serviceparam?.id}
                            serviceParam={serviceparam}
                            selectedItem={selectedItem}
                        />
                    ))}
            </div>
        )
    );
}

const serviceParamsFilters = {
    "DATE-RANGE": DateRangeWrapper,
    TEXT: TextFieldWrapper,
    NUMBER: NumberFieldWrapper,
    SELECT: SelectWrapper,
    RADIO: RadioWrapper,
    CHECKBOX: CheckboxWrapper,
};

function RenderFilter(props) {
    const { selectedItem, serviceParam } = props;
    const { type = "", selected, classes = "" } = serviceParam;
    if (!type) return <span className="me-3">{`${type} not found`}</span>;

    if (!serviceParamsFilters[type])
        return <span className="m-3">{`${type} not found`}</span>;

    if (!selected) return null;

    const component = serviceParamsFilters[type];
    //shahzad
    return (
        // <div className={`col-sm-10 ${classes}`}>
        <div
            className={`${
                selectedItem?.filters_position == "TOP"
                    ? "col"
                    : "col-sm-12"
            } mt-2`}>
            {/* <code>{JSON.stringify(selectedItem)}</code> */}
            {React.createElement(component, {
                disablePreviousDates: false,
                ...serviceParam,
            })}
        </div>
        // </div>
    );
}

function DateRangeWrapper(props) {
    const {
        label,
        disablePreviousDates,
        id,
        type,
        start_default_value,
        end_default_value,
        is_expression,
        db_column,
    } = props;
    // const [date, setDate] = useState({
    //     start: null,
    //     end: null,
    // });

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _start_default_value = evaluateExpressionDefault(
                { expression: start_default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            let _end_default_value = evaluateExpressionDefault(
                { expression: end_default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            if (!_start_default_value) {
                _start_default_value = new Date();
            }
            if (!_end_default_value) {
                _end_default_value = new Date();
            }
            handleDateChange({
                startDate: moment(_start_default_value),
                endDate: moment(_end_default_value),
            });
        } else if (start_default_value || end_default_value) {
            handleDateChange({
                startDate: moment(start_default_value),
                endDate: moment(end_default_value),
            });
        }
    }, []);

    const handleDateChange = selectedDate => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: {
                type: type,
                start: selectedDate?.startDate,
                end: selectedDate?.endDate,
                db_column: db_column,
            },
        }));
    };

    const date = sqlServiceParams[id];

    return (
        <DateRange
            startDate={date?.start}
            endDate={date?.end}
            handleDateChange={handleDateChange}
            label={label}
            disablePreviousDates={disablePreviousDates}
        />
    );
}

function TextFieldWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        db_column = "",
        default_value,
        is_expression,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            if (!_default_value) {
                _default_value = "";
            }
            handleOnChange({ target: { value: _default_value } });
        } else if (default_value) {
            handleOnChange({ target: { value: default_value } });
        }
    }, []);

    function handleOnChange(e) {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type: type, db_column: db_column, value: e?.target?.value },
        }));
    }

    return (
        <TextField
            key={id}
            placeholder={label}
            name={id}
            value={sqlServiceParams?.[id]?.value}
            label={label}
            type={type?.toLowerCase()}
            onChange={handleOnChange}
        />
    );
}

function NumberFieldWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        default_value,
        is_expression,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            handleOnChange({ target: { value: _default_value } });
        } else if (default_value) {
            handleOnChange({ target: { value: +default_value } });
        }
    }, []);

    function handleOnChange(e) {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type: type, text: e?.target?.value },
        }));
    }

    return (
        <TextField
            key={id}
            placeholder={label}
            name={id}
            value={sqlServiceParams?.[id]?.text}
            label={label}
            type={type?.toLowerCase()}
            onChange={handleOnChange}
        />
    );
}

function SelectWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        array = [],
        mapLabel,
        mapValue,
        default_value,
        is_expression,
        use_static,
        db_column = "",
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const [selectedOption, setSelectedOption] = useState({});
    const [options, setOptions] = useState(array);
    const expressionProps = useGlobalData();

    useEffect(() => {
        let _mapValue = mapValue && use_static !== "YES" ? mapValue : "value";
        let _default_value = default_value;
        if (is_expression) {
            _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            if (typeof _default_value === "string") {
                onChange(_default_value);
            } else {
                onChange(default_value);
            }
        }
        let selectedOptionIndex = options?.findIndex(
            option => option?.[_mapValue] === _default_value,
        );
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: {
                type: type,
                value: _default_value,
                db_column: db_column,
            },
        }));
        let _selectedOption = options[selectedOptionIndex];
        if (_selectedOption) {
            setSelectedOption(_selectedOption);
        }
    }, []);

    const onChange = item => {
        let temp = sqlServiceParams;
        let _options = options;
        let _mapValue = mapValue && use_static !== "YES" ? mapValue : "value";
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: {
                type: type,
                value: item[_mapValue],
                db_column: db_column,
            },
        }));
        let selectedOptionIndex = options?.findIndex(
            option => option?.[_mapValue] === item?.[_mapValue],
        );

        let _selectedOption = options[selectedOptionIndex];

        setSelectedOption(_selectedOption);
    };

    return (
        <div className="">
            {label && <label>{label}</label>}
            {/* {JSON.stringify(sqlServiceParams)} */}
            <ReactSelect
                options={options}
                fieldLabel={
                    mapLabel && use_static !== "YES" ? mapLabel : "label"
                }
                fieldValue={
                    mapValue && use_static !== "YES" ? mapValue : "value"
                }
                handleChange={onChange}
                selectedOption={selectedOption}
            />
        </div>
    );
}

function RadioWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        array,
        mapLabel,
        mapValue,
        default_value,
        is_expression,
        use_static,
        db_column,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);
    const [options, setOptions] = useState(array);
    const expressionProps = useGlobalData();

    useEffect(() => {
        try {
            if (is_expression) {
                let _default_value = evaluateExpressionDefault(
                    { expression: default_value },
                    // data,
                    // props.dataKeys,
                    ...expressionProps,
                );
                if (typeof _default_value === "string") {
                    onChange(_default_value);
                } else {
                    onChange(default_value);
                }
            } else if (default_value) {
                onChange(default_value);
            }
        } catch (e) {}
    }, []);

    const onChange = selectedOption => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, value: selectedOption, db_column: db_column },
        }));
    };

    return (
        <div className="col-sm-2">
            {label && <label className="mb-1">{label}</label>}
            <DynamicRadio
                items={options}
                mapLabel={mapLabel && use_static !== "YES" ? mapLabel : "label"}
                mapValue={mapValue && use_static !== "YES" ? mapValue : "value"}
                handleChange={onChange}
                selectedItem={sqlServiceParams?.[id]?.value}
                classes={{
                    main: "d-flex gap-2 flex-wrap align-items-center",
                }}
            />
        </div>
    );
}

function CheckboxWrapper(props) {
    const {
        label = "",
        id = "",
        type = "",
        options,
        mapLabel = "label",
        mapValue = "value",
        default_value,
        is_expression,
        use_static,
    } = props;

    const { sqlServiceParams, setSqlServiceParams } =
        useContext(SqlServiceParams);

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (is_expression) {
            let _default_value = evaluateExpressionDefault(
                { expression: default_value },
                // data,
                // props.dataKeys,
                ...expressionProps,
            );
            onChange(_default_value);
        } else if (default_value) {
            onChange(default_value);
        }
    }, []);

    const onChange = selectedOption => {
        setSqlServiceParams(prev => ({
            ...prev,
            [id]: { type, values: selectedOption },
        }));
    };

    return (
        <>
            {label && <label>{label}</label>}
            <DynamicCheckBoxs
                items={options}
                mapLabel={mapLabel && use_static !== "YES" ? mapLabel : "label"}
                mapValue={mapValue && use_static !== "YES" ? mapValue : "value"}
                handleChange={onChange}
                selectedItem={sqlServiceParams?.[id]?.values}
                classes={{
                    main: "d-flex flex-wrap gap-2 align-items-center my-2",
                }}
            />
        </>
    );
}

export default PreviewReport;

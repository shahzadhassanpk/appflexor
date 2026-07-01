import React, { useEffect, useRef, useState } from "react";
import { API_URL, ES_URL } from "../../../../../../Config";
import axios from "axios";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import ColorPalette from "./ChartColorPalette/ChartColorPalette";
import Select from "react-select";
import {
    colorCombination1,
    colorCombination2,
    colorCombination3,
    colorCombination4,
    colorCombination6,
    colorCombination7,
} from "./ChartColorPalette/colorPicker";
import * as colorCombinations from "./ChartColorPalette/colorPicker";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import { AppContext } from "../../../../../../../AppContext";
import { useContext } from "react";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";

export default function ChartModal(props) {
    const {
        error,
        input,
        handleInput,
        chartTypes,
        dataSourceType,
        showChatModule,
        showModal,
        setShowModal,
        setInput,
        handleInputChecked,
    } = props;

    const [fields, setFields] = useState([]);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const tabs = [
        { id: 1, title: "Setting", code: "SETTING" },
        { id: 2, title: "Description", code: "DESCRIPTION" },
    ];
    const [funcs, setFuncs] = useState([
        { id: 1, title: "Sum", code: "SUM" },
        { id: 2, title: "MIn", code: "MIN" },
        { id: 3, title: "Max", code: "MAX" },
        { id: 4, title: "Avg", code: "AVG" },
    ]);
    const [selectedTab, setSelectedTab] = useState("SETTING");
    const [colors, setColors] = useState([
        {
            id: "colorCombination1",
            title: "Blue",
            color: colorCombination1,
            selected: false,
        },
        {
            id: "colorCombination2",
            title: "Brown",
            color: colorCombination2,
            selected: false,
        },
        {
            id: "colorCombination3",
            title: "Yello Pink",
            color: colorCombination3,
            selected: false,
        },
        {
            id: "colorCombination4",
            title: "Green",
            color: colorCombination4,
            selected: false,
        },
        {
            id: "colorCombination6",
            title: "Es default",
            color: colorCombination6,
            selected: false,
        },
        {
            id: "colorCombination7",
            title: "Es status",
            color: colorCombination7,
            selected: false,
        },
    ]);
    const [dataSources, setDataSources] = useState([]);
    const verticalAligns = [
        { code: "top", name: "Top" },
        // { code: "middle", name: "Middle" },
        { code: "bottom", name: "Bottom" },
    ];
    const alignLegend = [
        { code: "left", name: "Left" },
        { code: "center", name: "Center" },
        { code: "right", name: "Right" },
    ];

    useEffect(() => {
        if (showModal) {
            getInstance();
            if ((input && input.serviceKey) || (input && input.query)) {
                const key = input && input.serviceKey;
                const query = input && input.query;
                getFields(key ? key : query);
            }
            if (input && input.color_palette) {
                let selectedColor;
                colors.forEach(item => {
                    if (item.id === input.color_palette) {
                        selectedColor = item;
                    }
                });
                setColors(
                    colors.map(item =>
                        item.id === input.color_palette
                            ? {
                                  ...selectedColor,
                                  selected: !selectedColor.selected,
                              }
                            : { ...item, selected: false },
                    ),
                );
            }
        }
    }, [showModal]);

    useEffect(() => {
        if (input && input.dataSourceType === "POSTGRES") {
            getSqlData(input && input.query);
        }
    }, [input?.dataSourceType]);

    function getFields(key) {
        if (input && input.dataSourceType === "POSTGRES") {
            getSqlData(key);
        } else {
            var dataRequest = {};
            dataRequest.dataKeys = [];
            var URL = API_URL + "?service.key=multiKey.data";
            const dataSourceType = input && input.dataSourceType;
            let fields;
            if (key) {
                if (dataSourceType === "SERVICE_KEY") {
                    // URL = API_URL + "?service.key=master.data";
                    URL = API_URL + "?service.key=tenant.data";

                    dataRequest = {
                        tenant_id: tenantId,
                        dataKeys: [
                            {
                                serviceParams: "",
                                dataKey: "data",
                                serviceKey: key,
                                mode: "formData",
                            },
                        ],
                    };
                } else if (dataSourceType === "POSTGRES") {
                    getSqlData(key);
                } else if (dataSourceType === "ELASTIC_SEARCH") {
                    dataRequest = {
                        method: "POST",
                        path: "/_sql",
                        data: {
                            query: key,
                        },
                    };
                    URL = ES_URL + "?service.key=data";
                }
            }

            dataRequest.datasource =
                input && input.dataSource ? input.dataSource : "";
            if (key)
                axios
                    .post(URL, dataRequest)
                    .then(response => {
                        if (response.status === 200) {
                            if (dataSourceType !== "ELASTIC_SEARCH") {
                                fields = response.data.C_DATA.data[0];
                                fields =
                                    typeof fields === "string" ? [] : fields;
                                setFields(Object.keys(fields));
                            } else {
                                fields = formatData(response.data.data);
                                fields =
                                    typeof fields === "string" ? [] : fields;
                                setFields(fields);
                            }
                        } else {
                            dataSourceType === "SERVICE_KEY"
                                ? toastEmitter(
                                      "invaild service key",
                                      true,
                                      "warning",
                                  )
                                : toastEmitter("invaild sql", true, "warning");
                            setFields([]);
                        }
                    })
                    .catch(error => {
                        dataSourceType === "SERVICE_KEY"
                            ? toastEmitter(
                                  "invaild service key",
                                  true,
                                  "warning",
                              )
                            : toastEmitter("invaild sql", true, "warning");
                        setFields([]);
                    });
        }
    }

    async function getSqlData(key) {
        let pg_end_point = "?service.key=bi.data";
        let dataSource =
            input && input.dataSourceName ? input.dataSourceName : "";
        var URL = API_URL + `${pg_end_point}&mode=formData`;
        var dataRequest = {
            tenant_id: tenantId,
            datasource: dataSource,
            query: key,
        };
        try {
            const response = await axios.post(URL, dataRequest);
            if (response.data.C_DATA) {
                let fields = response.data.C_DATA[0];
                setFields(Object.keys(fields));
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function getInstance() {
        var URL = API_URL + `?service.key=masterKey.tenantData`;
        var dataRequest = { dataKeys: [] };
        dataRequest.dataKeys.push({
            serviceParams: "",
            dataKey: "instance",
            serviceKey: "sys.instance",
            mode: "formData",
        });

        try {
            const response = await axios.post(URL, dataRequest);
            if (response.data.C_DATA.instance) {
                setDataSources(response.data.C_DATA.instance);
            }
        } catch (error) {
            console.log(error);
        }
    }

    function formatData(data) {
        const { columns } = data;
        const arr = [];
        columns.forEach(col => {
            arr.push(col["name"]);
        });
        return arr;
    }

    function selectedColor(color) {
        let e = { target: { value: color.id, name: "color_palette" } };
        handleInput(e);
    }

    function removeSeriveKey(e) {
        getFields(e.target.value);
        setInput({
            ...input,
            serviceKey: "",
        });
    }

    function removeSql(e) {
        getFields(e.target.value);
        setInput({
            ...input,
            query: "",
        });
    }

    function handleChange(event) {
        let id = event.target.id;
        let value = event.target.value;

        setInput(prevState => ({
            ...prevState,
            [id]: value,
        }));
    }

    return (
        <MODAL
            header="Chart"
            show={showModal}
            handleClose={() => setShowModal(false)}>
            <div>
                <ul className="nav nav-tabs">
                    {tabs.map((item, index) => (
                        <li
                            key={index}
                            className="nav-item"
                            onClick={() => setSelectedTab(item.code)}>
                            <div
                                className={
                                    item.code === selectedTab
                                        ? "nav-link text-center active"
                                        : "nav-link text-center"
                                }
                                href={`#${item.code}`}>
                                {item.title}
                            </div>
                        </li>
                    ))}
                </ul>
                {selectedTab === "SETTING" && (
                    <div
                        id="SETTING"
                        className="chart-config s2a-border mt-2 active">
                        <div
                            className="g-3 needs-validation"
                            id="horizontal-axis"
                            novalidate>
                            <div className="row px-2 mt-3">
                                <div className="col-sm-4">
                                    <label
                                        htmlFor="Title"
                                        className="form-label d-flex justify-content-between">
                                        <span className="d-inline-block">
                                            Title&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        <span
                                            className={`text-danger text-end ${
                                                props.error.indexOf("title") >
                                                -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Title required.
                                        </span>
                                    </label>
                                    <div className="input-group has-validation">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title"
                                            name="title"
                                            value={input && input.title}
                                            onChange={handleInput}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <SelectComponent
                                        label="Chart Type"
                                        name="chartType"
                                        value={input && input.chartType}
                                        handleInput={setInput}
                                        items={chartTypes}
                                        required={true}
                                        error={error}
                                    />
                                </div>
                                {/* <div className="col-sm-2">
                                    <label
                                        htmlFor="chartColor"
                                        className="form-label d-flex justify-content-between">
                                        <span className="d-inline-block">
                                            Color&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        <span
                                            className={`text-danger text-end ${
                                                props.error.indexOf(
                                                    "dataSourceType",
                                                ) > -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Select Color
                                        </span>
                                    </label>
                                    <ColorDropdownSelector
                                        name="chartColor"
                                        className="form-select"
                                        selectedColor={
                                            input && input.chartColor
                                        }
                                        setSelectedColor={setInput}
                                        ></ColorDropdownSelector>
                                </div> */}
                                <div className="col-sm-2">
                                    <label
                                        htmlFor="dataSourceType"
                                        className="form-label d-flex justify-content-between">
                                        <span className="d-inline-block">
                                            Data Source&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        <span
                                            className={`text-danger text-end ${
                                                props.error.indexOf(
                                                    "dataSourceType",
                                                ) > -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Select Data Source
                                        </span>
                                    </label>
                                    <select
                                        className="form-select"
                                        id="dataSourceType"
                                        name="dataSourceType"
                                        value={input && input.dataSourceType}
                                        onChange={handleInput}
                                        required>
                                        <option value="">
                                            Select Data Source
                                        </option>
                                        {dataSourceType?.map(
                                            (dataSource, index) => {
                                                return (
                                                    <option
                                                        key={index}
                                                        value={dataSource.code}>
                                                        {dataSource.name}
                                                    </option>
                                                );
                                            },
                                        )}
                                    </select>
                                </div>
                            </div>
                            {input &&
                                input.dataSourceType &&
                                input.dataSourceType === "SERVICE_KEY" && (
                                    <div className="row px-2 mt-3">
                                        <div className="col-sm-4">
                                            <label
                                                htmlFor="serviceKey"
                                                className="form-label d-flex justify-content-between">
                                                <span className="d-inline-block">
                                                    Service Key&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                                <span
                                                    className={`text-danger text-end ${
                                                        props.error.indexOf(
                                                            "serviceKey",
                                                        ) > -1
                                                            ? "d-inline-block"
                                                            : "d-none"
                                                    }`}>
                                                    Service Key required.
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="serviceKey"
                                                name="serviceKey"
                                                value={
                                                    input && input.serviceKey
                                                }
                                                onChange={handleInput}
                                                onBlur={e => removeSql(e)}
                                                required
                                            />
                                        </div>
                                        <div className="col-sm-4">
                                            <label className="form-label">
                                                Service Params
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="serviceParams"
                                                name="serviceParams"
                                                value={
                                                    input && input.serviceParams
                                                }
                                                onChange={handleInput}
                                            />
                                        </div>
                                    </div>
                                )}
                            {input &&
                                input.dataSourceType &&
                                input.dataSourceType === "POSTGRES" && (
                                    <div className="row px-2 mt-2">
                                        <div className="col-sm-4">
                                            <label
                                                htmlFor="dataSourceName"
                                                className="form-label d-flex justify-content-between">
                                                <span className="d-inline-block">
                                                    Datasource Name&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                                <span
                                                    className={`text-danger text-end ${
                                                        props.error.indexOf(
                                                            "dataSourceName",
                                                        ) > -1
                                                            ? "d-inline-block"
                                                            : "d-none"
                                                    }`}>
                                                    Select Datasource Name
                                                </span>
                                            </label>
                                            <select
                                                disabled={
                                                    dataSources &&
                                                    dataSources.length < 1
                                                }
                                                type="text"
                                                className="form-select"
                                                id="dataSourceName"
                                                name="dataSourceName"
                                                value={
                                                    input &&
                                                    input.dataSourceName
                                                }
                                                onChange={handleInput}
                                                required>
                                                <option
                                                    key="first"
                                                    value="">
                                                    Default
                                                </option>
                                                {dataSources?.map((item, i) => (
                                                    <>
                                                        <option
                                                            key={i}
                                                            value={item.code}>
                                                            {item.name}
                                                        </option>
                                                    </>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            {input &&
                                input.dataSourceType &&
                                input.dataSourceType !== "SERVICE_KEY" && (
                                    <div className="row px-2 mt-2">
                                        <div className="col-sm-12">
                                            <label
                                                htmlFor="query"
                                                className="form-label d-flex justify-content-between">
                                                <span className="d-inline-block">
                                                    Query&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                                <span
                                                    className={`text-danger text-end ${
                                                        props.error.indexOf(
                                                            "query",
                                                        ) > -1
                                                            ? "d-inline-block"
                                                            : "d-none"
                                                    }`}>
                                                    Query required.
                                                </span>
                                            </label>
                                            <textarea
                                                type="text"
                                                className="form-control"
                                                id="query"
                                                keyColumn
                                                name="query"
                                                value={input && input.query}
                                                onChange={handleInput}
                                                onBlur={e => removeSeriveKey(e)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            <div className="row px-2 mt-2">
                                <div className="col-sm-4">
                                    <label
                                        htmlFor="keyColumn"
                                        className="form-label d-flex justify-content-between chart-legend">
                                        <span className="d-inline-block">
                                            X Axis Column&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        <span
                                            className={`text-danger text-end ${
                                                props.error.indexOf(
                                                    "keyColumn",
                                                ) > -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Select column
                                        </span>
                                    </label>
                                    <select
                                        disabled={fields && fields.length < 1}
                                        type="text"
                                        className="form-select"
                                        id="keyColumn"
                                        name="keyColumn"
                                        value={input && input.keyColumn}
                                        onChange={handleInput}
                                        required>
                                        <option
                                            key="first"
                                            value="">
                                            Default
                                        </option>
                                        {fields.map((item, i) => (
                                            <>
                                                <option
                                                    key={i}
                                                    value={item}>
                                                    {item}
                                                </option>
                                            </>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-sm-4">
                                    <label
                                        htmlFor="RefreshInterval"
                                        className="form-label">
                                        Refresh Interval
                                        <span
                                            title="Provide time in seconds"
                                            className="ms-2">
                                            <i className="fa-regular fa-circle-question"></i>
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="RefreshInterval"
                                        name="refresh_interval"
                                        value={input && input.refresh_interval}
                                        onChange={handleInput}
                                    />
                                </div>
                                <div className="col-sm-2 allow-legend">
                                    <span className="me-2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input legend-checkbox"
                                            id="show_legend"
                                            name="show_legend"
                                            value={input && input.show_legend}
                                            checked={input && input.show_legend}
                                            onChange={handleInputChecked}
                                        />
                                    </span>
                                    <label
                                        htmlFor="show_legend"
                                        className="d-flex justify-content-between">
                                        <span className="d-inline-block">
                                            Show Legend&nbsp;
                                            
                                        </span>
                                        <span
                                            className={`text-danger text-end ${
                                                props.error.indexOf(
                                                    "show_legend",
                                                ) > -1
                                                    ? "d-inline-block"
                                                    : "d-none"
                                            }`}>
                                            Legend required.
                                        </span>
                                    </label>
                                </div>
                                <div className="col-sm-2 allow-legend">
                                    <span className="me-2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input legend-checkbox"
                                            id="show_percent"
                                            name="show_percent"
                                            value={input && input.show_percent}
                                            checked={input && input.show_percent}
                                            onChange={handleInputChecked}
                                        />
                                    </span>
                                    <label
                                        htmlFor="show_percent"
                                        className="d-flex justify-content-between">
                                        <span className="d-inline-block">
                                            Show As %&nbsp;                                            
                                        </span>                                        
                                    </label>
                                </div>
                            </div>
                            <div className="row px-2 mt-2">
                                {input &&
                                    input.chartType !== "statisticscard" && (
                                        <>
                                            <div className="col-sm-4">
                                                <label className="">
                                                    Select Color Palette
                                                </label>
                                                <div className="color-palette">
                                                    <div className="dropdown-center">
                                                        <div
                                                            className="dropdown-toggle dropdown__button"
                                                            type="button"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false">
                                                            <label className="">
                                                                Color Palette
                                                            </label>
                                                            <div className="palette-width">
                                                                {input &&
                                                                    input.color_palette && (
                                                                        <ColorPalette
                                                                            title={
                                                                                "testing"
                                                                            }
                                                                            colors={
                                                                                colorCombinations[
                                                                                    input
                                                                                        .color_palette
                                                                                ]
                                                                            }
                                                                        />
                                                                    )}
                                                            </div>
                                                        </div>
                                                        <ul className="dropdown-menu colorpicker__dropdown">
                                                            {colors.map(
                                                                (
                                                                    colorItem,
                                                                    index,
                                                                ) => {
                                                                    return (
                                                                        <li
                                                                            className="dropdown-item"
                                                                            key={
                                                                                index
                                                                            }
                                                                            onClick={() =>
                                                                                selectedColor(
                                                                                    colorItem,
                                                                                )
                                                                            }>
                                                                            <div className="color-list">
                                                                                <label>
                                                                                    {
                                                                                        colorItem.title
                                                                                    }
                                                                                </label>
                                                                                <ColorPalette
                                                                                    title={
                                                                                        colorItem.title
                                                                                    }
                                                                                    colors={
                                                                                        colorItem.color
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                },
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-2">
                                                <HeightField
                                                    input={input}
                                                    handleInput={handleInput}
                                                    error={error}
                                                />
                                            </div>
                                            <div className="col-sm-2">
                                                <label
                                                    htmlFor="width"
                                                    className="form-label d-flex justify-content-between">
                                                    <span className="d-inline-block">
                                                        Width&nbsp;
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`text-danger text-end ${
                                                            props.error.indexOf(
                                                                "width",
                                                            ) > -1
                                                                ? "d-inline-block"
                                                                : "d-none"
                                                        }`}>
                                                        Width required.
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="width"
                                                    name="width"
                                                    value={input && input.width}
                                                    onChange={handleInput}
                                                    required
                                                />
                                            </div>
                                            {input &&
                                                (input.chartType ===
                                                    "piechart" ||
                                                    input.chartType ===
                                                        "donutchart") && (
                                                    <>
                                                        <div className="col-sm-2">
                                                            <SelectComponent
                                                                label="Vertical Align"
                                                                name="vertical_align"
                                                                value={
                                                                    input &&
                                                                    input.vertical_align
                                                                }
                                                                items={
                                                                    verticalAligns
                                                                }
                                                                handleInput={
                                                                    setInput
                                                                }
                                                                error={error}
                                                            />
                                                        </div>
                                                        <div className="col-sm-2">
                                                            <SelectComponent
                                                                label="Align Legend"
                                                                name="align_legend"
                                                                value={
                                                                    input &&
                                                                    input.align_legend
                                                                }
                                                                items={
                                                                    alignLegend
                                                                }
                                                                handleInput={
                                                                    setInput
                                                                }
                                                                error={error}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                        </>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
                {selectedTab === "DESCRIPTION" && (
                    <div
                        id="DESCRIPTION"
                        className="mt-3">
                        <TextEditor
                            id="chart_description"
                            value={input?.chart_description}
                            onChange={handleChange}
                        />
                    </div>
                )}
                <div className="row px-2 mt-3">
                    <div className="col-sm-12 text-end">
                        <button
                            className="btn button-theme  btn-sm mx-1"
                            onClick={e => showChatModule(e)}>
                            Ok
                        </button>
                        <button
                            className="btn button-theme  btn-sm"
                            onClick={() => setShowModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </MODAL>
    );
}

function HeightField(props) {
    const { input, handleInput, error } = props;
    return (
        <div className="">
            <label
                htmlFor="height"
                className="form-label d-flex justify-content-between">
                <span className="d-inline-block">
                    Height&nbsp;
                    <span className="text-danger">*</span>
                </span>
                <span
                    className={`text-danger text-end ${
                        props.error.indexOf("height") > -1
                            ? "d-inline-block"
                            : "d-none"
                    }`}>
                    Height required.
                </span>
            </label>
            <input
                type="text"
                className="form-control"
                id="height"
                name="height"
                value={input && input.height}
                onChange={handleInput}
                required
            />
        </div>
    );
}
function ColorDropdownSelector({ name, selectedColor, setSelectedColor }) {
    const colorOptions = [
        { value: "#ff0000", label: "🔴 Red" },
        { value: "#00ff00", label: "🟢 Green" },
        { value: "#0000ff", label: "🔵 Blue" },
        { value: "#ffff00", label: "🟡 Yellow" },
        { value: "#ff00ff", label: "🟣 Magenta" },
        { value: "#00ffff", label: "🔵 Cyan" },
    ];

    return (
        <div style={{ width: "200px" }}>
            <Select
                name={name}
                options={colorOptions}
                value={selectedColor}
                onChange={setSelectedColor}
                styles={{
                    option: (styles, { data, isFocused }) => ({
                        ...styles,
                        backgroundColor: isFocused ? "#eee" : null,
                        display: "flex",
                        alignItems: "center",
                    }),
                    singleValue: (styles, { data }) => ({
                        ...styles,
                        display: "flex",
                        alignItems: "center",
                    }),
                }}
            />
            <p style={{ marginTop: "1rem" }}>
                Selected Hex: <strong>{selectedColor.value}</strong>
            </p>
        </div>
    );
}
function SelectComponent(props) {
    const {
        label,
        name,
        value,
        items,
        required,
        error,
        disabled,
        handleInput,
    } = props;

    const handleInputData = e => {
        handleInput(prev => ({
            ...prev,
            [name]: e.target.value,
        }));
    };

    return (
        <>
            <label
                htmlFor={name}
                className="form-label d-flex justify-content-between">
                <span className="d-inline-block">
                    {label}&nbsp;
                    <span className="text-danger">*</span>
                </span>
                <span
                    className={`text-danger text-end ${
                        error.indexOf(name) > -1 ? "d-inline-block" : "d-none"
                    }`}>
                    Select option.
                </span>
            </label>
            <select
                className={disabled ? "form-select opacity-50" : "form-select"}
                id={name}
                name={name}
                value={value}
                required={required ? required : false}
                title={disabled && "Enter sql first"}
                disabled={disabled}
                onChange={handleInputData}>
                <option value="">Default Option</option>
                {items &&
                    items?.map((item, index) => {
                        return (
                            <option
                                key={index}
                                value={item.code}>
                                {item.name}
                            </option>
                        );
                    })}
            </select>
        </>
    );
}

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

function MODAL(props) {
    const { show, handleClose, children, header } = props;
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    return (
        <>
            <Modal
                className="s2a-modal"
                size="xl"
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{header}</span>
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
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>{children}</Modal.Body>
            </Modal>
        </>
    );
}

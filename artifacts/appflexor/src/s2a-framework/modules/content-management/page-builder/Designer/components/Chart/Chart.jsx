import React, { useEffect, useState, lazy } from "react";
import axios from "axios";
import { API_URL, ES_URL } from "../../../../../../Config";
const LineChartApp = lazy(() =>
    import("./components/LineChartApp"),
);
// import LineChartApp from "./components/LineChartApp";
import BarChartApp from "./components/BarChartApp";
import AreaChartApp from "./components/AreaChartApp";
import StackedBarChartApp from "./components/StackedBarChartApp";
import HorizontalBarChart from "./components/HorizontalBarChart";
import HorizontalStackedBarChart from "./components/HorizontalStackedBarChart";
import { v4 as uuidv4 } from "uuid";
import PieChart from "./components/PieChart";
import DonutChart from "./components/DonutChart";
import StatisticsCard from "./components/StatisticsCard";
import { AppContext } from "../../../../../../../AppContext";
import { useContext } from "react";
import Messsage from "../../../../../../components/Subscription Message/Messsage";
//https://www.reddit.com/r/javahelp/comments/yjwet8/convert_a_flat_json_array_into_a_nested_json/

const componentList = {
    linechart: LineChartApp,
    donutchart: DonutChart,
    barchart: BarChartApp,
    areachart: AreaChartApp,
    stackedbarchart: StackedBarChartApp,
    horizontalbarchart: HorizontalBarChart,
    horizontalstackedbarchart: HorizontalStackedBarChart,
    piechart: PieChart,
    statisticscard: StatisticsCard,
};

function Chart(props) {
    const { component, flag, setFlag, mode, modeType } = props;
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const [chartData, setChartData] = useState({
        data: [],
        height: 200,
        width: 200,
        columns: {},
    });
    const featuresSubscription = appContext?.featuresSubscription;
    // const show = SubscriptionAllowViewer("WEB_CHARTS", featuresSubscription);
    const show = true;

    useEffect(() => {
        if (
            show &&
            component !== undefined &&
            (mode === modeType.render || mode === modeType.preview)
        ) {
            let chartHeight = component.height
                ? parseInt(component.height)
                : 300;
            let chartWidth = component.width ? parseInt(component.width) : 250;

            if (
                component.serviceParams ||
                component.serviceKey ||
                component.query
            ) {
                getData(
                    component.serviceParams,
                    component.serviceKey,
                    chartHeight,
                    chartWidth,
                    component.query,
                    component.dataSourceName,
                    component.dataSourceType,
                );
            }
        }
    }, []);

    useEffect(() => {
        if (flag === "get" && show) {
            if (
                component !== undefined &&
                (mode === modeType.render || mode === modeType.preview)
            ) {
                let chartHeight = component.height
                    ? parseInt(component.height)
                    : 300;
                let chartWidth = component.width
                    ? parseInt(component.width)
                    : 250;

                if (
                    component.serviceParams ||
                    component.serviceKey ||
                    component.query
                ) {
                    getData(
                        component.serviceParams,
                        component.serviceKey,
                        chartHeight,
                        chartWidth,
                        component.query,
                        component.dataSourceName,
                        component.dataSourceType,
                    );
                }
            }
        }
    }, [flag]);

    useEffect(() => {
        if (show) {
            const {
                refresh_interval,
                height,
                weight,
                serviceParams,
                serviceKey,
                dataSourceName,
                query,
                dataSourceType,
            } = component;
            let userRefreshTime =
                refresh_interval && refresh_interval !== ""
                    ? parseInt(refresh_interval) * 1000
                    : undefined;
            if (
                userRefreshTime !== "" &&
                userRefreshTime !== 0 &&
                userRefreshTime
            ) {
                const id = setInterval(() => {
                    if (
                        userRefreshTime !== "" &&
                        userRefreshTime !== 0 &&
                        userRefreshTime
                    ) {
                        getData(
                            serviceParams,
                            serviceKey,
                            height ? parseInt(height) : 300,
                            weight ? parseInt(weight) : 250,
                            query,
                            dataSourceName,
                            dataSourceType,
                        );
                    }
                    // toastEmitter("Chart Refresh Successfully", true);
                }, userRefreshTime);
                return () => clearInterval(id);
            }
        }
    }, []);

    const unflatten = arr => {
        let obj = arr[0];
        let keys = Object.keys(obj);
        let d1 = component.keyColumn;
        let d2 = keys[1];
        let fact = keys[2];
        try {
            var o = arr.reduce((a, b) => {
                a[b[d1]] = a[b[d1]] || [];
                a[b[d1]].push({ [b[d2]]: b[fact] });
                return a;
            }, {});

            var a = Object.keys(o).map(function (k) {
                let c = Object.assign.apply({}, o[k]);
                c.country = k;
                return c;
            });
            // console.log(a);
        } catch (e) {}
        return a;
    };

    function convertFlat(data) {
        let parseData = [];
        data.forEach(row => {
            let obj = {};

            Object.keys(row).forEach(key => {
                if (key === component.keyColumn) {
                    obj[key] = row[key];
                } else {
                    let value = row[key];
                    try {
                        value = parseInt(value);
                        if (value) {
                            obj[key] = value;
                        } else {
                            //obj[key] = row[key];
                        }
                    } catch (e) {}
                }
            });
            parseData.push(obj);
        });
        return parseData;
    }

    function convertData(data) {
        let parseData = [];
        let obj = data[0];
        let keys = Object.keys(obj);
        let keyLength = keys.length;
        if (keyLength < 3) {
            parseData = convertFlat(data);
        } else {
            parseData = unflatten(data);
        }
        return parseData;
    }

    function arrToJson(data) {
        let columns = data.columns;
        let rows = data.rows;
        let jsonArray = [];
        rows.forEach((row, rowIndex) => {
            let json = {};
            columns.forEach((column, columnIndex) => {
                json[column["name"]] = row[columnIndex];
            });
            jsonArray.push(json);
        });
        return jsonArray;
    }

    function getData(
        params,
        serviceKey,
        height,
        width,
        query,
        sourceName,
        sourceType,
    ) {
        params = params ? params : "";
        let dataRequest = {};
        let es = ES_URL;
        let pg = API_URL;
        let Url = "";
        let es_end_point = "?service.key=data";
        let pg_end_point = "?service.key=bi.data";
        let end_point = "";
        if (serviceKey || sourceType) {
            if (sourceType === "ELASTIC_SEARCH" && query) {
                Url = es;
                end_point = es_end_point;

                dataRequest = {
                    method: "POST",
                    path: "/_sql",
                    data: {
                        query,
                    },
                };
            } else if (sourceType === "POSTGRES" && query) {
                Url = pg;
                end_point = `${pg_end_point}&mode=formData`;

                dataRequest = {
                    tenant_id: tenantId,
                    datasource: sourceName,
                    query: query,
                };
            } else if (sourceType === "SERVICE_KEY") {
                Url = pg;
                end_point = `?service.key=tenant.data`;

                dataRequest = {
                    tenant_id: tenantId,

                    dataKeys: [
                        {
                            serviceParams: params,
                            dataKey: "data",
                            serviceKey: serviceKey,
                            mode: "formData",
                        },
                    ],
                };
            }
        }
        if (serviceKey !== undefined) {
            axios
                .post(Url + end_point, dataRequest)
                .then(response => {
                    if (response.status === 200) {
                        if (sourceType === "ELASTIC_SEARCH") {
                            let formatData = arrToJson(response.data.data);
                            if (formatData) {
                                let firstObjectForColumn = formatData
                                    ? formatData[0]
                                    : [];
                                setChartData(prev => ({
                                    ...prev,
                                    data: formatData,
                                    columns: firstObjectForColumn,
                                    height: height,
                                    width: width,
                                }));
                            } else {
                                // console.log(`Data is ${formatData}`);
                            }
                        } else if (sourceType === "POSTGRES") {
                            let data = response.data.C_DATA;
                            if (data) {
                                let parseData = data;
                                // let parseData = convertData(data);

                                let firstObjectForColumn = parseData
                                    ? parseData[0]
                                    : [];

                                setChartData(prev => ({
                                    ...prev,
                                    data: parseData,
                                    columns: firstObjectForColumn,
                                    height: height,
                                    width: width,
                                }));
                            } else {
                                // console.log(`Data is ${data}`);
                            }
                        } else if (sourceType === "SERVICE_KEY") {
                            let data = response.data.C_DATA.data;

                            if (data) {
                                let parseData = convertData(data);

                                let firstObjectForColumn = parseData
                                    ? parseData[0]
                                    : [];

                                setChartData(prev => ({
                                    ...prev,
                                    data: parseData,
                                    columns: firstObjectForColumn,
                                    height: height,
                                    width: width,
                                }));
                            } else {
                                // console.log(`data is ${data}`);
                            }
                        }
                        setFlag("Chart Created");
                    } else {
                        console.log(
                            `Either sampl.data does not exists or SQL query returns no result.`,
                        );
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    if (show)
        return (
            <div className="p-2">
                {component &&
                    chartData &&
                    chartData !== undefined &&
                    CreateComponent(
                        component.chartType,
                        component,
                        chartData,
                        setFlag,
                    )}
            </div>
        );
    else return <Messsage message="Charts" />;
}

function CreateComponent(type, data, chartData, setFlag) {
    if (typeof componentList[type] !== "undefined" && data && chartData) {
        return React.createElement(
            componentList[type],
            {
                id: uuidv4(),
                data,
                chartData,
                setFlag,
            },
            "",
        );
    }
    return React.createElement(
        () => (
            <div
                style={{ minHeight: "100px" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="text-muted">
                        {" "}
                        No <span className="text-danger">Chart</span> selected.
                    </p>
                </div>
            </div>
        ),
        { key: type },
    );
}

export default Chart;

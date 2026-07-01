import DesignerContext from "../../../../page-builder/Context/DesignerContext";
import { useState, useContext, useEffect, lazy } from "react";
// import Chart from "./Chart";
const Chart = lazy(() =>
    import("./Chart"),
);
import ChartModal from "./ChartModal";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";

function ChartForm(props) {
    const context = useContext(DesignerContext);
    const [showFields, setShowFields] = useState("");
    const [error, setError] = useState([]);
    const [flag, setFlag] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [input, setInput] = useState({});
    const [edit, setEdit] = useState(false);

    let chartTypes = [
        {
            name: "Line Chart",
            code: "linechart",
        },
        {
            name: "Donut Chart",
            code: "donutchart",
        },
        {
            name: "Pie chart",
            code: "piechart",
        },
        {
            name: "Bar Chart",
            code: "barchart",
        },
        {
            name: "Area Chart",
            code: "areachart",
        },
        {
            name: "Stacked Bar Chart",
            code: "stackedbarchart",
        },
        {
            name: "Horizontal Bar Chart",
            code: "horizontalbarchart",
        },
        {
            name: "Horizontal Stacked Bar Chart",
            code: "horizontalstackedbarchart",
        },
        {
            name: "Card",
            code: "statisticscard",
        },
    ];

    let dataSourceType = [
        // { code: "ELASTIC_SEARCH", name: "Elastic Search" },
        { code: "POSTGRES", name: "SQL" },
        { code: "SERVICE_KEY", name: "API" },
    ];

    useEffect(() => {
        if (edit && context.selectedComponent) {
            let currentComponent = context.selectedComponent;

            let tempData = currentComponent.data;
            setInput(tempData);

            setShowModal(true);
            if (tempData.dataSourceType === "POSTGRES") {
                setShowFields("showPgFields");
            } else if (tempData.dataSourceType === "ELASTIC_SEARCH") {
                setShowFields("showEsFields");
            } else if (tempData.dataSourceType === "SERVICE_KEY") {
                setShowFields("SERVICE_KEY");
            }
            setEdit(false);
        }
    }, [edit]);

    function handleInput(e) {
        let value, name;
        value = e.target.value;
        name = e.target.name;

        if (value === "POSTGRES") {
            setShowFields("showPgFields");
        } else if (value === "ELASTIC_SEARCH") {
            setShowFields("showEsFields");
        } else if (value === "SERVICE_KEY") {
            setShowFields("SERVICE_KEY");
        }
        setInput(pre => ({
            ...pre,
            [name]: value,
        }));
    }

    function handleInputChecked(e) {
        const { name, checked } = e.target;
        setInput({ ...input, [name]: checked });
    }

    function validation() {
        let chartData = { ...input };
        let _error = [];
        const excluded = ["refresh_interval"];
        for (var key in input) {
            if (chartData[key] === "" && !excluded.includes(key)) {
                _error.push(key);
            }
        }

        let serviceParams = _error.indexOf("serviceParams");
        if (serviceParams > -1) {
            _error.splice(serviceParams, 1);
        }

        if (chartData.dataSourceType === "ELASTIC_SEARCH") {
            let serviceKey = _error.indexOf("serviceKey");
            if (serviceKey > -1) {
                _error.splice(serviceKey, 1);
            }

            let index = _error.indexOf("dataSourceName");
            if (index > -1) {
                _error.splice(index, 1);
            }
        }
        if (chartData.dataSourceType === "POSTGRES") {
            let serviceKey = _error.indexOf("serviceKey");
            if (serviceKey > -1) {
                _error.splice(serviceKey, 1);
            }
            let index = _error.indexOf("dataSourceName");
            if (index > -1) {
                _error.splice(index, 1);
            }
        }
        if (chartData.dataSourceType === "SERVICE_KEY") {
            let index = _error.indexOf("dataSourceName");
            if (index > -1) {
                _error.splice(index, 1);
            }
            let indexDataSourceType = _error.indexOf("dataSourceType");
            if (indexDataSourceType > -1) {
                _error.splice(indexDataSourceType, 1);
            }
            let query = _error.indexOf("query");
            if (query > -1) {
                _error.splice(query, 1);
            }
        }
        if (chartData.chartType === "statisticscard") {
            let dataSourceName = _error.indexOf("height");
            if (dataSourceName > -1) {
                _error.splice(dataSourceName, 1);
            }
        }

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function showChatModule(e) {
        if (validation()) {
            e.preventDefault();
            // setShowChart("showChart")
            if (context && context.selectedComponent && context.components) {
                let _components = { ...context.components };

                let currentComponent = context.selectedComponent;

                let tempData = _components[currentComponent.id].data;
                tempData = { ...tempData, ...input };
                _components[currentComponent.id].data = tempData;
                context.setComponents(_components);
                setFlag("get");
                setShowModal(false);
                toastEmitter("Record Saved", true);
                // setPreviousState(tempData)
            }
        }
    }

    function handleEdit() {
        setEdit(true);
    }

    return (
        <div className="chart-form">
            <>
                {!showModal &&
                    props &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <div
                            className="chart-setting-btn"
                            onClick={() => handleEdit()}>
                            <div className="text-muted cursor-pointer">
                                <span className="fa-solid fa-chart-pie icon-space"></span>
                                {props &&
                                props.component &&
                                props.component.data &&
                                props.component.data.title ? (
                                    props.component.data.title
                                ) : (
                                    <>
                                        No{" "}
                                        <span className="text-danger">
                                            chart
                                        </span>{" "}
                                        selected.
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                {props &&
                    props.modeType &&
                    props.mode === props.modeType.readonly && (
                        <div className="chart-setting-btn">
                            <div className="cursor-pointer">
                                <span className="fa-solid fa-chart-pie icon-space"></span>
                                {props &&
                                props.component &&
                                props.component.data &&
                                props.component.data.title ? (
                                    props.component.data.title
                                ) : (
                                    <>
                                        No{" "}
                                        <span className="text-danger">
                                            chart
                                        </span>{" "}
                                        selected.
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                <ChartModal
                    showFields={showFields}
                    error={error}
                    input={input}
                    handleInput={handleInput}
                    chartTypes={chartTypes}
                    dataSourceType={dataSourceType}
                    showChatModule={showChatModule}
                    showModal={showModal}
                    setShowModal={setShowModal}
                    setInput={setInput}
                    handleInputChecked={handleInputChecked}
                />
            </>
            {props &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <Chart
                        component={
                            props.component && props.component.data
                                ? props.component.data
                                : {}
                        }
                        flag={flag}
                        setFlag={setFlag}
                        mode={props.mode}
                        modeType={props.modeType}
                    />
                )}
        </div>
    );
}

export default ChartForm;

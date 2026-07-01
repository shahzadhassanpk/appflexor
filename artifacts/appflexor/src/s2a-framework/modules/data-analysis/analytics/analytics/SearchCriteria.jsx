import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL, ES_URL } from "../../../../Config";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import MeasureColumns from "./MeasureColumns/MeasureColumns";
import { COLUMN_NAMES } from "./COLUMN_NAMES";
import Rows from "./DimRows/Rows";
import update from "immutability-helper";
import { useContext } from "react";
import AnalyticContext from "./AnalyticsContext";

const SearchCriteria = () => {
    const analyticContext = useContext(AnalyticContext);
    const {
        pivotTableDataRequest,
        selectedConfig,
        setSelectedConfig,
        selectedIndex,
        flag,
        setFlag,
        userMeasures,
        setUserMeasures,
        measures,
    } = analyticContext;
    const [select, setSelect] = useState("");

    useEffect(() => {
        if (flag) {
            getData();
            setFlag(false);
        }
    }, [flag]);

    useEffect(() => {
        if (
            checkObject(selectedConfig) &&
            checkObject(selectedConfig.dimensions) &&
            selectedConfig.dimensions.length >= 0 &&
            checkObject(userMeasures) &&
            userMeasures &&
            userMeasures.length >= 0
        ) {
            if (
                selectedConfig.dimensions[0]["selected_option"] &&
                selectedConfig.dimensions[0]["column"]
            ) {
                pivotTableDataRequest(
                    selectedConfig.dimensions,
                    userMeasures,
                    selectedConfig,
                );
            }
        }
    }, [selectedConfig?.dimensions, userMeasures]);

    function checkObject(obj) {
        try {
            for (let key in obj) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return false;
    }

    function getData() {
        let dataRequest = {};
        if (selectedIndex.data_source === "POSTGRES") {
            dataRequest = sqlMultiData();
        } else if (selectedIndex.data_source === "ELASTIC_SEARCH") {
            dataRequest = elasticSearchMultiData();
        }
        let es = ES_URL;
        let pg = API_URL;
        let Url = "";
        let es_end_point = "?service.key=multiKey.data";
        let pg_end_point = "?service.key=analytics.sqlData";
        let end_point = "";
        if (dataRequest !== undefined && JSON.stringify(dataRequest) !== `{}`) {
            // Url = pg;
            // end_point = `${pg_end_point}&datasource=${selectedIndex.data_source_name}`;

            if (selectedIndex.data_source === "ELASTIC_SEARCH") {
                Url = es;
                end_point = es_end_point;
            } else if (selectedIndex.data_source === "POSTGRES") {
                Url = pg;
                end_point = `${pg_end_point}&datasource=${selectedIndex.data_source_name}`;
            }
        }

        axios
            .post(Url + end_point, dataRequest)
            .then(response => {
                if (selectedIndex.data_source === "POSTGRES") {
                    if (response.data.C_STATUS === "SUCCESS") {
                        let tempItems = { ...selectedConfig };
                        tempItems.dimensions.forEach(item => {
                            item.option = response.data.C_DATA[item.dataKey];
                        });

                        for (let i = 0; i < tempItems.dimensions.length; i++) {
                            let dimObject = selectedConfig.dimensions[i];
                            if (typeof dimObject.option !== "string") {
                                dimObject.option.forEach(opt => {
                                    opt.label = opt[dimObject["key"]];
                                    opt.value = opt[dimObject["where_column"]];
                                });
                            } else {
                                dimObject.option = [];
                            }
                        }

                        setSelectedConfig(tempItems);
                    }
                } else if (selectedIndex.data_source === "ELASTIC_SEARCH") {
                    if (response.status === 200) {
                        let obj = {};
                        for (let key in response.data) {
                            obj[key] = formatData(response.data[key]);
                        }

                        let tempItems = { ...selectedConfig };
                        tempItems.dimensions.forEach(item => {
                            item.option = obj[item.dataKey];
                        });

                        for (let i = 0; i < tempItems.dimensions.length; i++) {
                            let dimObject = selectedConfig.dimensions[i];
                            if (typeof dimObject.option !== "string") {
                                dimObject.option.forEach(opt => {
                                    opt.label = opt[dimObject["key"]];
                                    opt.value = opt[dimObject["where_column"]];
                                });
                            } else {
                                dimObject.option = [];
                            }
                        }

                        setSelectedConfig(tempItems);
                    }
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    function formatData(data) {
        const { columns, rows } = data.data;
        let result = [];
        rows.forEach(row => {
            let obj = {};
            columns.forEach((column, colIndex) => {
                obj[column["name"]] = row[colIndex];
            });
            result.push(obj);
        });
        return result;
    }

    function sqlMultiData() {
        var dataRequest = {
            dataKeys: [],
        };
        let obj = {};
        if (
            selectedConfig !== undefined &&
            JSON.stringify(selectedConfig) !== `{}`
        ) {
            selectedConfig.dimensions &&
                selectedConfig.dimensions.length > 0 &&
                selectedConfig.dimensions.forEach(item => {
                    obj = {
                        serviceParams: "",
                        dataKey: `${item.dataKey}`,
                        sql: `${item.serviceKey}`,
                        mode: "lowerCase",
                        // mode: "formData",
                    };
                    dataRequest.dataKeys.push(obj);
                });
        }
        return dataRequest;
    }

    function elasticSearchMultiData() {
        var dataRequest = {
            dataKeys: [],
        };
        if (
            selectedConfig !== undefined &&
            JSON.stringify(selectedConfig) !== `{}`
        ) {
            selectedConfig.dimensions &&
                selectedConfig.dimensions.length > 0 &&
                selectedConfig.dimensions.forEach(item => {
                    let obj = {
                        key: item.dataKey,
                        request: {
                            method: "POST",
                            path: "/_sql",
                            data: {
                                query: item.serviceKey,
                            },
                        },
                    };
                    dataRequest.dataKeys.push(obj);
                });
        }
        return dataRequest;
    }

    function moveCardHandler(dragIndex, hoverIndex, item) {
        const dragItem = selectedConfig[dragIndex];
        if (item.currentColumnName !== "Selected Dimensions") {
            if (dragItem) {
                setSelectedConfig(prevState => {
                    const coppiedStateArray = [...prevState.dimensions];

                    // remove item by "hoverIndex" and put "dragItem" instead
                    const prevItem = coppiedStateArray.splice(
                        hoverIndex,
                        1,
                        dragItem,
                    );

                    // remove item by "dragIndex" and put "prevItem" instead
                    coppiedStateArray.splice(dragIndex, 1, prevItem[0]);
                    return coppiedStateArray;
                });
            }
        } else {
            setSelectedConfig(prev => ({
                ...prev,
                dimensions: update(prev.dimensions, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, prev.dimensions[dragIndex]],
                    ],
                }),
            }));
        }
    }

    function returnItemsForColumn(columnName) {
        return (
            selectedConfig.dimensions &&
            selectedConfig.dimensions.length > 0 &&
            selectedConfig.dimensions
                .filter(item => item.column === columnName)
                .map((item, index) => (
                    <div key={index}>
                        <Rows
                            itemId={item.id}
                            rowItem={item}
                            index={index}
                            setSelectedConfig={setSelectedConfig}
                            moveCardHandler={moveCardHandler}
                            currentColumnName={columnName}
                            items={selectedConfig.dimensions ?? []}
                            option={item.option ?? []}
                            selectedOption={item.selected_option ?? []}
                            handleSelectedOption={handleSelectedOption}
                        />
                    </div>
                ))
        );
    }

    function handleSelectedOption(selectedOption, serviceKey) {
        if ((selectedOption, serviceKey)) {
            let tempArr = [...selectedConfig.dimensions];

            tempArr.forEach((item, i) => {
                if (item.serviceKey === serviceKey) {
                    tempArr[i].selected_option = selectedOption;
                }
            });

            setSelectedConfig(prev => ({
                ...prev,
                dimensions: tempArr,
            }));
        }
    }

    function handleMeasure(selectedMeasure, e) {
        if (JSON.stringify(userMeasures) !== "[]" && userMeasures.length > 0) {
            let tempItems = [...userMeasures];
            if (selectedMeasure === "selectedAll") {
                tempItems.forEach(item => {
                    item.selected = true;
                });
            } else if (selectedMeasure === "deSelectAll") {
                tempItems.forEach(item => {
                    item.selected = false;
                });
            } else {
                if (selectedMeasure.selected === true) {
                    selectedMeasure.selected = false;
                } else {
                    selectedMeasure.selected = true;
                }
            }
            setUserMeasures(tempItems);
        }
    }

    return (
        <div className="row search-criteria s2a-search-criteria">
            <DndProvider backend={HTML5Backend}>
                <DimColumns
                    moveItems={selectedConfig?.dimensions}
                    title={COLUMN_NAMES.Search_Criteria}>
                    <div className="analytic-scroll">
                        {returnItemsForColumn(COLUMN_NAMES.Search_Criteria)}
                    </div>
                </DimColumns>
                <DimColumns
                    moveItems={selectedConfig?.dimensions}
                    title={COLUMN_NAMES.Rows}>
                    <div className="analytic-scroll">
                        {returnItemsForColumn(COLUMN_NAMES.Rows)}
                    </div>
                </DimColumns>
                <MeasureColumns
                    title={COLUMN_NAMES.Measures}
                    handleMeasure={handleMeasure}
                    userMeasures={userMeasures ? userMeasures : []}
                    // measures={userMeasures}
                    measures={measures}
                    setUserMeasures={setUserMeasures}
                    setSelect={setSelect}
                    select={select}></MeasureColumns>
            </DndProvider>
        </div>
    );
};

export default SearchCriteria;

function DimColumns({ children, title, selected, total }) {
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: "Our first type",
        drop: () => ({ name: title }),
        collect: monitor => ({
            isOver: monitor.isOver(),
        }),
        // Override monitor.canDrop() function
    });

    return (
        <>
            <div
                ref={drop}
                className="col-sm-4 pe-0">
                <div className="heading measure-heading">
                    <span className="">
                        {" "}
                        <i className="fa-brands fa-uncharted horizontal-nav-icons"></i>
                        {title}
                    </span>
                </div>
                <div className="s2a-border p-2">{children}</div>
            </div>
        </>
    );
}

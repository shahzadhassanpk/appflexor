import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL, ES_URL } from "../../../../Config";
import Modalbox from "../../../../components/Modal/Modal";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { showMessage } from "../../../../utils/utils";
import Listing from "./Listing";
import SearchCriteria from "./SearchCriteria";
import TableView from "./TableView";
import AnalyticContext from "./AnalyticsContext";
import { useContext } from "react";
import { getData, getSelectedItem } from "../../../../components/CrudApiCall";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import ReactSelect from "react-select";

export default function Analytics(props) {
    const { mode, modeType, activeTab = undefined } = props;
    let initialState = {
        id: "new",
        title: "",
        setting: {},
        index: "",
    };
    const [show, setShow] = useState(false);
    const [indexData, setIndexData] = useState([]);
    const [dataRequest, setDataRequest] = useState({});
    const [configObj, setConfigObj] = useState({});
    const [indexes, setIndexes] = useState([]);
    const [saveSetting, setSaveSetting] = useState(initialState);
    const [userSettingList, setUserSettingList] = useState([]);
    const [filterUserSettingList, setFilterUserSettingList] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState({});
    const [selectedIndex, setSelectedIndex] = useState({});
    const [selectedIndexId, setSelectedIndexid] = useState("");
    const [flag, setFlag] = useState(false);
    const [showBtns, setShowBtn] = useState(false);
    const [showOnAddOrEdit, setShowOnAddOrEdit] = useState(false);
    const [error, setError] = useState([]);
    const [selectedQueryName, setSelectedQueryName] = useState("");
    const [selectedQueryId, setSelectedQueryId] = useState("");
    const [showIndexList, setShowIndexList] = useState(true);
    const [showModal, setShowModal] = useState({
        show: false,
        item: {},
    });

    const [userMeasures, setUserMeasures] = useState([]);
    const [staticMeasures, setStaticMeasures] = useState([]);
    const [runTimeMeasures, setRunTimeMeasures] = useState([]);
    const inputReference = useRef(null);
    const settingConfig = useRef(null);
    const runTimeMeasureRef = useRef(null);
    const analyticConfig = useRef(null);
    const selectedIndexRef = useRef(null);
    const renderMode = mode !== modeType.design;

    // for tab effects

    useEffect(() => {
        if (activeTab) {
            getSaveSetting("FIRST_RENDER");
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            runTimeMeasures &&
            runTimeMeasures.length > 0 &&
            activeTab &&
            renderMode
        ) {
            getData({ ...selectedConfig, measures: runTimeMeasures });
        }
    }, [runTimeMeasures]);

    useEffect(() => {
        if (selectedIndexId !== "" && activeTab && renderMode) {
            getSelectedIndex();
        }
    }, [selectedIndexId]);

    // for page effects

    useEffect(() => {
        if (props?.component?.data?.index?.value && renderMode) {
            setShowOnAddOrEdit(true);
            setSelectedIndexid(props?.component?.data?.index?.value);
        }
    }, [props?.component?.data?.index?.value]);

    useEffect(() => {
        if (props?.component?.data?.query?.value && renderMode) {
            setSelectedQueryId(props?.component?.data?.query?.value);
        }
    }, [props?.component?.data?.query?.value]);

    useEffect(() => {
        if (selectedIndexId !== "" && renderMode) {
            getSelectedIndex();
        }
    }, [selectedIndexId]);

    useEffect(() => {
        if (selectedQueryId && selectedIndexRef?.current && flag && renderMode)
            handleEdit({ id: selectedQueryId });
    }, [selectedQueryId, selectedIndexRef?.current]);

    // both

    useEffect(() => {
        if (error && JSON.stringify(error) !== "[]" && renderMode) {
            if (error.indexOf("title") !== -1) {
                toastEmitter("Title Required", true, "warning");
            }
            if (error.indexOf("setting") !== -1) {
                toastEmitter("Drag Atleast One Dimension", true, "warning");
            }
            if (error.indexOf("measure") !== -1) {
                toastEmitter("Select Atleast One Measure", true, "warning");
            }
            if (error.indexOf("saveDimError") !== -1) {
                toastEmitter("Create Dimension First", true, "warning");
            }
            if (error.indexOf("saveMeasureError") !== -1) {
                toastEmitter("Create Measure First", true, "warning");
            }
        }
    }, [error]);

    async function getSelectedIndex() {
        const res = await getSelectedItem({
            id: selectedIndexId,
            serviceKey: "sys.selected.index",
        });
        const index = res.data.C_DATA[selectedIndexId][0];
        try {
            let parseConfig = JSON.parse(index.config);
            parseConfig.index = index.name;
            index.config = parseConfig;
            setSelectedConfig(parseConfig);

            setSelectedIndex(index);
            selectedIndexRef.current = index;
            setStaticMeasures(index.config.measures);
            const updatedFlag = true;
            if (flag !== updatedFlag) setFlag(updatedFlag);
            if (!activeTab) {
                setShow(true);
                settingConfig.current = parseConfig;
            }
        } catch (error) {
            console.log(error);
        }
    }

    function handleSearch(event) {
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }

        let filterListByChannel = userSettingList?.filter(
            item => item.index_id === selectedIndexId,
        );
        if (value) {
            setFilterUserSettingList(
                filterListByChannel.filter(item =>
                    item?.title.toLowerCase().includes(value),
                ),
            );
        } else {
            setFilterUserSettingList(filterListByChannel);
        }
    }

    function pivotTableDataRequest(
        dimensions = [],
        measures = [],
        config = {},
        index = selectedIndex,
    ) {
        let columnsStr = "";
        let dimensionsColumnRows = [];

        dimensions.forEach(dim => {
            if (dim.column === "Selected Dimensions") {
                dimensionsColumnRows.push(dim);
            }
        });

        let LENGTH = 0;
        dimensionsColumnRows.forEach((item, index) => {
            if (item.column === "Selected Dimensions") {
                if (index === 0) {
                    columnsStr = item.selectedColumn;
                    LENGTH++;
                } else {
                    columnsStr = columnsStr + "," + item.selectedColumn;
                    LENGTH++;
                }
            }
        });

        let firstChar = columnsStr.charAt(0);
        if (firstChar === ",") {
            columnsStr = columnsStr.replace(",", "");
        }
        let checkCondition = "";
        let OPTIONS = {
            _selected: 0,
            total: 0,
        };
        dimensionsColumnRows.forEach(dim => {
            if (dim.column === "Selected Dimensions") {
                dim.where = "";
                dim.condition = [];
                let length = dim.selected_option.length;
                OPTIONS._selected = length;
                OPTIONS.total = dim.option.length;

                if (dim.selected_option) {
                    checkObject(dim.selected_option) &&
                        dim.selected_option.forEach(option => {
                            dim.where = `${dim.where_column} in `;
                            dim.condition.push(`'${option["value"]}'`);
                            checkCondition += `'${option["value"]}',`;
                        });
                }
            }
        });
        let method = "";
        measures &&
            measures.forEach(measure => {
                if (
                    measure.selected === true &&
                    measure.method !== undefined &&
                    measure.method !== ""
                ) {
                    if (measures) {
                        method += "," + measure["formula"].replaceAll("\n", "");
                    }
                }
            });

        let finalCondition = "";
        let request = {};
        if (index.data_source === "ELASTIC_SEARCH") {
            //sql to es
            if (checkCondition !== "" && LENGTH > 1) {
                dimensionsColumnRows &&
                    dimensionsColumnRows.forEach((item, index) => {
                        if (
                            dimensionsColumnRows &&
                            dimensionsColumnRows.length > 0 &&
                            item.condition &&
                            item.condition.length > 0
                        ) {
                            if (index === 0) {
                                finalCondition += `${
                                    item.where
                                } (${item.condition.join(",")})`;
                            } else if (
                                index !==
                                dimensionsColumnRows.length - 1
                            ) {
                                finalCondition += `and ${
                                    item.where
                                } (${item.condition.join(",")})`;
                            } else {
                                finalCondition += `and ${
                                    item.where
                                } (${item.condition.join(",")})`;
                            }
                            request = {
                                method: "POST",
                                path: "/_sql",
                                data: {
                                    query: `select ${columnsStr} ${method} from ${config.index} where ${finalCondition} group by ${columnsStr} order by ${columnsStr}`,
                                },
                            };
                        }
                    });
            } else {
                if (method !== "") {
                    request = {
                        method: "POST",
                        path: "/_sql",
                        data: {
                            query: `select ${columnsStr} ${method} from ${config.index} group by ${columnsStr} order by ${columnsStr}`,
                        },
                    };
                } else {
                    request = {
                        method: "POST",
                        path: "/_sql",
                        data: {
                            query: `select ${columnsStr} ${method} from ${config.index} group by ${columnsStr} order by ${columnsStr}`,
                        },
                    };
                }
            }
        } else if (index.data_source === "POSTGRES") {
            //condition apply their
            if (checkCondition !== "" && LENGTH > 1) {
                dimensionsColumnRows &&
                    dimensionsColumnRows.forEach((item, index) => {
                        if (
                            dimensionsColumnRows &&
                            dimensionsColumnRows.length > 0 &&
                            item.condition &&
                            item.condition.length > 0
                        ) {
                            if (index === 0) {
                                finalCondition += `${
                                    item.where
                                } (${item.condition.join(",")})`;
                            } else if (
                                index !==
                                dimensionsColumnRows.length - 1
                            ) {
                                finalCondition += `and ${
                                    item.where
                                } (${item.condition.join(",")})`;
                            } else {
                                finalCondition += `and ${
                                    item.where
                                } (${item.condition.join(",")})`;
                            }
                            request = {
                                query: `select ${columnsStr} ${method} from ${config.index} where ${finalCondition} group by ${columnsStr} order by ${columnsStr}`,
                            };
                        }
                    });
            } else {
                if (method !== "") {
                    request = {
                        query: `select ${columnsStr} ${method} from ${config.index}  group by ${columnsStr} order by ${columnsStr}`,
                    };
                } else {
                    request = {
                        query: `select ${columnsStr} from ${config.index}  group by ${columnsStr} order by ${columnsStr}`,
                    };
                }
            }
        }

        setDataRequest(request);
        setConfigObj(config);
        return request;
    }

    function getData(
        setting = selectedIndexRef.current
            ? { ...selectedIndexRef.current.config, measures: userMeasures }
            : selectedConfig,
        condition,
        index = selectedIndex,
    ) {
        let valid = selectedItemValid(setting);
        let request = {};
        if (valid) {
            const runtimeRequest = pivotTableDataRequest(
                setting?.dimensions
                    ? setting?.dimensions
                    : configObj?.dimensions,
                setting?.measures ? setting?.measures : userMeasures,
                setting ? setting : selectedConfig,
                index,
            );
            let es = ES_URL;
            let pg = API_URL;
            let Url = "";
            let es_end_point = "?service.key=data";
            let pg_end_point = "?service.key=analytics.sqlData";
            // let pg_end_point = "?service.key=bi.data&source";
            let end_point = "";
            if (
                (dataRequest !== undefined &&
                    JSON.stringify(dataRequest) !== "{}") ||
                condition
            ) {
                if (index.data_source === "ELASTIC_SEARCH") {
                    Url = es;
                    end_point = es_end_point;
                    request = dataRequest;
                } else if (index.data_source === "POSTGRES") {
                    Url = pg;
                    end_point = `${pg_end_point}&datasource=${index.data_source_name}`;
                    const query = runtimeRequest.query
                        ? runtimeRequest.query
                        : dataRequest.query;
                    request = {
                        dataKeys: [
                            {
                                serviceParams: "",
                                dataKey: "data",
                                sql: query,
                                mode: "lowerCase",
                            },
                        ],
                    };
                }

                if (checkObject(request))
                    axios
                        .post(Url + end_point, request)
                        .then(response => {
                            if (response.status === 200) {
                                if (index.data_source === "ELASTIC_SEARCH") {
                                    if (
                                        JSON.stringify(response.data) !==
                                            `{}` &&
                                        response.data !== undefined &&
                                        response.data !== ""
                                    ) {
                                        let data = arrToJson(
                                            response.data.data,
                                        );
                                        setIndexData(data);
                                        setShow(false);
                                        setShowBtn(true);
                                    } else {
                                        toastEmitter(
                                            "API response data null from Elastic Search",
                                            true,
                                            "warning",
                                        );
                                        showMessage("es response null", true);
                                    }
                                } else if (index.data_source === "POSTGRES") {
                                    if (
                                        response.data !== "" &&
                                        response.data !== undefined &&
                                        response.data.C_DATA !== null &&
                                        response.data.C_STATUS !== "FAIL" &&
                                        JSON.stringify(response.data.C_DATA) !==
                                            "[]" &&
                                        JSON.stringify(
                                            response.data.C_DATA.data,
                                        ) !== "[]"
                                    ) {
                                        let data = response.data.C_DATA.data;
                                        if (typeof data === "string") {
                                            toastEmitter(
                                                "Invalid selection, Data does not exist",
                                                true,
                                                "warning",
                                            );
                                        } else {
                                            setIndexData(data);
                                            setShow(false);
                                            setShowBtn(true);
                                        }
                                    } else {
                                        toastEmitter(
                                            `Invalid selection, Data does not exist | table:${configObj.index}`,
                                            true,
                                            "warning",
                                        );
                                    }
                                }
                            } else {
                                toastEmitter(
                                    "data not retrieved",
                                    true,
                                    "warning",
                                );
                            }
                            // getProfile()
                        })
                        .catch(error => {
                            console.log(error);
                        });
            }
        }
    }

    function selectedItemValid(setting) {
        let _error = [];
        let selectedItem = { ...setting };

        if (checkObject(selectedItem)) {
            try {
                let dimError = selectedItem.dimensions.every(
                    item => item.column === "Available Dimensions",
                );
                let measureError = selectedItem.measures.every(
                    item => item.selected === false,
                );

                dimError && _error.push("setting");
                measureError && _error.push("measure");
            } catch (error) {
                console.log(error);
            }
        } else {
            _error.push("setting");
            _error.push("measure");
        }

        if (_error && _error.length > 0) {
            setError(_error);
            return false;
        } else {
            return true;
        }
    }

    function deleteData(item, condition) {
        if (condition === undefined) {
            setShowModal(prev => ({
                ...prev,
                show: true,
                item: item,
            }));
        }
        if (condition === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "analytic_query";
            entityForm.entity = "analytic_query";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        getSaveSetting();
                        setShowModal(prev => ({
                            ...prev,
                            show: false,
                            item: {},
                        }));
                        addNew();
                        toastEmitter("Record Deleted", true, "success");
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
        }
    }

    function getSaveSetting(condition) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "analyticQuery",
                    serviceKey: "sys.analytic.query",
                    mode: "formData",
                },
            ],
        };
        if (condition === "FIRST_RENDER") {
            dataRequest.dataKeys.push({
                serviceParams: "",
                dataKey: "index",
                serviceKey: "sys.index",
                mode: "formData",
            });
        }

        return new Promise(resolve => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    resolve(response);
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.analyticQuery) {
                            let data = response.data.C_DATA.analyticQuery;
                            setUserSettingList(data);
                        } else {
                            console.log(
                                `Either dir.group does not exists or SQL query returns no result.`,
                            );
                        }
                        if (response.data.C_DATA.index) {
                            setIndexes(response.data.C_DATA.index);
                        }
                        if (
                            selectedIndexId &&
                            checkObject(response.data.C_DATA.analyticQuery)
                        ) {
                            let data = [];
                            data = response.data.C_DATA.analyticQuery.filter(
                                item => item.index_id === selectedIndexId,
                            );
                            setFilterUserSettingList(data);
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
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

    function handleSaveSetting(condition) {
        if (validate()) {
            let _configObj = { ...selectedConfig, measures: userMeasures };

            // _configObj.measures = userMeasures;
            let _config = saveIdsOnly(_configObj);
            let setting = structuredClone(_config);
            let config = {};
            config["id"] = saveSetting.id;
            config["title"] = saveSetting.title;
            config["index_id"] = selectedIndexId;
            config["setting"] = setting;
            setSelectedQueryName(config["title"]);

            if (config.setting !== "") {
                var url = API_URL + "?service.key=update.formData";
                var request = {};
                request.data = [];
                var entityForm = {};

                entityForm.formId = "analytic_query"; //"formid"
                entityForm.entity = "analytic_query"; //Db- "table name"
                entityForm.action = "update";
                if (
                    config.id == "new" ||
                    config.id == undefined ||
                    config.id == ""
                ) {
                    entityForm.id = "new";
                    config.id = "new";
                } else {
                    config.id = config.id;
                    entityForm.id = config.id;
                }

                entityForm.formData = config;
                request.data.push(entityForm);

                try {
                    axios.post(url, request).then(function (response) {
                        if (response.status === 200) {
                            if (
                                saveSetting.id === "new" ||
                                saveSetting.id === ""
                            ) {
                                setSaveSetting(prev => ({
                                    ...prev,
                                    id: response.data.C_DATA[0].formData.id,
                                }));
                            }
                            if (condition === "run") {
                                setRunTimeMeasures(
                                    response.data.C_DATA[0].formData.setting
                                        .measures,
                                );
                                runTimeMeasureRef.current =
                                    response.data.C_DATA[0].formData.setting.measures;
                            }
                            getSaveSetting();
                            toastEmitter("Record Saved", true, "success");
                        }
                    });
                } catch (e) {
                    console.log("saveGig error:" + e);
                }
            } else {
                window.confirm("Please enter the setting");
            }
        }
    }

    const saveIdsOnly = obj => {
        const _obj = { ...obj };
        const dimensions = [];
        _obj.dimensions.forEach(dimension => {
            const obj = {
                id: dimension.id,
                column: dimension.column,
                selected_option: dimension.selected_option,
            };
            dimensions.push(obj);
        });

        return { ..._obj, dimensions };
    };

    function validate() {
        let _saveSetting = structuredClone(saveSetting);
        let notRequired = ["id", "index", "setting"];
        let _error = [];
        const configObj = selectedConfig;
        _saveSetting.setting = configObj;
        if (checkObject(configObj)) {
            let dim = configObj.dimensions.length;
            let measures = configObj.measures.length;

            dim === -1 && _error.push("saveDimError");
            measures === -1 && _error.push("saveMeasureError");
        } else {
            _error.push("saveDimError");
            _error.push("saveMeasureError");
        }
        try {
            for (let key in _saveSetting) {
                if (!notRequired.includes(key) && _saveSetting[key] === "") {
                    _error.push(key);
                }
            }

            setError(_error);
        } catch (error) {
            console.log(error);
        }

        if (_error && _error.length) {
            return false;
        } else {
            return true;
        }
    }

    function checkObject(object) {
        try {
            for (let key in object) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return false;
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

    function jsonToCsv() {
        if (indexData !== undefined && indexData.length > 0) {
            const measures = userMeasures;
            const userDefHeaders = Object.keys(indexData[0]);
            const queryFetchHeaders = Object.keys(indexData[0]);

            const rowItems = indexData.map(row =>
                queryFetchHeaders
                    .map(fieldName =>
                        JSON.stringify(row[fieldName] ? row[fieldName] : ""),
                    )
                    .join(","),
            );

            // join header and body, and break into separate lines
            const csv = [userDefHeaders, ...rowItems].join("\r\n");
            // const csv = [headerString, ...rowItems].join("\r\n");

            //Generate a file name
            let queryName =
                selectedQueryName !== ""
                    ? selectedQueryName.toLowerCase()
                    : "query";

            var fileName = queryName + "_analytics" + "_" + formatDate();
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

    function handleConfigChange(e, id) {
        // getSaveSetting();
        let indexId = id ? id : e.target.value;
        setSelectedQueryName("");
        setShow(true);
        setShowBtn(false);
        if (indexId === "") {
            setSelectedIndexid("");
            setSelectedConfig({});
            setSaveSetting(initialState);
            setConfigObj({});
            setIndexData([]);
        } else {
            setConfigObj({});
            setIndexData([]);
            setSelectedIndexid(indexId);
            setSaveSetting(prev => ({
                ...prev,
                title: "",
                index: indexId,
                id: "",
            }));
            let data = [];
            data = userSettingList.filter(item => item.index_id === indexId);
            setFilterUserSettingList(data);
        }
        setShowOnAddOrEdit(false);
    }

    function tryToParse(selectedSetting) {
        try {
            if (selectedSetting && typeof selectedSetting === "string") {
                return JSON.parse(selectedSetting);
            } else {
                return selectedSetting;
            }
        } catch (error) {
            console.log(error);
        }
    }

    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSaveSetting(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleEdit(selectedSetting) {
        const selectedQuery = await getSelectedItem({
            id: selectedSetting.id,
            serviceKey: "sys.selected.analytic.query",
        });

        const item = selectedQuery.data.C_DATA[selectedSetting.id][0];
        const itemSetting = tryToParse(item.setting);
        setSelectedQueryName(item && item.title);

        if (checkObject(item.setting)) {
            item.setting =
                typeof item.setting === "string"
                    ? JSON.parse(item.setting)
                    : item.setting;
            const { setting, index } = await updateDimAnMeasureOnEdit(item);
            setting.measures = tryToParse(itemSetting.measures);
            selectedIndexRef.current.config = setting;
            getData(setting, true, index);
            setShow(true);
            setShowBtn(false);
        }
        setShowOnAddOrEdit(true);
    }

    const updateDimAnMeasureOnEdit = async selectSetting => {
        settingConfig.current = { ...selectSetting.setting };
        selectSetting.setting = parseOnly(selectSetting.setting);
        let updatedSetting;

        // const res = await getSelectedItem({
        //     id: selectSetting.index_id,
        //     serviceKey: "sys.selected.index",
        // });
        // updatedSetting = res.data.C_DATA[selectSetting.index_id][0];
        updatedSetting = selectedIndexRef.current;

        updatedSetting.config = parseOnly(
            updatedSetting.config
                ? updatedSetting.config
                : updatedSetting.setting,
        );
        try {
            if (selectSetting && selectSetting !== "{}") {
                selectSetting.setting.dimensions = reducedDim(
                    updatedSetting.config,
                    selectSetting.setting,
                );
                selectSetting.setting.measures = reducedMeasure(
                    updatedSetting.config,
                    selectSetting.setting,
                );
                // selectSetting[0].setting.index = selectSetting[0].name;
                setUserMeasures(selectSetting.setting.measures);
                selectSetting.setting.measures = updatedSetting.config.measures;
                setSelectedConfig(selectSetting.setting);
                setSaveSetting(prev => ({
                    ...prev,
                    id: selectSetting.id,
                    title: selectSetting.title,
                }));
                const updatedFlag = true;
                if (flag !== updatedFlag) setFlag(updatedFlag);
                return {
                    setting: selectSetting.setting,
                    index: updatedSetting,
                };
            } else {
            }
        } catch (error) {
            console.log(error);
        }
    };

    const reducedDim = (updatedConfig, selectSetting) => {
        let updated = {};
        let old = {};
        let unique = {};

        if (updatedConfig && selectSetting) {
            updatedConfig["dimensions"].forEach(item => {
                updated[item.id] = item;
            });
            selectSetting["dimensions"].forEach(item => {
                old[item.id] = item;
            });
            for (let key in updated) {
                if (old[key]) {
                    unique[key] = { ...updated[key], ...old[key] };
                } else {
                    unique[key] = { ...updated[key] };
                }
            }
        }
        return Object.values(unique);
    };
    const reducedMeasure = (updatedConfig, selectSetting) => {
        let updated = {};
        let old = {};
        let unique = {};

        if (updatedConfig && selectSetting) {
            updatedConfig["measures"].forEach(item => {
                updated[item.label] = item;
            });
            selectSetting["measures"].forEach(item => {
                old[item.label] = item;
            });
            for (let key in old) {
                unique[key] = { ...updated[key], ...old[key] };
            }
        }
        return Object.values(unique);
    };

    const parseOnly = item => {
        return typeof item === "string" && item !== ""
            ? JSON.parse(item)
            : item;
    };

    async function addNew() {
        await getSaveSetting("FIRST_RENDER");
        setSaveSetting(initialState);
        setSelectedQueryName("");
        const res = await getSelectedItem({
            id: selectedIndexId,
            serviceKey: "sys.selected.index",
        });
        const index = res.data.C_DATA[selectedIndexId][0];
        resetToInitialState(index);
    }

    const resetToInitialState = index => {
        try {
            const dimensions = [];
            const measures = [];
            const _index = structuredClone(index);

            if (_index && _index.config.length > 0) {
                _index.config = tryToParse(_index.config);

                selectedConfig.dimensions.forEach(item => {
                    _index.config.dimensions.forEach(item2 => {
                        if (item.id === item2.id) {
                            item2.option = item.option;
                        }
                    });
                });

                _index.config.dimensions.forEach(item => {
                    item.column = "Available Dimensions";
                    item.selected_option = [];
                    dimensions.push(item);
                });

                _index.config.measures.forEach(item => {
                    item.selected = false;
                    measures.push(item);
                });

                _index.config.index = index.name;
                _index.config.dimensions = dimensions;
                _index.config.measures = measures;

                setSelectedConfig(_index.config);
                selectedIndexRef.current = _index;
            }
        } catch (error) {
            console.log(error);
        }
    };

    function showDimsAddNew() {
        setShow(true);
        setShowBtn(false);
        setShowOnAddOrEdit(true);
        setUserMeasures([]);
        addNew();
    }

    function switchToQuery() {
        setShow(true);
        setFlag(true);
        setShowBtn(false);
    }

    function Message(message) {
        return (
            <div className="col task-view-panel">
                <div className="no-task-border">
                    <div className="no-task-wrap">
                        <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                        <span className="no-task-text">{message}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AnalyticContext.Provider
            value={{
                userSettingList: filterUserSettingList,
                handleEdit: handleEdit,
                deleteData: deleteData,
                selectedConfig: selectedIndexRef?.current?.config,
                // selectedConfig,
                saveSetting,
                selectedIndexId: selectedIndexId,
                handleSearch: handleSearch,
                inputReference: inputReference,
                showDimsAddNew: showDimsAddNew,
                indexes,
                setShowIndexList,
                showIndexList,
                Data: indexData,
                config: configObj,
                showBtns: showBtns,
                pivotTableDataRequest,
                setSelectedConfig,
                selectedIndex: selectedIndexRef?.current,
                // selectedIndex,
                measures: selectedConfig?.measures,
                staticMeasures,
                flag,
                setFlag,
                handleConfigChange,
                userMeasures,
                setUserMeasures,
                handleSaveSetting,
                runTimeMeasures,
                dataRequest,
                jsonToCsv,
                switchToQuery,
                handleInputField,
            }}>
            <ChildrenModal
                ref={analyticConfig}
                header="Analytics">
                <AnalyticForm
                    setProps={props?.setComponentPropsData}
                    component={props?.component}
                    close={analyticConfig?.current?.close}
                />
            </ChildrenModal>
            <div className="s2a-analytics analytics container-fluid react-table-style p-0">
                <Modalbox
                    header="Confirm"
                    state={showModal}
                    message={`Are you sure to delete ${showModal.item.title}?`}
                    operation={deleteData}
                    setState={setShowModal}
                />
                {mode &&
                    modeType &&
                    (mode === modeType.readonly ||
                        mode === modeType.design) && (
                        <div
                            className="title"
                            onClick={() => analyticConfig?.current?.show()}>
                            <center>
                                <span className="cursor-pointer">
                                    <span className="fa-solid fa-chart-column icon-space"></span>
                                    Analytics added successfully
                                </span>
                            </center>
                        </div>
                    )}

                {mode &&
                    modeType &&
                    (mode === modeType.render || mode === modeType.preview) && (
                        <>
                            <div className="row m-0">
                                <>
                                    {showIndexList && activeTab && (
                                        <>
                                            <div className="col-sm-2 listing">
                                                <SelectOrAdd />
                                            </div>
                                            {selectedIndexId !== "" && (
                                                <div className="col-sm-2 listing">
                                                    <Listing />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {selectedIndexId === "" &&
                                        Message(
                                            "Select a Data Set form the list.",
                                        )}
                                    {selectedIndexId !== "" &&
                                        showOnAddOrEdit && (
                                            <div
                                                className={
                                                    activeTab
                                                        ? showIndexList ===
                                                          false
                                                            ? "col-sm-12 form-background"
                                                            : "col-sm-8"
                                                        : "col-sm-12"
                                                }>
                                                <div className="analytic-setting">
                                                    <div style={{margin:"auto"}}>
                                                        {activeTab && (
                                                            <span>
                                                                {showIndexList ? (
                                                                    <span
                                                                        title="hide index or quries"
                                                                        onClick={() =>
                                                                            setShowIndexList(
                                                                                false,
                                                                            )
                                                                        }>
                                                                        <i
                                                                            className="fa-solid fa-align-left me-2"
                                                                            title="Maximize / Minimize"></i>
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        title="show index or quries"
                                                                        onClick={() =>
                                                                            setShowIndexList(
                                                                                true,
                                                                            )
                                                                        }>
                                                                        <i className="fa-solid fa-align-left me-2"></i>
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {!showBtns ? (
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="title"
                                                                value={
                                                                    saveSetting.title
                                                                }
                                                                onChange={e =>
                                                                    handleInputField(
                                                                        e,
                                                                    )
                                                                }
                                                                disabled={
                                                                    selectedIndexId !==
                                                                    ""
                                                                        ? false
                                                                        : true
                                                                }
                                                                title={
                                                                    selectedIndexId !==
                                                                    ""
                                                                        ? ""
                                                                        : "Selected Index First"
                                                                }
                                                                placeholder="Query Title"
                                                            />
                                                        ) : (
                                                            <label>{saveSetting.title}</label>
                                                        )}
                                                    </div>

                                                    <div className="btn-actions">
                                                        {showBtns === false && (
                                                            <>
                                                                <span
                                                                    className="m-2"
                                                                    onClick={() =>
                                                                        getData()
                                                                    }
                                                                    disabled={
                                                                        selectedIndexId !==
                                                                        ""
                                                                            ? false
                                                                            : true
                                                                    }
                                                                    title="Run Settings">
                                                                    <i className="fa-solid fa-play"></i>
                                                                </span>
                                                                <span
                                                                    className="m-2"
                                                                    onClick={() =>
                                                                        handleSaveSetting(
                                                                            "save",
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        selectedIndexId !==
                                                                        ""
                                                                            ? false
                                                                            : true
                                                                    }
                                                                    title="Save Settings">
                                                                    <i className="fa-solid fa-floppy-disk mx-1"></i>
                                                                </span>
                                                            </>
                                                        )}
                                                        {showBtns &&
                                                            (indexData &&
                                                            indexData.length >
                                                                0 ? (
                                                                <>
                                                                    <span
                                                                        className="m-2"
                                                                        onClick={() =>
                                                                            getData()
                                                                        }
                                                                        disabled={
                                                                            selectedIndexId !==
                                                                            ""
                                                                                ? false
                                                                                : true
                                                                        }
                                                                        title="Refresh Data">
                                                                        <i className="fa-solid fa-arrows-rotate"></i>
                                                                    </span>
                                                                    <span
                                                                        type="button"
                                                                        className="m-2"
                                                                        onClick={() =>
                                                                            jsonToCsv()
                                                                        }
                                                                        title="Export excel">
                                                                        <i className="fa-solid fa-file-export"></i>
                                                                    </span>
                                                                    <span
                                                                        type="button"
                                                                        className="m-2"
                                                                        onClick={() =>
                                                                            switchToQuery()
                                                                        }
                                                                        title="Design Query">
                                                                        <i className="fa-solid fa-pencil"></i>
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span
                                                                        type="button"
                                                                        className="m-2 opacity-50"
                                                                        onClick={() =>
                                                                            jsonToCsv()
                                                                        }
                                                                        title="No Record Found">
                                                                        <i className="fa-solid fa-file-export"></i>
                                                                    </span>
                                                                    <span
                                                                        className=""
                                                                        onClick={() =>
                                                                            switchToQuery()
                                                                        }
                                                                        title="Design Query">
                                                                        <i className="fa-solid fa-gear"></i>
                                                                    </span>
                                                                </>
                                                            ))}
                                                    </div>
                                                </div>
                                                {show === false ? (
                                                    <TableView />
                                                ) : (
                                                    <SearchCriteria />
                                                )}
                                            </div>
                                        )}
                                    {selectedIndexId !== "" &&
                                        showOnAddOrEdit === false &&
                                        Message("Add new or select Query")}
                                </>
                            </div>
                        </>
                    )}
            </div>
        </AnalyticContext.Provider>
    );
}

function SelectOrAdd() {
    const analyticContext = useContext(AnalyticContext);
    const { handleConfigChange, indexes, selectedIndexId } = analyticContext;
    return (
        <div className="row select-add">
            <div className="list-header">
                <label className="">
                    <i className="fa fa-cubes"></i> Data Cubes
                </label>
            </div>
            <ul className="list-group enable-scroll">
                {indexes.map(index => {
                    return (
                        <li
                            key={index.id}
                            className={
                                index.id === selectedIndexId
                                    ? "list-group-item active-item"
                                    : "list-group-item mb-1 mt-1"
                            }
                            onClick={() => handleConfigChange(null, index.id)}>
                            <i className="fa fa-cube"></i>
                            {index.title}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function AnalyticForm(props) {
    const { setProps, component, close } = props;
    const [indexes, setIndexes] = useState([]);
    const [queries, setQueries] = useState([]);
    const [input, setInput] = useState({
        index: {},
        query: {},
    });

    useEffect(() => {
        getIndexes();
        setInput(component?.data);
    }, []);

    useEffect(() => {
        if (input?.index?.value) {
            getQueries({ value: input?.index?.value });
        }
    }, [input?.index?.value]);

    async function getIndexes() {
        const keys = [{ serviceKey: "sys.index" }];
        const res = await getData({ keys });
        const status = res.data.C_STATUS;

        if (status === "SUCCESS") {
            const data = res.data.C_DATA[0];
            const updatedData = data.map(item => {
                return {
                    label: item.title,
                    value: item.id,
                };
            });
            setIndexes(updatedData);
        }
    }

    const handleChange = (item, name) => {
        setInput({
            ...input,
            [name]: item,
        });

        if (name == "index") {
            setInput(prev => ({
                ...prev,
                query: {},
            }));
        }
    };

    async function getQueries(item) {
        const res = await getData({
            keys: [
                {
                    params: item.value,
                    serviceKey: "sys.selected.index.queries",
                },
            ],
        });
        const queries = res.data.C_DATA[0];
        const updatedData = queries.map(query => {
            return {
                label: query.title,
                value: query.id,
            };
        });
        setQueries(updatedData);
    }

    const updateInComponet = () => {
        setProps(input, component);
        close();
    };

    return (
        <>
            <div className="row">
                <div className="col">
                    <label
                        className="fw-bold"
                        htmlFor="indexes">
                        Index
                    </label>

                    <ReactSelect
                        options={indexes}
                        value={input?.index}
                        onChange={selectedItem =>
                            handleChange(selectedItem, "index")
                        }
                    />
                </div>
                <div className="col">
                    <label
                        htmlFor="queries"
                        className="fw-bold">
                        Query
                    </label>

                    <ReactSelect
                        options={queries}
                        value={input?.query}
                        onChange={selectedItem =>
                            handleChange(selectedItem, "query")
                        }
                    />
                </div>
            </div>

            <button
                className="button-theme mt-2 float-end"
                onClick={updateInComponet}>
                Ok
            </button>
        </>
    );
}

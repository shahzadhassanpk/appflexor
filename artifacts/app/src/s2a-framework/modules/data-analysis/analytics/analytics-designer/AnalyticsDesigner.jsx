import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import ModalBox from "../../../../components/Modal/Modal";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    JsonToCsv,
    deleteItem,
    insertItem,
    makeid,
    updateItem,
} from "../../../../utils/utils";
import DimForm from "./Forms/DimForm";
import IndexForm from "./Forms/IndexForm";
import MeasureForm from "./Forms/MeasureForm";
import Listing from "./Listing/Listing";
import { tryToParse } from "../../../data-management/form-builder/Forms/FormViewer/utils";
import {
    getSelectedItem,
    getData as globalGetData,
    handleMultiSave,
} from "../../../../components/CrudApiCall";

export default function AnalyticsDesigner({ activeTab }) {
    let dimId = makeid(8);
    const [showModalComp, setShowModalComp] = useState({
        show: false,
        item: {},
    });
    const [showModalDim, setShowModalDim] = useState({
        show: false,
        item: {},
    });
    const [showModalMeasure, setShowModalMeasure] = useState({
        show: false,
        item: {},
    });
    const [error, setError] = useState([]);

    const [config, setConfig] = useState({
        index: "",
        dimensions: [],
        measures: [],
    });

    const [indexConfig, setIndexConfig] = useState({
        index: "",
        dimensions: [],
        measures: [],
    });

    let initialDimension = {
        id: dimId,
        label: "",
        key: "",
        dataKey: "",
        selectedColumn: "",
        where_column: "",
        column: "Available Dimensions",
        serviceKey: "",
        option: [],
        selected_option: [],
        where: "",
        condition: "",
    };
    let initialMeasure = {
        id: makeid(8),
        key: "",
        label: "",
        selected: false,
    };
    let initialIndex = {
        id: "new",
        title: "",
        name: "",
        description: "",
        data_source: "",
        data_source_name: "",
        config: {
            index: "",
            dimensions: [],
            measures: [],
        },
    };
    let initialDataSource = [
        {
            id: "1",
            title: "Elastic Search",
            name: "ELASTIC_SEARCH",
            selected: false,
        },
        { id: "2", title: "Postgres", name: "POSTGRES", selected: false },
    ];

    const [dataSources, setDataSources] = useState(initialDataSource);
    const [dimension, setDimension] = useState(initialDimension);
    const [exportIndexIds, setExportIndexIds] = useState({});
    const [measure, setMeasure] = useState(initialMeasure);
    const [index, setIndex] = useState(initialIndex);
    const [indexes, setIndexes] = useState([]);
    const [instanceItems, setInstanceItems] = useState([]);
    const [addBtnHide, setAddBtnHide] = useState(true);
    const [selectedDataSource, setSelectedDataSource] = useState("");
    const [importReference, setImportReference] = useState({
        fun: () => {},
    });

    const [hide, setHide] = useState(false);
    const [multiExport, setMultiExport] = useState({
        fun: () => {},
        title: "",
    });
    const indexRef = useRef(null);
    const dimRef = useRef(null);
    const measureRef = useRef(null);
    const exportModal = useRef(null);
    const importModal = useRef(null);

    useEffect(() => {
        if (activeTab === "ANALYTIC_TABLE") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (index.id !== "") {
            setAddBtnHide(false);
        } else {
            setAddBtnHide(true);
        }
    }, [index.id]);

    useEffect(() => {
        if (config.index !== "") {
            setIndex(prev => ({
                ...prev,
                config: { ...config },
            }));
        }
    }, [config]);

    useEffect(() => {
        if (selectedDataSource) {
            getInstance();
        }
    }, [selectedDataSource]);

    const openIndexModal = () => {
        selectedDataSource && getInstance();
        indexRef.current.show();
    };
    const closeIndexModal = () => {
        indexRef.current.close();
        setSelectedDataSource("");
    };

    const openDimModal = () => {
        dimRef.current.show();
    };
    const closeDimModal = () => {
        dimRef.current.close();
    };

    const openMeasureModal = () => {
        measureRef.current.show();
    };
    const closeMeasureModal = () => {
        measureRef.current.close();
    };

    function getData(condition, index) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "index",
                    serviceKey: "sys.index",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === undefined) {
                    getData("FIRST_RENDER");
                }
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.index) {
                        setIndexes(response.data.C_DATA.index);

                        if (condition === "save") {
                            let savedIndex = [];
                            savedIndex = response.data.C_DATA.index.filter(
                                item => item.id === index.id,
                            );
                            handleSelectedIndexId(savedIndex[0]);
                        }
                        // }
                        dimensionClearFields("get");
                        measureClearFields();
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getInstance() {
        // let serviceKey = {
        //     POSTGRES: "sys.instance",
        //     // ELASTIC_SEARCH: "sys.es.datasource",
        // };
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.instance",
                    mode: "formData",
                },
            ],
        };
        if (index && index.data_source)
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.instance) {
                            setInstanceItems(response.data.C_DATA.instance);
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
    }

    function handleInputDimension(e) {
        let _dimension = { ...dimension };
        let name = e.target.name;
        let value = e.target.value;

        _dimension = { ..._dimension, [name]: value };
        if (
            _dimension["serviceKey"] !== "" &&
            _dimension["serviceKey"] !== undefined
        ) {
            let key = _dimension["key"];

            _dimension = { ..._dimension, dataKey: key, selectedColumn: key };
        }

        setDimension(_dimension);
    }

    function handleInputMeasure(e) {
        let name, value;
        name = e.target.name;
        value = e.target.value;

        setMeasure(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleInputIndex(e) {
        let name = e.target.name;
        let value = e.target.value;

        let tempArr = [...dataSources];
        if (name === "data_source") {
            tempArr.forEach(item => {
                if (item.name === value) {
                    item.selected = true;
                } else {
                    item.selected = false;
                }
            });
        }
        setDataSources(tempArr);
        // console.log(dataSources);
        setIndex(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleBlur(e) {
        let { name, value } = e.target;
        let _dimension = { ...dimension };

        _dimension = { ..._dimension, [name]: value.trim() };

        if (
            _dimension["serviceKey"] !== "" &&
            _dimension["serviceKey"] !== undefined
        ) {
            let key = _dimension["key"];

            _dimension = { ..._dimension, dataKey: key, selectedColumn: key };
        }

        setDimension(_dimension);
    }

    function handlePushDimension() {
        if (validation()) {
            const tempDim = [...config.dimensions];
            const _index = { ...index };
            if (dimension.key !== "" && dimension.serviceKey !== "") {
                tempDim.push(dimension);
                setConfig(prev => ({
                    ...prev,
                    dimensions: tempDim,
                }));
                setDimension(initialDimension);
                setHide(true);

                _index.config.dimensions = tempDim;
                const bool = handleSaveIndex(_index);
                if (bool) {
                    toastEmitter("Dimension Saved Successfully", true);
                }
                closeDimModal();
            }
        }
    }
    function handlePushFactAndMeasure() {
        if (validateMeasure()) {
            const measureTemp = [...config.measures];
            const _index = { ...index };
            measureTemp.push(measure);

            setConfig(prev => ({
                ...prev,
                measures: measureTemp,
            }));
            setMeasure(initialMeasure);
            setHide(true);

            _index.config.measures = measureTemp;
            const bool = handleSaveIndex(_index);
            if (bool) {
                toastEmitter("Measure Saved Successfully", true);
            }
            closeMeasureModal();
        }
    }

    async function handleSelectedIndexId(index, e) {
        let indexId = index.id;
        if (!e.target.closest(".form-check-input"))
            try {
                const res = await fetchIndex(index.id);
                index = res.data.C_DATA[index.id][0];
                setSelectedDataSource(index.data_source);
                if (index.config === "{}") {
                    setIndex(prev => ({
                        ...prev,
                        id: index.id,
                        name: index.name,
                        title: index.title,
                        data_source: index.data_source,
                        data_source_name: index.data_source_name,
                        description: index.description,
                    }));
                    setConfig(prev => ({
                        ...prev,
                        index: indexId,
                        dimensions: [],
                        measures: [],
                    }));
                } else {
                    let config = index.config;
                    let parseConfig = tryToParse(config);
                    parseConfig.index = indexId;
                    setIndex(prev => ({
                        ...prev,
                        id: index.id,
                        name: index.name,
                        title: index.title,
                        data_source: index.data_source,
                        data_source_name: index.data_source_name,
                        description: index.description,
                    }));
                    setConfig(parseConfig);
                }
            } catch (error) {
                console.log(error);
            }
    }

    function fetchIndex(id) {
        if (id === index.id) return;
        return getSelectedItem({ id, serviceKey: "sys.selected.index" });
    }

    function indexClearFields(condition) {
        let initialIndex = {
            id: "new",
            title: "",
            name: "",
            description: "",
            data_source: "",
            data_source_name: "",
            config: {
                index: "",
                dimensions: [],
                measures: [],
            },
        };
        setIndex(initialIndex);
        setConfig(prev => ({
            ...prev,
            index: "",
            dimensions: [],
            measures: [],
        }));
        setDataSources(initialDataSource);
        if (condition === "target") {
            openIndexModal();
        }
        setError([]);
    }

    function dimensionClearFields(condition) {
        setDimension(initialDimension);
        setHide(true);
        setError([]);
        if (condition === "open") {
            openDimModal();
        }
    }

    function measureClearFields(condition) {
        setMeasure(initialMeasure);
        setHide(true);
        setError([]);
        if (condition === "open") {
            openMeasureModal();
        }
    }

    async function handleEditIndex(index) {
        let _dataSources = [...dataSources];
        const res = await getSelectedItem({
            id: index.id,
            serviceKey: "sys.selected.index",
        });
        const data = res.data.C_DATA[index.id][0];
        _dataSources.forEach(dataSource => {
            if (dataSource.name === data.data_source) {
                dataSource.selected = true;
            } else {
                dataSource.selected = false;
            }
        });
        setDataSources(_dataSources);
        setIndex(data);
        openIndexModal();
    }

    function handleEditDimension(dimension) {
        setDimension(dimension);
        setHide(false);
        openDimModal();
    }

    function handleEditMeasure(measure) {
        setMeasure(measure);
        setHide(false);
        openMeasureModal();
    }

    function handleSaveIndex(index) {
        if (indexValidation()) {
            let tempIndex = { ...index };
            const status =
                index.id == "" || index.id == "new" ? "created" : "updated";

            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "index"; //"formid"
            entityForm.entity = "index"; //Db- "table name"
            entityForm.action = "update";

            if (!index.id || index.id == "" || index.id == "new") {
                entityForm.id = "new";
                tempIndex.id = "new";
            } else {
                entityForm.id = tempIndex.id;
            }

            entityForm.formData = tempIndex;
            request.data.push(entityForm);

            try {
                return new Promise((resolve, reject) => {
                    axios.post(url, request).then(function (response) {
                        if (response.data.C_STATUS === "SUCCESS") {
                            resolve(true);
                            const data = response.data.C_DATA[0].formData;
                            if (status == "created")
                                insertItem(setIndexes, data);
                            else updateItem(setIndexes, data);
                            setIndex(prev => ({
                                ...prev,
                                id: data.id,
                            }));

                            closeIndexModal();
                        } else {
                            resolve(false);
                        }
                    });
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        }
    }

    // function handleSaveElasticSearchIndex() {

    //   let url = ES_URL + "?service.key=post.data"
    //   let request = {}
    //   request.data = []

    //   request = {
    //     dataKeys: [
    //       {
    //         dataKey: `${index.name}`,
    //         mode: "formData",
    //         serviceParams: "",
    //         serviceKey: `${index.service_key}`,
    //       },
    //     ],
    //   }

    //   try {
    //     axios.post(url, request).then(function (response) {
    //       if (response.status === 200) {
    //         console.log("save es index")
    //       }
    //     })
    //   } catch (e) {
    //     console.log("saveData error:" + e)
    //   }
    // }

    function handleDeleteIndex(index, condition) {
        if (condition === undefined) {
            setShowModalComp(prev => ({
                ...prev,
                show: true,
                item: index,
            }));
        }
        if (condition === true) {
            let fieldsData = index;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "index";
            entityForm.entity = "index";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        indexClearFields();
                        setConfig(prev => ({
                            ...prev,
                            index: "",
                        }));
                    }
                    deleteItem(setIndexes, fieldsData);
                    toastEmitter(`Index Deleted Successfully`, true);
                    setShowModalComp(prev => ({
                        ...prev,
                        show: false,
                        item: {},
                    }));
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
        }
    }

    async function handleDeleteDimension(dimension, condition) {
        const _index = { ...index };
        if (condition === undefined) {
            setShowModalDim(prev => ({
                ...prev,
                show: true,
                item: dimension,
            }));
        }
        if (condition === true) {
            let tempDimension = config.dimensions.filter(
                (item, i, array) => i !== array.indexOf(dimension),
            );

            setIndex(prev => ({
                ...prev,
                dimension: tempDimension,
            }));
            setConfig(prev => ({
                ...prev,
                dimensions: tempDimension,
            }));
            _index.config.dimensions = tempDimension;
            const bool = await handleSaveIndex(_index);
            if (bool) {
                toastEmitter("Dimension Deleted", true);
            }
            setShowModalDim(prev => ({
                ...prev,
                show: false,
                item: {},
            }));
        }
    }

    async function handleDeleteMeasure(measure, condition) {
        const _index = { ...index };
        if (condition === undefined) {
            setShowModalMeasure(prev => ({
                ...prev,
                show: true,
                item: measure,
            }));
        }
        if (condition === true) {
            let tempMeasure = config.measures.filter(
                (item, i, array) => i !== array.indexOf(measure),
            );
            setConfig(prev => ({
                ...prev,
                measures: tempMeasure,
            }));

            _index.config.measures = tempMeasure;
            const bool = await handleSaveIndex(_index);

            if (bool) {
                toastEmitter("Measure Deleted Successfully", true);
            }
            setShowModalMeasure(prev => ({
                ...prev,
                show: false,
                item: {},
            }));
        }
    }

    function handleUpdateDimension(dimension) {
        if (validation()) {
            let dimensions = [...config.dimensions];

            let dimObjIndex = dimensions.findIndex(
                item => item.id === dimension.id,
            );
            const _index = { ...index };

            dimensions[dimObjIndex] = dimension;

            setConfig(prev => ({
                ...prev,
                dimensions: dimensions,
            }));

            _index.config.dimensions = dimensions;

            const bool = handleSaveIndex(_index);

            if (bool) {
                toastEmitter("Dimension Updated Successfully", true);
            }
            closeDimModal();
        }
    }

    async function handleUpdateMeasure(measure) {
        if (validateMeasure()) {
            let measures = [...config.measures];
            let objIndex = measures.findIndex(item => item.id === measure.id);
            const _index = { ...index };

            measures[objIndex] = measure;

            setConfig(prev => ({
                ...prev,
                measures: measures,
            }));

            _index.config.measures = measures;
            const bool = await handleSaveIndex(_index);

            if (bool) {
                toastEmitter("Measure Updated Successfully", true);
            }
            closeMeasureModal();
        }
    }

    function indexValidation() {
        let _index = { ...index };
        let _error = [];
        let requiredFields = ["title", "name", "data_source"];
        // let check = {};

        for (let requiredField of requiredFields) {
            if (_index[requiredField] === "") {
                _error.push(requiredField);
            }
        }

        // dataSources.forEach(dataSource => {
        //     if (dataSource.selected === true) {
        //         check[dataSource.name] = dataSource.name;
        //     }
        // });

        setError(_error);
        if (_error.length > 0) return false;
        else if (_error.length === 0) return true;
    }

    function validation() {
        let dim = { ...dimension };
        let _error = [];
        let requiredDims = ["key", "serviceKey", "where_column", "label"];

        for (let requiredDim of requiredDims) {
            if (dim[requiredDim] === "") {
                _error.push(requiredDim);
            }
        }
        setError(_error);
        if (_error.length > 0) return false;
        else if (_error.length === 0) return true;
    }
    function validateMeasure() {
        let tempMeasure = { ...measure };
        let _error = [];

        for (let key in tempMeasure) {
            if (tempMeasure[key] === "") {
                _error.push(key);
            }
        }

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function getNameById(id, array) {
        let name = "";

        for (let object of array) {
            if (id === object.id) {
                name = object.title;
            }
        }
        return name ? `(${name})` : ``;
    }

    async function duplicate(item) {
        const res = await getSelectedItem({
            id: item.id,
            serviceKey: "sys.selected.index",
        });
        const data = res.data.C_DATA[item.id][0];
        const bool = data.title.startsWith("copy");
        data.id = "new";
        data.title = !bool ? "copy " + data.title : data.title;
        handleSaveIndex(data);
    }

    const nameExport = async () => {
        const keys = [];
        if (JSON.stringify(exportIndexIds) !== "{}") {
            for (let id in exportIndexIds) {
                let obj = {
                    params: id,
                    serviceKey: "sys.selected.index",
                };
                keys.push(obj);
            }

            const res = await globalGetData({ keys });

            if (res.data.C_STATUS == "SUCCESS") {
                exportItem(res);
            }
        } else {
            toastEmitter("Selected Index First", true, "warning");
        }
    };

    function exportItem(res) {
        const exportedIndexes = [];
        const data = res.data.C_DATA;
        for (let key in data) {
            exportedIndexes.push(data[key][0]);
        }
        const length = exportedIndexes.length;
        if (length == 1) {
            JsonToCsv(exportedIndexes, exportedIndexes[0].title);
            setExportIndexIds({});
        } else if (length > 1) {
            const exportReference = title => {
                JsonToCsv(exportedIndexes, title);
                exportModal.current.close();
                setMultiExport({
                    fun: () => {},
                    title: "",
                });
                setExportIndexIds({});
            };

            setMultiExport({ ...multiExport, fun: exportReference });
            exportModal.current.show();
        }
    }

    const selectForExport = (item, checked) => {
        const id = item.id;
        let ids = {};
        if (checked) {
            ids = { ...exportIndexIds, [id]: id };
        } else {
            ids = { ...exportIndexIds };
            delete ids[id];
        }
        setExportIndexIds(ids);
    };

    async function saveItems(items, table) {
        const res = await handleMultiSave({ items, entity: table });
        if (res.status == 200) {
            importModal.current.close();
            getData();
        }
    }

    return (
        <ErrorBoundary>
            <div
                id="analytics-designer"
                className="py-2 s2a-analytic-designer">
                <ModalBox
                    header="Confirm"
                    state={showModalComp}
                    message={`Are you sure to delete ${
                        showModalComp.item.name ?? ""
                    }?`}
                    operation={handleDeleteIndex}
                    setState={setShowModalComp}
                />
                <ModalBox
                    header="Confirm"
                    state={showModalDim}
                    message={`Are you sure to delete Dimension?`}
                    operation={handleDeleteDimension}
                    setState={setShowModalDim}
                />
                <ModalBox
                    header="Confirm"
                    state={showModalMeasure}
                    message={`Are you sure to delete Measure?`}
                    operation={handleDeleteMeasure}
                    setState={setShowModalMeasure}
                />
                <ChildrenModal
                    ref={indexRef}
                    header="Data Set">
                    <IndexForm
                        indexClearFields={indexClearFields}
                        handleSaveIndex={handleSaveIndex}
                        handleInputIndex={handleInputIndex}
                        index={index}
                        dataSources={dataSources}
                        instanceItems={instanceItems}
                        modalShow={openIndexModal}
                        closeModal={closeIndexModal}
                        error={error}
                        setSelectedDataSource={setSelectedDataSource}
                    />
                </ChildrenModal>
                <ChildrenModal
                    ref={dimRef}
                    header="Dimension">
                    <DimForm
                        error={error}
                        handleInputDimension={handleInputDimension}
                        dimension={dimension}
                        handlePushDimension={handlePushDimension}
                        handleUpdateDimension={handleUpdateDimension}
                        hide={hide}
                        handleBlur={handleBlur}
                        instanceItems={instanceItems}
                    />
                </ChildrenModal>
                <ChildrenModal
                    ref={measureRef}
                    header="Measure">
                    <MeasureForm
                        measure={measure}
                        indexMeasures={indexConfig?.measures}
                        handleInputMeasure={handleInputMeasure}
                        error={error}
                        handlePushFactAndMeasure={handlePushFactAndMeasure}
                        handleUpdateMeasure={handleUpdateMeasure}
                        measureClearFields={measureClearFields}
                        hide={hide}
                        index={index}
                        closeModal={closeMeasureModal}
                    />
                </ChildrenModal>
                <ChildrenModal
                    ref={exportModal}
                    header="Export Indexes">
                    <ExportForm
                        multiExport={multiExport}
                        setMultiExport={setMultiExport}
                    />
                </ChildrenModal>
                <ChildrenModal
                    ref={importModal}
                    header="Import Indexes">
                    <input
                        type="file"
                        className="form-control"
                        onChange={e =>
                            handleImportIndex(
                                e,
                                setImportReference,
                                saveItems,
                                "index",
                            )
                        }
                    />
                    <button
                        className="button-theme my-2"
                        onClick={() => importReference.fun()}>
                        Ok
                    </button>
                </ChildrenModal>
                <div className="analytics-builder">
                    <div className="row analytics-row">
                        <div className="col-sm-4 analytics-col">
                            <div className="listing-header s2a-border">
                                <div className="col">
                                    <label>
                                        <i className="fa fa-cubes"></i> Data
                                        Cubes
                                    </label>
                                </div>
                                <div
                                    className="col-sm-1 analytics-add-btn"
                                    type="button"
                                    title="Add"
                                    onClick={() => indexClearFields("target")}>
                                    <span className="fa-solid fa-plus pointer"></span>
                                </div>
                                <span
                                    onClick={() => importModal.current.show()}
                                    title="Import"
                                    className="fa-solid fa-file-import me-3 pointer"></span>
                                <span
                                    className="fa-solid fa-file-export pointer"
                                    title="Export"
                                    onClick={nameExport}></span>
                            </div>
                            <Listing
                                items={indexes}
                                handleSelectedItemId={handleSelectedIndexId}
                                handleEdit={handleEditIndex}
                                handleDelete={handleDeleteIndex}
                                duplicate={duplicate}
                                index={index}
                                flag="index"
                                className="fa fa-cube"
                                selectForExport={selectForExport}
                                ids={exportIndexIds}
                            />
                        </div>
                        <div className="col-sm-4 analytics-col">
                            <div className="listing-header s2a-border">
                                <div className="col">
                                    <label>
                                        <i
                                            className="fa-brands fa-uncharted horizontal-nav-icons"
                                            title="
                                                Dimensions"></i>
                                        Dimensions{" "}
                                        {index.id &&
                                            indexes &&
                                            getNameById(index.id, indexes)}
                                    </label>
                                </div>
                                <div
                                    type="button"
                                    className={
                                        addBtnHide
                                            ? `visually-hidden`
                                            : `col-sm-1 analytics-add-btn`
                                    }>
                                    <span
                                        className="fa-solid fa-plus pointer"
                                        title="Add"
                                        onClick={() =>
                                            dimensionClearFields("open")
                                        }></span>
                                </div>
                            </div>
                            <Listing
                                items={
                                    config.dimensions &&
                                    config.dimensions.length > 0 &&
                                    config.dimensions
                                }
                                handleSelectedItemId={() => {}}
                                handleEdit={handleEditDimension}
                                handleDelete={handleDeleteDimension}
                                duplicate={duplicate}
                                config={config}
                                flag="dim"
                            />
                        </div>
                        <div className="col-sm-4 analytics-col">
                            <div className="listing-header s2a-border">
                                <div className="col">
                                    <label>
                                        <i className="fa-sharp fa-solid fa-ruler-combined"></i>{" "}
                                        Measures{" "}
                                        {config.index &&
                                            indexes &&
                                            getNameById(config.index, indexes)}
                                    </label>
                                </div>
                                <div
                                    type="button"
                                    className={
                                        addBtnHide
                                            ? `visually-hidden`
                                            : `col-sm-1 analytics-add-btn`
                                    }>
                                    <span
                                        className="fa-solid fa-plus pointer"
                                        title="Add"
                                        onClick={() =>
                                            measureClearFields("open")
                                        }></span>
                                </div>
                            </div>
                            <Listing
                                items={
                                    config.measures &&
                                    config.measures.length > 0 &&
                                    config.measures
                                }
                                handleSelectedItemId={() => {}}
                                handleEdit={handleEditMeasure}
                                handleDelete={handleDeleteMeasure}
                                duplicate={duplicate}
                                config={config}
                                flag="measure"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export function ExportForm(props) {
    const { multiExport, setMultiExport } = props;
    return (
        <>
            <label
                className="fw-bold mb-1"
                htmlFor="export-index">
                Title
            </label>
            <input
                id="export-index"
                type="text"
                className={`form-control  ${
                    multiExport.title.length > 0 ? "" : "border border-danger"
                }`}
                onChange={e =>
                    setMultiExport({
                        ...multiExport,
                        title: e.target.value,
                    })
                }
            />
            <button
                className="button-theme mt-2 float-end"
                disabled={multiExport.title.length < 1}
                onClick={() => multiExport.fun(multiExport.title)}>
                Export
            </button>
        </>
    );
}

export const handleImportIndex = (e, setImportReference, saveItems, table) => {
    const file = e.target.files;
    const fileReader = new FileReader();

    fileReader.onload = e => {
        const data = e.target.result;
        const parseData = tryToParse(data);
        const ref = () => saveItems(parseData, table);
        setImportReference(prev => ({
            ...prev,
            fun: ref,
        }));
    };

    fileReader.readAsText(file[0]);
};

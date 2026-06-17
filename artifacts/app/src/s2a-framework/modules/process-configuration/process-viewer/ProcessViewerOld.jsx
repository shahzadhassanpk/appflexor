import React, { useState, useRef, useEffect, useContext } from "react";
// import { AppContext } from "../../AppContext";
import axios from "axios";
import { API_URL } from "../../../Config";
import { BPM_API_URL } from "../../camunda/CamundaConfig";
// import ProcessesContext from "../camunda/ProcessesContext";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import { Modal } from "react-bootstrap";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { filterArrayByTerms, makeid } from "../../../utils/utils";
import DesignerContext from "../../page-builder/Context/DesignerContext";

function ProcessViewer(props) {
    let initialState = {
        id: "",
        title: "",
        process_id: "",
        form_id: "",
        category: "",
    };
    const [formList, setFormList] = useState([]);
    const [items, setItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [processList, setProcessList] = useState([]);
    const [filteredProcessList, setFilteredProcessList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [mode, setMode] = useState("DESIGN_MODE");
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [selectedForm, setSelectedForm] = useState({});
    const [category, setCategory] = useState("");
    const [show, setShow] = useState(false);
    const inputReference = useRef(null);
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);

    let modalId = makeid(8);

    const getPaginateData = (current, pageSize) => {
        return filteredProcessList.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            getData(context.selectedComponent.data.category);
        }
    }, [context]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setSelectedItem(prev => ({
                ...prev,
                category: context.selectedComponent.data.category,
            }));
        }
    }, [props]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(context.selectedComponent.props);
            setInputField(context.selectedComponent.data);
        } else {
            setInputField({});
            setPropsFromComponent([]);
            setCurrentComponent({});
        }
    }, [context]);

    useEffect(() => {
        console.log(props, "props");
    }, [props]);

    useEffect(() => {
        if (selectedItem && selectedItem.category) {
            inputReference.current = selectedItem.category;
        }
    }, [selectedItem]);

    useEffect(() => {
        console.log(filteredProcessList);
    }, [filteredProcessList]);

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function getProcessDefination() {
        const dataRequest = {
            method: "GET",
            path: "/process-definition?latestVersion=true",
            data: {},
        };
        axios
            .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    let data = response.data.data;
                    if (data) {
                        setProcessList(data);
                        // setLoaded(true);
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function getData(category) {
        setShow(true);
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "formList",
                    serviceKey: "sys.forms",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "processMap",
                    serviceKey: "process.map",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "processCategory",
                    serviceKey: "process.category",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    setFormList(response.data.C_DATA.formList);
                    setItems(response.data.C_DATA.processMap);
                    setCategoryList(response.data.C_DATA.processCategory);

                    let result = filterIt(
                        response.data.C_DATA.processMap,
                        category,
                    );
                    setFilteredProcessList(result);
                }
                getProcessDefination();
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getNameById(id) {
        let name = "";
        formList.forEach(item => {
            if (item.id === id) {
                name = item.name;
            }
        });
        return name ? name : "";
    }

    function getProcessByName(id) {
        let name = "";
        processList.forEach(item => {
            if (item.id === id) {
                name = item.name;
            }
        });
        return name ? name : "";
    }

    function getCategoryByKey(key) {
        let title = "";
        categoryList.forEach(item => {
            if (item.key === key) {
                title = item.title;
            }
        });
        return title ? title : "";
    }

    function filterIt(items, category) {
        return items.filter(item => item.category === category);
    }

    const handleUpdateComponentData = value => {
        let _components = { ...context.components };

        let tempData = _components[currentComponent.id].data;
        tempData = { ...tempData, ...inputField };
        _components[currentComponent.id].data.category = value;
        context.setComponents(_components);
    };

    function handleSearchCategory(event) {
        let value = event.target.value;
        handleUpdateComponentData(value);
        setCategory(value);
        if (value !== undefined) {
            let result = [];
            result = filterIt(items, value);

            setFilteredProcessList(result);

            setSelectedItem(prev => ({
                ...prev,
                category: value,
            }));
        }
    }

    return (
        <React.Fragment>
            <div
                id="processlist"
                className="py-3 mx-3">
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.readonly && (
                        <div>
                            <center>
                                <span>Processes added successfully!</span>
                            </center>
                        </div>
                    )}

                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <div>
                            <center>
                                <select
                                    className="form-select"
                                    name="category"
                                    value={selectedItem.category}
                                    onChange={e => handleSearchCategory(e)}>
                                    <option
                                        key={0}
                                        value="">
                                        Select All
                                    </option>
                                    {categoryList &&
                                        categoryList !== undefined &&
                                        categoryList.map(category => {
                                            return (
                                                <option
                                                    key={category.id}
                                                    value={category.key}>
                                                    {category.title}
                                                </option>
                                            );
                                        })}
                                </select>
                            </center>
                        </div>
                    )}

                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.render ||
                        props.mode === props.modeType.design ||
                        props.mode === props.modeType.preview) && (
                        <div className="">
                            {/* Header */}
                            <div className="">
                                {mode === "DESIGN_MODE" ||
                                mode === "PREVIEW" ||
                                mode === "RENDER_MODE" ? (
                                    <div className="col-sm-9 d-inline-flex align-self-center">
                                        <div className="col-sm-6 fw-bold">
                                            {selectedItem && selectedItem.name}
                                        </div>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                            {/* Views */}
                            {props.mode === props.modeType.render ||
                            props.mode === props.modeType.preview ||
                            props.mode === props.modeType.readonly ? (
                                <div className="row m-0">
                                    <div className="col-sm-12 ps-0">
                                        {/* <table></table> */}

                                        <ProcessListViewer
                                            items={items}
                                            setItems={setItems}
                                            selectedItem={selectedItem}
                                            getNameById={getNameById}
                                            getProcessByName={getProcessByName}
                                            getCategoryByKey={getCategoryByKey}
                                            handleSearchCategory={
                                                handleSearchCategory
                                            }
                                            filteredProcessList={
                                                filteredProcessList
                                            }
                                            size={size}
                                            current={current}
                                            getPaginateData={getPaginateData}
                                            setSize={setSize}
                                            setCurrent={setCurrent}
                                            processList={processList}
                                            categoryList={categoryList}
                                            setSelectedItem={setSelectedItem}
                                            setShow={setShow}
                                            show={show}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>
                    )}
            </div>
        </React.Fragment>
    );
}

function ProcessListViewer({
    items,
    setItems,
    selectedItem,
    size,
    current,
    getPaginateData,
    setSize,
    categoryList,
    setCurrent,
    filteredProcessList,
    getNameById,
    category,
}) {
    return (
        <>
            <div className="row m-0 my-2">
                <div className="col-sm-3 p-0 mb-2">
                    <div className="form-group">
                        {/* <label className="mt-1 fw-bold">
                      Category&nbsp;
                    </label> */}
                    </div>
                </div>
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"title"}
                                        headerTitle={"Title"}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    Form
                                </Th>
                                {/* <Th className="col-sm-2 table-row text-left"></Th> */}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredProcessList.map(item => {
                                return (
                                    <Tr
                                        key={item.id}
                                        className={` ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.title}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {getNameById(item.form_id)}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            <button
                                                className="btn button-theme btn-sm pull-left ms-0"
                                                // onClick={handleSaveSettings}
                                            >
                                                Submit
                                            </button>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </div>
            </div>
            <div className="row">
                {/* <div className="col-sm-2">
          <button
            className="btn btn-sm button-theme "
            onClick={() => saveProcessListIdInLayout()}
          >
            Ok
          </button>
        </div> */}
                <div className="col-sm-10">
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={filteredProcessList}
                    />
                </div>
            </div>
        </>
    );
    return <></>;
}

export default ProcessViewer;

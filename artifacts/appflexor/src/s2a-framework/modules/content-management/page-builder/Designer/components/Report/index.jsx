import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { API_URL, REPORT_URL } from "../../../../../../Config";
import { TablePagination } from "../../../../../../components/TablePagination/TablePagination";
import TableSorting from "../../../../../../components/TableSorting/TableSorting";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
// import { filterArrayByTerms } from "../../../../../utils/utils";
import { makeid } from "../../../../../../utils/utils";
import DesignerContext from "../../../Context/DesignerContext";
import PreviewReport from "./PreviewReport";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Report(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;
            temObj.id = makeid(5);

            setComponentData(temObj);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;

        if (componentData.regex && componentData.regex.length > 0) {
            const regexExp = new RegExp(componentData.regex);
            let strToValidate = value;
            let strIsValid = regexExp.test(strToValidate);

            if (!strIsValid) {
                let regexInfo = `Field must match regex pattern.`;
                if (props.component.data.regexinfo) {
                    regexInfo = props.component.data.regexinfo;
                }
                setMessage(regexInfo);
            } else {
                setMessage("");
            }
        }

        setObj(prev => ({
            ...prev,
            [key]: value,
        }));

        props.handleInputFields(componentData.db_column, value);
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 ">
                <label className="form-label">Report</label>
            </div>
        );

    function resizeIframe() {
        let obj = document.getElementById(componentData.id);
        let height = obj.contentWindow.document.documentElement.scrollHeight;
        obj.style.height = height + "px";
        // console.log("************* height:" + height);
        //obj.contentWindow.top = obj;
    }

    return (
        <ErrorBoundary>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {componentData.reportId ? (
                            <div className="iframe-main">
                                <PreviewReport
                                    reportId={componentData.reportId}
                                />
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No{" "}
                                    <span className="text-danger">Report</span>{" "}
                                    selected.
                                </span>
                            </div>
                        )}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {componentData.reportId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    Points to this Report{" "}
                                    <span className="text-danger">
                                        {componentData.reportId}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted">
                                    No{" "}
                                    <span className="text-danger">Report</span>{" "}
                                    selected.
                                </span>
                            </div>
                        )}
                    </>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div
                        className={` p-3 position-relative `}
                        onClick={() => setShow(true)}>
                        {componentData.reportId ? (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted text-center">
                                    <span className="fa-solid fa-print icon-space"></span>
                                    Points to&nbsp;
                                    <span className="text-danger">
                                        {componentData.reportName}
                                    </span>
                                    &nbsp;Report
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{ minHeight: "100px" }}
                                className="d-flex align-items-center justify-content-center">
                                <span className="text-muted cursor-pointer">
                                    <span className="fa-solid fa-print icon-space"></span>
                                    No{" "}
                                    <span className="text-danger">Report</span>{" "}
                                    selected.
                                </span>
                            </div>
                        )}

                        {/* <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}
                                >
                                <i className="m-2 fa-regular fa-pen-to-square d-block"></i>{" "}
                            </div>
                        </div> */}
                    </div>
                )}

            <Modal
                className="s2a-modal"
                show={show}
                size="lg"
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Link Report</span>
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
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ReportSelection setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function ReportSelection({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [selectedItem, setSelectedItem] = useState({
        id: "",
    });
    const [items, setItems] = useState([]);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(context.selectedComponent.props);
            setSelectedItem(context.selectedComponent.data);
        } else {
            setSelectedItem({});
            setPropsFromComponent([]);
            setCurrentComponent({});
        }
    }, [context.selectedComponent]);

    const getPaginateData = (current, pageSize) => {
        return items.slice((current - 1) * pageSize, current * pageSize);
    };

    function linkReport(item) {
        setSelectedItem(prev => ({
            ...prev,
            reportId: item.id,
            reportName: item.name,
        }));
        handleUpdateComponentData();
    }

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        tempData = { ...tempData, ...selectedItem };
        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function getData(callback) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "appReports",
                    serviceKey: "sys.reports.configrations",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.appReports) {
                            setItems(response.data.C_DATA.appReports);
                        } else {
                            console.log(
                                `Eitherapp.channel does not exists or SQL query returns no result.`,
                            );
                        }

                        if (callback) callback();
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <ErrorBoundary>
            <div className="p-2">
                <div className="mb-3">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"name"}
                                        headerTitle={"Name"}
                                        activeTab={"true"}
                                    />
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"report_key"}
                                        headerTitle={"Report Key"}
                                        activeTab={"true"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map((item, i) => {
                                return (
                                    <Tr
                                        key={item.id}
                                        className={` ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.name}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.report_key}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.id ===
                                            selectedItem.reportId ? (
                                                <span
                                                    className="table-edit-font"
                                                    title="Link"
                                                    onClick={() =>
                                                        linkReport(item)
                                                    }>
                                                    <i className="fa-solid fa-link-slash"></i>
                                                </span>
                                            ) : (
                                                <span
                                                    className="table-edit-font"
                                                    title="Link"
                                                    onClick={() =>
                                                        linkReport(item)
                                                    }>
                                                    <i className="fa-solid fa-link"></i>
                                                </span>
                                            )}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={items}
                    />
                </div>
                <div className="d-flex flex-row justify-content-end">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                handleUpdateComponentData();
                                setShow(false);
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default Report;

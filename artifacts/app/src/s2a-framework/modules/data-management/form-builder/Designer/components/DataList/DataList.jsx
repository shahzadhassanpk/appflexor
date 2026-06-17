import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import DataListViewer from "../../../../../content-management/page-builder/datalist-viewer/viewer/DataListViewer";
import DataListPropsEditor from "../../props-editors/DataListPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function DataList(props) {
    const { modeType, mode, formData } = props;
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [ids, setIds] = useState({
        id: "",
        form_id: "",
    });
    const [fkValue, setFkValue] = useState("");
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    let master_key_column = props?.component?.data?.master_key_column;

    const expressionProps = useGlobalData();

    useEffect(() => {       
        
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.component.data]);

    useEffect(() => {
        
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        
        let _fkValue = "";
      
        if (master_key_column && props && props.formData) {
            _fkValue = master_key_column
                ? props.formData[master_key_column]
                : props.formData.id;
        } else {
            _fkValue = props.formData.id;
        }
        setFkValue(_fkValue);        
        setData(props?.formData);
    }, [props.formData]);

    useEffect(() => {
        if (componentData && !isEmpty(componentData)) {
            let str = componentData.value;

            let _obj = tryParseJSONObject(str, {
                id: "",
                form_id: "",
            });
            setIds(_obj);
        }
    }, [componentData]);

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;

                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression(
                            { expression: disableExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    const Error = () => {
        return <div>Error occurred in Text Field.</div>;
    };

    const DatalistLabel = ({ data }) => {
        let obj = tryParseJSONObject(data.value, { name: "" });

        return <span className="datalist-component"> {obj.name} </span>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }
    const renderDatalist = () => {
        let datalist;
        props && formData
            ? (datalist = (
                  <div>
                      <Delayed>
                          <DataListViewer
                              ids={ids}
                              fkColumn={componentData.foreign_key_column}
                              fkValue={fkValue}
                              dataKey= {props?.component?.data?.dataKey}
                              setDataKeys= {props?.setDataKeys}
                              dataKeys= {props?.dataKeys}
                              modeType={modeType}
                              mode={mode}
                              isInsideForm={true}
                              formData={data}
                              hideFormDatalistLabel={componentData.hide_label}
                              maximize_button={componentData.maximize_button}
                          />
                      </Delayed>
                  </div>
              ))
            : (datalist = (
                  <div className="no-task-border">
                      <div className="no-task-wrap">
                          <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                          <span className="no-task-text">
                              Please save form to enable Datalist.
                          </span>
                      </div>
                  </div>
              ));
        return datalist;
    };
    return (
        <div className="s2a-datalist-viewer">
            <ErrorBoundary render={() => Error}>
                {/* <code>{JSON.stringify(componentData, null, 2)}</code>
            <hr />
            <code>{JSON.stringify(obj, null, 2)}</code>
            ...
            <code>{JSON.stringify(parentId, null, 2)}</code>
            ...
            <pre>
                <code>{JSON.stringify(props, null, 2)}</code>
            </pre> */}
                {/* <code>{JSON.stringify(componentData, null, 2)}</code> */}
                <div>
                    {visible && (
                        <div>
                            {props && mode === modeType?.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        </div>
                    )}

                    {props &&
                        (mode === modeType?.design) && (
                            <div>
                                <span className="h-50">
                                    <center>
                                        <DatalistLabel data={componentData} />
                                        Datalist
                                    </center>
                                </span>
                            </div>
                        )}

                    {props &&
                        (mode === modeType.preview || mode === modeType.readonly ||
                            mode === modeType.render) && (
                            <div>{renderDatalist()}</div>
                        )}
                </div>
                {/* <code>{JSON.stringify(obj)}</code> */}
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
                            <span>Edit Datalist</span>
                            <div className="d-flex">
                                <div
                                    className={`${
                                        toggleModalWindow === "maximize"
                                            ? "visually-hidden"
                                            : ""
                                    } `}
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }
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
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }
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
                        <DataListPropsEditor setShow={setShow} />
                    </Modal.Body>
                </Modal>
            </ErrorBoundary>
        </div>
    );
}

function Delayed({ children, waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : "Loading...";
}
export default DataList;

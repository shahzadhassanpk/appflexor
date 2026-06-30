import axios from "axios";
import { React, useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../../../../../AppContext";
import { API_URL } from "../../../../../../Config";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import SelectListPropsEditor from "../../props-editors/SelectListPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
/**
 *
 * @param {mode, label, db_column, handleChangeEvent} props
 * @returns {object}
 */

function MultiSelect(props) {
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    const [selectedOptions, setSelectedOptions] = useState([]);
    const [render, setRender] = useState(true);
    const [list, setList] = useState([]);
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    // control rerenders
    const [serviceParamsVal, setServiceParamsVal] = useState("");
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (!isEmpty(data) && !isEmpty(componentData)) {
            const useStatic = componentData.use_static;
            if (useStatic === "YES") {
            } else {
                const serviceParams = componentData.serviceParams;
                if (serviceParams) {
                    let _serviceParamsVal = "";

                    //check if serviceParams have value or reference from other form fields
                    if (data[serviceParams]) {
                        _serviceParamsVal = data[serviceParams];
                    } else {
                        _serviceParamsVal = serviceParams;
                    }
                    setServiceParamsVal(_serviceParamsVal);
                }
            }
        }
    }, [componentData, data]);

    // serviceParamsVal controls rerender
    useEffect(() => {
        if (!isEmpty(componentData)) {
            const useStatic = componentData.use_static;

            if (useStatic === "YES") {
            } else {
                const { mapLabel, serviceKey, datasource } = componentData;
                // if use_static is true than value is used as reference to get value from options -> item
                // - since static option always have same label/value pair we use default "value" as key
                // else value is taken from mapValue as a reference because value can be taken from any DB column
                const mapValue =
                    useStatic === "YES" ? "value" : componentData.mapValue;
                // setRender() force rerender ReactSelect component to update state on new data from fetch request
                setRender(false);
                // setServiceParamsVal(_serviceParamsVal)
                getData(
                    serviceKey,
                    serviceParamsVal,
                    mapValue,
                    mapLabel,
                    datasource,
                    componentData?.filter_by,
                );
            }
        }
    }, [serviceParamsVal, componentData]);

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

    useEffect(() => {
        try {
            if (props.component && props.component.data) {
                let data = props.component.data;
                let key = data.db_column;
                let value = data.value;
                let serviceKey = data.serviceKey;
                let serviceParams = data.serviceParams;
                let useStaticOptions = data.use_static;
                if (
                    props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render ||
                        props.mode === props.modeType.readonly)
                ) {
                    if (useStaticOptions === "YES") {
                        setRender(false);
                        props &&
                            props.component &&
                            props.component.props &&
                            props.component.props.map(item => {
                                if (item.id === "options") {
                                    if (item.options) {
                                        let options = tryParseJSONObject(
                                            item.options,
                                            [],
                                        );
                                        // options.unshift(selectedOption);
                                        const componentData =
                                            props?.component?.data;
                                        const formField =
                                            componentData?.serviceParams;
                                        if (formField) {
                                            const data = props?.formData;
                                            const filteredOptions =
                                                options.filter(option => {
                                                    if (
                                                        data[formField] &&
                                                        option[
                                                            "group"
                                                        ].toLowerCase() ===
                                                            data[
                                                                formField
                                                            ].toLowerCase()
                                                    ) {
                                                        return true;
                                                    } else {
                                                        return false;
                                                    }
                                                });
                                            setList(filteredOptions);
                                        } else {
                                            setList(options);
                                        }

                                        setRender(true);
                                    }
                                }
                            });
                    } else if (serviceKey !== "") {
                    } else
                        setMessage(
                            "No service key or Static options provided.",
                        );
                }

                setComponentData(data);
            }
        } catch (error) {
            console.log(error);
        }
    }, [props.component.data, props?.formData]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }

        if (render) {
            let key = props.component.data.db_column;

            if (list && list.length > 0) {
                let mapValue = "";
                if (props.component.data.use_static === "YES") {
                    mapValue = "value";
                } else {
                    mapValue = props.component.data.mapValue;
                }

                const newValuesStr = props.formData[key];
                const newValuesArr = newValuesStr?.split(";");

                let defaultSelection = getArrayByValues(
                    newValuesArr,
                    list,
                    mapValue,
                );
                setSelectedOptions(defaultSelection);
            }
        }

        setData(props.formData);
    }, [props.formData, list, render, componentData]);

    function handleChange(newValues = [], action) {
        // actions : select-option, remove-value
        let data = props.component.data;
        let key = data.db_column;
        let mapValue = "";

        if (props.component.data.use_static === "YES") {
            mapValue = "value";
        } else {
            mapValue = props.component.data.mapValue;
        }

        const newValuesArr = newValues.map(item => {
            return item[mapValue];
        });

        const newValuesStr = newValuesArr.join(";");

        setSelectedOptions(newValues);

        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, newValuesStr);
            if (props.handleOnFieldBlur) {
                props.handleOnFieldBlur("SELECT", newValuesStr);
            }
        }
    }

    function getArrayByValues(newValuesArr = [], list = [], map = "") {
        const resArr = [];

        newValuesArr.map(val => {
            list.map(item => {
                if (item[map] === val) {
                    resArr.push(item);
                }
            });
        });
        return resArr;
    }

    // Api calls

    function getData(
        serviceKey,
        serviceParamsVal = "",
        mapValue = "",
        mapLabel = "",
        datasource = "",
        filter_by = "",
    ) {
        var dataRequest = {
            tenant_id: tenantId,
            datasource,
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "list",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=tenant.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "FAIL") {
                }

                if (response.data.C_STATUS === "SUCCESS") {
                    let list = response.data.C_DATA.list;

                    list.unshift({
                        [mapLabel]: "",
                        [mapValue]: "",
                    });
                    const filterList = serviceParamsVal
                        ? list.filter(
                              item => item[filter_by] === serviceParamsVal,
                          )
                        : list;
                    setList(filterList);
                    // set default value exists
                    if (!isEmpty(props.component.data)) {
                        // let data = props.component.data;
                        // let value = data.value;
                        // const defaultSelection = getArrayByValues(
                        //     value,
                        //     list,
                        //     mapValue,
                        // );
                        // setSelectedOptions(defaultSelection);
                    }
                } else {
                    setList([]);
                }
                setRender(true);
            })
            .catch(error => {
                setRender(true);
                console.error(error);
                throw `Error fetching data for ${serviceKey}.`;
            });
    }

    const Error = () => {
        return <div>Error occurred in Select Field.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="field-padding">
                <label className="form-label">Select</label>
                <select
                    className="form-select form-select-sm"
                    disabled>
                    <option defaultValue="">Select option</option>
                </select>
            </div>
        );

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div className={`form-group s2a-select ${userDefineClasses()}`}>
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        {!props.isInDatalistMode && (
                            <label
                                htmlFor=""
                                className="form-label">
                                {componentData.label
                                    ? componentData.label
                                    : "MultiSelect"}
                                {componentData.required &&
                                    componentData.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}{" "}
                            </label>
                        )}
                    </>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <select
                                className="form-control"
                                disabled>
                                <option defaultValue="Select">Select</option>
                            </select>
                        )}
                    {/* New */}
                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.preview ||
                            props.mode === props.modeType.render ||
                            props.mode === props.modeType.readonly) &&
                        render && (
                            <>
                                <ReactSelect
                                    placeholder="Choose option"
                                    options={list?.filter(item => item.id)}
                                    selectedOptions={selectedOptions}
                                    handleChange={handleChange}
                                    fieldLabel={
                                        componentData.use_static === "YES"
                                            ? "label"
                                            : componentData.mapLabel
                                    }
                                    fieldValue={
                                        componentData.use_static === "YES"
                                            ? "value"
                                            : componentData.mapValue
                                    }
                                    isMulti={true}
                                    disabled={
                                        props.mode === props.modeType.design ||
                                        props.mode === props.modeType.readonly
                                            ? true
                                            : componentData.readonly ===
                                                  "YES" || disable
                                            ? true
                                            : false
                                    }
                                />
                            </>
                        )}
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
                        <span>Edit MultiSelect</span>
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
                    <SelectListPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default MultiSelect;

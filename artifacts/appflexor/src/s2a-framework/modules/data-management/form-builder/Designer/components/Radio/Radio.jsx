import axios from "axios";
import { React, useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../../../../../AppContext";
import { API_URL } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../../utils/utils";
import RadioListPropsEditor from "../../props-editors/RadioListPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
/**
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function Radio(props) {
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [options, setOptions] = useState([]);
    const [updatedOptions, setUpdatedOptions] = useState([]);
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [serviceParamsVal, setServiceParamsVal] = useState("");
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (!isEmpty(data) && !isEmpty(componentData)) {
            const serviceParams = componentData.serviceParams;

            let _serviceParamsVal = "";

            //check if serviceParams have value or reference from other form fields
            if (data[serviceParams]) {
                _serviceParamsVal = data[serviceParams];
            } else {
                _serviceParamsVal = serviceParams;
            }

            setServiceParamsVal(_serviceParamsVal);
        }
    }, [componentData, data]);

    // serviceParamsVal controls rerender
    useEffect(() => {
        if (!isEmpty(componentData)) {
            const useStatic = componentData.use_static;

            if (useStatic === "YES") {
            } else {
                const mapLabel = componentData.mapLabel;
                const serviceKey = componentData.serviceKey;
                // if use_static is true than value is used as reference to get value from options -> item
                // - since static option always have same label/value pair we use default "value" as key
                // else value is taken from mapValue as a reference because value can be taken from any DB column
                const mapValue =
                    useStatic === "YES" ? "value" : componentData.mapValue;

                getData(serviceKey, serviceParamsVal, mapValue, mapLabel);
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
        if (props.component && props.component.data && props.component.props) {
            setComponentData(props.component.data);

            let data = props.component.data;
            let mapValue = data.mapValue;
            let mapLabel = data.mapLabel;

            let key = data.db_column;
            let value = data.value;
            let serviceKey = data.serviceKey;
            let serviceParams = data.serviceParams;
            let useStaticOptions = data.use_static;

            let _options = [];

            if (useStaticOptions === "YES") {
                props.component.props.map(props => {
                    if (props.type === "array") {
                        try {
                            _options = tryParseJSONObject(
                                props.options,
                                props.options,
                            );
                        } catch (error) {
                            console.log();
                        }
                    }
                });

                if (_options) {
                    _options.map(option => {
                        option.isChecked = false;
                    });

                    setOptions(_options);
                }
            } else setMessage("No service key or Static options provided.");

            setObj({
                [key]: value,
            });

            // if (key && value && props.handleInputFields) {
            //     props.handleInputFields(key, value);
            // }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        setData(props.formData);
    }, [props.formData]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData) || isEmpty(options)) {
            return;
        }
        let key = props.component.data.db_column;
        let currentValue = props.formData[key];

        setObj(prev => ({
            ...prev,
            [key]: currentValue,
        }));

        let _options = [];
        options.map(opt => {
            if (currentValue === opt.value) {
                opt.isChecked = true;
                _options.push(opt);
            } else {
                opt.isChecked = false;
                _options.push(opt);
            }
        });
        // setData(props.formData);
        setUpdatedOptions(_options);
    }, [props.formData, options]);

    function handleChange(e) {
        let id = e.target.getAttribute("data-id");
        let key = componentData.db_column;
        let value = e.target.value;
        let isValid = true;

        let _options = [];

        // if (props.mode === props.modeType.preview) {
        //     _options = [...options];
        //
        //     _options.map(opt => {
        //         if (opt.id === id) {
        //             opt.value = value;
        //         }
        //     });

        //     setOptions(_options);
        // }

        if (props.mode === props.modeType.render) {
            _options = [];

            updatedOptions.map(opt => {
                if (opt.id === id) {
                    opt.isChecked = true;
                    _options.push(opt);
                } else {
                    opt.isChecked = false;
                    _options.push(opt);
                }
            });

            setUpdatedOptions(_options);
        }

        setIsValidField(isValid);
        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            console.log(e);
            props.handleInputFields(componentData.db_column, value, isValid);
            if (props.handleOnFieldBlur && e.type === "change") {
                props.handleOnFieldBlur("RADIO", value);
            }
        }
    }

    function handleOnBlur(event) {
        handleChange(event);
    }

    function getData(
        serviceKey,
        serviceParams = "",
        mapValue = "",
        mapLabel = "",
    ) {
        // let serParamsData = "";

        // if (serviceParams !== undefined || serviceParams !== "") {
        //     serParamsData = props.data[serviceParams];
        // }

        //  TODO: serParamsData
        var dataRequest = {
            tenant_id: tenantId,

            dataKeys: [
                {
                    serviceParams: serviceParams,
                    dataKey: "list",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=tenant.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let list = response.data.C_DATA.list;
                    let _options = list.map(item => {
                        return {
                            id: item.id ? item.id : makeid(4),
                            label: item[mapLabel],
                            value: item[mapValue],
                        };
                    });
                    setOptions(_options);

                    // set default value exists
                    if (!isEmpty(props.component.data)) {
                        let data = props.component.data;
                        let value = data.value;

                        let _selectedOptions = _options.map(option => {
                            if (value === option.value) {
                                option.isChecked = true;
                            } else {
                                option.isChecked = false;
                            }
                            return option;
                        });

                        if (_selectedOptions) {
                            setUpdatedOptions(_selectedOptions);
                        }
                    }
                } else {
                    setMessage("Provided service key is invalid.");
                }
            })
            .catch(error => {
                console.error(error);
                throw `Error fetching data for ${serviceKey}.`;
            });
    }

    function getCheckedIds(options) {
        let arr = [];

        options.map(opt => {
            if (opt.isChecked) {
                arr.push(opt.value);
            }
        });

        return arr;
    }

    // utils

    function isEmpty(obj) {
        for (var i in obj) return false;
        return true;
    }

    function isArrayEmpty(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === "") return true;
        }
        return false;
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 mb-3">
                <label className="form-label">Radio</label>
            </div>
        );

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
                <div className={"ps-2 " + userDefineClasses()}>
                    <div>
                        {!props.isInDatalistMode && (
                            <label>
                                {componentData.label
                                    ? componentData.label
                                    : "Radio"}
                                {componentData.required &&
                                    componentData.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}
                            </label>
                        )}
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                    </div>
                    <div className={`s2a-radio ${
                                            componentData.inline === "YES"
                                                ? "d-flex"
                                                : ""
                                        }`}>
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design &&
                            options &&
                            options.map(option => {
                                return (
                                    <div
                                        className={`form-check`}>
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name={componentData.db_column}
                                            // defaultValue={evalDefault(
                                            //     props.component.data.value,
                                            // )}
                                            value={option.value}
                                            data-id={option.id}
                                            onChange={handleChange}
                                            disabled
                                        />
                                        <label className="form-check-label pe-3">
                                            {option.label}
                                        </label>
                                    </div>
                                );
                            })}
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.readonly &&
                            updatedOptions &&
                            updatedOptions.map(option => {
                                return (
                                    <div
                                        className={`form-check`}>
                                        <input
                                            className={`form-check-input ${
                                                componentData.required &&
                                                componentData.required === "YES"
                                                    ? isValidField
                                                        ? ""
                                                        : "form-control-danger"
                                                    : ""
                                            } `}
                                            type="radio"
                                            name={componentData.db_column}
                                            value={option.value}
                                            data-id={option.id}
                                            onChange={handleChange}
                                            onBlur={handleChange}
                                            checked={
                                                option.isChecked ? true : false
                                            }
                                            disabled={true}
                                        />
                                        <label className="form-check-label pe-3">
                                            {option.label}
                                        </label>
                                    </div>
                                );
                            })}
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.preview &&
                            options &&
                            options.map(option => {
                                return (
                                    <div
                                        className={`form-check`}>
                                        <input
                                            className={`form-check-input ${
                                                componentData.required &&
                                                componentData.required === "YES"
                                                    ? isValidField
                                                        ? ""
                                                        : "form-control-danger"
                                                    : ""
                                            } `}
                                            type="radio"
                                            name={componentData.db_column}
                                            value={option.value}
                                            // data-id={option.id}
                                            // onBlur={handleChange}
                                            // checked={
                                            //     option.isChecked ? true : false
                                            // }
                                            // onChange={handleChange}
                                            // disabled={
                                            //     props.mode === props.modeType.design
                                            //         ? true
                                            //         : componentData.readonly ===
                                            //           "YES"
                                            //         ? true
                                            //         : disable
                                            //         ? true
                                            //         : false
                                            // }
                                        />
                                        <label className="form-check-label pe-3">
                                            {option.label}
                                        </label>
                                    </div>
                                );
                            })}

                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.render &&
                            updatedOptions &&
                            updatedOptions.map(option => {
                                let shortId = makeid(4);

                                return (
                                    <div
                                        key={option.id}
                                        className={`form-check`}>
                                        <input
                                            id={option.id}
                                            className={`form-check-input ${
                                                componentData.required &&
                                                componentData.required === "YES"
                                                    ? isValidField
                                                        ? ""
                                                        : "form-control-danger"
                                                    : ""
                                            } `}
                                            type="radio"
                                            name={`${shortId}`}
                                            value={option.value}
                                            data-id={option.id}
                                            onChange={handleChange}
                                            onBlur={handleOnBlur}
                                            checked={
                                                option.isChecked ? true : false
                                            }
                                            disabled={
                                                props.mode ===
                                                props.modeType.design
                                                    ? true
                                                    : componentData.readonly ===
                                                      "YES"
                                                    ? true
                                                    : disable
                                                    ? true
                                                    : false
                                            }
                                        />
                                        <label
                                            className={`form-check-label pe-3 pointer ${componentData.style}`}
                                            htmlFor={option.id}>
                                            {option.label}
                                        </label>
                                    </div>
                                );
                            })}
                    </div>
                    {/* <code>
                    <pre>{JSON.stringify(options, null, 2)}</pre>
                </code> */}
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
                        <span>Edit Radio</span>
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
                    <RadioListPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default Radio;

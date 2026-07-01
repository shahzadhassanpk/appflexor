import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import { API_URL } from "../../../../../../Config";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";
// import TextEditor from "../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import DesignerContext from "../../../Context/DesignerContext";
import FormViewer from "../../../Forms/FormViewer/FormViewer";

/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function SubForm(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [subFormConfig, setSubFormConfig] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [businessKey, setBusinessKey] = useState("new");
    const [formKey, setFormKey] = useState("");
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;

                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression({ expression: disableExp }, data),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression({ expression: visibleExp }, data),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    useEffect(() => {
        if (!isEmpty(props.formData)) {
            setFormData(props.formData);
        }
    }, [props.formData]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });

            // if (key && value && props.handleInputFields) {
            //   props.handleInputFields(key, value)
            // }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!isEmpty(formData) && !isEmpty(componentData)) {
            console.log(formData);
            console.log(componentData);
            if (formData.id !== undefined) {
                let str = componentData.value;

                let objValue = tryParseJSONObject(str, {});

                if (objValue.selectedForm !== undefined) {
                    let formKey = objValue.selectedForm.form_key
                        ? objValue.selectedForm.form_key
                        : "";
                    setFormKey(formKey);
                }
                if (objValue.columnName !== undefined) {
                    let columnName = objValue.columnName
                        ? objValue.columnName
                        : "";
                    let bk = formData[columnName]
                        ? formData[columnName]
                        : "new";
                    setBusinessKey(bk);
                }
            } else {
                // console.log(props);
                let dbColumn = componentData.db_column;
                let subFormDefaultConfig = props.subFormDefaultConfig;
                let jsonValue = subFormDefaultConfig[dbColumn]
                    ? subFormDefaultConfig[dbColumn]
                    : "";
                let objValue = tryParseJSONObject(jsonValue, {});
                setSubFormConfig(objValue);

                if (objValue.selectedForm !== undefined) {
                    let formKey = objValue.selectedForm.form_key
                        ? objValue.selectedForm.form_key
                        : "";
                    setFormKey(formKey);
                }
            }

            // let arr = businessKeyStr.split(";");
            // if (arr.length === 2) {
            //     setBusinessKey(arr[1]);
            // } else if (arr.length === 1) {
            //     setBusinessKey("new");
            // } else {
            //     setBusinessKey("new");
            // }
        }
    }, [formData, componentData]);

    function handleFormChange(state = {}, formDetails = {}, filesContent = {}) {
        // console.log(state);
        // console.log(formDetails);
        if (props.handleInputFields) {
            props.handleInputFields(
                componentData.db_column,
                state,
                true,
                "subform",
                filesContent,
                state,
                formDetails,
            );
        }

        // let key = e.target.id;
        // let value = e.target.value;
        // let isValid = true;
        // setIsValidField(isValid);
        // setObj(prev => ({
        //     ...prev,
        //     [key]: value,
        // }));
        // this `handleInputFields` will be provided by Parent component

        /*
         key = "",
        value = "",
        isValid = false,
        type = "text",
        fileData = "",
        state = {},
        formDetails = {},
        */
    }

    // function handleChange(e) {
    //     let key = e.target.id;
    //     let value = e.target.value;

    //     if (componentData.regex && componentData.regex.length > 0) {
    //         const regexExp = new RegExp(componentData.regex);
    //         let strToValidate = value;
    //         let strIsValid = regexExp.test(strToValidate);

    //         if (!strIsValid) {
    //             let regexInfo = `Field must match regex pattern.`;
    //             if (props.component.data.regexinfo) {
    //                 regexInfo = props.component.data.regexinfo;
    //             }
    //             setMessage(regexInfo);
    //         } else {
    //             setMessage("");
    //         }
    //     }

    //     setObj(prev => ({
    //         ...prev,
    //         [key]: value,
    //     }));

    //     props.handleInputFields(componentData.db_column, value);
    // }

    const Error = () => {
        return (
            <div>
                <center className="text-danger">
                    Error occurred in Text Area.
                </center>
            </div>
        );
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
            <div className="p-3 ">
                <label className="form-label">Sub Form</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <>
                    <div
                        className={`s2a-richtext position-relative  ${
                            props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design
                                ? "border"
                                : ""
                        }`}>
                        <label className="form-label">
                            {componentData.label
                                ? componentData.label
                                : "Textarea"}
                            {componentData.required &&
                                componentData.required === "YES" && (
                                    <span className="text-danger">&nbsp;*</span>
                                )}
                        </label>
                        {props.mode &&
                            props.modeType &&
                            (props.mode === props.modeType.design ||
                                props.mode === props.modeType.readonly) && (
                                <div className="p-2 bg-light border rounded">
                                    <FormViewer
                                        formKey={formKey}
                                        businessKey={businessKey}
                                        handleChange={handleFormChange}
                                        isSubForm={true}
                                        mode={"READONLY_MODE"}
                                        subFormConfig={subFormConfig}
                                    />
                                </div>
                                // <input
                                //     rows={obj.rows ? obj.rows : 5}
                                //     type="textarea"
                                //     className="form-control form-control-sm"
                                //     value={obj[componentData.db_column]}
                                //     disabled
                                // />
                            )}

                        {/* <pre>
                            Inside Wrapper <hr />
                            <code>
                                {JSON.stringify(componentData, null, 2)}
                                {JSON.stringify(obj, null, 2)}
                            </code>
                        </pre> */}

                        {props.mode &&
                            props.modeType &&
                            (props.mode === props.modeType.preview ||
                                props.mode === props.modeType.render) && (
                                <div className="p-2 bg-light border rounded">
                                    {/* <code>{obj[componentData.db_column]}</code> */}
                                    {businessKey !== null ? (
                                        <Delayed>
                                            {/* Form Will Render Here */}

                                            <FormViewer
                                                formKey={formKey}
                                                businessKey={businessKey}
                                                handleChange={handleFormChange}
                                                isSubForm={true}
                                                subFormConfig={subFormConfig}
                                            />
                                        </Delayed>
                                    ) : null}
                                </div>
                            )}
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <div className="">
                                    <div className="d-flex justify-content-center align-items-center pointer">
                                        <span
                                            className="m-2 fa-regular fa-pen-to-square mx-1"
                                            onClick={() =>
                                                setShow(true)
                                            }></span>{" "}
                                        Select Form
                                    </div>
                                </div>
                            )}
                    </div>
                    <Modal
                        show={show}
                        onHide={() => setShow(false)}
                        // backdrop="static"
                        keyboard={true}
                        animation={true}
                        size="lg">
                        <Modal.Header>
                            <Modal.Title>Select Form</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <UpdateData setShow={setShow} />
                        </Modal.Body>
                    </Modal>
                </>
            )}
        </ErrorBoundary>
    );
}

function UpdateData({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});

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

    const handleInputField = event => {
        let name = event.target.name;
        let value = event.target.value;

        // old
        // setInputField((prev) => ({
        //     ...prev,
        //     [name]: value,
        // }));

        // new
        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);

        // let _components = { ...context.components };

        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };

        let tempData = _components[currentComponent.id].data;
        tempData = { ...tempData, ...inputField };
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
    return (
        <ErrorBoundary>
            <div className="p-2">
                <div className="mb-3">
                    <RenderFormFields
                        fieldsArr={propsFromComponent}
                        inputField={inputField}
                        handleInputField={handleInputField}
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

export function RenderFormFields({ fieldsArr, inputField, handleInputField }) {
    const [list, setList] = useState([]);
    const [selectedOption, setSelectedOption] = useState({});
    const [fieldsData, setFieldsData] = useState({});

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (list && inputField) {
            let obj = tryParseJSONObject(inputField.value, {});

            if (obj.saveId === undefined) {
                obj.saveId = "SAVE_ID_IN_MAIN";
            }

            setFieldsData(obj);

            if (obj && obj.selectedForm !== undefined) {
                let arr = list.filter(
                    l => l.form_key === obj.selectedForm.form_key,
                );

                if (arr.length > 0) {
                    setSelectedOption(arr[0]);
                }
            }
        }
    }, [list, inputField]);

    function handleSelectionChange(obj) {
        setSelectedOption(obj);

        let temp = structuredClone(fieldsData);
        let final = { ...temp, selectedForm: obj };

        setFieldsData(final);

        let tempStr = JSON.stringify(final);

        let _event = {
            target: {
                name: "value",
                value: tempStr,
            },
        };

        handleInputField(_event);
    }

    function handleChange(event) {
        let key = event.target.name;
        let value = event.target.value;

        let temp = structuredClone(fieldsData);
        let final = { ...temp, [key]: value };

        setFieldsData(final);

        let tempStr = JSON.stringify(final);

        let _event = {
            target: {
                name: "value",
                value: tempStr,
            },
        };

        handleInputField(_event);
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

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "formList",
                    serviceKey: "sys.get.forms.keys",
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
                    if (response.data.C_DATA.formList) {
                        let _formList = response.data.C_DATA.formList;

                        setList(_formList);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="row">
            {fieldsArr &&
                fieldsArr.map(field => {
                    return (
                        <React.Fragment key={field.id}>
                            {field.type === "sub-form" && (
                                <>
                                    <div className="col-sm-12">
                                        <div className="mb-3">
                                            <label htmlFor="">
                                                Select Form
                                            </label>
                                            <span className="text-danger">
                                                *
                                            </span>

                                            <ReactSelect
                                                placeholder="Choose option"
                                                options={list}
                                                selectedOption={selectedOption}
                                                handleChange={
                                                    handleSelectionChange
                                                }
                                                fieldLabel={"name"}
                                                fieldValue={"form_key"}
                                                disabled={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-sm-12">
                                        <label htmlFor="">DB Column</label>
                                        <span className="text-danger">*</span>
                                        <input
                                            type="text"
                                            name="columnName"
                                            className={`form-control`}
                                            onChange={e => handleChange(e)}
                                            value={
                                                fieldsData.columnName !==
                                                undefined
                                                    ? fieldsData.columnName
                                                    : ""
                                            }
                                        />
                                    </div>
                                    <div className="col-sm-12">
                                        <label className="px-1 form-check-label pointer my-3">
                                            <input
                                                type="radio"
                                                className="form-check-input "
                                                name="saveId"
                                                onChange={e => handleChange(e)}
                                                value="SAVE_ID_IN_MAIN"
                                                checked={
                                                    fieldsData.saveId ===
                                                    "SAVE_ID_IN_MAIN"
                                                }
                                            />
                                            <span className="ms-2">
                                                Keep subform id in main
                                            </span>
                                        </label>

                                        <label className="px-1 form-check-label pointer my-3">
                                            <input
                                                type="radio"
                                                className="form-check-input "
                                                name="saveId"
                                                value="SAVE_ID_IN_SUB_FORM"
                                                checked={
                                                    fieldsData.saveId ===
                                                    "SAVE_ID_IN_SUB_FORM"
                                                }
                                                onChange={e => handleChange(e)}
                                            />
                                            <span className="ms-2">
                                                Keep main id in subform
                                            </span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
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

export default SubForm;

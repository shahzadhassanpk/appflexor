import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DesignerContext from "../../../Context/DesignerContext";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function RichText(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

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
                <label className="form-label">Rich Text</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            <div
                className={`s2a-richtext position-relative  ${
                    props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design
                        ? "border"
                        : ""
                }`}>
                <Interweave content={obj[componentData.db_column]} />
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}>
                                <i className="m-2 fa-regular fa-pen-to-square d-block"></i>{" "}
                            </div>
                        </div>
                    )}
            </div>
            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}>
                <Modal.Header>
                    <Modal.Title>Edit richtext</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UpdateRichText setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function UpdateRichText({ setShow }) {
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
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

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
                            className="btn btn-sm button-theme  mx-1"
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
    return (
        <div className="row">
            {fieldsArr &&
                fieldsArr.map(field => {
                    return (
                        <React.Fragment key={field.id}>
                            {field.type === "richtext" && (
                                <div className="col-sm-12">
                                    <div className="mb-3">
                                        <label htmlFor="">Input HTML</label>
                                        {/* <TextEditor
                                                    name={field.id}
                                                    id="random-id"
                                                    data={
                                                        inputField[field.id]
                                                            ? inputField[
                                                                  field.id
                                                              ]
                                                            : ""
                                                    }
                                                    height="220px"
                                                    onEditorChange={(
                                                        newValue
                                                    ) => {
                                                        let name = field.id;
                                                        let value = newValue;
                                                        let e = {};
                                                        e.target = {
                                                            name,
                                                            value,
                                                        };
                                                        handleInputField(e);
                                                    }}
                                                /> */}

                                        <textarea
                                            type={field.type}
                                            name={field.id}
                                            className={`form-control form-control-sm`}
                                            rows="10"
                                            onChange={e => handleInputField(e)}
                                            value={
                                                inputField[field.id]
                                                    ? inputField[field.id]
                                                    : ""
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
        </div>
    );
}

export default RichText;

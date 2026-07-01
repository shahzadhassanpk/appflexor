import React, { useContext, useEffect, useState } from "react";
import TextEditor from "../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import FormContext from "../../Context/FormContext";
import DynamicInput from "../../../../../components/dynamic-input/DynamicInput";
import DynamicRadio from "../../../../../components/dynamic-radio/radio";

export default function HTMLPropsEditor(props) {
    const { setShow } = props;
    const context = useContext(DesignerContext);
    const formContext = useContext(FormContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [richText, setRichText] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            let componentData = context.selectedComponent.data;
            let htmlId = componentData.html_id;
            let prevHtmlCollection = { ...formContext.htmlCollection };
            let data = prevHtmlCollection[htmlId];

            setCurrentComponent(context.selectedComponent);
            setInputField(componentData);
            setRichText({ value: data });
        }
    }, [context]);

    const handleRichTextEditor = event => {
        let key = event.target.name;
        let value = event.target.value;
        let data = { ...richText, [key]: value };

        setRichText(data);
    };

    const handleInputField = event => {
        let key = event.target.name;
        let value = event.target.value;
        let _inputField = { ...inputField, [key]: value };

        setInputField(_inputField);
    };

    const handleUpdateComponentData = () => {
        let prevHtmlCollection = { ...formContext.htmlCollection };
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        if (tempData.html_id) delete prevHtmlCollection[tempData.html_id];

        let id = `${makeid(8)}`;
        let value = richText.value;
        let newHtmlCollection = { ...prevHtmlCollection, [id]: value };

        formContext.setHtmlCollection(newHtmlCollection);

        handleInputField({
            target: {
                name: "html_id",
                value: id,
            },
        });

        tempData = { ...tempData, ...inputField, html_id: id };
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
            <form>
                <div className="collapse__container d-flex flex-row  gap-4 mb-2 flex-wrap">
                    <div className="collapse__radio">
                        <label className="fw-bold mb-1">Collapse</label>
                        <div className="d-flex gap-3">
                            <DynamicRadio
                                items={[
                                    {
                                        code: "horizontal",
                                        label: "Horizontal",
                                    },
                                    { code: "vertical", label: "Vertical" },
                                    { code: "none", label: "None" },
                                ]}
                                selectedItem={inputField["collapse"]}
                                handleChange={item => {
                                    setInputField({
                                        ...inputField,
                                        collapse: item,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div className="collapse__position">
                        <label className="fw-bold mb-1">
                            Collapse Button Position
                        </label>
                        <div className="d-flex gap-3">
                            <DynamicRadio
                                items={[
                                    {
                                        code: "left",
                                        label: "left",
                                    },
                                    { code: "right", label: "right" },
                                ]}
                                selectedItem={inputField["position"]}
                                handleChange={item => {
                                    setInputField({
                                        ...inputField,
                                        position: item,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div className="collapse__icon">
                        <DynamicInput
                            label="class"
                            db_column="icon"
                            formData={inputField}
                            setFormData={setInputField}
                        />
                    </div>
                </div>
                <div className="col-sm-3 form-group">
                    <label htmlFor="label">Label</label>
                    <input
                        className="form-control my-2"
                        name="label"
                        value={inputField.label}
                        onChange={e => handleInputField(e)}
                    />
                </div>
                <div className="row">
                    <div className="col">
                        <TextEditor
                            name="value"
                            value={richText.value}
                            height="400px"
                            onChange={handleRichTextEditor}
                        />
                        {/* <textarea
                            type="textarea"
                            name="value"
                            className={`form-control form-control-sm`}
                            rows="10"
                            onChange={e => handleRichTextEditor(e)}
                            value={richText.value}
                        /> */}
                    </div>
                </div>

                <div className="d-flex flex-row justify-content-end my-2">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                handleUpdateComponentData();
                                setShow(false);
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </ErrorBoundary>
    );
}

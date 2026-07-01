import React, { useContext, useEffect, useState } from "react";
import TextEditor from "../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import PageContext from "../../Context/PageContext";
import DynamicRadio from "../../../../../components/dynamic-radio/radio";
import DynamicInput from "../../../../../components/dynamic-input/DynamicInput";

export default function HTMLPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const pageContext = useContext(PageContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});
    const [richText, setRichText] = useState({});

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            let componentData = context.selectedComponent.data;
            let htmlId = componentData.html_id;
            let prevHtmlCollection = { ...pageContext.htmlCollection };
            let data = prevHtmlCollection[htmlId];

            setCurrentComponent(context.selectedComponent);
            setInputField(componentData);
            setRichText({ value: data });
        }
    }, [context.selectedComponent]);

    const handleRichTextEditor = event => {
        let key = event.target.name;
        let value = event.target.value;
        let data = { ...richText, [key]: value };

        setRichText(data);
    };

    const handleInputField = event => {
        let key = event.target?.name;
        let value = event.target.value;
        let _inputField = { ...inputField, [key]: value };

        setInputField(_inputField);
    };

    const handleUpdateComponentData = () => {
        let prevHtmlCollection = { ...pageContext.htmlCollection };
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        if (tempData.html_id) delete prevHtmlCollection[tempData.html_id];

        let id = `${makeid(8)}`;
        let value = richText.value;
        let newHtmlCollection = { ...prevHtmlCollection, [id]: value };

        pageContext.setHtmlCollection(newHtmlCollection);

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
                            handleChange={item =>
                                setInputField(prev => ({
                                    ...prev,
                                    collapse: item,
                                }))
                            }
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
                            handleChange={item =>
                                setInputField(prev => ({
                                    ...prev,
                                    position: item,
                                }))
                            }
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
            <div className="mb-2">
                <label
                    htmlFor="editor"
                    className="mb-2 fw-bold">
                    Html Editor
                </label>
                <TextEditor
                    name="value"
                    value={richText.value}
                    height="220px"
                    onChange={handleRichTextEditor}
                />
            </div>
            <div className="d-flex flex-row justify-content-end my-1">
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
        </ErrorBoundary>
    );
}

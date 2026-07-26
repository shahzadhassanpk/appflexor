import React, { useState, useContext, useEffect } from "react";
import DesignerContext from "../../../Context/DesignerContext";

export const SubmitFormPropsEditor = ({
    setShow,
    componentData,
    setComponentData,
    handleChangeEvent,
}) => {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [actionUrl, setActionUrl] = useState(componentData.actionUrl || "");
    const [buttonLabel, setButtonLabel] = useState(
        componentData.buttonLabel || "Submit",
    );
    const [inputs, setInputs] = useState(componentData.inputs || {});
    const [inputField, setInputField] = useState({});
    const inputArray = Object.entries(inputs);

    useEffect(() => {
        if (
            context.selectedComponent &&
            !isEmpty(context.selectedComponent) 
        ) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;
            setInputField(componentData);
        }
    }, [context.selectedComponent]);

    function getObjectById(arr, idField, idValue) {
        return arr.find(obj => obj[idField] === idValue);
    }

    function isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
    }

    const handleInputChange = (index, field, value) => {
        const updated = [...inputArray];
        updated[index] =
            field === "name"
                ? [value, updated[index][1]]
                : [updated[index][0], value];
        setInputs(Object.fromEntries(updated));
    };

    const addInput = () => {
        setInputs({ ...inputs, [`field_${Date.now()}`]: "" });
    };

    const removeInput = name => {
        const updated = { ...inputs };
        delete updated[name];
        setInputs(updated);
    };

    const handleSave = () => {
        let _components = { ...context.components };
        let componentId = currentComponent.id;        
        const newData = { actionUrl, inputs, buttonLabel };
        _components[currentComponent.id].data = newData;
        setComponentData(newData);
        context.setComponents(_components);
        setShow(false);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let componentId = currentComponent.id;
        let tempData = _components[componentId].data;

        _components[componentId].data = tempData;
        context.setComponents(_components);
    };

    return (
        <div className="p-3">
            <div className="mb-3">
                <label className="form-label">Action URL</label>
                <input
                    type="text"
                    className="form-control"
                    value={actionUrl}
                    onChange={e => setActionUrl(e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Inputs</label>
                {inputArray.map(([name, value], index) => (
                    <div
                        key={name || index}
                        className="d-flex mb-2">
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Name"
                            value={name}
                            onChange={e =>
                                handleInputChange(index, "name", e.target.value)
                            }
                        />
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Value"
                            value={value}
                            onChange={e =>
                                handleInputChange(
                                    index,
                                    "value",
                                    e.target.value,
                                )
                            }
                        />
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeInput(name)}>
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={addInput}>
                    Add Input
                </button>
            </div>

            <div className="mb-3">
                <label className="form-label">Button Label</label>
                <input
                    type="text"
                    className="form-control"
                    value={buttonLabel}
                    onChange={e => setButtonLabel(e.target.value)}
                />
            </div>

            <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}>
                Save
            </button>
        </div>
    );
};

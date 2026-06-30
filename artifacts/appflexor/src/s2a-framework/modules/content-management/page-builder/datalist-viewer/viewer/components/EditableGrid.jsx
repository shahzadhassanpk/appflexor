import React from "react";
import { modeType } from "../../../Designer/Designer";
import { componentList } from "../../../../../data-management/form-builder/Designer/ComponentRegistry";
import { useState } from "react";
import { useEffect } from "react";
import { isEmpty } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";

export default function EditableGrid(props) {
    const { row, column, components, handleInputFields, handleOnFieldBlur } =
        props;
    const { datatype } = column;

    const [component, setComponent] = useState({});

    useEffect(() => {
        if (!isEmpty(components)) {
            let _component = components[column.id];
            if (_component) {
                setComponent(_component);
            }
        }
    }, [components]);

    if (!isEmpty(component))
        return CreateComponent(
            datatype,
            component,
            componentList,
            row.original,
            handleInputFields,
            handleOnFieldBlur,
            props.mode,
        );
    else return <span></span>;
}

function CreateComponent(
    datatype,
    component = {},
    componentList = [],
    formData = {},
    handleInputFields,
    handleOnFieldBlur,
    mode = modeType.render,
    formDetails = {},
    // images = {},
    // htmlCollection = {},
) {
    const isInDatalistMode = true;
    let comp = componentList[datatype];
    if (typeof comp !== "undefined") {
        return React.createElement(comp, {
            key: component.id,
            component,
            mode: mode,
            modeType: modeType,
            handleInputFields,
            handleOnFieldBlur,
            formData,
            formDetails,
            isInDatalistMode,
            // images,
            // htmlCollection,
        });
    }
    return React.createElement(
        () => (
            <div
                // style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="">
                        The Component for{" "}
                        <span className="text-danger">{component.type}</span>{" "}
                        has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id },
    );
}

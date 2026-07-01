import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDrag } from "react-dnd";
import DesignerContext from "../../Context/DesignerContext";
import { COMPONENT, componentList } from "../ComponentRegistry";
import { modeType } from "../Designer";
import Component from "./Component";

const Wrapper = ({ componentData, components, htmlCollection, path }) => {
    // console.log({ componentData, components });
    const context = useContext(DesignerContext);
    const ref = useRef(null);

    const [componentProps, setComponentProps] = useState([]);

    // let propertyChangeListener = null;

    const [{ isDragging }, drag] = useDrag({
        item: {
            id: componentData.id,
            type: COMPONENT,
            path: path,
        },
        type: COMPONENT,
        canDrag: !context.forbidDrag,
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(ref);
    const component = components[componentData.id];
    component.path = path;
    const isSelected = context.selectedComponent.id === componentData.id;

    let componentStyles = classNames({
        move: !context.forbidDrag,
        default: context.forbidDrag,
    });

    function setComponentPropsData(dataToSet, componentDetails) {
        // console.log({ dataToSet, componentDetails });
        let _components = { ...context.components };
        let tempComponentData = _components[componentDetails.id];

        // previous
        // tempComponentData = { ...tempComponentData, ...dataToSet }

        //  current
        tempComponentData = {};
        tempComponentData = { ...dataToSet };

        // end

        // localStorage.setItem(componentData.id, propsStr);
        // tempComponentData.data = id;
        _components[componentDetails.id].data = { ...tempComponentData };
        context.setComponents(_components);
        // setComponentProps(propsStr);
    }

    return (
        <Component
            component={component}
            isSelected={isSelected}>
            <div
                ref={ref}
                style={{ opacity }}
                className={`s2a-component-wrapper draggable ${
                    isSelected ? "component-outline component" : ""
                } ${componentStyles}`}
                onClick={() => context.handleSelectComponent(component)}>
                {CreateComponent(
                    component,
                    componentList,
                    modeType.design,
                    modeType,
                    setComponentPropsData,
                    context.selectedComponent.id,
                    htmlCollection,
                )}
            </div>
        </Component>
    );
};

function CreateComponent(
    component,
    componentList,
    mode,
    modeType,
    setComponentPropsData,
    activeComponentId,
    htmlCollection,
) {
    if (typeof componentList[component.type] !== "undefined") {
        try {
            return React.createElement(componentList[component.type], {
                key: component.id,
                component,
                htmlCollection,
                mode,
                modeType,
                setComponentPropsData,
                activeComponentId,
            });
        } catch (error) {
            console.log(error);
            return <div>{JSON.stringify(error)}</div>;
        }
    }
    return React.createElement(
        () => (
            <div
                style={{ minHeight: "50px" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="fs-3">
                        {" "}
                        The Component for{" "}
                        <span className="text-danger">
                            {component.type}
                        </span>{" "}
                        has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id },
    );
}
export default Wrapper;

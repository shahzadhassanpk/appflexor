import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import AppContext from "./AppContext";
import Component from "./Component";
import { COMPONENT, componentList } from "./ComponentRegistry";

const Wrapper = ({ componentData, components, htmlCollection, path }) => {
    // console.log({ componentData, components });
    const context = useContext(AppContext);
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

    function setLayoutPostId(id, componentData) {
        let _components = { ...context.components };
        let tempComponentData = _components[componentData.id];
        tempComponentData.props.post_id = id;
        _components[component.id] = { ...tempComponentData };
        context.setComponents(_components);
    }

    return (
        <Component
            component={component}
            isSelected={isSelected}>
            <div
                ref={ref}
                style={{ opacity }}
                className={` draggable ${
                    isSelected ? "outlineBlue component" : ""
                } ${componentStyles}`}
                onClick={() => context.handleSelectComponent(component)}>
                {CreateComponent(
                    component,
                    componentList,
                    htmlCollection,
                    "DESIGN_MODE",
                    setComponentPropsData,
                    context.selectedComponent.id,
                )}
            </div>
        </Component>
    );
};

function CreateComponent(
    component,
    componentList,
    htmlCollection,
    mode,
    setComponentPropsData,
    activeComponentId,
) {
    if (typeof componentList[component.type] !== "undefined") {
        try {
            return React.createElement(componentList[component.type], {
                key: component.id,
                component,
                htmlCollection,
                mode,
                setComponentPropsData,
                activeComponentId,
                componentList,
            });
        } catch (error) {
            console.log(error);
            return <div>{JSON.stringify(error)}</div>;
        }
    }
    return React.createElement(
        () => (
            <div
                style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center vh-100">
                <div className="text-center">
                    <p className="fs-3">
                        {" "}
                        The Component for{" "}
                        <span className="text-danger">{component.id}</span> has
                        not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id },
    );
}
export default Wrapper;

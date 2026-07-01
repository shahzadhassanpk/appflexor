import React, { useContext, useEffect, useRef, useState } from "react";
import AppContext from "./AppContext";
const style = {};

const Component = ({ component, isSelected, children }) => {
    const context = useContext(AppContext);
    const [showConfig, setShowConfig] = useState(false);

    // useEffect(() => {
    //     if (context) {
    // let _components = { ...context.components };
    // let currentComponent =
    //     _components[context.selectedComponent.id];
    // currentComponent = {
    //     ...currentComponent,
    //     getProps: getComponentProps,
    // };
    // _components[context.selectedComponent.id] =
    //     currentComponent;
    // context.setComponents(_components);
    // }
    // }, [context]);

    useEffect(() => {
        if (isSelected) {
            setShowConfig(true);
        } else {
            setShowConfig(false);
        }
    }, [isSelected]);

    return (
        <div
            className={`position-relative ${
                showConfig && showConfig
                    ? `selected-component`
                    : `not-selected-component`
            }`}
        >
            {showConfig && (
                <span
                    onClick={() => {
                        context.handleRemoveFromLayput(
                            context.selectedComponent
                        );
                    }}
                    className="fa-solid fa-trash pointer text-danger m-2 position-absolute top-0 end-0"
                ></span>
            )}
            {/* {showConfig && <ConfigTooltip title={component.type} />} */}
            {children}
        </div>
    );
};

export default Component;

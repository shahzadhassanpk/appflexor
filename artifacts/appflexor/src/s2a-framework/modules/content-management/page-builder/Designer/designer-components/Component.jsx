import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import { write } from "../../../../../utils/localStorage";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import DesignerContext from "../../Context/DesignerContext";
import { createInstanceOfComponentForCopy } from "../helpers/dnd-helpers";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";

const Component = ({ component, isSelected, children }) => {
    const context = useContext(DesignerContext);
    const [showConfig, setShowConfig] = useState(false);

    function copyToClipboard() {
        const components = context.components;
        const htmlCollection = context.htmlCollection;
        const currentComponent = structuredClone(context.selectedComponent);

        if (currentComponent) {
            const newComponent = createInstanceOfComponentForCopy(
                currentComponent,
                components,
                htmlCollection,
            );
            write("page.component", newComponent);
            toastEmitter(`Copied to clipboard.`);
        } else {
            toastEmitter(`Failed to copy.`, true, "error");
        }
    }

    useEffect(() => {
        if (isSelected) {
            setShowConfig(true);
        } else {
            setShowConfig(false);
        }
    }, [isSelected]);

    const renderTooltip = (props, text) => (
        <Tooltip
            id="selected-component-tooltip"
            {...props}>
            {text}
        </Tooltip>
    );

    return (
        <div
            className={`position-relative ${
                showConfig && showConfig
                    ? `selected-component`
                    : `not-selected-component`
            }`}>
            {showConfig && (
                <div>
                    {/* <div
                        style={{
                            zIndex: 4,
                        }}
                        className="pointer position-absolute top-0 end-1"
                        onClick={copyToClipboard}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Copy Component")
                            }>
                            <span className="fa-solid fa-copy text-light m-2"></span>
                        </OverlayTrigger>
                    </div> */}
                    <div
                        style={{
                            zIndex: 4,
                        }}
                        className="pointer position-absolute top-0 end-0"
                        onClick={() => {
                            context.removeComponent();
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Remove Component")
                            }>
                            <span className="fa-solid fa-trash  text-danger m-2"></span>
                        </OverlayTrigger>
                    </div>
                </div>
            )}
            {/* {showConfig && <ConfigTooltip title={component.type} />} */}
            {children}
        </div>
    );
};

export default Component;

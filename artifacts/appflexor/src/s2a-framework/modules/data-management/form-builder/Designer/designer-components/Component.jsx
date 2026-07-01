import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import DesignerContext from "../../Context/DesignerContext";
import { read, write } from "../../../../../utils/localStorage";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import { COMPONENTS_STORED_IN_LAYOUT } from "../ComponentRegistry";
import { createInstanceOfComponentForCopy } from "../helpers/dnd-helpers";
import { makeid } from "../../../../../utils/utils";

const Component = ({ component, isSelected, children }) => {
    const context = useContext(DesignerContext);
    const path = component.path || "";

    const splittedPath = path.split("-");
    const rowIndex = Number(splittedPath[0]);
    const colIndex = Number(splittedPath[1]);
    const componentIndex = Number(splittedPath[2]);

    const [showConfig, setShowConfig] = useState(false);

    function copyToClipboard() {
        const components = context.components;
        const htmlCollection = context.htmlCollection;
        const images = context.images;
        const currentComponent = structuredClone(context.selectedComponent);

        if (currentComponent) {
            const newComponent = createInstanceOfComponentForCopy(
                currentComponent,
                components,
                htmlCollection,
                images,
            );
            write("form.component", newComponent);
            toastEmitter(`Copied to clipboard.`);
        } else {
            toastEmitter(`Failed to copy.`, true, "error");
        }
    }

    function pasteComponentAbove() {
        const componentFromClipboard = read("form.component");
        const type = componentFromClipboard?.componentData?.type;

        if (!type || !componentFromClipboard) {
            toastEmitter(
                `Clipbaord data is invalid. Please copy component again.`,
                true,
                "error",
            );
        } else {
            if (type == "HTML") {
                let htmlCollection = structuredClone(context.htmlCollection);
                const newHtmlId = makeid(8);
                componentFromClipboard.componentData.data.html_id = newHtmlId;
                htmlCollection[newHtmlId] =
                    componentFromClipboard.content.htmlCollection;

                context.setHtmlCollection(htmlCollection);
            }

            if (type == "imageview") {
                let images = structuredClone(context.images);

                const newImageId = makeid(8);
                componentFromClipboard.componentData.data.image_id = newImageId;
                images[newImageId] = componentFromClipboard.content.images;

                context.setImages(images);
            }
            const updatedLayout = structuredClone(context.layout);
            const newComponentId = makeid(8);

            // added new component id to layout
            const right = updatedLayout[rowIndex].children[colIndex].children;
            const temp = [
                {
                    id: newComponentId,
                    type: "component",
                },
            ];

            updatedLayout[rowIndex].children[colIndex].children = [
                ...temp,
                ...right,
            ];

            let newComponent = {
                ...componentFromClipboard.componentData,
                id: newComponentId,
            };

            context.setLayout(updatedLayout);

            context.setComponents({
                ...context.components,
                [newComponentId]: newComponent,
            });
        }
    }

    function pasteComponentBelow() {
        const componentFromClipboard = read("form.component");
        const type = componentFromClipboard?.componentData?.type;
        if (!type || !componentFromClipboard) {
            toastEmitter(
                `Clipbaord data is invalid. Please copy component again.`,
                true,
                "error",
            );
        } else {
            if (type == "HTML") {
                let htmlCollection = structuredClone(context.htmlCollection);
                const newHtmlId = makeid(8);
                componentFromClipboard.componentData.data.html_id = newHtmlId;
                htmlCollection[newHtmlId] =
                    componentFromClipboard.content.htmlCollection;

                context.setHtmlCollection(htmlCollection);
            }

            if (type == "imageview") {
                let images = structuredClone(context.images);

                const newImageId = makeid(8);
                componentFromClipboard.componentData.data.image_id = newImageId;
                images[newImageId] = componentFromClipboard.content.images;

                context.setImages(images);
            }
            const updatedLayout = structuredClone(context.layout);
            const newComponentId = makeid(8);

            const temp = [
                {
                    id: newComponentId,
                    type: "component",
                },
            ];

            const left = updatedLayout[rowIndex].children[
                colIndex
            ].children.slice(0, componentIndex + 1);

            const right = updatedLayout[rowIndex].children[
                colIndex
            ].children.slice(componentIndex + 1);

            let newComponent = {
                ...componentFromClipboard.componentData,
                id: newComponentId,
            };

            updatedLayout[rowIndex].children[colIndex].children = [
                ...left,
                ...temp,
                ...right,
            ];

            context.setLayout(updatedLayout);

            context.setComponents({
                ...context.components,
                [newComponentId]: newComponent,
            });
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

    const hideCopyAction =
        componentIndex + 1 !=
        context.layout[rowIndex].children[colIndex].children.length;

    return (
        <div
            className={`position-relative ${
                showConfig && showConfig
                    ? `selected-component`
                    : `not-selected-component`
            }`}>
            {/* {componentIndex == "0" && (
                <span className="z-3 position-absolute component-paste-top-actions">
                    <span
                        className="pointer me-1 inline-block "
                        onClick={pasteComponentAbove}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Paste component here")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </span>
                </span>
            )} */}
            {showConfig && (
                <div className="position-absolute d-flex flex-row-reverse component-copy-actions">
                    
                    <span
                        style={{
                            zIndex: 4,
                        }}
                        className="pointer me-1 inline-block"
                        onClick={() => {
                            context.removeComponent();
                        }}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Delete Component")
                            }>
                            <span className="fa-solid fa-trash  text-danger m-1"></span>
                        </OverlayTrigger>
                    </span>
                    <span
                        className="pointer me-1 inline-block "
                        onClick={copyToClipboard}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Copy component")
                            }>
                            <span className="fa-solid fa-copy m-1"></span>
                        </OverlayTrigger>
                    </span>
                </div>
            )}
            {/* {showConfig && <ConfigTooltip title={component.type} />} */}
            {children}
            {/* <span className="z-3 position-absolute component-paste-bottom-actions">
                <span
                    className="pointer me-1 inline-block "
                    onClick={pasteComponentBelow}>
                    <OverlayTrigger
                        overlay={props =>
                            renderTooltip(props, "Paste component here")
                        }>
                        <span className="fa-solid fa-paste m-1"></span>
                    </OverlayTrigger>
                </span>
            </span> */}
        </div>
    );
};

export default Component;

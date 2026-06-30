import { makeid } from "../../../../../utils/utils";
import {
    COLUMN,
    COMPONENT,
    COMPONENTS_STORED_IN_LAYOUT,
    ROW,
} from "../ComponentRegistry";

// a little function to help us with reordering the result
export const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed); // inserting task in new index

    return result;
};

export const remove = (arr, index) => [
    // part of the array before the specified index
    ...arr.slice(0, index),
    // part of the array after the specified index
    ...arr.slice(index + 1),
];

export const insert = (arr, index, newItem) => [
    // part of the array before the specified index
    ...arr.slice(0, index),
    // inserted item
    newItem,
    // part of the array after the specified index
    ...arr.slice(index),
];

export const reorderChildren = (children, splitDropZonePath, splitItemPath) => {
    if (splitDropZonePath.length === 1) {
        const dropZoneIndex = Number(splitDropZonePath[0]);
        const itemIndex = Number(splitItemPath[0]);
        return reorder(children, itemIndex, dropZoneIndex);
    }

    const updatedChildren = [...children];

    const curIndex = Number(splitDropZonePath.slice(0, 1));

    // Update the specific node's children
    const splitDropZoneChildrenPath = splitDropZonePath.slice(1);
    const splitItemChildrenPath = splitItemPath.slice(1);
    const nodeChildren = updatedChildren[curIndex];
    updatedChildren[curIndex] = {
        ...nodeChildren,
        children: reorderChildren(
            nodeChildren.children,
            splitDropZoneChildrenPath,
            splitItemChildrenPath,
        ),
    };

    return updatedChildren;
};

export const removeChildFromChildren = (children, splitItemPath) => {
    if (splitItemPath.length === 1) {
        const itemIndex = Number(splitItemPath[0]);
        return remove(children, itemIndex);
    }

    const updatedChildren = [...children];

    const curIndex = Number(splitItemPath.slice(0, 1));

    // Update the specific node's children
    const splitItemChildrenPath = splitItemPath.slice(1);
    const nodeChildren = updatedChildren[curIndex];
    updatedChildren[curIndex] = {
        ...nodeChildren,
        children: removeChildFromChildren(
            nodeChildren.children,
            splitItemChildrenPath,
        ),
    };

    return updatedChildren;
};

export const addChildToChildren = (children, splitDropZonePath, item) => {
    if (splitDropZonePath.length === 1) {
        const dropZoneIndex = Number(splitDropZonePath[0]);
        return insert(children, dropZoneIndex, item);
    }

    const updatedChildren = [...children];

    const curIndex = Number(splitDropZonePath.slice(0, 1));

    // Update the specific node's children
    const splitItemChildrenPath = splitDropZonePath.slice(1);
    const nodeChildren = updatedChildren[curIndex];
    updatedChildren[curIndex] = {
        ...nodeChildren,
        children: addChildToChildren(
            nodeChildren.children,
            splitItemChildrenPath,
            item,
        ),
    };

    return updatedChildren;
};

export const handleMoveWithinParent = (
    layout,
    splitDropZonePath,
    splitItemPath,
) => {
    return reorderChildren(layout, splitDropZonePath, splitItemPath);
};

export const handleAddColumDataToRow = layout => {
    const layoutCopy = [...layout];
    const COLUMN_STRUCTURE = {
        type: COLUMN,
        id: `${makeid(8)}`,
        classes: "col-sm",
        children: [],
    };

    return layoutCopy.map(row => {
        if (!row.children.length) {
            row.children = [COLUMN_STRUCTURE];
        }
        return row;
    });
};

export const handleMoveToDifferentParent = (
    layout,
    splitDropZonePath,
    splitItemPath,
    item,
) => {
    let newLayoutStructure;
    const COLUMN_STRUCTURE = {
        type: COLUMN,
        id: `${makeid(8)}`,
        classes: "col-sm",
        children: [item],
    };

    const ROW_STRUCTURE = {
        type: ROW,
        id: `${makeid(8)}`,
    };
    switch (splitDropZonePath.length) {
        case 1: {
            // moving column outside into new row made on the fly
            if (item.type === COLUMN) {
                newLayoutStructure = {
                    ...ROW_STRUCTURE,
                    children: [item],
                };
            } else {
                // moving component outside into new row made on the fly
                newLayoutStructure = {
                    ...ROW_STRUCTURE,
                    children: [COLUMN_STRUCTURE],
                };
            }
            break;
        }
        case 2: {
            // moving component outside into a row which creates column
            if (item.type === COMPONENT) {
                newLayoutStructure = COLUMN_STRUCTURE;
            } else {
                // moving column into existing row
                newLayoutStructure = item;
            }

            break;
        }
        default: {
            newLayoutStructure = item;
        }
    }

    let updatedLayout = layout;
    updatedLayout = removeChildFromChildren(updatedLayout, splitItemPath);
    updatedLayout = handleAddColumDataToRow(updatedLayout);
    updatedLayout = addChildToChildren(
        updatedLayout,
        splitDropZonePath,
        newLayoutStructure,
    );

    return updatedLayout;
};

export const handleMoveSidebarComponentIntoParent = (
    layout,
    splitDropZonePath,
    item,
) => {
    let newLayoutStructure;
    switch (splitDropZonePath.length) {
        case 1: {
            newLayoutStructure = {
                type: ROW,
                id: `${makeid(8)}`,
                children: [
                    {
                        type: COLUMN,
                        id: `${makeid(8)}`,
                        classes: "col-sm",
                        children: item ? [item] : [],
                    },
                ],
            };
            break;
        }
        case 2: {
            newLayoutStructure = {
                type: COLUMN,
                id: `${makeid(8)}`,
                classes: "col-sm",
                children: item ? [item] : [],
            };
            break;
        }
        default: {
            newLayoutStructure = item;
        }
    }

    return addChildToChildren(layout, splitDropZonePath, newLayoutStructure);
};

export const handleRemoveItemFromLayout = (layout, splitItemPath) => {
    return removeChildFromChildren(layout, splitItemPath);
};

export const createInstanceOfRowForCopy = (
    currentRow,
    components,
    htmlCollection,
    images,
) => {
    let thisImages = {};
    let thisHtmlCollection = {};
    let newComponents = {};
    let children = [];

    currentRow.children.map(childColumn => {
        const newColumnId = makeid(8);
        const newColumnChildren = [];

        childColumn.children.map(child => {
            const newComponentId = makeid(8);
            const thisComponent = structuredClone(components[child.id]);

            const childType = COMPONENTS_STORED_IN_LAYOUT.includes(
                thisComponent.type,
            )
                ? thisComponent.type
                : "component";
            // ;
            if (childType == "HTML") {
                const newHTMLId = makeid(8);
                let id = thisComponent.data.html_id;
                thisComponent.data.html_id = newHTMLId;
                thisHtmlCollection[newHTMLId] = htmlCollection[id];
            }

            if (childType == "imageview") {
                const newImageId = makeid(8);
                let id = thisComponent.data.image_id;
                thisComponent.data.image_id = newImageId;
                thisImages[newImageId] = images[id];
            }

            newComponents[newComponentId] = {
                ...thisComponent,
                id: newComponentId,
            };

            newColumnChildren.push({
                id: newComponentId,
                type: "component",
            });
        });

        const newColumn = {
            id: newColumnId,
            type: childColumn.type,
            classes: childColumn.classes,
            className: childColumn.className,
            title: childColumn.title,
            classNames: childColumn.classNames,
            children: newColumnChildren,
            ...(childColumn.visibilityExpression && {
                visibilityExpression: childColumn.visibilityExpression,
            }),
        };

        children.push(newColumn);
        // ;
    });
    const newRow = {
        data: {
            children,
            type: "row",
            id: "new",
            ...(currentRow.visibilityExpression && {
                visibilityExpression: currentRow.visibilityExpression,
            }),
            ...(currentRow.enableTabView && {
                enableTabView: currentRow.enableTabView,
            }),
        },
        content: {
            images: thisImages,
            htmlCollection: thisHtmlCollection,
            components: newComponents,
        },
    };
    return newRow;
};
export const createInstanceOfColumnForCopy = (
    currentColumn,
    components,
    htmlCollection,
    images,
) => {
    let newImages = {};
    let newHtmlCollection = {};
    let newComponents = {};
    let newChildren = [];
    currentColumn.children.map(child => {
        const newComponentId = makeid(8);
        const thisComponent = structuredClone(components[child.id]);
        const type = COMPONENTS_STORED_IN_LAYOUT.includes(thisComponent.type)
            ? thisComponent.type
            : "component";

        if (type == "HTML") {
            const newHTMLId = makeid(8);
            let id = thisComponent.data.html_id;
            thisComponent.data.html_id = newHTMLId;
            newHtmlCollection[newHTMLId] = htmlCollection[id];
        }

        if (type == "imageview") {
            const newImageId = makeid(8);
            let id = thisComponent.data.image_id;
            thisComponent.data.image_id = newImageId;
            newImages[newImageId] = images[id];
        }

        newComponents[newComponentId] = {
            ...thisComponent,
            id: newComponentId,
        };
        newChildren.push({ ...child, id: newComponentId });
    });

    const newColumn = {
        data: {
            id: "new",
            type: "DB Column",
            classes: currentColumn.classes,
            className: currentColumn.className,
            title: currentColumn.title,
            classNames: currentColumn.classNames,
            children: newChildren,
            ...(currentColumn.visibilityExpression && {
                visibilityExpression: currentColumn.visibilityExpression,
            }),
        },
        content: {
            images: newImages,
            htmlCollection: newHtmlCollection,
            components: newComponents,
        },
    };
    return newColumn;
};

export const createInstanceOfComponentForCopy = (
    currentComponent,
    components,
    htmlCollection,
    images,
) => {
    let newImage = "";
    let newHTML = "";

    const thisComponent = structuredClone(components[currentComponent.id]);
    const type = COMPONENTS_STORED_IN_LAYOUT.includes(thisComponent.type)
        ? thisComponent.type
        : "component";

    if (type == "HTML") {
        let id = thisComponent.data.html_id;
        thisComponent.data.html_id = "new";
        newHTML = htmlCollection[id];
    }

    if (type == "imageview") {
        let id = thisComponent.data.image_id;
        thisComponent.data.image_id = "new";
        newImage = images[id];
    }

    const newComponent = {
        componentData: {
            ...thisComponent,
            type: thisComponent.type,
            id: "new",
        },
        content: {
            images: newImage,
            htmlCollection: newHTML,
        },
    };

    return newComponent;
};

export const createInstanceOfRowForPaste = row => {
    const currentRow = structuredClone(row);
    const images = { ...currentRow.content.images };
    const htmlCollection = { ...currentRow.content.htmlCollection };
    const components = { ...currentRow.content.components };

    let newImages = {};
    let newHtmlCollection = {};
    let newComponents = {};
    let newRow = {};
    let newChildren = []; // row children == DB Columns

    currentRow.data.children.map(childColumn => {
        const newColumnId = makeid(8);
        const newColumnChildren = [];
        childColumn.children.map(child => {
            const newComponentId = makeid(8);
            const thisComponent = structuredClone(components[child.id]);

            const childType = COMPONENTS_STORED_IN_LAYOUT.includes(
                thisComponent.type,
            )
                ? thisComponent.type
                : "component";
            // ;
            if (childType == "HTML") {
                const newHTMLId = makeid(8);
                let id = thisComponent.data.html_id;
                thisComponent.data.html_id = newHTMLId;
                newHtmlCollection[newHTMLId] = htmlCollection[id];
            }

            if (childType == "imageview") {
                const newImageId = makeid(8);
                let id = thisComponent.data.image_id;
                thisComponent.data.image_id = newImageId;
                newImages[newImageId] = images[id];
            }

            newComponents[newComponentId] = {
                ...thisComponent,
                id: newComponentId,
            };

            newColumnChildren.push({
                id: newComponentId,
                type: "component",
            });
        });
        const newColumn = {
            id: newColumnId,
            type: childColumn.type,
            className: childColumn.className,
            classes: childColumn.classes,
            title: childColumn.title,
            classNames: childColumn.classNames,
            children: newColumnChildren,
            ...(childColumn.visibilityExpression && {
                visibilityExpression: childColumn.visibilityExpression,
            }),
        };

        newChildren.push(newColumn);
    });
    console.log(currentRow);

    newRow = {
        data: {
            id: makeid(8),
            type: currentRow.data.type,
            children: newChildren,
            classes: currentRow.data.classes,
            ...(currentRow.data.visibilityExpression && {
                visibilityExpression: currentRow.data.visibilityExpression,
            }),
            ...(currentRow.data.enableTabView && {
                enableTabView: currentRow.data.enableTabView,
            }),
        },
        content: {
            images: newImages,
            htmlCollection: newHtmlCollection,
            components: newComponents,
        },
    };
    return newRow;
};

export const createInstanceOfColumnForPaste = column => {
    const currentColumn = structuredClone(column);
    const images = { ...currentColumn.content.images };
    const htmlCollection = { ...currentColumn.content.htmlCollection };
    const components = { ...currentColumn.content.components };

    let newImages = {};
    let newHtmlCollection = {};
    let newComponents = {};
    let newColumn = {};
    let newChildren = []; // row children == DB Columns

    currentColumn.data.children.map(child => {
        const newComponentId = makeid(8);
        const thisComponent = structuredClone(components[child.id]);

        const childType = COMPONENTS_STORED_IN_LAYOUT.includes(
            thisComponent.type,
        )
            ? thisComponent.type
            : "component";
        // ;
        if (childType == "HTML") {
            const newHTMLId = makeid(8);
            let id = thisComponent.data.html_id;
            thisComponent.data.html_id = newHTMLId;
            newHtmlCollection[newHTMLId] = htmlCollection[id];
        }

        if (childType == "imageview") {
            const newImageId = makeid(8);
            let id = thisComponent.data.image_id;
            thisComponent.data.image_id = newImageId;
            newImages[newImageId] = images[id];
        }

        newComponents[newComponentId] = {
            ...thisComponent,
            id: newComponentId,
        };

        newChildren.push({
            id: newComponentId,
            type: "component",
        });
    });
    newColumn = {
        data: {
            id: makeid(8),
            type: currentColumn.data.type,
            children: newChildren,
            classes: currentColumn.data.classes,
            className: currentColumn.data.className,
            title: currentColumn.data.title,
            classNames: currentColumn.data.classNames,
            ...(currentColumn.data.visibilityExpression && {
                visibilityExpression: currentColumn.data.visibilityExpression,
            }),
        },
        content: {
            images: newImages,
            htmlCollection: newHtmlCollection,
            components: newComponents,
        },
    };
    return newColumn;
};

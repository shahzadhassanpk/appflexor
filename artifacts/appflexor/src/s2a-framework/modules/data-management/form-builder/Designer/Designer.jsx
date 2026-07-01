import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import React, {
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { Modal } from "react-bootstrap";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { components } from "react-select";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { API_URL } from "../../../../Config";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import DesignerContext from "../Context/DesignerContext";
import FormContext from "../Context/FormContext";

import {
    COLUMN,
    COMPONENT,
    ROW,
    SIDEBAR_ITEM,
    SIDEBAR_ITEMS,
} from "./ComponentRegistry";
import DropZone from "./designer-components/DropZone";
import Row from "./designer-components/Row";
import { Settings } from "./designer-components/Settings";
import SideBarItem from "./designer-components/SideBarItem";
import TrashDropZone from "./designer-components/TrashDropZone";
import FormPreviewModal from "./FormPreviewModal";
import {
    createInstanceOfRowForPaste,
    handleMoveSidebarComponentIntoParent,
    handleMoveToDifferentParent,
    handleMoveWithinParent,
    handleRemoveItemFromLayout,
} from "./helpers/dnd-helpers";

import "./styles.css";
import { disposeTooltip, enableTooltip, makeid } from "../../../../utils/utils";
import { read } from "../../../../utils/localStorage";
import { toastEmitter } from "../../../../components/Toastify/Toastify";

export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

const INITIAL_DESIGN = {
    layout: [],
    components: {},
    images: {},
    htmlCollection: {},
};

const Designer = ({ updateData, setDesignMode }) => {
    const formContext = useContext(FormContext);

    const [forbidDrag, setForbidDrag] = useState(false);
    const [selectedRow, setSelectedRow] = useState({});
    const [selectedColumn, setSelectedColumn] = useState({});
    const [selectedComponent, setSelectedComponent] = useState({});
    // const fields =
    //     selectedForm.fields !== "" && typeof selectedForm.fields === "string"
    //         ? JSON.parse(selectedForm.fields)
    //         : selectedForm.fields;
    // const [filteredFields, setFilteredFields] = useState(fields);
    const [filteredFields, setFilteredFields] = useState(SIDEBAR_ITEMS);
    const textAreaRef = useRef(null);
    const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);
    const [showEditRowDialogue, setShowEditRowDialogue] = useState(false);
    const [showEditColumnDialogue, setShowEditColumnDialogue] = useState(false);
    const [showFormCloseDialogue, setShowFormCloseDialogue] = useState(false);

    const [isCopied, setIsCopied] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [designJson, setDesignJson] = useState("");
    const [toggleDelete, setToggleDelete] = useState({
        row: { current: false, path: "" },
        column: { current: false, path: "" },
        component: { current: false, path: "" },
    });

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        const currentDesign = {
            layout: formContext.layout,
            components: formContext.components,
            images: formContext.images,
            htmlCollection: formContext.htmlCollection,
        };

        let str = JSON.stringify(currentDesign, undefined, 4);

        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.innerHTML = str;
        }
        setDesignJson(str);
    }, [
        formContext.selectedForm,
        formContext.selectedFormPage,
        formContext.layout,
        formContext.components,
        formContext.images,
        formContext.htmlCollection,
    ]);

    const handleDrop = useCallback(
        (dropZone, item) => {
            const splitDropZonePath = dropZone.path.split("-");
            const pathToDropZone = splitDropZonePath.slice(0, -1).join("-");

            const newLayoutItem = {
                id: item.id,
                type: item.type,
            };

            if (item.type === COLUMN) {
                newLayoutItem.children = item.children;
            }

            if (item.type === SIDEBAR_ITEM) {
                // 1. Move side bar item into page

                // shallow copy - orignal
                // const newComponent = {
                //     id: `component-id-${uuidv4()}`,
                //     ...item.component,
                // };

                // deep copy - updated
                let currentProps = [...item.component.props];
                let updatedProps = [];

                // removing options reference
                currentProps.map(props => {
                    if (props.type === "array") {
                        let temp = { ...props };
                        temp.options = [...props.options];
                        temp.options = [];
                        updatedProps.push(temp);
                    } else {
                        updatedProps.push(props);
                    }
                });

                let newComponent = {
                    id: `${makeid(8)}`,
                    type: item.component.type,
                    props: updatedProps,
                };

                Object.keys(item.component.data).forEach(key => {
                    newComponent.data = {
                        ...newComponent.data,
                        [key]: "",
                    };
                });
                // } else {
                //     newComponent = {
                //         ...newComponent,
                //         props: item.component.props,
                //     };
                // }

                const newLayoutItem = {
                    id: newComponent.id,
                    type: COMPONENT,
                };

                formContext.setComponents({
                    ...formContext.components,
                    [newComponent.id]: newComponent,
                });
                const updatedLayout = handleMoveSidebarComponentIntoParent(
                    formContext.layout,
                    splitDropZonePath,
                    newLayoutItem,
                );

                formContext.setLayout(updatedLayout);
                return;
            }

            // move down here since sidebar items dont have path

            const splitItemPath = item.path ? item.path.split("-") : [];
            const pathToItem = splitItemPath.slice(0, -1).join("-");
            // 2. pure move ( no create)
            if (splitItemPath.length === splitDropZonePath.length) {
                // 2a. move within parent
                if (pathToItem === pathToDropZone) {
                    const updatedLayput = handleMoveWithinParent(
                        formContext.layout,
                        splitDropZonePath,
                        splitItemPath,
                    );
                    // console.log({ updatedLayput });

                    formContext.setLayout(updatedLayput);
                    return;
                } else {
                    // 2.b. OR move different parent
                    // TODO FIX columns. item includes children
                    const updatedLayout = handleMoveToDifferentParent(
                        formContext.layout,
                        splitDropZonePath,
                        splitItemPath,
                        newLayoutItem,
                    );

                    // console.log({ updatedLayout });

                    formContext.setLayout(updatedLayout);
                    return;
                }
            }

            // 3. Move + Create
            const updatedLayout = handleMoveToDifferentParent(
                formContext.layout,
                splitDropZonePath,
                splitItemPath,
                newLayoutItem,
            );

            // console.log({ updatedLayout });

            formContext.setLayout(updatedLayout);
        },

        [formContext.layout, formContext.components],
    );

    const insertRowToEnd = () => {
        const currentLayout = structuredClone(formContext.layout);
        const newRow = [
            {
                type: ROW,
                id: `${makeid(8)}`,
                children: [
                    {
                        type: COLUMN,
                        id: `${makeid(8)}`,
                        classes: "col-sm",
                        children: [],
                    },
                ],
            },
        ];

        formContext.setLayout([...currentLayout, ...newRow]);
    };

    const pasteFromClipboard = () => {
        const rowFromClipboard = read("form.row");
        // TODO: Add scheme validation here
        const type = rowFromClipboard.data.type;

        if (type != "row") {
            toastEmitter(
                `Clipbaord data is invalid. Please copy again.`,
                true,
                "error",
            );
        } else {
            const currentLayout = structuredClone(formContext.layout);
            const updatedRowFromClipboard =
                createInstanceOfRowForPaste(rowFromClipboard);

            const updatedLayout = [
                ...currentLayout,
                { ...updatedRowFromClipboard.data, id: makeid(8) },
            ];

            formContext.setComponents({
                ...formContext.components,
                ...updatedRowFromClipboard.content.components,
            });

            formContext.setHtmlCollection({
                ...formContext.htmlCollection,
                ...updatedRowFromClipboard.content.htmlCollection,
            });

            formContext.setImages({
                ...formContext.images,
                ...updatedRowFromClipboard.content.images,
            });

            formContext.setLayout(updatedLayout);
        }
    };

    const showErrorMessage = () =>
        toast.error(`DB column or Label cannot be empty for any component.`, {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "light",
        });

    const handleLayoutSave = () => {
        let validations = checkForValidations(formContext.components);
        if (validations.length === 0) {
            // generateTable();
            setSelectedComponent({});
            let _components = structuredClone(formContext.components);

            for (const key in _components) {
                delete _components[key].isValid;
            }
            formContext.setComponents(_components);
            updateData(_components);
        } else {
            showErrorMessage();

            let componentIds = validations.reduce(
                (accumulator, currentValue) => {
                    accumulator.push(currentValue.componentId);
                    return accumulator;
                },
                [],
            );

            let _components = structuredClone(formContext.components);

            for (const key in _components) {
                if (componentIds.indexOf(key) === -1) {
                    _components[key].isValid = "true";
                } else {
                    _components[key].isValid = "false";
                }
            }
            formContext.setComponents(_components);
        }
    };

    // this function handles empty and duplicate fields
    const checkForValidations = components => {
        let invalidKeys = [];
        let invalidComponents = [];
        for (const property in components) {
            let obj = {
                componentId: "",
                componentType: "",
                invalidKey: "",
                isValid: "",
                message: "",
            };

            let currentComponent = components[property];
            let type = currentComponent.type;
            switch (type) {
                case "imageview": {
                    break;
                }
                case "action": {
                    break;
                }
                case "HTML": {
                    break;
                }
                case "daterange": {
                    if (
                        currentComponent.data.start_db_column === "" ||
                        currentComponent.data.end_db_column === "" ||
                        currentComponent.data.label === ""
                    ) {
                        obj = {
                            componentId: currentComponent.id,
                            componentType: currentComponent.type,
                            invalidKey: "",
                            isValid: "NO",
                            message: "Column or label cannot be empty.",
                        };
                        invalidComponents.push(obj);
                    }

                    break;
                }
                case "datalist": {
                    if (
                        currentComponent.data.foreign_key_column === "" ||
                        currentComponent.data.value === ""
                    ) {
                        obj = {
                            componentId: currentComponent.id,
                            componentType: currentComponent.type,
                            invalidKey: "",
                            isValid: "NO",
                            message: "Column or label cannot be empty.",
                        };
                        invalidComponents.push(obj);
                    }

                    break;
                }

                default: {
                    if (
                        currentComponent.data.db_column === "" ||
                        currentComponent.data.label === ""
                    ) {
                        obj = {
                            componentId: currentComponent.id,
                            componentType: currentComponent.type,
                            invalidKey: "",
                            isValid: "NO",
                            message: "Column or label cannot be empty.",
                        };
                        invalidComponents.push(obj);
                    }
                }
            }
        }

        return invalidComponents;
    };

    const removeComponent = () => {
        setShowDeleteDialogue(true);

        setToggleDelete({
            row: { current: false, path: "" },
            column: { current: false, path: "" },
            component: { current: true, path: "" },
        });

        // handleRemoveComponent(selectedComponent);
    };

    const handleRemoveComponent = useCallback(
        item => {
            // if (window.confirm(`Delete ${item.type}?`)) {
            const splitItemPath = item.path.split("-");
            const removedItemLayout = handleRemoveItemFromLayout(
                formContext.layout,
                splitItemPath,
            );
            formContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeFromComponents(item);

            // }
        },
        [formContext.layout],
    );

    const editRow = () => {
        setShowEditRowDialogue(true);
    };

    const editColumn = () => {
        setShowEditColumnDialogue(true);
    };

    const removeRow = path => {
        setShowDeleteDialogue(true);

        setToggleDelete({
            row: { current: true, path },
            column: { current: false, path: "" },
            component: { current: false, path: "" },
        });

        // handleRemoveRow(selectedRow, path);
    };

    const handleRemoveRow = useCallback(
        (item, path) => {
            // if (window.confirm(`Delete ${item.type}?`)) {
            const splitItemPath = path.split("-");
            // console.log(path);
            const removedItemLayout = handleRemoveItemFromLayout(
                formContext.layout,
                splitItemPath,
            );
            formContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeComponentsFromRow(item);
            // }
        },
        [formContext.layout],
    );

    const removeColumn = path => {
        setShowDeleteDialogue(true);

        setToggleDelete({
            row: { current: false, path: "" },
            column: { current: true, path },
            component: { current: false, path: "" },
        });

        // handleRemoveColumn(selectedColumn, path);
    };

    const handleRemoveColumn = useCallback(
        (item, path) => {
            // if (window.confirm(`Delete ${item.type}?`)) {
            const splitItemPath = path.split("-");
            // console.log(path);
            const removedItemLayout = handleRemoveItemFromLayout(
                formContext.layout,
                splitItemPath,
            );
            formContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeComponentsFromCol(item);
            // }
        },
        [formContext.layout],
    );

    const handleSelectComponent = component => {
        setSelectedComponent(component);
    };
    const handleSelectColumn = column => {
        setSelectedColumn(column);
    };

    const handleSelectRow = row => {
        setSelectedRow(row);
    };

    function removeFromComponents(item) {
        let _components = { ...formContext.components };
        let _images = { ...formContext.images };
        let _htmlCollection = { ...formContext.htmlCollection };

        delete _components[item.id];

        if (item.data && item.data["image_id"] !== undefined) {
            delete _images[item.data.image_id];
        }

        if (item.data && item.data["html_id"] !== undefined) {
            delete _htmlCollection[item.data.html_id];
        }

        formContext.setComponents(_components);
        formContext.setImages(_images);
        formContext.setHtmlCollection(_htmlCollection);
    }

    function removeComponentsFromCol(item) {
        let _components = { ...formContext.components };
        let idsToRemove = getIdsFromCol(item);
        idsToRemove.map(id => {
            delete _components[id];
        });
        formContext.setComponents(_components);

        let _images = { ...formContext.images };
        let _htmlCollection = { ...formContext.htmlCollection };

        let imagesToRemove = getImagesIdsFromCol(item);
        let htmlToRemove = getHtmlIdsFromCol(item);

        imagesToRemove.map(id => {
            delete _images[id];
        });

        htmlToRemove.map(id => {
            delete _htmlCollection[id];
        });

        formContext.setImages(_images);
        formContext.setHtmlCollection(_htmlCollection);
    }

    function removeComponentsFromRow(item) {
        let _components = { ...formContext.components };
        let idsToRemove = getIdsFromRow(item);
        idsToRemove.map(id => {
            delete _components[id];
        });
        formContext.setComponents(_components);

        let _images = { ...formContext.images };
        let _htmlCollection = { ...formContext.htmlCollection };
        let imagesToRemove = getImagesIdsFromRow(item);
        let htmlToRemove = getHtmlIdsFromRow(item);
        imagesToRemove.map(id => {
            delete _images[id];
        });
        htmlToRemove.map(id => {
            delete _htmlCollection[id];
        });
        formContext.setImages(_images);
        formContext.setHtmlCollection(_htmlCollection);
    }

    function getIdsFromRow(row) {
        let arr = [];
        if (!isArrayEmpty(row.children)) {
            if (!isArrayEmpty(row.children)) {
                row.children.map(child => {
                    child.children.map(lastChild => {
                        arr.push(lastChild.id);
                    });
                });
            }
        }

        return arr;
    }

    function getIdsFromCol(col) {
        let arr = [];

        col.children.map(child => {
            arr.push(child.id);
        });

        return arr;
    }
    function getImagesIdsFromCol(col) {
        let imageIds = [];
        let componentsId = [];

        col.children.map(child => {
            componentsId.push(child.id);
        });

        componentsId.map(id => {
            let idToFind =
                formContext.components[id].data["image_id"] !== undefined
                    ? formContext.components[id].data["image_id"]
                    : null;

            if (idToFind) {
                imageIds.push(idToFind);
            }
        });

        return imageIds;
    }
    function getHtmlIdsFromCol(col) {
        let htmlIds = [];
        let componentsId = [];

        col.children.map(child => {
            componentsId.push(child.id);
        });

        componentsId.map(id => {
            let idToFind =
                formContext.components[id].data["html_id"] !== undefined
                    ? formContext.components[id].data["html_id"]
                    : null;

            if (idToFind) {
                htmlIds.push(idToFind);
            }
        });

        return htmlIds;
    }

    function getImagesIdsFromRow(row) {
        let imageIds = [];
        let componentsId = [];

        row.children.map(child => {
            child.children.map(lastChild => {
                componentsId.push(lastChild.id);
            });
        });

        componentsId.map(id => {
            let idToFind = formContext.components[id].data.image_id;
            if (idToFind) {
                imageIds.push(idToFind);
            }
        });

        return imageIds;
    }
    function getHtmlIdsFromRow(row) {
        let htmlIds = [];
        let componentsId = [];

        row.children.map(child => {
            child.children.map(lastChild => {
                componentsId.push(lastChild.id);
            });
        });

        componentsId.map(id => {
            let idToFind = formContext.components[id].data.html_id;
            if (idToFind) {
                htmlIds.push(idToFind);
            }
        });

        return htmlIds;
    }

    function isArrayEmpty(arr) {
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === "") return true;
            }
        } else {
            return false;
        }
    }

    function renderRow(row, currentPath) {
        return (
            <Row
                key={row.id}
                rowData={row}
                handleDrop={handleDrop}
                path={currentPath}
                components={formContext.components}
                images={formContext.images}
                htmlCollection={formContext.htmlCollection}></Row>
        );
    }

    function syncDesignJson() {
        if (formContext.selectedForm.enable_multipage !== "YES") {
            let layout = formContext.selectedForm.design.layout;
            let components = formContext.selectedForm.design.components;
            let images = formContext.selectedForm.design.images;
            let htmlCollection = formContext.selectedForm.design.htmlCollection;

            formContext.setLayout(layout);
            formContext.setComponents(components);
            formContext.setImages(images);
            formContext.setHtmlCollection(htmlCollection);
        } else {
            if (formContext.selectedFormPage.id !== "") {
                console.log(formContext.multipageDesign);
                if (
                    formContext.multipageDesign &&
                    formContext.multipageDesign.length > 0
                ) {
                    formContext.multipageDesign.map(item => {
                        if (item.id === formContext.selectedFormPage.id) {
                            formContext.setImages(item.design.images);
                            formContext.setHtmlCollection(
                                item.design.htmlCollection,
                            );
                            formContext.setLayout(item.design.layout);
                            formContext.setComponents(item.design.components);
                        }
                    });
                }
            }
        }
    }

    function generateTable() {
        let reqToSend = createRequest(
            formContext.selectedForm,
            formContext.layout,
            formContext.components,
        );

        var url = API_URL + "?service.key=update.formData";
        // console.log(reqToSend);
        // TODO: Fix this
        // axios
        //     .post(url, reqToSend)
        //     .then(function (response) {
        //         if (response.status === 200) {
        //             if (response.data.C_STATUS === "SUCCESS") {
        //                 toast.success(
        //                     `Table ${data.table} created successfully.`,
        //                     {
        //                         position: "bottom-right",
        //                         autoClose: false,
        //                         hideProgressBar: false,
        //                         closeOnClick: true,
        //                         pauseOnHover: false,
        //                         draggable: true,
        //                         progress: undefined,
        //                         theme: "light",
        //                     }
        //                 );
        //             } else {
        //                 toast.error(`Unable to create table ${data.table}.`, {
        //                     position: "bottom-right",
        //                     autoClose: false,
        //                     hideProgressBar: false,
        //                     closeOnClick: true,
        //                     pauseOnHover: false,
        //                     draggable: true,
        //                     progress: undefined,
        //                     theme: "light",
        //                 });
        //                 console.error(response);
        //             }
        //         }
        //     })
        //     .catch((error) => {
        //         console.error(error);
        //     });
    }

    const handleSearch = event => {
        let textToSearch = event.target.value.toLowerCase();
        const keysToSearch = ["title", "type"];
        let result = [];
        result = filterComponents(SIDEBAR_ITEMS, textToSearch, keysToSearch);
        setFilteredFields(result);
    };

    function filterComponents(arr = [], terms = "", keysToSearch = []) {
        if (terms.length < 1) return arr;
        let words = terms.match(/\w+|"[^"]+"/g);
        if (words) {
            words.push(terms);
            let searchResults = arr.filter(currentObj => {
                let tempObj = {};
                for (const property in currentObj) {
                    if (typeof currentObj[property] === "string") {
                        if (keysToSearch.includes(property)) {
                            tempObj[property] = currentObj[property];
                        }
                    } else if (typeof currentObj[property] === "object") {
                        let nestedObj = currentObj[property];
                        for (const nestedProperty in nestedObj) {
                            if (typeof nestedObj[nestedProperty] === "string") {
                                if (keysToSearch.includes(nestedProperty)) {
                                    tempObj[nestedProperty] =
                                        nestedObj[nestedProperty];
                                }
                            } else if (
                                typeof nestedObj[nestedProperty] === "object"
                            ) {
                                //    do not search futher nested objects for now
                            }
                        }
                    }
                }
                const allValues = Object.values(tempObj);
                const f = JSON.stringify(allValues).toLowerCase();
                let hasValue = words.every(val => f.includes(val));
                return hasValue;
            });
            return searchResults;
        } else {
            return arr;
        }
    }

    function createRequest(formData, layout, components) {
        let request = {
            data: [],
        };
        let tempObj = {};

        tempObj.id = "new";
        tempObj.entity = formData.table;
        tempObj.formId = formData.table;
        tempObj.action = "update";
        tempObj.formData = {
            id: "new",
        };

        let arr = [];
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    arr.push(foundComponent.data);
                });
            });
        });

        for (let i = 0; i < arr.length; i++) {
            let obj = arr[i];
            let keys = Object.keys(obj);
            keys.map(key => {
                tempObj.formData[key] = obj[key];
            });
        }

        request.data.push(tempObj);
        return request;
    }

    function copyToClipboard() {
        setIsCopied(true);

        setTimeout(() => {
            setIsCopied(false);
        }, 3000);

        let str = JSON.stringify(formContext.selectedForm.design, undefined, 4);

        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.innerHTML = str;
            textAreaRef.current.select();

            document.execCommand("copy");
        }
    }

    function disableEditJson() {
        setIsCopied(false);
        setIsEditable(false);

        let str = JSON.stringify(formContext.selectedForm.design, undefined, 4);

        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.innerHTML = str;
        }

        setDesignJson(str);
    }

    function enableEditJson() {
        setIsCopied(false);
        setIsEditable(true);
    }

    const handleDesignJsonChange = value => {
        // let value = e.target.value;

        setDesignJson(value);
    };

    const saveDesignJson = () => {
        let json = tryParseJSONObject(designJson, {
            layout: [],
            components: {},
            images: {},
            htmlCollection: {},
        });

        formContext.setLayout(json.layout);
        formContext.setComponents(json.components);
        formContext.setImages(json.images);
        formContext.setHtmlCollection(json.htmlCollection);

        let temp = { ...formContext.selectedForm };
        temp.design = {};

        temp.design = {
            layout: json.layout,
            components: json.components,
            images: json.images,
            htmlCollection: json.htmlCollection,
        };
        formContext.setSelectedForm(temp);

        setIsCopied(false);
        setIsEditable(false);
    };

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    const renderTooltip = props => (
        <Tooltip
            id="gp-back-tooltip"
            {...props}>
            Go back
        </Tooltip>
    );

    const onChange = React.useCallback((value, viewUpdate) => {
        // console.log("value:", value);
    }, []);

    const [theme, setTheme] = useState("dark");
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    return (
        <React.Fragment>
            <DndProvider backend={HTML5Backend}>
                <DesignerContext.Provider
                    value={{
                        layout: formContext.layout,
                        setLayout: formContext.setLayout,
                        components: formContext.components,
                        setComponents: formContext.setComponents,
                        htmlCollection: formContext.htmlCollection,
                        setHtmlCollection: formContext.setHtmlCollection,
                        images: formContext.images,
                        setImages: formContext.setImages,
                        formTable: formContext.selectedForm?.table,
                        selectedComponent,
                        handleSelectComponent,
                        forbidDrag,
                        setForbidDrag,
                        handleRemoveComponent,
                        removeComponent,
                        handleLayoutSave,
                        handleSelectRow,
                        handleSelectColumn,
                        handleSearch,
                        selectedColumn,
                        selectedRow,
                        handleRemoveColumn,
                        removeColumn,
                        handleRemoveRow,
                        removeRow,
                        editRow,
                        editColumn,
                    }}>
                    <div
                        id="form-designer-action-bar"
                        className="flex-row d-flex s2a-border-bottom justify-content-between align-items-center stick-below-navbar">
                        <div className="p-2 ps-0">
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip}>
                                <span
                                    className={`mx-2 pointer`}
                                    onClick={() => {
                                        let validations = checkForValidations(
                                            formContext.components,
                                        );

                                        if (validations.length === 0) {
                                            setDesignMode(false);
                                        } else {
                                            setShowFormCloseDialogue(true);
                                        }
                                    }}>
                                    <span>
                                        <i className="fa-solid fa-arrow-left mt-1 fs-5"></i>
                                    </span>
                                </span>
                            </OverlayTrigger>
                        </div>
                        <div className="p-2">
                            <span>{`Form Name : ${formContext.selectedForm.name} | Form Key : ${formContext.selectedForm.form_key} | Table : ${formContext.selectedForm.table}`}</span>
                        </div>
                        <div className="p-2 pe-2 ">
                            <div className="flex-row d-flex">
                                <span
                                    className={`mx-2 pointer`}
                                    onClick={() =>
                                        formContext.setRenderPreview(true)
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Open form preview">
                                    <span
                                        data-bs-toggle="modal"
                                        data-bs-target="#form-preview">
                                        <i className="fa-regular fa-eye mt-1 fs-5"></i>
                                    </span>
                                </span>
                                <span
                                    className={`mx-2 pointer`}
                                    data-bs-toggle="tooltip"
                                    data-bs-title="View JSON">
                                    <span
                                        data-bs-toggle="modal"
                                        data-bs-target="#view-json">
                                        <i className="fa-solid fa-code mt-1 fs-5"></i>
                                    </span>
                                </span>
                                {/* <button
                                    disabled
                                    className={`btn btn-sm undo-btn`}
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Undo changes">
                                    <span>
                                        <i className="fa-solid fa-arrow-rotate-left mt-1 fs-5"></i>
                                    </span>
                                </button> */}

                                <span
                                    className={`mx-2 pointer`}
                                    onClick={() => handleLayoutSave()}
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Save">
                                    <span>
                                        <i className="fa-solid fa-check mt-1 fs-5"></i>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-2">
                            <div className="component-list stick-below-action-bar">
                                <div className="p-2 mb-2 me-2">
                                    <div className="row">
                                        <div className="input-group px-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search fields"
                                                onChange={handleSearch}
                                            />
                                            <span className="input-group-text">
                                                <i className="fa-solid fa-magnifying-glass"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="enable-scroll max-height-screen-80">
                                    {filteredFields.map(
                                        (sideBarItem, index) => {
                                            return (
                                                <SideBarItem
                                                    key={sideBarItem.id}
                                                    sideBarItem={sideBarItem}
                                                />
                                            );
                                        },
                                    )}

                                    {/* {Object.values(filteredFields).map((sideBarItem, index) => {
                                            return <SideBarItem key={sideBarItem.id} data={sideBarItem} />;
                                        })} */}

                                    {/* {Object.values(SIDEBAR_ITEMS).map((sideBarItem, index) => {
                                            return <SideBarItem key={sideBarItem.id} data={sideBarItem} />;
                                        })} */}

                                    {/* {SIDEBAR_ITEMS.map((item) => {
                                            return <SideBarItem key={item.id} data={item} />;
                                        })} */}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-10">
                            <div className="form-view">
                                {/* <div className="d-flex justify-content-center">
                                        <span
                                            onClick={insertRowToEnd}
                                            className={`mx-1 pointer inline-block`}
                                            data-bs-toggle="tooltip"
                                            data-bs-title="Add Row">
                                            <span>
                                                <i className="fa-solid fa-plus mt-1 fs-5"></i>
                                            </span>
                                        </span>
                                        <span
                                            onClick={pasteFromClipboard}
                                            className={`mx-1 pointer inline-block`}
                                            data-bs-toggle="tooltip"
                                            data-bs-title="Paste Row">
                                            <span>
                                                <i className="fa-solid fa-paste mt-1 fs-5"></i>
                                            </span>
                                        </span>
                                    </div> */}
                                {formContext.layout &&
                                    formContext.layout.map((row, index) => {
                                        const currentPath = `${index}`;
                                        return (
                                            <div
                                                key={row.id}
                                                className="row-section">
                                                <DropZone
                                                    data={{
                                                        path: currentPath,
                                                        childrenCount:
                                                            formContext?.layout
                                                                ?.length,
                                                    }}
                                                    onDrop={
                                                        handleDrop
                                                    }></DropZone>
                                                {renderRow(row, currentPath)}
                                            </div>
                                        );
                                    })}
                                <DropZone
                                    data={{
                                        path: `${
                                            formContext &&
                                            formContext.layout &&
                                            formContext.layout.length
                                        }`,
                                        childrenCount:
                                            formContext &&
                                            formContext.layout &&
                                            formContext.layout.length,
                                    }}
                                    onDrop={handleDrop}
                                    isLast></DropZone>

                                {
                                    <div className="d-flex justify-content-center">
                                        <span
                                            onClick={pasteFromClipboard}
                                            className={`mx-1 pointer inline-block`}
                                            data-bs-toggle="tooltip"
                                            data-bs-title="Paste Row">
                                            <span>
                                                <i className="fa-solid fa-paste mt-1 fs-5"></i>
                                            </span>
                                        </span>
                                    </div>
                                }
                            </div>
                        </div>
                        {/* <div className="col-sm-3">
                            <ul
                                className="nav nav-tabs mt-2 mx-2"
                                id=""
                                role="">
                                <li className="nav-item">
                                    <button
                                        className="nav-link active"
                                        data-bs-toggle="tab"
                                        data-bs-target="#form-properties-tab"
                                        type="button">
                                        Properties
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className="nav-link"
                                        data-bs-toggle="tab"
                                        data-bs-target="#form-script-tab"
                                        type="button">
                                        Scripts
                                    </button>
                                </li>
                            </ul>

                            <div
                                className="tab-content mb-2 mx-2"
                                id="">
                                <div
                                    className="tab-pane fade show active"
                                    id="form-properties-tab">
                                    <div className="border bg-light border-top-0">
                                        <Settings />
                                    </div>
                                </div>
                                <div
                                    className="tab-pane fade"
                                    id="form-script-tab">
                                    Scripts
                                </div>
                            </div>
                        </div> */}
                    </div>
                    <RowEditDialogue
                        showEditRowDialogue={showEditRowDialogue}
                        setShowEditRowDialogue={setShowEditRowDialogue}
                        selectedRow={selectedRow}
                    />
                    <ColumnEditDialogue
                        showEditColumnDialogue={showEditColumnDialogue}
                        setShowEditColumnDialogue={setShowEditColumnDialogue}
                        selectedColumn={selectedColumn}
                    />
                </DesignerContext.Provider>
            </DndProvider>
            <DeleteDialogue
                showDeleteDialogue={showDeleteDialogue}
                setShowDeleteDialogue={setShowDeleteDialogue}
                toggleDelete={toggleDelete}
                handleRemoveComponent={handleRemoveComponent}
                selectedComponent={selectedComponent}
                handleRemoveRow={handleRemoveRow}
                selectedRow={selectedRow}
                handleRemoveColumn={handleRemoveColumn}
                selectedColumn={selectedColumn}
            />
            <FormCloseDialogue
                showFormCloseDialogue={showFormCloseDialogue}
                setShowFormCloseDialogue={setShowFormCloseDialogue}
                setDesignMode={setDesignMode}
                syncDesignJson={syncDesignJson}
            />
            {/* JSON Viewer */}
            <div
                id="view-json"
                className="modal fade"
                data-bs-backdrop="static"
                data-bs-keyboard="false">
                <div
                    className={`modal-dialog  ${
                        toggleModalWindow === "maximize"
                            ? "modal-fullscreen"
                            : "modal-xl"
                    } `}>
                    <div className="modal-content ">
                        <div className="modal-header">
                            <div className="flex-row d-flex vw-100 justify-content-between align-items-center">
                                <label
                                    htmlFor=""
                                    className="my-2 form-label">
                                    Form design JSON{" "}
                                    {!isEditable ? "( Readonly mode )" : ""}
                                </label>
                                {isCopied && (
                                    <div
                                        className="alert alert-info mb-0 p-1"
                                        role="alert">
                                        {isCopied ? "Copied to clipboard!" : ""}
                                    </div>
                                )}
                                <div className="flex-row d-flex">
                                    <div
                                        className={`mx-2 pointer ${
                                            theme === "light"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() => setTheme("light")}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Set light theme">
                                        <i className="fa-regular fs-5 fa-sun"></i>
                                    </div>
                                    <div
                                        className={`mx-2 pointer ${
                                            theme === "dark"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() => setTheme("dark")}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Set dark theme">
                                        <i className="fa-regular fs-5 fa-moon"></i>
                                    </div>
                                    {/* <div
                                        className={`mx-2 pointer ${
                                            isEditable ? "visually-hidden" : ""
                                        } `}
                                        onClick={() => copyToClipboard()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Copy JSON">
                                        <i className="fa-regular fs-5 fa-clone"></i>
                                    </div> */}
                                    <div
                                        className={`mx-2 pointer ${
                                            !isEditable ? "" : "visually-hidden"
                                        } `}
                                        onClick={() => enableEditJson()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Edit">
                                        <i className="fa-regular fs-5 fa-pen-to-square"></i>
                                    </div>

                                    {/* <div
                                        className={`mx-2 pointer ${
                                            !isEditable ? "visually-hidden" : ""
                                        } `}
                                        onClick={() => disableEditJson()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Undo changes">
                                        <i className="fa-solid fa-arrow-rotate-left fs-5"></i>
                                    </div> */}

                                    <div
                                        className={`mx-2 pointer ${
                                            !isEditable ? "visually-hidden" : ""
                                        } `}
                                        onClick={() => saveDesignJson()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Save changes">
                                        <i className="fa-solid fs-5 fa-check"></i>
                                    </div>

                                    <div
                                        className={`mx-2 pointer ${
                                            toggleModalWindow === "maximize"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() =>
                                            setToggleModalWindow("maximize")
                                        }
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Maximize window">
                                        <i className="fa-regular fa-window-maximize fs-5"></i>
                                    </div>

                                    <div
                                        className={`mx-2 pointer ${
                                            toggleModalWindow === "restore"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() =>
                                            setToggleModalWindow("restore")
                                        }
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Restore Window">
                                        <i className="fa-regular fa-window-restore fs-5"></i>
                                    </div>

                                    <div
                                        className="mx-2 pointer"
                                        data-bs-dismiss="modal"
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Close JSON viewer">
                                        <i className="fa-solid fs-5 fa-x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-body p-0 scroll-for-all">
                            <CodeMirror
                                value={designJson}
                                height="100%"
                                theme={theme}
                                extensions={[javascript({ jsx: true })]}
                                onChange={(value, viewUpdate) => {
                                    handleDesignJsonChange(value);
                                }}
                                readOnly={!isEditable}
                            />
                            {/* <textarea
                                type="text"
                                rows="15"
                                className={`form-control ${
                                    !isEditable ? "visually-hidden" : ""
                                }`}
                                style={{ fontFamily: "Courier New" }}
                                value={designJson}
                                onChange={(e) => handleDesignJsonChange(e)}
                            />
                            <textarea
                                ref={textAreaRef}
                                type="text"
                                rows="15"
                                className={`form-control ${
                                    isEditable ? "visually-hidden" : ""
                                }`}
                                style={{ fontFamily: "Courier New" }}
                                readOnly={true}
                            /> */}

                            {/*

                                 value={JSON.stringify(
                                    formContext.selectedForm.design
                                )}

                            */}
                            {/*<div className="p-4 border rounded bg-light">
                                <code className="text-dark">
                                     <pre className="">
                                        {isCopied ? (
                                            <mark
                                                style={{
                                                    backgroundColor:
                                                        "lightskyblue",
                                                }}
                                            >
                                                {JSON.stringify(
                                                    formContext.selectedForm
                                                        .design,
                                                    null,
                                                    2
                                                )}
                                            </mark>
                                        ) : (
                                            <div className="text-dark">
                                                {JSON.stringify(
                                                    formContext.selectedForm
                                                        .design,
                                                    null,
                                                    2
                                                )}
                                            </div>
                                        )}
                                    </pre>
                                </code>
                            </div>
                            */}
                        </div>
                        <div className=""></div>
                    </div>
                </div>
            </div>
            <FormPreviewModal />
        </React.Fragment>
    );
};

function DeleteDialogue(props) {
    return (
        <Modal
            show={props.showDeleteDialogue}
            onHide={() => props.setShowDeleteDialogue(false)}
            keyboard={true}>
            <Modal.Header>
                <Modal.Title>Confirm </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {props.toggleDelete.component.current && (
                    <div className="d-flex justify-content-between">
                        <div>
                            Are you sure you want to delete{" "}
                            <b>{props.selectedComponent.type}</b>?
                        </div>
                        <div className="d-flex flex-row">
                            <button
                                ref={ref => ref && ref.focus()}
                                className="btn btn-sm btn-danger mx-1"
                                onClick={() => {
                                    props.handleRemoveComponent(
                                        props.selectedComponent,
                                    );
                                    props.setShowDeleteDialogue(false);
                                }}>
                                Yes
                            </button>
                            <button
                                className="btn btn-sm btn-light mx-1"
                                onClick={() => {
                                    props.setShowDeleteDialogue(false);
                                }}>
                                No
                            </button>
                        </div>
                    </div>
                )}
                {props.toggleDelete.row.current && (
                    <div className="d-flex justify-content-between">
                        <div>
                            Are you sure you want to delete <b>Row</b>?
                        </div>
                        <div className="d-flex flex-row">
                            <button
                                ref={ref => ref && ref.focus()}
                                className="btn btn-sm btn-danger mx-1"
                                onClick={() => {
                                    props.handleRemoveRow(
                                        props.selectedRow,
                                        props.toggleDelete.row.path,
                                    );
                                    props.setShowDeleteDialogue(false);
                                }}>
                                Yes
                            </button>
                            <button
                                className="btn btn-sm btn-light mx-1"
                                onClick={() => {
                                    props.setShowDeleteDialogue(false);
                                }}>
                                No
                            </button>
                        </div>
                    </div>
                )}
                {props.toggleDelete.column.current && (
                    <div className="d-flex justify-content-between">
                        <div>
                            Are you sure you want to delete <b>Column</b>?
                        </div>
                        <div className="d-flex flex-row">
                            <button
                                ref={ref => ref && ref.focus()}
                                className="btn btn-sm btn-danger mx-1"
                                onClick={() => {
                                    props.handleRemoveColumn(
                                        props.selectedColumn,
                                        props.toggleDelete.column.path,
                                    );
                                    props.setShowDeleteDialogue(false);
                                }}>
                                Yes
                            </button>
                            <button
                                className="btn btn-sm btn-light mx-1"
                                onClick={() => {
                                    props.setShowDeleteDialogue(false);
                                }}>
                                No
                            </button>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

function RowEditDialogue({
    showEditRowDialogue,
    setShowEditRowDialogue,
    selectedRow,
}) {
    const formContext = useContext(FormContext);

    const [visibilityExpression, setVisibilityExpression] = useState("");
    const [enableTabView, setEnableTabView] = useState("NO");

    useEffect(() => {
        if (selectedRow.id) {
            formContext.layout.forEach(row => {
                if (row) {
                    if (row.id === selectedRow.id) {
                        if (row["enableTabView"]) {
                            let _enableTabView = row.enableTabView;
                            setEnableTabView(_enableTabView);
                        } else {
                            setEnableTabView("NO");
                        }
                        if (row["visibilityExpression"] !== undefined) {
                            setVisibilityExpression(row.visibilityExpression);
                        } else {
                            setVisibilityExpression("");
                        }
                    }
                }
            });
        } else {
            setVisibilityExpression("");
            setEnableTabView("NO");
        }
    }, [selectedRow.id]);

    function handleLayoutUpdate() {
        let _layout = structuredClone(formContext.layout);

        _layout.forEach(row => {
            if (row) {
                if (row.id === selectedRow.id) {
                    row.visibilityExpression = visibilityExpression;
                    row.enableTabView = enableTabView;
                }
            }
        });

        formContext.setLayout(_layout);
        setShowEditRowDialogue(false);
    }

    return (
        <Modal
            show={showEditRowDialogue}
            onHide={() => setShowEditRowDialogue(false)}
            // backdrop="static"
            keyboard={true}
            animation={true}>
            <Modal.Header>
                <Modal.Title>Edit Row</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form>
                    <div className="row">
                        <div className="col mb-3">
                            <label className="form-label">
                                Visibility Expression
                            </label>
                            <input
                                type="text"
                                name="label"
                                className={`form-control form-control-sm`}
                                onChange={e =>
                                    setVisibilityExpression(e.target.value)
                                }
                                value={visibilityExpression}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    onChange={e =>
                                        setEnableTabView(
                                            e.target.checked ? "YES" : "NO",
                                        )
                                    }
                                    checked={
                                        enableTabView === "YES" ? true : false
                                    }
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckChecked">
                                    Enable Tab View
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-row justify-content-end">
                        <div className="d-flex flex-row">
                            <button
                                className="btn btn-sm button-theme mx-1"
                                type="button"
                                onClick={() => {
                                    handleLayoutUpdate();
                                }}>
                                OK
                            </button>
                            <button
                                className="btn btn-sm button-theme mx-1"
                                type="button"
                                onClick={() => {
                                    setShowEditRowDialogue(false);
                                }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
}

function ColumnEditDialogue({
    showEditColumnDialogue,
    setShowEditColumnDialogue,
    selectedColumn,
}) {
    const formContext = useContext(FormContext);

    const [visibilityExpression, setVisibilityExpression] = useState("");
    const [className, setClassName] = useState("");

    useEffect(() => {
        if (showEditColumnDialogue && selectedColumn.id) {
            let temp = {
                visibilityExpression: "",
                className: "",
            };
            formContext.layout.forEach(row => {
                console.log(row);
                row.children.map(column => {
                    console.log(column);
                    if (column.id === selectedColumn.id) {
                        if (
                            selectedColumn["visibilityExpression"] !== undefined
                        ) {
                            temp.visibilityExpression =
                                selectedColumn.visibilityExpression;
                        }
                        if (selectedColumn["className"] !== undefined) {
                            temp.className = selectedColumn.className;
                        }
                    }
                });
            });

            setVisibilityExpression(temp.visibilityExpression);
            setClassName(temp.className);
        } else {
            setVisibilityExpression("");
            setClassName("");
        }
    }, [selectedColumn.id, showEditColumnDialogue]);

    function handleLayoutUpdate() {
        let _layout = structuredClone(formContext.layout);
        _layout.map(row => {
            row.children.map(column => {
                if (column.id === selectedColumn.id) {
                    column.visibilityExpression = visibilityExpression;
                    column.className = className;
                }
            });
        });
        formContext.setLayout(_layout);
        setShowEditColumnDialogue(false);
    }

    return (
        <Modal
            show={showEditColumnDialogue}
            onHide={() => setShowEditColumnDialogue(false)}
            // backdrop="static"
            keyboard={true}
            animation={true}>
            <Modal.Header>
                <Modal.Title>Edit Column</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form>
                    <div className="row">
                        <div className="col mb-3">
                            <label className="form-label">
                                Visibility Expression
                            </label>
                            <input
                                type="text"
                                name="label"
                                className={`form-control form-control-sm`}
                                onChange={e =>
                                    setVisibilityExpression(e.target.value)
                                }
                                value={visibilityExpression}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col mb-3">
                            <label className="form-label">CSS Class Name</label>
                            <input
                                type="text"
                                name="label"
                                className={`form-control form-control-sm`}
                                onChange={e => setClassName(e.target.value)}
                                value={className}
                            />
                        </div>
                    </div>
                    <div className="d-flex flex-row justify-content-end">
                        <div className="d-flex flex-row">
                            <button
                                className="btn btn-sm button-theme mx-1"
                                type="button"
                                onClick={() => {
                                    handleLayoutUpdate();
                                }}>
                                OK
                            </button>
                            <button
                                className="btn btn-sm button-theme mx-1"
                                type="button"
                                onClick={() => {
                                    setShowEditColumnDialogue(false);
                                }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
}

function FormCloseDialogue({
    showFormCloseDialogue,
    setShowFormCloseDialogue,
    setDesignMode,
    syncDesignJson,
}) {
    return (
        <Modal
            show={showFormCloseDialogue}
            onHide={() => setShowFormCloseDialogue(false)}
            keyboard={true}>
            <Modal.Header>
                <Modal.Title>Unsaved Changes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-row">
                    There are some unsaved changes. Are you sure you want to
                    discard them
                    {/* <b>{props.selectedComponent.type}</b> */}?
                </div>
                <div className="d-flex justify-content-end">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm btn-danger mx-1"
                            onClick={() => {
                                setDesignMode(false);
                                setShowFormCloseDialogue(false);
                                syncDesignJson();
                            }}>
                            Yes
                        </button>
                        <button
                            className="btn btn-sm btn-light mx-1"
                            onClick={() => {
                                setShowFormCloseDialogue(false);
                            }}>
                            No
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export { Designer };

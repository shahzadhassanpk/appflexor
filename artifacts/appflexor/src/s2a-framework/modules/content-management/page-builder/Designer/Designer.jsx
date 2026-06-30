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
import { read } from "../../../../utils/localStorage";
import { Modal } from "react-bootstrap";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
// import { components } from "react-select";
// import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
// import { API_URL } from "../../../Config";
// import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import DesignerContext from "../Context/DesignerContext";
import PageContext from "../Context/PageContext";
import {
    COLUMN,
    COMPONENT,
    SIDEBAR_ITEM,
    SIDEBAR_ITEMS,
} from "./ComponentRegistry";
import DropZone from "./designer-components/DropZone";
import Row from "./designer-components/Row";
// import { Settings } from "./designer-components/Settings";
import PagePreviewModal from "./PagePreviewModal";
import SideBarItem from "./designer-components/SideBarItem";
import TrashDropZone from "./designer-components/TrashDropZone";
import {
    createInstanceOfRowForPaste,
    handleMoveSidebarComponentIntoParent,
    handleMoveToDifferentParent,
    handleMoveWithinParent,
    handleRemoveItemFromLayout,
} from "./helpers/dnd-helpers";

import { AppContext } from "../../../../../AppContext";
import {
    disposeTooltip,
    enableTooltip,
    getAuthorizedComponents,
    getAuthorizedTabs,
    makeid,
} from "../../../../utils/utils";
import "./styles.css";

export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

export const RENDER_MODE = {
    firstTime: "FIRST_TIME_ACTIVE",
    allTime: "ALL_TIME_ACTIVE",
};

const Designer = ({ updateData, setDesignMode }) => {
    const pageContext = useContext(PageContext);
    const appContext = useContext(AppContext);
    const { featuresSubscription } = appContext;

    const [forbidDrag, setForbidDrag] = useState(false);
    const [selectedRow, setSelectedRow] = useState({});
    const [selectedColumn, setSelectedColumn] = useState({});
    const [selectedComponent, setSelectedComponent] = useState({});
    const invalidKeys = [];
    const [authorizedFields, setAuthorizedFields] = useState([]);
    const [filteredFields, setFilteredFields] = useState([]);
    const textAreaRef = useRef(null);
    const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);
    const [showEditRowDialogue, setShowEditRowDialogue] = useState(false);
    const [showEditColumnDialogue, setShowEditColumnDialogue] = useState(false);

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
        const authorizedComponents = getAuthorizedComponents(
            SIDEBAR_ITEMS,
            featuresSubscription,
        );
        if (
            pageContext.selectedForm.type === "PUBLIC" &&
            authorizedComponents.length > 0
        ) {
            const filteredComponents = authorizedComponents.filter(component =>
                ["WEB_CONTENT", "WEB_POSTS", "TASK_INBOX", "WIKI"].includes(
                    component.code,
                ),
            );
            setAuthorizedFields(filteredComponents);
            setFilteredFields(filteredComponents);
        } else {
            setAuthorizedFields(authorizedComponents);
            setFilteredFields(authorizedComponents);
        }
    }, [featuresSubscription, SIDEBAR_ITEMS]);

    useEffect(() => {
        if (pageContext.selectedForm.design) {
            let str = JSON.stringify(
                pageContext.selectedForm.design,
                undefined,
                4,
            );

            if (textAreaRef && textAreaRef.current) {
                textAreaRef.current.innerHTML = str;
            }
            setDesignJson(str);
        }
    }, [pageContext.selectedForm]);

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

                if (item["code"] !== undefined) {
                    newComponent.code = item["code"];
                }

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

                pageContext.setComponents({
                    ...pageContext.components,
                    [newComponent.id]: newComponent,
                });

                const updatedLayout = handleMoveSidebarComponentIntoParent(
                    pageContext.layout,
                    splitDropZonePath,
                    newLayoutItem,
                );

                pageContext.setLayout(updatedLayout);
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
                        pageContext.layout,
                        splitDropZonePath,
                        splitItemPath,
                    );
                    // console.log({ updatedLayput });

                    pageContext.setLayout(updatedLayput);
                    return;
                } else {
                    // 2.b. OR move different parent
                    // TODO FIX columns. item includes children
                    const updatedLayout = handleMoveToDifferentParent(
                        pageContext.layout,
                        splitDropZonePath,
                        splitItemPath,
                        newLayoutItem,
                    );

                    // console.log({ updatedLayout });

                    pageContext.setLayout(updatedLayout);
                    return;
                }
            }

            // 3. Move + Create
            const updatedLayout = handleMoveToDifferentParent(
                pageContext.layout,
                splitDropZonePath,
                splitItemPath,
                newLayoutItem,
            );
            pageContext.setLayout(updatedLayout);
        },

        [pageContext.layout, pageContext.components],
    );

    const handleLayoutSave = () => {
        updateData();
        setSelectedComponent({});
        // let validations = checkForValidations(pageContext.components);
        // if (validations.length === 0) {
        //     updateData();
        //     generateTable();
        //     setSelectedComponent({});
        // } else {
        //     const notify = () =>
        //         toast.error(`DB column or Label cannot be empty for any component.`, {
        //             position: "bottom-right",
        //             autoClose: 3000,
        //             hideProgressBar: false,
        //             closeOnClick: true,
        //             pauseOnHover: false,
        //             draggable: true,
        //             progress: undefined,
        //             theme: "light",
        //         });
        //     notify();

        //     // TODO: if invalid do something
        //     // show red on invalid fields
        //     // validations.map((validation) => {
        //     //     console.log(validation);
        //     // });
        // }
    };

    const checkForValidations = components => {
        let array = [];
        for (const property in components) {
            let obj = {
                componentId: "",
                invalidKey: "",
                isValid: "",
                message: "",
            };

            let currentComponent = components[property];

            if (
                currentComponent.data.db_column === "" ||
                currentComponent.data.label === ""
            ) {
                obj = {
                    componentId: currentComponent.id,
                    invalidKey: "",
                    isValid: "NO",
                    message: "Column or label cannot be empty.",
                };
                array.push(obj);
            } else {
                if (invalidKeys.includes(currentComponent.data.db_column)) {
                    obj = {
                        componentId: currentComponent.id,
                        invalidKey: currentComponent.data.db_column,
                        isValid: "NO",
                        message: "Column already exists.",
                    };
                    array.push(obj);
                }
            }
        }

        return array;
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
                pageContext.layout,
                splitItemPath,
            );
            pageContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeFromComponents(item);
            // }
        },
        [pageContext.layout],
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
                pageContext.layout,
                splitItemPath,
            );
            pageContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeComponentsFromRow(item);
            // }
        },
        [pageContext.layout],
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
                pageContext.layout,
                splitItemPath,
            );
            pageContext.setLayout(removedItemLayout);
            setSelectedComponent({});
            setSelectedColumn({});
            setSelectedRow({});
            removeComponentsFromCol(item);
            // }
        },
        [pageContext.layout],
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
        let _components = { ...pageContext.components };
        let _htmlCollection = { ...pageContext.htmlCollection };

        delete _components[item.id];

        if (item.data && item.data["html_id"] !== undefined) {
            delete _htmlCollection[item.data.html_id];
        }

        pageContext.setComponents(_components);
        pageContext.setHtmlCollection(_htmlCollection);
    }

    function removeComponentsFromCol(item) {
        let _components = { ...pageContext.components };
        let _htmlCollection = { ...pageContext.htmlCollection };

        let idsToRemove = getIdsFromCol(item);
        let htmlToRemove = getHtmlIdsFromCol(item);

        idsToRemove.map(id => {
            delete _components[id];
        });

        htmlToRemove.map(id => {
            delete _htmlCollection[id];
        });

        pageContext.setComponents(_components);
        pageContext.setHtmlCollection(_htmlCollection);
    }

    function removeComponentsFromRow(item) {
        let _components = { ...pageContext.components };
        let _htmlCollection = { ...pageContext.htmlCollection };
        let htmlToRemove = getHtmlIdsFromRow(item);
        htmlToRemove.map(id => {
            delete _htmlCollection[id];
        });
        let idsToRemove = getIdsFromRow(item);
        idsToRemove.map(id => {
            delete _components[id];
        });
        pageContext.setComponents(_components);
        pageContext.setHtmlCollection(_htmlCollection);
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

    function getHtmlIdsFromCol(col) {
        let htmlIds = [];
        let componentsId = [];

        col.children.map(child => {
            componentsId.push(child.id);
        });

        componentsId.map(id => {
            let idToFind =
                pageContext.components[id].data["html_id"] !== undefined
                    ? pageContext.components[id].data["html_id"]
                    : null;

            if (idToFind) {
                htmlIds.push(idToFind);
            }
        });

        return htmlIds;
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
            let idToFind = pageContext.components[id]?.data?.html_id;
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
                components={pageContext.components}
                htmlCollection={pageContext.htmlCollection}></Row>
        );
    }

    const handleSearch = event => {
        let textToSearch = event.target.value.toLowerCase();
        const keysToSearch = ["title", "type"];
        let result = [];
        result = filterComponents(authorizedFields, textToSearch, keysToSearch);
        setFilteredFields(result);
    };

    function filterComponents(arr = [], terms = "", keysToSearch = []) {
        if (terms.length < 3) return arr;
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

    function copyToClipboard() {
        setIsCopied(true);

        setTimeout(() => {
            setIsCopied(false);
        }, 3000);

        let str = JSON.stringify(pageContext.selectedForm.design, undefined, 4);

        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.innerHTML = str;
            textAreaRef.current.select();

            document.execCommand("copy");
        }
    }

    function disableEditJson() {
        setIsCopied(false);
        setIsEditable(false);

        let str = JSON.stringify(pageContext.selectedForm.design, undefined, 4);

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
            htmlCollection: {},
        });

        pageContext.setLayout(json.layout);
        pageContext.setComponents(json.components);
        pageContext.setHtmlCollection(json.htmlCollection);

        let temp = { ...pageContext.selectedForm };
        temp.design = {};

        temp.design = {
            layout: json.layout,
            components: json.components,
            htmlCollection: json.htmlCollection,
        };
        pageContext.setSelectedForm(temp);

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
    const pasteFromClipboard = () => {
        const rowFromClipboard = read("page.row");
        // TODO: Add scheme validation here
        const type = rowFromClipboard.data.type;

        if (type != "row") {
            toastEmitter(
                `Clipbaord data is invalid. Please copy again.`,
                true,
                "error",
            );
        } else {
            const currentLayout = structuredClone(pageContext.layout);
            const updatedRowFromClipboard =
                createInstanceOfRowForPaste(rowFromClipboard);

            const updatedLayout = [
                ...currentLayout,
                { ...updatedRowFromClipboard.data, id: makeid(8) },
            ];

            pageContext.setComponents({
                ...pageContext.components,
                ...updatedRowFromClipboard.content.components,
            });

            pageContext.setHtmlCollection({
                ...pageContext.htmlCollection,
                ...updatedRowFromClipboard.content.htmlCollection,
            });

            // pageContext?.setImages({
            //     ...pageContext?.images,
            //     ...updatedRowFromClipboard?.content?.images,
            // });

            pageContext.setLayout(updatedLayout);
        }
    };
    const [theme, setTheme] = useState("light");
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    return (
        <React.Fragment>
            <DndProvider backend={HTML5Backend}>
                <DesignerContext.Provider
                    value={{
                        layout: pageContext.layout,
                        setLayout: pageContext.setLayout,
                        components: pageContext.components,
                        htmlCollection: pageContext.htmlCollection,
                        setHtmlCollection: pageContext.setHtmlCollection,
                        setComponents: pageContext.setComponents,
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
                    <div className="flex-row d-flex s2a-border-bottom justify-content-between align-items-center">
                        <div className="p-2 ps-0">
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip}>
                                <span
                                    className={`mx-2 pointer`}
                                    onClick={() => {
                                        setDesignMode(false);
                                    }}>
                                    <span>
                                        <i className="fa-solid fa-arrow-left mt-1 fs-5"></i>
                                    </span>
                                </span>
                            </OverlayTrigger>
                        </div>
                        <div className="p-2">
                            <span>
                                {`Page Name : ${pageContext.selectedForm.name} `}{" "}
                                {`/ Type : ${pageContext.selectedForm.type} `}
                            </span>
                        </div>
                        <div className="p-2 pe-2">
                            <div className="flex-row d-flex">
                                <span
                                    className={`mx-2 pointer`}
                                    onClick={() =>
                                        pageContext.setRenderPreview(true)
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Page Preview">
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
                                <span
                                    disabled
                                    className={`btn btn-sm undo-btn opacity-50`}
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Undo changes disabled">
                                    <span>
                                        <i className="fa-solid fa-arrow-rotate-left mt-1 fs-5"></i>
                                    </span>
                                </span>
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
                            <div className="row">
                                <div className="max-height-50">
                                    <div className="py-2 ps-2 mb-2">
                                        <div className="row">
                                            <div className="input-group px-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search..."
                                                    onChange={handleSearch}
                                                />
                                                <span className="input-group-text">
                                                    <i className="fa-solid fa-magnifying-glass m-0"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="enable-scroll builder-scrolling">
                                        {filteredFields &&
                                            filteredFields.map(
                                                (sideBarItem, index) => {
                                                    return (
                                                        <SideBarItem
                                                            key={sideBarItem.id}
                                                            data={sideBarItem}
                                                        />
                                                    );
                                                },
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-10">
                            <div className="row m-0">
                                {pageContext.layout &&
                                    pageContext.layout.map((row, index) => {
                                        const currentPath = `${index}`;
                                        return (
                                            <React.Fragment key={row.id}>
                                                <DropZone
                                                    data={{
                                                        path: currentPath,
                                                        childrenCount:
                                                            pageContext?.layout
                                                                .length,
                                                    }}
                                                    onDrop={
                                                        handleDrop
                                                    }></DropZone>
                                                {renderRow(row, currentPath)}
                                            </React.Fragment>
                                        );
                                    })}
                                <DropZone
                                    data={{
                                        path: `${pageContext.layout.length}`,
                                        childrenCount:
                                            pageContext.layout.length,
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
                                    className="my-2 h5 form-label">
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
                                    <div
                                        className={`mx-2 pointer ${
                                            isEditable ? "visually-hidden" : ""
                                        } `}
                                        onClick={() => copyToClipboard()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Copy JSON">
                                        <i className="fa-regular fs-5 fa-clone"></i>
                                    </div>
                                    <div
                                        className={`mx-2 pointer ${
                                            !isEditable ? "" : "visually-hidden"
                                        } `}
                                        onClick={() => enableEditJson()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Edit">
                                        <i className="fa-regular fs-5 fa-pen-to-square"></i>
                                    </div>

                                    <div
                                        className={`mx-2 pointer ${
                                            !isEditable ? "visually-hidden" : ""
                                        } `}
                                        onClick={() => disableEditJson()}
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Undo changes">
                                        <i className="fa-solid fa-arrow-rotate-left fs-5"></i>
                                    </div>

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
                                    pageContext.selectedForm.design
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
                                                    pageContext.selectedForm
                                                        .design,
                                                    null,
                                                    2
                                                )}
                                            </mark>
                                        ) : (
                                            <div className="text-dark">
                                                {JSON.stringify(
                                                    pageContext.selectedForm
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
            <PagePreviewModal />
        </React.Fragment>
    );
};

function RowEditDialogue({
    showEditRowDialogue,
    setShowEditRowDialogue,
    selectedRow,
}) {
    const pageContext = useContext(PageContext);

    const [enableTabView, setEnableTabView] = useState("NO");
    const [renderMode, setRenderMode] = useState(RENDER_MODE.firstTime);
    const [classes, setClasses] = useState("");

    useEffect(() => {
        if (selectedRow.id) {
            pageContext.layout.forEach(row => {
                if (row) {
                    if (row.id === selectedRow.id) {
                        if (row["enableTabView"]) {
                            let _enableTabView = row.enableTabView;
                            setEnableTabView(_enableTabView);
                        } else {
                            setEnableTabView("NO");
                        }

                        if (row["renderMode"]) {
                            setRenderMode(row.renderMode);
                        } else {
                            setRenderMode(RENDER_MODE.firstTime);
                        }

                        if (row["classes"]) {
                            setClasses(row.classes);
                        } else {
                            setClasses("");
                        }
                    }
                }
            });
        } else {
            setEnableTabView("NO");
            setRenderMode(RENDER_MODE.firstTime);
            setClasses("");
        }
    }, [selectedRow.id]);

    function handleLayoutUpdate() {
        let _layout = structuredClone(pageContext.layout);

        _layout.forEach(row => {
            if (row) {
                if (row.id === selectedRow.id) {
                    row.enableTabView = enableTabView;
                    row.classes = classes;
                    row.renderMode = renderMode;
                }
            }
        });

        pageContext.setLayout(_layout);
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
                            <label
                                className="form-label"
                                htmlFor="flexCheckChecked">
                                Classes
                            </label>
                            <input
                                className="form-control form-control-sm"
                                onChange={e => setClasses(e.target.value)}
                                value={classes}
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
                    {enableTabView === "YES" && (
                        <div className="row mb-3">
                            <div className="col">
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckChecked">
                                    Tabs data refresh
                                </label>
                                <div className="form-check">
                                    <input
                                        className="form-check-input pointer"
                                        type="radio"
                                        id="first-time-render"
                                        onChange={e =>
                                            setRenderMode(RENDER_MODE.firstTime)
                                        }
                                        checked={
                                            renderMode === RENDER_MODE.firstTime
                                                ? true
                                                : false
                                        }
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="first-time-render">
                                        On First Click
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input pointer"
                                        type="radio"
                                        id="all-time-render"
                                        checked={
                                            renderMode === RENDER_MODE.allTime
                                                ? true
                                                : false
                                        }
                                        onChange={e =>
                                            setRenderMode(RENDER_MODE.allTime)
                                        }
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="all-time-render">
                                        On Every Click
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

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
    const pageContext = useContext(PageContext);

    const [visibilityExpression, setVisibilityExpression] = useState("");

    useEffect(() => {
        if (showEditColumnDialogue && selectedColumn.id) {
            pageContext.layout.forEach(row => {
                row.children.map(column => {
                    if (column.id === selectedColumn.id) {
                        if (column["visibilityExpression"] !== undefined) {
                            let _visibilityExpression =
                                column.visibilityExpression;
                            setVisibilityExpression(_visibilityExpression);
                            return;
                        }
                    }
                });
            });
        } else {
            setVisibilityExpression("");
        }
    }, [selectedColumn.id, showEditColumnDialogue]);

    function handleLayoutUpdate() {
        let _layout = structuredClone(pageContext.layout);
        _layout.map(row => {
            row.children.map(column => {
                if (column.id === selectedColumn.id) {
                    column.visibilityExpression = visibilityExpression;
                }
            });
        });
        pageContext.setLayout(_layout);
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

export { Designer };

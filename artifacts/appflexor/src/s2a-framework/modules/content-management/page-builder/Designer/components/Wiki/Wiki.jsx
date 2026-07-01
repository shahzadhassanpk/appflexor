// React component to display hierarchical user manual using Adjacency List Model
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../../../../Config";
import { SplitView } from "./SplitView";
import { Interweave } from "interweave";
import Markdown from "react-markdown";
import DesignerContext from "../../../Context/DesignerContext";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { AppContext } from "../../../../../../../AppContext";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import DataListFormViewer from "../../../../../data-management/form-builder/Forms/FormViewer/DataListFormViewer";

import "./styles.css";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";
import { toast } from "react-toastify";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import {
    tryToParse,
    compareStrings,
} from "../../../../../data-management/form-builder/Forms/FormViewer/utils";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";

// Recursive component to render sections and subsections
const Section = ({
    section,
    childrenMap,
    setChildrenMap,
    selectedNode,
    setSelectedNode,
    handleWikiEdit,
    handleWikiMove,
    selectedIds,
    setSelectedIds,
    selectedMove,
    sections,
    setSections,
    handleExpension,
}) => {
    const selectedItem = selectedIds?.find(item => item === section.id);
    // debugger
    const hanldeChange = id => {
        const item = selectedIds?.find(item => item === section.id);
        if (item) {
            setSelectedIds(prev => prev.filter(_item => _item !== item));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const updateTreeNode = (node, event) => {
        let map = localStorage.getItem("wiki-selection") || {};
        if (typeof map === "string") {
            map = tryToParse(map);
        }
        if (map[node.id]) {
            map[node.id] = false;
        } else {
            map[node.id] = true;
        }

        localStorage.setItem("wiki-selection", JSON.stringify(map));
        localStorage.setItem("wiki_last_selection", node?.id);
        handleExpension(sections);
    };

    return (
        <li
            className="list-unstyled pointer sub-node"
            key={section.id}
            style={{
                marginLeft: "10px",
            }}>
            {/* <pre>
                <code>{JSON.stringify(section)}</code>
            </pre> */}
            <div
                className={`tree-node d-flex ${
                    section.id == selectedNode.id ? "active" : ""
                }`}
                onClick={e => {
                    setSelectedNode(section);
                    updateTreeNode(section, e);
                }}>
                <div>
                    <div className="col-sm-12 mb-1 d-flex">
                        {selectedMove && (
                            <DynamicCheckBoxs
                                handleChange={hanldeChange}
                                items={[{ code: section.id }]}
                                selectedItem={selectedItem}
                            />
                        )}{" "}
                        <span>{section.title}</span>
                    </div>
                    {selectedMove && section.id == selectedNode.id && (
                        <div className="col-sm-12 text-right d-flex gap-2">
                            <a
                                href="#"
                                onClick={() => handleWikiEdit("add")}>
                                Add Child
                            </a>

                            {selectedMove && (
                                <a
                                    href="#"
                                    onClick={() => handleWikiMove("move")}>
                                    Move here
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {section?.isOpen &&
                childrenMap[section.id] &&
                childrenMap[section.id].map(child => (
                    <ul
                        key={section.id}
                        className="ps-4 list-unstyled pointer main-node">
                        <Section
                            key={child.id}
                            section={child}
                            sections={sections}
                            childrenMap={childrenMap}
                            setSelectedNode={setSelectedNode}
                            selectedNode={selectedNode}
                            handleWikiEdit={handleWikiEdit}
                            handleWikiMove={handleWikiMove}
                            selectedIds={selectedIds}
                            setSelectedIds={setSelectedIds}
                            selectedMove={selectedMove}
                            setChildrenMap={setChildrenMap}
                            setSections={setSections}
                            handleExpension={handleExpension}
                        />
                    </ul>
                ))}
        </li>
    );
};

const Wiki = props => {
    const wikiGroups = props?.component?.data?.groups;
    const [sections, setSections] = useState([]);
    const [childrenMap, setChildrenMap] = useState({});
    const [selectedNode, setSelectedNode] = useState({});
    const [selectedPage, setSelectedPage] = useState({});
    const [selectedPageLinks, setSelectedPageLinks] = useState({});
    const [selectedRelatedPage, setSelectedRelatedPage] = useState([]);

    const [businessKey, setBusinessKey] = useState("new");
    const formModalRef = useRef(null);
    const handleShow = () => formModalRef.current.show();
    const handleClose = () => formModalRef.current.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    const wikiFormModal = useRef(null);

    const [obj, setObj] = useState({});
    const [wiki, setWiki] = useState({});
    const [componentData, setComponentData] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);

    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const userGroup = appContext?.userGroups;
    const enableMove = false;
    const isAuthor =
        wikiGroups && compareStrings(wikiGroups, userGroup?.group_code, ";");

    const [selectedMove, setSelectedMove] = useState(isAuthor);
    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;
            // temObj.id = makeid(5);
            setComponentData(temObj);

            let key = "id";
            let value = temObj.formId;
            setObj({
                [key]: value,
            });

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);
    useEffect(() => {
        if (
            props.mode &&
            props.modeType &&
            props.mode === props.modeType.render &&
            obj.id
        ) {
            getData("FIRST_RENDER");
        }
    }, [props, obj]);

    useEffect(() => {
        if (selectedNode?.id) {
            getPage();
        }
    }, [selectedNode]);

    function isValidMove(data, moveId, newParentId) {
        // Create a map to store nodes by their id for fast lookups
        const map = new Map();
        data.forEach(item => {
            map.set(item.id, { ...item, children: [] });
        });

        // Link children to their respective parents
        data.forEach(item => {
            if (item.parent_id) {
                const parent = map.get(item.parent_id);
                const child = map.get(item.id);
                if (parent?.children) parent.children.push(child);
            }
        });

        // Find the node being moved and the new parent
        const moveNode = map.get(moveId);
        const newParentNode = map.get(newParentId);

        // If the move node's parent is the same as the new parent, it's an invalid move
        if (moveNode.parent_id === newParentId) {
            return false;
        }

        // Function to check if the new parent is one of the descendants of the node being moved (cycle check)
        function isDescendant(node, targetNode) {
            if (!node) return false;
            if (node.id === targetNode.id) return true;
            for (const child of node.children) {
                if (isDescendant(child, targetNode)) {
                    return true;
                }
            }
            return false;
        }

        // If the new parent is already a descendant of the move node, return false (invalid move)
        if (isDescendant(moveNode, newParentNode)) {
            return false;
        }

        // If no cycle, the move is valid
        return true;
    }

    async function handleMove() {
        const idsMap = {};
        const sectionsMap = {};
        const selectionIsValid = [];
        const request = {
            data: [],
        };
        const newParentId = selectedNode.id;

        selectedIds.forEach(id => {
            const parentToChild = isValidMove(sections, id, newParentId);
            selectionIsValid.push(parentToChild);
        });
        const valid = selectionIsValid.every(item => item === true);
        if (!valid) {
            toastEmitter("Invalid Move", true, "error");
            return;
        }

        for (let id of selectedIds) {
            idsMap[id] = id;
        }
        for (let section of sections) {
            sectionsMap[section.id] = section;
        }

        for (let section of sections) {
            if (idsMap[section.id]) {
                section.parent_id = newParentId;
                const reqData = {
                    id: section.id,
                    formId: "wiki_page",
                    entity: "wiki_page",
                    action: "update",
                    formData: section,
                };

                request.data.push(reqData);
            }
        }

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                getData("FIRST_RENDER");
                setSelectedIds([]);
            });
    }

    function handleDelete() {
        if (!confirm("Delete > Are you sure?")) {
            return;
        }
        let req = {
            datasource: "",
            data: [
                {
                    formId: "wiki_page",
                    entity: "wiki_page",
                    action: "delete",
                    id: selectedPage.id,
                },
            ],
        };
        let url = API_URL + "?service.key=update.formData";
        axios.post(url, req).then(res => {
            if (res.status === 200) {
                getData("FIRST_RENDER");
            }
        });
    }

    function handleWikiEdit(mode) {
        if (mode == "delete") {
            handleDelete();
            return;
        }
        let id = "new";
        if (mode == "edit") {
            // setBusinessKey(selectedNode?.id ? selectedNode.id : "new");
            id = selectedNode?.id ? selectedNode.id : "new";
        } else {
            setBusinessKey("new");
        }
        // wikiFormModal.current.show();
        let url = `/app/page-form-viewer?formKey=wiki_page&businessKey=${id}&external=true&wiki_id=${obj.id}`;
        window.open(url, "_blank");
    }

    function handleAddNewWikiAction(actionType, resObj) {
        if (actionType == "COMPLETE") {
            wikiFormModal.current.close();
        }
        getData("FIRST_RENDER");
    }

    function handleExpension(sections) {
        try {
            const selectedNodeIds = localStorage.getItem("wiki-selection");
            const map = {};
            const emptyObj = {};
            const _sections = [...sections];

            if (selectedNodeIds) {
                const parsedNodes = tryToParse(selectedNodeIds) || emptyObj;

                if (emptyObj === parsedNodes) return;

                const updatedSections = _sections.map(section => {
                    return {
                        ...section,
                        isOpen: true, //parsedNodes[section?.id],
                    };
                });

                updatedSections.forEach(section => {
                    if (!map[section.parent_id]) {
                        map[section.parent_id] = [];
                    }
                    map[section.parent_id].push(section);
                });

                setChildrenMap(map);
                setSections(updatedSections);
            } else {
                _sections.forEach(section => {
                    if (!map[section.parent_id]) {
                        map[section.parent_id] = [];
                    }
                    map[section.parent_id].push(section);
                });

                setChildrenMap(map);
                setSections(_sections);
            }
        } catch (error) {
            console.log(error);
        }
    }

    function getData(condition) {
        let parsedTagAndPosts = [];
        var dataRequest = {};
        if (condition === "FIRST_RENDER") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: obj.id,
                        dataKey: "wiki",
                        serviceKey: "wiki",
                        mode: "formData",
                    },
                    {
                        serviceParams: obj.id,
                        dataKey: "wikiPages",
                        serviceKey: "wiki.pages",
                        mode: "formData",
                    },
                ],
            };
        }
        if (dataRequest?.dataKeys) {
            return new Promise((resolve, reject) => {
                axios
                    .post(API_URL + "?service.key=multiKey.data", dataRequest)
                    .then(response => {
                        resolve(response);
                        if (response.data.C_STATUS === undefined) {
                            getData("FIRST_RENDER");
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        } else if (response.data.C_STATUS === "SUCCESS") {
                            if (response.data.C_DATA) {
                                if (response.data.C_DATA.wiki.length > 0) {
                                    setWiki(response.data.C_DATA.wiki[0]);
                                }
                                if (response.data.C_DATA.wikiPages.length > 0) {
                                    let data = response.data.C_DATA.wikiPages;
                                    setSections(data);
                                    const map = {};
                                    data.forEach(section => {
                                        if (!map[section.parent_id]) {
                                            map[section.parent_id] = [];
                                        }
                                        map[section.parent_id].push(section);
                                    });
                                    setChildrenMap(map);
                                    handleExpension(data);
                                    if (!selectedNode?.id) {
                                        const wiki_last_selection =
                                            localStorage.getItem(
                                                "wiki_last_selection",
                                            );
                                        if (wiki_last_selection) {
                                            let lastNode = {};
                                            for (let node of data) {
                                                if (
                                                    node.id ===
                                                    wiki_last_selection
                                                ) {
                                                    lastNode = node;
                                                    break;
                                                }
                                            }
                                            setSelectedNode(lastNode);
                                        } else {
                                            const firstNode = data[0];
                                            firstNode.isOpen = true;
                                            setSelectedNode(firstNode);
                                        }
                                    }
                                } else {
                                    setPostList([]);
                                }

                                if (response.data.C_DATA.styleList) {
                                    setStyles(response.data.C_DATA.styleList);
                                }

                                // handleAddNewPost();
                            } else {
                                console.log(
                                    `Either api does not exists or SQL query returns no result.`,
                                );
                            }
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            });
        }
    }
    function getPage() {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedNode.id,
                    dataKey: "wikiPage",
                    serviceKey: "wiki.page",
                    mode: "formData",
                },
                {
                    serviceParams: selectedNode.id,
                    dataKey: "wikiPageLinks",
                    serviceKey: "wiki.page.links",
                    mode: "formData",
                },
                {
                    serviceParams: selectedNode.id,
                    dataKey: "wikiRelatedPage",
                    serviceKey: "wiki.related.page",
                    mode: "formData",
                },
            ],
        };
        if (dataRequest?.dataKeys) {
            return new Promise((resolve, reject) => {
                axios
                    .post(API_URL + "?service.key=multiKey.data", dataRequest)
                    .then(response => {
                        resolve(response);
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        } else if (response.data.C_STATUS === "SUCCESS") {
                            if (response.data.C_DATA) {
                                if (response.data.C_DATA.wikiPage.length > 0) {
                                    let data = response.data.C_DATA.wikiPage[0];
                                    setSelectedPage(data);
                                }
                                if (
                                    response.data.C_DATA.wikiPageLinks.length >
                                    0
                                ) {
                                    let data =
                                        response.data.C_DATA.wikiPageLinks;
                                    setSelectedPageLinks(data);
                                } else {
                                    setSelectedPageLinks({});
                                }
                                if (
                                    response.data.C_DATA.wikiRelatedPage
                                        .length > 0
                                ) {
                                    let data =
                                        response.data.C_DATA.wikiRelatedPage;
                                    setSelectedRelatedPage(data);
                                } else {
                                    setSelectedRelatedPage([]);
                                }
                            } else {
                                console.log(
                                    `Either api does not exists or SQL query returns no result.`,
                                );
                            }
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            });
        }
    }
    const left = (
        <>
            <div className="tree s2a-scroll enable-scroll">
                {childrenMap[""] &&
                    childrenMap[""].map(section => (
                        <Section
                            key={section.id}
                            section={section}
                            sections={sections}
                            setSections={setSections}
                            childrenMap={childrenMap}
                            setChildrenMap={setChildrenMap}
                            setSelectedNode={setSelectedNode}
                            selectedNode={selectedNode}
                            handleWikiEdit={handleWikiEdit}
                            handleWikiMove={handleMove}
                            setSelectedIds={setSelectedIds}
                            selectedIds={selectedIds}
                            selectedMove={selectedMove}
                            handleExpension={handleExpension}
                        />
                    ))}
            </div>
        </>
    );
    return (
        <div>
            {/* {JSON.stringify(wiki)} */}
            {/* {JSON.stringify(props?.component?.data)} */}
            {/* <code>{JSON.stringify(childrenMap)}</code> */}
            <div>
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.render && (
                        <div>
                            <div className="s2a-form-title d-flex">
                                <div className="col-sm-10">
                                    <h6 className="mb-1">{wiki?.name}</h6>
                                    {/* <code>{JSON.stringify(props.component.data)}</code> */}
                                </div>
                                <div className="col-sm-2 text-end">
                                    {isAuthor && (
                                        <div className="col-sm-12">
                                            {selectedMove && (
                                                <a
                                                    href="#"
                                                    className="me-2"
                                                    onClick={() => {
                                                        setSelectedPage({});
                                                        setSelectedNode({});
                                                        handleWikiEdit("add");
                                                    }}>
                                                    Add Page
                                                </a>
                                            )}
                                            <input
                                                className={`form-check-input me-1`}
                                                type="checkbox"
                                                name="selectedMove"
                                                id="selectedMove"
                                                value={selectedMove}
                                                onChange={e =>
                                                    setSelectedMove(
                                                        !selectedMove,
                                                    )
                                                }
                                                checked={selectedMove}
                                            />{" "}
                                            Edit{" "}
                                        </div>
                                    )}
                                </div>
                                {/* {props.mode} {JSON.stringify(props.modeType)} */}
                            </div>
                            <SplitView
                                left={left}
                                right={
                                    <>
                                        {/* Main Content */}
                                        <div className="left-section col-sm-9">
                                            <div className="s2a-scroll enable-scroll">
                                                <div
                                                    className="col-sm-12 d-flex"
                                                    style={{
                                                        borderBottom:
                                                            "1px solid",
                                                        marginBottom: "15px",
                                                    }}>
                                                    <div className="col-sm-11">
                                                        <h1>
                                                            {" "}
                                                            {
                                                                selectedPage?.title
                                                            }{" "}
                                                        </h1>
                                                    </div>

                                                    {selectedMove && (
                                                        <div className="col-sm-1 mt-auto mb-1 d-flex text-end gap-2">
                                                            <i
                                                                className="far fa-edit cursor-pointer"
                                                                onClick={() =>
                                                                    handleWikiEdit(
                                                                        "edit",
                                                                    )
                                                                }></i>
                                                            <i
                                                                className="fa-regular fa-trash-can text-danger cursor-pointer"
                                                                onClick={() =>
                                                                    handleWikiEdit(
                                                                        "delete",
                                                                    )
                                                                }></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-sm-12">
                                                    {/* {JSON.stringify(selectedPage)} */}
                                                    {!selectedPage?.content_type ||
                                                    selectedPage?.content_type ===
                                                        "HTML" ? (
                                                        <Interweave
                                                            content={
                                                                selectedPage?.content
                                                            }
                                                        />
                                                    ) : (
                                                        <Markdown>
                                                            {
                                                                selectedPage?.content
                                                            }
                                                        </Markdown>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sticky Sidebar */}
                                        <div className="right-section col-sm-3 s2a-scroll enable-scroll">
                                            {/* {JSON.stringify(selectedRelatedPage)} */}
                                            {selectedRelatedPage?.length >
                                                0 && (
                                                <>
                                                    <label className="section-title">
                                                        Related Pages
                                                    </label>
                                                    <ul className="related-list">
                                                        {selectedRelatedPage.map(
                                                            (link, index) =>
                                                                link.title ? (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            setSelectedNode(
                                                                                link,
                                                                            )
                                                                        }>
                                                                        <a href="#">
                                                                            {
                                                                                link.title
                                                                            }
                                                                        </a>
                                                                    </li>
                                                                ) : null,
                                                        )}
                                                    </ul>
                                                </>
                                            )}

                                            {/* Related Links */}
                                            {selectedPageLinks?.length > 0 && (
                                                <>
                                                    <div className="section-header">
                                                        <label className="section-title">
                                                            Related Links
                                                        </label>
                                                    </div>
                                                    <ul className="link-list">
                                                        {selectedPageLinks.map(
                                                            (link, index) =>
                                                                link.title ? (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }>
                                                                        <a
                                                                            href={
                                                                                link.url?.startsWith(
                                                                                    "http",
                                                                                )
                                                                                    ? link.url
                                                                                    : `https://${link.url}`
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer">
                                                                            {
                                                                                link.title
                                                                            }
                                                                        </a>
                                                                    </li>
                                                                ) : null,
                                                        )}
                                                    </ul>
                                                </>
                                            )}

                                            {/* Downloads */}
                                            {selectedPage?.downloads
                                                ?.split(";")
                                                .filter(f => f.trim() !== "")
                                                .length > 0 && (
                                                <>
                                                    <label className="section-title">
                                                        Downloads
                                                    </label>
                                                    {selectedPage.downloads
                                                        .split(";")
                                                        .filter(
                                                            f =>
                                                                f.trim() !== "",
                                                        )
                                                        .map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="download-list">
                                                                <a
                                                                    href={`/file/service/wiki_page/${
                                                                        selectedPage.id
                                                                    }/${encodeURIComponent(
                                                                        file.trim(),
                                                                    )}`}
                                                                    download
                                                                    target="_blank"
                                                                    rel="noopener noreferrer">
                                                                    {file.trim()}
                                                                </a>
                                                            </div>
                                                        ))}
                                                </>
                                            )}
                                        </div>
                                    </>
                                }
                            />
                        </div>
                    )}
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <div
                            className={` p-3 position-relative `}
                            onClick={() => setShow(true)}>
                            {componentData.formId ? (
                                <div
                                    style={{ minHeight: "100px" }}
                                    className="d-flex align-items-center justify-content-center">
                                    <span className="text-muted">
                                        <span className="fa fa-book"></span>
                                        Selected Wiki{" "}
                                        <span className="text-danger">
                                            {componentData.formName}
                                        </span>{" "}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    style={{ minHeight: "100px" }}
                                    className="d-flex align-items-center justify-content-center">
                                    <span className="text-muted cursor-pointer">
                                        <span className="fa-solid fa-database icon-space"></span>
                                        No{" "}
                                        <span className="text-danger">
                                            Wiki
                                        </span>{" "}
                                        selected.
                                    </span>
                                </div>
                            )}

                            {/* <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}
                                >
                                <i className="m-2 fa-solid fa-gear d-block"></i>{" "}
                            </div>
                        </div> */}
                        </div>
                    )}
                <ChildrenModal
                    ref={formModalRef}
                    size="small"
                    header="Form Settings">
                    <UpdateText
                        setShow={setShow}
                        tenantId={tenantId}
                    />
                </ChildrenModal>
                <ChildrenModal
                    ref={wikiFormModal}
                    centered={true}
                    header={`Wiki Page`}>
                    <DataListFormViewer
                        formKey={"wiki_page"}
                        businessKey={businessKey}
                        handleActions={handleAddNewWikiAction}
                        handleClose={() => {
                            wikiFormModal.current.close();
                        }}
                        formVars={{
                            wiki_id: wiki.id,
                            parent_id: selectedNode?.id ? selectedNode.id : "",
                        }}
                    />
                </ChildrenModal>
            </div>
        </div>
    );
};

function UpdateText({ setShow, tenantId }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});
    const [formList, setFormList] = useState([]);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (inputField && context?.components) {
            handleUpdateComponentData();
        }
    }, [inputField]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(context.selectedComponent.props);
            setInputField(context.selectedComponent.data);
        } else {
            setInputField({});
            setPropsFromComponent([]);
            setCurrentComponent({});
        }
    }, [context]);

    const handleInputField = event => {
        let name = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        // old
        // setInputField((prev) => ({
        //     ...prev,
        //     [name]: value,
        // }));

        // new
        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);

        // let _components = { ...context.components };

        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id]?.data;
        let selectedForm = formList.filter(f => f.id === inputField.formId);
        let formName = selectedForm[0] ? selectedForm[0].name : "";
        tempData = {
            ...tempData,
            ...inputField,
            formName,
        };
        if (tempData && _components[currentComponent.id]?.data) {
            _components[currentComponent.id].data = tempData;
            context.setComponents(_components);
        }
    };

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "forms",
                    serviceKey: "wiki.list",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "groups",
                    serviceKey: "wiki.user.groups",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setFormList(response.data.C_DATA.forms);
                    setGroups(response.data.C_DATA.groups);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const handleGroups = groups => {
        let selectedGroups = "";

        for (let group of groups) {
            selectedGroups += `${group?.code};`;
        }
        setInputField({
            groups: selectedGroups,
        });
    };

    const getSelectedOptions = () => {
        if (!Array.isArray(groups)) return;
        const result = [];
        for (let group of groups) {
            if (inputField?.groups?.includes(group?.code)) {
                result.push(group);
            }
        }
        return result;
    };
    return (
        <ErrorBoundary>
            <div className="p-2">
                <div className="row mb-3">
                    <div className="col-sm-12">
                        <label
                            className="mt-2"
                            htmlFor="">
                            Wiki
                        </label>
                        <select
                            className="form-select"
                            name="formId"
                            onChange={handleInputField}
                            value={inputField["formId"]}>
                            <option defaultValue="">Select an option</option>
                            {formList &&
                                formList.map(form => (
                                    <option value={form.id}>{form.name}</option>
                                ))}
                        </select>
                    </div>
                    <div className="col-sm-12 mt-2">
                        <label
                            htmlFor=""
                            className="mb-1">
                            Author Groups
                        </label>
                        <ReactSelect
                            isMulti={true}
                            options={groups}
                            fieldLabel="code"
                            fieldValue="code"
                            selectedOptions={getSelectedOptions()}
                            handleChange={handleGroups}
                        />
                    </div>
                </div>
                <div className="d-flex flex-row justify-content-end mt-2">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                setShow(false);
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default Wiki;

import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { API_URL, BPM_API_URL } from "../../../../../../Config";
import { makeShortId } from "../../../../../../utils/utils";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import DataListFormViewer from "../../../../../data-management/form-builder/Forms/FormViewer/DataListFormViewer";

import MoveDocument from "./MoveDocument";
import MoveMultiFolder from "./MoveMultiFolder";
import FolderListView from "./FolderListView";
import DocumentListView from "./DocumentListView";
import Navigation from "./components/Navigation";
import MoveFolder from "./MoveFolder";

import {
    INITIAL_CREATE_STATE,
    INITIAL_SELECT_STATE,
    INITIAL_SELECTED_ACTIONS_STATE,
    SELECT_OPTIONS,
    SELECTED_ACTIONS,
    SORTING,
} from "./utils/constants";
import {
    copyAddNewDocFolder,
    formatDataToMap,
    getSelectedActionState,
    handleCheckinDocAction,
    sortListByFilterType,
} from "./utils/helper";

import { RepositoryContext } from "./context/RespositoryContext";
import { Modal } from "react-bootstrap";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { AppContext } from "../../../../../../../AppContext";
import { tryToParse } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";
import { docActions } from "./RepositoryViewer";
import { s } from "plotly.js/dist/plotly-cartesian";

const Detailspanel = ({
    explorerTree,
    repository,
    datalistIds,
    selectedFolder: selectedParentFolder,
    allFoldersListMap,
    allDocumentsListMap,
    navigationStack,
    onUpdateAction,
    dmsConfig,
    backNavigationAction,
    handleNavigationAction,
    search,
    setSearch,
    startProcessInstance7,
    startProcessInstance8,
    actions,
}) => {
    const [folderList, setFolderList] = useState([]);
    const [sortedFolderList, setSortedFolderList] = useState([]);
    const [documentList, setDocumentList] = useState([]);
    const [documentListMap, setDocumentListMap] = useState({});
    const [sortedDocumentList, setSortedDocumentList] = useState([]);

    const [formKeys, setFormKeys] = useState([]);
    const [selectedFormKey, setSelectedFormKey] = useState({});
    const [selectedFolder, setSelectedFolder] = useState({});
    const [selectedDoc, setSelectedDoc] = useState({});
    const [defaultSorting, setDefaultSorting] = useState(SORTING.ASC);
    const [selectedFolders, setSelectedFolders] = useState([]);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);
    const [childTypes, setChildTypes] = useState([]);

    const lastRootFoldersId = useRef(null); // API calls optimization
    const lastSubFoldersId = useRef(null); // API calls optimization

    // Dialogs
    const parentFormModal = useRef(null);
    const folderFormModal = useRef(null);
    const documentEditModal = useRef(null);
    const documentCheckinModal = useRef(null);

    const singleFolderDeleteModal = useRef(null);
    const singleFolderMoveModal = useRef(null);
    const singleDocumentDeleteModal = useRef(null);
    const singleDocumentMoveModal = useRef(null);

    const multiDeleteModal = useRef(null);
    const multiMoveModal = useRef(null);
    const appContext = useContext(AppContext);
    const { profile } = appContext;
    const { tenant_id: tenantId, process_engine } =
        appContext.tenantSubscription;
    let permissionActions = null;
    const selectedFolderPermission = !selectedParentFolder.parent_id
        ? 0
        : selectedParentFolder.permission || 0;

    switch (selectedFolderPermission) {
        case 0: {
            permissionActions = "ALL";
            break;
        }
        case 1: {
            permissionActions = "READ";
            break;
        }
        case 2: {
            permissionActions = "WRITE";
            break;
        }
    }

    const [filteredFolders, setFilteredFolders] = useState(sortedFolderList);
    useEffect(() => {
        if (!search) {
            setFilteredFolders(sortedFolderList);
            return;
        }

        const lowerSearch = search.toLowerCase().trim();

        const _filtered = sortedFolderList.filter(doc => {
            // Check text fields
            const searchMatch = Object.entries(doc).some(([key, value]) => {
                if (key === "tags" || value == null) return false;
                return value.toString().toLowerCase().includes(lowerSearch);
            });

            // Check tags separately
            const tagMatch = doc?.tags
                ?.replaceAll("_", "")
                ?.toLowerCase()
                ?.includes(lowerSearch);

            return searchMatch || tagMatch;
        });

        setFilteredFolders(_filtered);
    }, [sortedFolderList, search]);

    const [filteredDocuments, setFilteredDocuments] = useState(documentList);

    useEffect(() => {
        if (!search) {
            setFilteredDocuments(sortedDocumentList);
            return;
        }

        const lowerSearch = search.toLowerCase().trim();

        const _filtered = sortedDocumentList.filter(doc => {
            // Check text fields
            const searchMatch = Object.entries(doc).some(([key, value]) => {
                if (key === "tags" || value == null) return false;
                return value.toString().toLowerCase().includes(lowerSearch);
            });

            // Check tags separately
            const tagMatch = doc?.tags
                ?.replaceAll("_", "")
                ?.toLowerCase()
                ?.includes(lowerSearch);

            return searchMatch || tagMatch;
        });

        setFilteredDocuments(_filtered);
    }, [sortedDocumentList, search]);

    useEffect(() => {
        if (
            !selectedParentFolder.id &&
            repository.id &&
            !lastRootFoldersId.current
        ) {
            getDataByParentId(repository);
            // setFormKeys(formatFormKeys(repository));
            lastRootFoldersId.current = repository.id;
            lastSubFoldersId.current = null;
        }
    }, [selectedParentFolder, repository]);

    useEffect(() => {
        if (selectedParentFolder.id) {
            if (!lastSubFoldersId.current) {
                getData();
            } else if (lastSubFoldersId.current != selectedParentFolder.id) {
                getData();
            }
        }
    }, [selectedParentFolder]);

    function getData() {
        // setFormKeys(formatFormKeys(selectedParentFolder));
        getDataByParentId(selectedParentFolder);
        lastSubFoldersId.current = selectedParentFolder.id;
        lastRootFoldersId.current = null;
    }

    function handleFolderSelection(folder) {
        const id = folder?.id;
        if (selectedFolders.includes(id)) {
            const filteredList = selectedFolders.filter(f => f != id);
            setSelectedFolders(filteredList);
        } else {
            const updatedList = [...selectedFolders, id];
            setSelectedFolders(updatedList);
        }
    }

    function handleSearch(event) {
        const { value } = event.target;

        setSearch(value);
    }

    function handleDocumentSelection(id) {
        if (selectedDocuments.includes(id)) {
            const filteredList = selectedDocuments.filter(f => f != id);
            setSelectedDocuments(filteredList);
        } else {
            const updatedList = [...selectedDocuments, id];
            setSelectedDocuments(updatedList);
        }
    }

    function handleSelectActionChange(selectedItem) {
        const updatedState = getSelectedActionState(
            selectedItem.value,
            selectedParentFolder,
            selectedFolders,
            selectedDocuments,
            allFoldersListMap,
            documentListMap,
            repository,
        );

        setSelectedFolders(updatedState[0]);
        setSelectedDocuments(updatedState[1]);
    }

    function handleSelectedActionChange(selectedItem) {
        switch (selectedItem.value) {
            case "MOVE":
                multiMoveModal.current.show();
                break;
            case "DELETE":
                setShowDeleteDialogue(true);
                break;
            case "DESELECT_ALL":
                setSelectedFolders([]);
                setSelectedDocuments([]);
                break;
        }
    }

    function handleSingleFolderDelete() {
        singleFolderDeleteModal.current.close();
    }

    function handleSingleFolderMove(resObj) {
        fetchData(resObj);
        singleFolderMoveModal.current.close();
    }

    function handleSingleDocMove(resObj) {
        fetchData(resObj);
        singleDocumentMoveModal.current.close();
    }
    function handleMultipleMoveAction(resObj) {
        fetchData(resObj);
        multiMoveModal.current.close();
    }

    function handleParentFormSelection(obj) {
        console.log("hit");

        setSelectedFormKey(obj);
        parentFormModal.current.show();
    }

    function handleFolderEdit(node) {
        const nodeId = node.id;
        // by talha bhai
        // const selectedSubFolder = allFoldersListMap[nodeId];

        // by haider
        const selectedFolder = folderList.find(fol => fol.id === nodeId);
        if (selectedFolder) {
            setSelectedFolder(selectedFolder);
        } else {
            setSelectedFolder(node);
        }

        folderFormModal.current.show();
    }

    function handleDocEdit(doc) {
        setSelectedDoc(doc);
        documentEditModal.current.show();
    }

    function handleDocCheckin(doc) {
        setSelectedDoc(doc);
        documentCheckinModal.current.show();
    }

    function handleFolderDelete(folder) {
        setSelectedFolder(folder);
        singleFolderDeleteModal.current.show();
    }
    function handleFolderMove(folder) {
        setSelectedFolder(folder);
        singleFolderMoveModal.current.show();
    }
    function handleDocMove(doc) {
        setSelectedDoc(doc);
        singleDocumentMoveModal.current.show();
    }
    function handleDocUpdateActions(resObj) {
        fetchData(resObj);
    }

    function handleAddNewDocFolderAction(actionType, resObj) {
        console.log(resObj);
        console.log(appContext);
        if (actionType == "COMPLETE") {
            parentFormModal.current.close();
            fetchData(resObj);
            copyAddNewDocFolder(resObj);
            // process start there
            startProcess(resObj);
        }
    }

    function startProcess(resObj) {
        if ("folder_type" in resObj) {
            const process_key = childTypes?.find(
                folderType => folderType?.id === resObj?.folder_type,
            );
            // console.log(process_key);
            // if (process_engine === "CAMUNDA_SEVEN") {
            //     startProcessInstance7(
            //         resObj.id,
            //         {
            //             subject: resObj.title,
            //             event: folderActions.create,
            //         },
            //         { process_key: process_key?.on_create },
            // appContext
            //     );
            // } else {
            //     startProcessInstance8(
            //         resObj.id,
            //         {
            //             subject: resObj.title,
            //             event: folderActions.create,
            //         },
            //         { process_key: process_key?.on_create },
            // appContext
            //     );
            // }
        } else {
            const process_key = childTypes?.find(
                DOC => DOC?.id === resObj?.doc_type,
            );
            if (process_engine === "CAMUNDA_SEVEN") {
                startProcessInstance7(
                    resObj.id,
                    {
                        tenantId,
                        action: docActions.create,
                        username: profile?.username,
                    },
                    { process_key: process_key?.on_create },
                    appContext,
                );
            } else {
                startProcessInstance8(
                    resObj.id,
                    {
                        subject: resObj.title,
                        action: docActions.create,
                    },
                    { process_key: process_key?.on_create },
                    appContext,
                );
            }
        }
    }

    function handleFolderUpdateActions(resObj) {
        fetchData(resObj);
    }

    // function handleAddNewDocFolderAction(actionType, resObj) {
    //     if (actionType == "COMPLETE") {
    //         parentFormModal.current.close();
    //         fetchData(resObj);
    //     }
    // }

    function handleEditFolderAction(actionType, resObj) {
        if (actionType == "COMPLETE") {
            folderFormModal.current.close();
            fetchData(resObj);
            // if (
            //     appContext?.tenantSubscription?.process_engine ===
            //     "CAMUNDA_SEVEN"
            // ) {
            //     startProcessInstance7(
            //         resObj.id,
            //         {
            //             subject: resObj.title,
            //             action: folderActions.update,
            //         },
            //         { process_key: selectedFolder?.on_update },
            // appContext
            //     );
            // } else {
            //     startProcessInstance8(
            //         resObj.id,
            //         {
            //             subject: resObj.title,
            //             action: folderActions.update,
            //         },
            //         { process_key: selectedFolder?.on_update },
            // appContext
            //     );
            // }
        }
    }

    function handleEditDocAction(actionType, resObj) {
        if (actionType == "COMPLETE") {
            documentEditModal.current.close();
            fetchData(resObj);
            if (process_engine === "CAMUNDA_SEVEN") {
                startProcessInstance7(
                    resObj.id,
                    {
                        // subject: resObj.title,
                        // action: docActions.update,
                        // doc_no: resObj.doc_no,
                        tenantId,
                        action: docActions.update,
                        username: profile?.username,
                    },
                    { process_key: selectedDoc?.on_update },
                    appContext,
                );
            } else {
                startProcessInstance8(
                    resObj.id,
                    {
                        subject: resObj.title,
                        action: docActions.update,
                    },
                    { process_key: selectedDoc?.on_update },
                    appContext,
                );
            }
        }
    }

    function fetchData(resObj) {
        if (resObj.parent_id == repository.id) {
            getDataByParentId(repository);
        } else {
            getDataByParentId(selectedParentFolder);
        }

        onUpdateAction(resObj);
    }

    function formatFormKeys(childTypes) {
        const allKeys = [];
        // let folderTypes = childTypes;
        // childTypes?.forEach(childType => {
        // const keys = parseFormKeys(childType);
        Array.isArray(childTypes) &&
            childTypes?.forEach(el => {
                // if (!el.id) return;
                const isMandatory = el?.mandatory;
                const asteric = isMandatory === "true" ? " *" : "";
                const title = el?.["title"] + asteric;
                allKeys.push({
                    id: el?.id || "",
                    label: title,
                    value: el?.["form_key"],
                    type: el?.["type"],
                    mandatory: isMandatory,
                });
                // });
                // const keys = parseFormKeys(folder);

                // const formatedFormKeys = keys.map(el => {
                //     return {
                //         id: el.form_key ? el.form_key : makeShortId(5),
                //         label: el["title"],
                //         value: el["form_key"],
                //     };
                // });
            });

        return allKeys;
    }

    function parseFormKeys(folder) {
        try {
            const parsedFormKeys = folder.folder_form_key
                ? JSON.parse(folder.folder_form_key)
                : {};
            const parsedDocKeys = folder.doc_form_key
                ? JSON.parse(folder.doc_form_key)
                : {};
            return [...parsedFormKeys, ...parsedDocKeys];
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    const handleAscSort = () => {
        const sortedFolders = sortListByFilterType(
            folderList,
            SORTING.DESC,
            "NAME",
        );
        const sortedDocuments = sortListByFilterType(
            documentList,
            SORTING.DESC,
        );

        setSortedDocumentList(sortedDocuments);
        setSortedFolderList(sortedFolders);

        setDefaultSorting(SORTING.DESC);
    };

    const handleDescSort = () => {
        const sortedFolders = sortListByFilterType(folderList, SORTING.ASC);
        const sortedDocuments = sortListByFilterType(documentList, SORTING.ASC);

        setSortedDocumentList(sortedDocuments);
        setSortedFolderList(sortedFolders);

        setDefaultSorting(SORTING.ASC);
    };

    const onDeleteConfirm = () => {
        handleDeleteSelection();
        setShowDeleteDialogue(false);
    };
    const onDeleteCancel = () => {
        setShowDeleteDialogue(false);
    };

    const requestHelper = (items, table) => {
        const requestItems = [];
        items.forEach(item => {
            if (item?.id)
                requestItems.push({
                    formId: table,
                    entity: table,
                    action: "update",
                    formData: {
                        id: item?.id,
                        status: "ARCHIVE",
                    },
                    // formData: item,
                    mode: "formData",
                    id: item?.id,
                });
        });

        return requestItems;
    };

    const getItemsByid = (ids, mapping) => {
        const items = [];
        ids.forEach(id => {
            items.push(mapping[id]);
        });
        return items;
    };

    const makeMapping = items => {
        const mapping = {};

        items.forEach(item => {
            mapping[item.id] = item;
        });

        return mapping;
    };

    const makeRequest = () => {
        const request = {
            data: [],
        };
        const allFoldersMapping = makeMapping(folderList);
        const allDocumentsMapping = makeMapping(documentList);
        const folders = getItemsByid(selectedFolders, allFoldersMapping);
        const docs = getItemsByid(selectedDocuments, allDocumentsMapping);

        const archiveFolders = requestHelper(folders, "dms_folder");
        const archiveDocs = requestHelper(docs, "dms_document");

        request.data = [...archiveFolders, ...archiveDocs];

        return request;
    };

    const handleDeleteSelection = async () => {
        const URL = API_URL + "?service.key=update.formData";
        let request = makeRequest();

        // if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.PURGE) {
        //     request.data = getDeleteSelectionPurgeRequest(
        //         selectedFolders,
        //         selectedDocuments,
        //         selectedParentFolder,
        //         repository,
        //         explorerTree,
        //         allFoldersListMap,
        //         allDocumentsListMap,
        //     );
        // }

        // if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {

        // request.data = getDeleteSelectionArchiveRequest(
        //     selectedFolders,
        //     selectedDocuments,
        //     selectedParentFolder,
        //     repository,
        //     explorerTree,
        //     allFoldersListMap,
        //     allDocumentsListMap,
        // );
        // }

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                } else {
                    resObj.parent_id = selectedParentFolder.id;
                }

                toastEmitter(`Deleted selected items.`);
                handleFolderUpdateActions(resObj);

                // if (
                //     appContext?.tenantSubscription?.process_engine ===
                //     "CAMUNDA_SEVEN"
                // ) {
                //     startProcessInstance7(
                //         resObj.id,
                //         {
                //             subject: resObj.label,
                //             action: folderActions.delete,
                //         },
                //         { process_key: selectedFolder?.on_delete },
                // appContext
                //     );
                // } else {
                //     startProcessInstance8(
                //         resObj.id,
                //         {
                //             subject: resObj.label,
                //             action: folderActions.delete,
                //         },
                //         { process_key: selectedFolder?.on_delete },
                // appContext
                //     );
                // }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getDataByParentId = async parent => {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: parent?.id,
                    dataKey: "documents",
                    serviceKey: "dms.get.docs",
                    mode: "formData",
                },
                {
                    serviceParams: parent?.id,
                    dataKey: "folders",
                    serviceKey: "dms.get.folders",
                    mode: "formData",
                },
            ],
        };
        if (parent?.folder_type === "repository") {
            dataRequest.dataKeys.push({
                serviceParams: parent?.id,
                dataKey: "FolderChildTypes",
                serviceKey: "dms.repo.child.folder.type",
                mode: "formData",
            });
            dataRequest.dataKeys.push({
                serviceParams: parent?.id,
                dataKey: "DocChildTypes",
                serviceKey: "dms.repo.child.doc.type",
                mode: "formData",
            });
            // dataRequest.dataKeys.push({
            //     serviceParams: parent?.id,
            //     dataKey: "childTypes",
            //     serviceKey: "dms.repo.child.type",
            //     mode: "formData",
            // });
        } else {
            dataRequest.dataKeys.push({
                serviceParams: parent?.folder_type,
                dataKey: "FolderChildTypes",
                serviceKey: "dms.folder.child.folder.type",
                mode: "formData",
            });
            dataRequest.dataKeys.push({
                serviceParams: parent?.folder_type,
                dataKey: "DocChildTypes",
                serviceKey: "dms.folder.child.doc.type",
                mode: "formData",
            });
            // dataRequest.dataKeys.push({
            //     serviceParams: parent?.folder_type,
            //     dataKey: "childTypes",
            //     serviceKey: "dms.folder.child.type",
            //     mode: "formData",
            // });
        }

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const documents = response.data.C_DATA.documents;
                const folders = response.data.C_DATA.folders;
                const FolderChildTypes = response.data.C_DATA.FolderChildTypes;
                const DocChildTypes = response.data.C_DATA.DocChildTypes;

                // const childTypes = response.data.C_DATA.childTypes;
                const formattedDocumentDataMap = formatDataToMap(documents);

                const sortedFolders = sortListByFilterType(
                    folders,
                    defaultSorting,
                );
                const sortedDocuments = sortListByFilterType(
                    documents,
                    defaultSorting,
                );
                // const types = structuredClone(childTypes);
                const allKeys = [];
                if (FolderChildTypes?.length > 0) {
                    FolderChildTypes[0].folder_form_key = tryToParse(
                        FolderChildTypes[0].folder_form_key,
                    );
                    for (let key of FolderChildTypes[0].folder_form_key) {
                        allKeys.push(key);
                    }
                }
                if (DocChildTypes?.length > 0) {
                    DocChildTypes[0].doc_form_key = tryToParse(
                        DocChildTypes[0].doc_form_key,
                    );
                    for (let key of DocChildTypes[0].doc_form_key) {
                        allKeys.push(key);
                    }
                }
                setFormKeys(formatFormKeys(allKeys));

                setDocumentListMap(formattedDocumentDataMap);
                setSortedDocumentList(sortedDocuments);
                setSortedFolderList(sortedFolders);
                setDocumentList(documents);
                setChildTypes(allKeys);
                setFolderList(folders);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="">
            <ErrorBoundary>
                <code>
                    {/* <pre>{JSON.stringify(explorerTreeState, null, 2)}</pre> */}
                </code>
                <code>
                    {/* <pre>{JSON.stringify(explorerTree, null, 2)}</pre> */}
                </code>
                <code>
                    {/* <pre>{JSON.stringify(repository, null, 2)}</pre> */}
                </code>
                <RepositoryContext.Provider
                    value={{
                        repository,
                        datalistIds,
                        allFoldersListMap,
                        allDocumentsListMap,
                        explorerTree,
                        dmsConfig,
                        process_engine,
                        startProcessInstance7,
                        startProcessInstance8,
                        navigationStack,
                        setSelectedFolders,
                        setSelectedDocuments,
                        actions,
                    }}>
                    <div className="d-flex align-items-center justify-content-between p-2 action-header s2a-border mb-2">
                        <div className="d-flex align-items-center  gap-3">
                            <ReactSelect
                                options={formKeys}
                                selectedOption={INITIAL_CREATE_STATE}
                                handleChange={handleParentFormSelection}
                                isSearchable={false}
                                width={150}
                                disabled={permissionActions === "READ"}
                            />
                            <ReactSelect
                                options={SELECT_OPTIONS}
                                selectedOption={INITIAL_SELECT_STATE}
                                handleChange={handleSelectActionChange}
                                withIcons={true}
                                width={150}
                                isSearchable={false}
                                disabled={permissionActions === "READ"}
                            />

                            <ReactSelect
                                options={SELECTED_ACTIONS}
                                selectedOption={INITIAL_SELECTED_ACTIONS_STATE}
                                handleChange={handleSelectedActionChange}
                                withIcons={true}
                                width={150}
                                isSearchable={false}
                                disabled={
                                    (selectedFolders.length == 0 &&
                                        selectedDocuments.length == 0) ||
                                    permissionActions === "READ"
                                }
                            />
                            <div className="position-relative">
                                <i
                                    className="fa-solid fa-magnifying-glass position-absolute"
                                    style={{ left: "8px", top: "10px" }}
                                />
                                <input
                                    className="form-control"
                                    placeholder="Search..."
                                    onChange={handleSearch}
                                    value={search}
                                    style={{ paddingLeft: "28px" }}
                                />
                            </div>
                            <div className="search-count">
                                <span
                                    className="count pe-2"
                                    title="Folders">
                                    <i className="fas fa-folder"></i>{" "}
                                    {filteredFolders.length} :{" "}
                                    {folderList.length}
                                </span>
                                <span
                                    className="count pe-2"
                                    title="Documents">
                                    <i className="fas fa-file"></i>{" "}
                                    {filteredDocuments.length} :{" "}
                                    {documentList.length}
                                </span>
                            </div>
                            {/* <Upload /> */}
                        </div>
                        <div className="d-flex align-items-center  gap-3">
                            <ToggleSort
                                sorting={defaultSorting}
                                handleAscSort={handleAscSort}
                                handleDescSort={handleDescSort}
                            />
                            {/* <ReactSelect
                                options={SORTBY_OPTIONS}
                                selectedOption={INITIAL_SORTBY_STATE}
                                handleChange={() => {}}
                                isSearchable={false}
                            /> */}
                            {/* <ReactSelect
                                options={OPTIONS}
                                selectedOption={INITIAL_OPTION_STATE}
                                handleChange={() => {}}
                                withIcons={true}
                                isSearchable={false}
                            /> */}
                        </div>
                    </div>
                    <Navigation
                        navigation={navigationStack}
                        permissionActions={permissionActions}
                        repository={repository}
                        selectedFolder={selectedParentFolder}
                        handleFolderMove={handleFolderMove}
                        handleFolderEdit={handleFolderEdit}
                        handleDeleteFolder={handleFolderDelete}
                        backNavigationAction={backNavigationAction}
                        handleNavigationAction={handleNavigationAction}
                    />
                    <div>
                        <ol className="list-group ">
                            <FolderListView
                                search={search}
                                folderList={filteredFolders}
                                selectedFolders={selectedFolders}
                                handleFolderSelection={handleFolderSelection}
                                handleFolderEdit={handleFolderEdit}
                                handleNavigationAction={handleNavigationAction}
                                handleFolderDelete={handleFolderDelete}
                                handleFolderMove={handleFolderMove}
                                handleFolderUpdateActions={
                                    handleFolderUpdateActions
                                }
                                selectedParentFolder={selectedParentFolder}
                            />
                            <DocumentListView
                                search={search}
                                selectedDocuments={selectedDocuments}
                                handleDocumentSelection={
                                    handleDocumentSelection
                                }
                                documentList={filteredDocuments}
                                handleDocEdit={handleDocEdit}
                                handleDocCheckin={handleDocCheckin}
                                handleDocMove={handleDocMove}
                                selectedParentFolder={selectedParentFolder}
                                handleDocUpdateActions={handleDocUpdateActions}
                            />
                        </ol>
                    </div>
                    <ChildrenModal
                        ref={parentFormModal}
                        centered={true}
                        header={selectedFormKey?.label}>
                        {selectedFormKey.type === "folder" ? (
                            <DataListFormViewer
                                formKey={selectedFormKey.value}
                                businessKey="new"
                                handleActions={handleAddNewDocFolderAction}
                                handleClose={() => {
                                    parentFormModal.current.close();
                                }}
                                formVars={{
                                    repository_id: repository.id,
                                    parent_id: selectedParentFolder.id
                                        ? selectedParentFolder.id
                                        : repository.id,
                                    folder_type: selectedFormKey.id,
                                }}
                            />
                        ) : (
                            <DataListFormViewer
                                formKey={selectedFormKey.value}
                                businessKey="new"
                                handleActions={handleAddNewDocFolderAction}
                                handleClose={() => {
                                    parentFormModal.current.close();
                                }}
                                formVars={{
                                    repository_id: repository.id,
                                    parent_id: selectedParentFolder.id
                                        ? selectedParentFolder.id
                                        : repository.id,
                                    doc_type: selectedFormKey.id,
                                }}
                            />
                        )}
                    </ChildrenModal>
                    <ChildrenModal
                        ref={folderFormModal}
                        centered={true}
                        header={"Edit Folder"}>
                        <DataListFormViewer
                            formKey={selectedFolder.form_key}
                            businessKey={selectedFolder.id}
                            handleActions={handleEditFolderAction}
                            handleClose={() => {
                                folderFormModal.current.close();
                            }}
                            // formVars={{
                            //     repository_id: repository.id,
                            //     parent_id: selectedParentFolder.id
                            //         ? selectedParentFolder.id
                            //         : repository.id,
                            //     folder_type: selectedFolder.id,
                            // }}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={documentEditModal}
                        centered={true}
                        header={"Edit Document"}>
                        <DataListFormViewer
                            formKey={selectedDoc.form_key}
                            businessKey={selectedDoc.id}
                            handleActions={handleEditDocAction}
                            handleClose={() => {
                                documentEditModal.current.close();
                            }}
                            // formVars={{
                            //     repository_id: repository.id,
                            //     parent_id: selectedParentFolder.id
                            //         ? selectedParentFolder.id
                            //         : repository.id,
                            //     doc_type: selectedDoc.id,
                            // }}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={documentCheckinModal}
                        centered={true}
                        header={`Checkin - ${selectedDoc.name}`}>
                        <DataListFormViewer
                            formKey={"dms_doc_revision"}
                            businessKey={"new"}
                            handleActions={(actionType, resObj) =>
                                handleCheckinDocAction({
                                    actionType,
                                    resObj,
                                    selectedDoc,
                                    documentCheckinModal,
                                    documentListMap,
                                    selectedFormKey,
                                    fetchData,
                                    selectedParentFolder,
                                    repository,
                                    appContext,
                                })
                            }
                            handleClose={() => {
                                documentCheckinModal.current.close();
                            }}
                            formVars={{
                                doc_id: selectedDoc.id,
                                type: selectedDoc.type,
                                status: selectedDoc.status,
                                content:
                                    selectedDoc.type === "HTML"
                                        ? selectedDoc.content
                                        : "",
                                revision:
                                    parseInt(selectedDoc.current_revision) + 1,
                            }}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={singleFolderDeleteModal}
                        centered={true}
                        hideMaximizeButton={true}
                        hideCloseButton={true}
                        header={"Delete Folder"}>
                        <DeleteFolder
                            singleFolderDeleteModal={singleFolderDeleteModal}
                            selectedFolder={selectedFolder}
                            handleSingleFolderDelete={handleSingleFolderDelete}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={singleFolderMoveModal}
                        centered={true}
                        hideMaximizeButton={true}
                        header={`Move Folder: ${repository.name} > ${selectedFolder.name}`}>
                        <MoveFolder
                            singleFolderMoveModal={singleFolderMoveModal}
                            selectedParentFolder={selectedFolder}
                            handleSingleFolderMove={handleSingleFolderMove}
                            parentRepository={repository}
                            allFoldersListMap={allFoldersListMap}
                            parentTree={explorerTree}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={singleDocumentMoveModal}
                        centered={true}
                        hideMaximizeButton={true}
                        header={`Move Document: ${repository.name} > ${selectedDoc.name}`}>
                        <MoveDocument
                            singleDocumentMoveModal={singleDocumentMoveModal}
                            selectedParentFolder={selectedFolder}
                            selectedGrandParentFolder={selectedParentFolder}
                            selectedParentDoc={selectedDoc}
                            handleSingleDocMove={handleSingleDocMove}
                            parentRepository={repository}
                            allFoldersListMap={allFoldersListMap}
                            documentListMap={documentListMap}
                            parentTree={explorerTree}
                        />
                    </ChildrenModal>
                    <ChildrenModal
                        ref={multiMoveModal}
                        centered={true}
                        hideMaximizeButton={true}
                        header={`Multi Move: ${repository.name}`}>
                        <MoveMultiFolder
                            multiMoveModal={multiMoveModal}
                            selectedParentFolder={selectedFolder}
                            selectedGrandParentFolder={selectedParentFolder}
                            selectedParentDoc={selectedDoc}
                            handleMultipleMoveAction={handleMultipleMoveAction}
                            parentRepository={repository}
                            allFoldersListMap={allFoldersListMap}
                            documentListMap={documentListMap}
                            parentTree={explorerTree}
                            selectedParentDocuments={selectedDocuments}
                            selectedParentFolders={selectedFolders}
                        />
                    </ChildrenModal>
                    <Modal
                        show={showDeleteDialogue}
                        onHide={() => setShowDeleteDialogue(false)}
                        keyboard={true}>
                        <Modal.Header>
                            <Modal.Title>Confirm </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="d-flex justify-content-between">
                                <div>
                                    Are you sure you want to delete selected
                                    items?
                                </div>
                                <div className="d-flex flex-row">
                                    <button
                                        ref={ref => ref && ref.focus()}
                                        className="btn btn-sm btn-danger mx-1"
                                        onClick={onDeleteConfirm}>
                                        Yes
                                    </button>
                                    <button
                                        className="btn btn-sm btn-light mx-1"
                                        onClick={onDeleteCancel}>
                                        No
                                    </button>
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal>
                </RepositoryContext.Provider>
            </ErrorBoundary>
        </div>
    );
};

const DeleteFolder = props => {
    const {
        selectedFolder,
        singleFolderDeleteModal,
        handleSingleFolderDelete,
    } = props;

    return (
        <div className="d-flex justify-content-between">
            <div>
                <div>
                    Are you sure you want to delete{" "}
                    <b>{`${selectedFolder.name}`}</b> ?
                </div>
            </div>
            <div className="d-flex flex-row">
                <button
                    className="btn btn-sm btn-danger mx-1"
                    onClick={handleSingleFolderDelete}>
                    Yes
                </button>
                <button
                    className="btn btn-sm btn-light mx-1"
                    onClick={() => {
                        singleFolderDeleteModal.current.close();
                    }}>
                    No
                </button>
            </div>
        </div>
    );
};

const ToggleSort = ({ sorting, handleAscSort, handleDescSort }) => {
    return (
        <>
            {sorting == SORTING.ASC ? (
                <i
                    title="Sort by name"
                    className="fa-solid fa-arrow-down-wide-short pointer"
                    onClick={handleAscSort}></i>
            ) : (
                <i
                    title="Sort by name"
                    className="fa-solid fa-arrow-up-wide-short pointer"
                    onClick={handleDescSort}></i>
            )}
        </>
    );
};

const Upload = () => {
    return (
        <div
            className=" p-1 pointer"
            style={{
                minWidth: "100px",
            }}>
            <i className="fa-solid fa-upload"></i>
            Upload
        </div>
    );
};

export default Detailspanel;

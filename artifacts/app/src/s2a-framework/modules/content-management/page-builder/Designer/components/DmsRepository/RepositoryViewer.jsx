import { useContext, useEffect, useState } from "react";
import axios from "axios";

import { read, write } from "../../../../../../utils/localStorage";
import { API_URL, BPM_API_URL } from "../../../../../../Config";

import Detailspanel from "./DetailsPanel";
import { DMC_CONFIG } from "./dmsConfig";
import { SplitView } from "./components/SplitView";
import Explorer from "./components/Explorer";
import {
    formatDataToMap,
    formatDataToTree,
    getPathToNode,
    setAllSelectedFalse,
    setSelectedFalseExcept,
    sortListByFilterType,
    startProcessInstance7,
    startProcessInstance8,
    updateTreeNode,
} from "./utils/helper";

import "./styles.css";
import { TREE_STATE_KEY } from "./dmsConfig";
import EditingDocument from "./EditingDocuments";
import RecycleBin from "./RecycleBin";
import Favourites from "./Favourits";
import { AppContext } from "../../../../../../../AppContext";
import { FavoriteContext } from "./context/FavoriteContext";

// const keysByType = {
//     editing: {
//         serviceParams: "",
//         dataKey: "documents",
//         serviceKey: "dms.get.current.user.checkout.doc",
//         mode: "formData",
//     },
//     favorites: {
//         serviceParams: "",
//         dataKey: "favorites",
//         serviceKey: "dms.get.current.user.favorites",
//         mode: "formData",
//     },
//     recyclebin: [
//         {
//             serviceParams: "",
//             dataKey: "folders",
//             serviceKey: "dms.get.archived.folder",
//             mode: "formData",
//         },
//         {
//             serviceParams: "",
//             dataKey: "documents",
//             serviceKey: "dms.get.archived.doc",
//             mode: "formData",
//         },
//     ],
// };

export const folderActions = {
    create: "CREATED",
    update: "UPDATED",
    delete: "DELETED",
    archive: "ARCHIVED",
    view: "VIEWED",
};
export const docActions = {
    create: "CREATED",
    update: "UPDATED",
    delete: "DELETED",
    archive: "ARCHIVED",
    checkin: "CHECKED-IN",
    view: "VIEWED",
};

const RepositoryViewer = ({ componentData }) => {
    const actions = componentData?.actions;
    const appContext = useContext(AppContext);
    const { tenant_id: tenantId, process_engine } =
        appContext.tenantSubscription;

    const [explorerTree, setExplorerTree] = useState([]);
    const [repository, setRepository] = useState({});

    // stores all folders and documents for nested delete operation
    const [allFoldersListMap, setAllFoldersListMap] = useState({});
    const [allDocumentsListMap, setAllDocumentsListMap] = useState({});

    const [navigationStack, setNavigationStack] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState({});

    const [datalistIds, setdDatalistIds] = useState({});

    const [explorerTreeState, setExplorerTreeState] =
        useState(initializeTreeState);

    const [dmsConfig, setDmsConfig] = useState(DMC_CONFIG);

    const [documentIsOpen, setDocumentIsOpen] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState("");
    const [search, setSearch] = useState("");
    const [esSearch, setEsSearch] = useState("");

    useEffect(() => {
        if (componentData.repositoryId) {
            getData(componentData.repositoryId);
        }
    }, [componentData]);

    useEffect(() => {
        const type = localStorage.getItem("selectedDocumentType");
        if (type) {
            setSelectedDocumentType(type);
            setDocumentIsOpen(true);
        }
    }, []);

    function initializeTreeState() {
        return read(TREE_STATE_KEY, {
            isSelected: "",
            isOpen: [],
        });
    }

    const clearDocumentType = () => {
        setSelectedDocumentType("");
        localStorage.removeItem("selectedDocumentType");
    };

    const handleRepositoryExpansion = node => {
        const id = node.id;
        setRepository(prev => ({ ...prev, isOpen: !prev.isOpen }));

        const lastState = { ...explorerTreeState };

        if (!node.isOpen) {
            lastState.isOpen.push(id);
        } else {
            lastState.isOpen = lastState.isOpen.filter(_id => _id != id);
        }

        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
        clearDocumentType();
    };

    const handleRepositorySelection = node => {
        const id = node.id;
        setSelectedFolder(node);
        setRepository(prev => ({ ...prev, isOpen: true, isSelected: true }));

        const updatedTree = setAllSelectedFalse(explorerTree);
        setExplorerTree(updatedTree);
        setNavigationPath(node.id);

        const lastState = { ...explorerTreeState };

        lastState.isSelected = id;
        if (!lastState.isOpen.includes(id)) {
            lastState.isOpen.push(id);
        }
        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
        clearDocumentType();
    };

    const handleFolderExpansion = node => {
        const id = node.id;
        // update current tree state (local)
        const currentNode = { ...node, isOpen: !node.isOpen };
        const updatedTree = updateTreeNode(id, explorerTree, currentNode);
        setExplorerTree(updatedTree);
        const lastState = { ...explorerTreeState };

        if (!node.isOpen) {
            lastState.isOpen.push(id);
        } else {
            lastState.isOpen = lastState.isOpen.filter(_id => _id != id);
        }

        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
        clearDocumentType();
    };

    const handleFolderSelection = node => {
        const id = node.id;
        const updatedTree = setSelectedFalseExcept(id, explorerTree);
        setExplorerTree(updatedTree);

        const selection = allFoldersListMap[id];

        setSelectedFolder(selection);
        setRepository(prev => ({ ...prev, isSelected: false }));

        setNavigationPath(node.id);

        const lastState = { ...explorerTreeState };

        lastState.isSelected = id;
        if (!lastState.isOpen.includes(id)) {
            lastState.isOpen.push(id);
        }
        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
        clearDocumentType();
    };

    const onUpdateAction = newFolder => {
        getData(componentData.repositoryId);
    };

    const backNavigationAction = () => {
        const secondLastElement = navigationStack.slice(-2, -1)[0];
        const id = secondLastElement.id;

        if (navigationStack.length == 2) {
            setSelectedFolder({});
            setRepository(prev => ({
                ...prev,
                isOpen: true,
                isSelected: true,
            }));

            const updatedTree = setAllSelectedFalse(explorerTree);
            setExplorerTree(updatedTree);
        } else {
            const updatedTree = setSelectedFalseExcept(id, explorerTree);
            setExplorerTree(updatedTree);

            const selection = allFoldersListMap[id];

            setSelectedFolder(selection);
        }

        setNavigationPath(id);
        lastState.isSelected = id;
        if (!lastState.isOpen.includes(id)) {
            lastState.isOpen.push(id);
        }
        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
    };

    const handleNavigationAction = id => {
        if (id == repository.id) {
            setSelectedFolder({});
            setRepository(prev => ({
                ...prev,
                isOpen: true,
                isSelected: true,
            }));

            const updatedTree = setAllSelectedFalse(explorerTree);
            setExplorerTree(updatedTree);
        } else {
            const updatedTree = setSelectedFalseExcept(id, explorerTree);
            setExplorerTree(updatedTree);

            const selection = allFoldersListMap[id];

            setSelectedFolder(selection);
            setRepository(prev => ({
                ...prev,
                isOpen: true,
                isSelected: false,
            }));
        }
        const lastState = { ...explorerTreeState };
        setNavigationPath(id);
        lastState.isSelected = id;
        if (!lastState.isOpen.includes(id)) {
            lastState.isOpen.push(id);
        }
        write(TREE_STATE_KEY, lastState);
        setExplorerTreeState(lastState);
    };

    function setNavigationPath(id) {
        const path = getPathToNode(id, explorerTree);
        path.unshift({
            id: repository.id,
            name: repository.name,
        });
        setNavigationStack(path);
    }

    const getData = async repositoryId => {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: repositoryId,
                    dataKey: "repository",
                    serviceKey: "dms.get.repository",
                    mode: "formData",
                },
                {
                    serviceParams: repositoryId,
                    dataKey: "folders",
                    serviceKey: "dms.repo.folders",
                    mode: "formData",
                },
                {
                    serviceParams: repositoryId,
                    dataKey: "documents",
                    serviceKey: "dms.repo.documents",
                    mode: "formData",
                },
                {
                    serviceParams: dmsConfig.COMMENT_DL_KEY,
                    dataKey: "commentsDl",
                    serviceKey: "dms.get.datalist",
                    mode: "formData",
                },
                {
                    serviceParams: dmsConfig.PERMISSONS_DL_KEY,
                    dataKey: "permissonsDl",
                    serviceKey: "dms.get.datalist",
                    mode: "formData",
                },
            ],
        };

        // if (selectedDocumentType === "editing") {
        //     const keys = keysByType[selectedDocumentType];
        //     dataRequest.dataKeys.splice(2, 1, keys);
        // } else if (selectedDocumentType === "recyclebin") {
        //     const keys = keysByType[selectedDocumentType];
        //     dataRequest.dataKeys.splice(1, 2, ...keys);
        // }

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const repository = response.data.C_DATA.repository[0];
                const folderList = response.data.C_DATA.folders;
                const documentsList = response.data.C_DATA.documents;
                const commentsDl = response.data.C_DATA.commentsDl[0];
                const permissonsDl = response.data.C_DATA.permissonsDl[0];
                const initialState = initializeTreeState(); // from LocalStorage

                const sortedFolders = sortListByFilterType(folderList);

                const _explorerTree = formatDataToTree(
                    sortedFolders,
                    initialState,
                    repository.id,
                );

                const formattedFolderDataMap = formatDataToMap(folderList);
                const formattedDocumentsDataMap =
                    formatDataToMap(documentsList);

                if (initialState.isSelected == "") {
                    initialState.isOpen.push(repository.id);
                    initialState.isSelected = repository.id;
                    setExplorerTreeState(initialState);
                    setRepository({
                        ...repository,
                        isOpen: true,
                        isSelected: true,
                    });
                    const path = [];
                    path.unshift({
                        id: repository.id,
                        name: repository.name,
                    });
                    setNavigationStack(path);

                    write(TREE_STATE_KEY, initialState);
                } else {
                    let currentSelectedId = initialState.isSelected;

                    const folder = formattedFolderDataMap[currentSelectedId]
                        ? formattedFolderDataMap[currentSelectedId]
                        : null;

                    if (folder) {
                        setSelectedFolder(folder);
                    } else {
                        if (currentSelectedId == repository.id) {
                            setSelectedFolder({});
                        }

                        if (!initialState.isOpen.includes(repository.id)) {
                            initialState.isOpen.push(repository.id);
                        }
                        initialState.isSelected = repository.id;
                        setExplorerTreeState(initialState);
                        write(TREE_STATE_KEY, initialState);
                    }

                    setRepository({
                        ...repository,
                        isOpen: true,
                        isSelected:
                            currentSelectedId == repository.id ? true : false,
                    });

                    const path = getPathToNode(
                        currentSelectedId,
                        _explorerTree,
                    );
                    path.unshift({
                        id: repository.id,
                        name: repository.name,
                    });
                    setNavigationStack(path);
                }

                const lastState = { ...datalistIds };
                lastState[dmsConfig.COMMENT_DL_KEY] = commentsDl;
                lastState[dmsConfig.PERMISSONS_DL_KEY] = permissonsDl;

                setdDatalistIds(lastState);

                setAllDocumentsListMap(formattedDocumentsDataMap);
                setAllFoldersListMap(formattedFolderDataMap);
                setExplorerTree(_explorerTree);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const rightPanel = () => {
        let right = null;
        if (selectedDocumentType === "editing") {
            right = (
                <EditingDocument
                    explorerTreeState={explorerTreeState}
                    explorerTree={explorerTree}
                    datalistIds={datalistIds}
                    repository={repository}
                    selectedFolder={selectedFolder}
                    selectedDocumentType={selectedDocumentType}
                    allFoldersListMap={allFoldersListMap}
                    allDocumentsListMap={allDocumentsListMap}
                    navigationStack={navigationStack}
                    dmsConfig={dmsConfig}
                    onUpdateAction={onUpdateAction}
                    backNavigationAction={backNavigationAction}
                    handleNavigationAction={handleNavigationAction}
                    search={search}
                    setSearch={setSearch}
                    startProcessInstance8={startProcessInstance8}
                    startProcessInstance7={startProcessInstance7}
                    actions={actions}
                />
            );
        } else if (selectedDocumentType === "recyclebin") {
            right = (
                <RecycleBin
                    explorerTreeState={explorerTreeState}
                    explorerTree={explorerTree}
                    datalistIds={datalistIds}
                    repository={repository}
                    selectedFolder={selectedFolder}
                    allFoldersListMap={allFoldersListMap}
                    allDocumentsListMap={allDocumentsListMap}
                    navigationStack={navigationStack}
                    dmsConfig={dmsConfig}
                    onUpdateAction={onUpdateAction}
                    backNavigationAction={backNavigationAction}
                    selectedDocumentType={selectedDocumentType}
                    handleNavigationAction={handleNavigationAction}
                    search={search}
                    setSearch={setSearch}
                    startProcessInstance8={startProcessInstance8}
                    startProcessInstance7={startProcessInstance7}
                    actions={actions}
                />
            );
        } else if (selectedDocumentType === "favorites") {
            right = (
                <Favourites
                    explorerTreeState={explorerTreeState}
                    explorerTree={explorerTree}
                    datalistIds={datalistIds}
                    repository={repository}
                    selectedFolder={selectedFolder}
                    allFoldersListMap={allFoldersListMap}
                    allDocumentsListMap={allDocumentsListMap}
                    navigationStack={navigationStack}
                    dmsConfig={dmsConfig}
                    onUpdateAction={onUpdateAction}
                    backNavigationAction={backNavigationAction}
                    selectedDocumentType={selectedDocumentType}
                    handleNavigationAction={handleNavigationAction}
                    search={search}
                    setSearch={setSearch}
                    startProcessInstance8={startProcessInstance8}
                    startProcessInstance7={startProcessInstance7}
                    actions={actions}
                />
            );
        } else {
            right = (
                <Detailspanel
                    explorerTreeState={explorerTreeState}
                    explorerTree={explorerTree}
                    datalistIds={datalistIds}
                    repository={repository}
                    selectedFolder={selectedFolder}
                    allFoldersListMap={allFoldersListMap}
                    allDocumentsListMap={allDocumentsListMap}
                    navigationStack={navigationStack}
                    dmsConfig={dmsConfig}
                    onUpdateAction={onUpdateAction}
                    backNavigationAction={backNavigationAction}
                    handleNavigationAction={handleNavigationAction}
                    search={search}
                    setSearch={setSearch}
                    startProcessInstance8={startProcessInstance8}
                    startProcessInstance7={startProcessInstance7}
                    selectedDocumentType={selectedDocumentType}
                    actions={actions}
                />
            );
        }

        return right;
    };

    return (
        <FavoriteContext.Provider
            value={{
                explorerTreeState,
                explorerTree,
                datalistIds,
                repository,
                selectedFolder,
                allFoldersListMap,
                allDocumentsListMap,
                navigationStack,
                dmsConfig,
                onUpdateAction,
                backNavigationAction,
                selectedDocumentType,
                handleNavigationAction,
                search,
                setSearch,
                startProcessInstance8,
                startProcessInstance7,
                actions,
                esSearch,
                setEsSearch,
            }}>
            <div className="p-2">
                <SplitView
                    left={
                        <Explorer
                            repository={repository}
                            explorerTree={explorerTree}
                            handleFolderSelection={handleFolderSelection}
                            handleFolderExpansion={handleFolderExpansion}
                            handleRepositoryExpansion={
                                handleRepositoryExpansion
                            }
                            handleRepositorySelection={
                                handleRepositorySelection
                            }
                            isOpen={documentIsOpen}
                            setIsOpen={setDocumentIsOpen}
                            setSelectedDocumentType={setSelectedDocumentType}
                            selectedDocumentType={selectedDocumentType}
                            actions={actions}
                        />
                    }
                    right={rightPanel()}
                />
            </div>
        </FavoriteContext.Provider>
    );
};

// Detailspanel

export default RepositoryViewer;

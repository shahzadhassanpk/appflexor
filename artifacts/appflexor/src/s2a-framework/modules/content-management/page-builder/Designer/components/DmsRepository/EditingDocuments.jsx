import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { API_URL } from "../../../../../../Config";
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
    INITIAL_OPTION_STATE,
    INITIAL_SELECT_STATE,
    INITIAL_SELECTED_ACTIONS_STATE,
    INITIAL_SORTBY_STATE,
    SELECT_OPTIONS,
    SELECTED_ACTIONS,
    SORTBY_OPTIONS,
    OPTIONS,
    SORTING,
} from "./utils/constants";
import {
    copyAddNewDocFolder,
    copyAddNewDocRevision,
    formatDataToMap,
    getDeleteSelectionArchiveRequest,
    getDeleteSelectionPurgeRequest,
    getSelectedActionState,
    handleCheckinDocAction,
    saveDocCheckoutStatus,
    sortListByFilterType,
} from "./utils/helper";

import { RepositoryContext } from "./context/RespositoryContext";
import { Modal } from "react-bootstrap";
import { DELETE_ACTION_TYPES } from "./dmsConfig";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { AppContext } from "../../../../../../../AppContext";

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
    selectedDocumentType,
    search,
    setSearch,
    startProcessInstance8,
    startProcessInstance7,
    actions,
}) => {
    const appContext = useContext(AppContext);
    const {
        profile,
        tenantSubscription: { tenantId },
    } = appContext;

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

    useEffect(() => {
        if (selectedDocumentType && repository?.id) {
            getDataByParentId(repository);
        }
    }, [selectedDocumentType, repository?.id]);

    // useEffect(() => {
    //     if (selectedParentFolder.id) {
    //         if (!lastSubFoldersId.current) {
    //             getData();
    //         } else if (lastSubFoldersId.current != selectedParentFolder.id) {
    //             getData();
    //         }
    //     }
    // }, [selectedParentFolder]);

    function getData() {
        // setFormKeys(formatFormKeys(selectedParentFolder));
        getDataByParentId(selectedParentFolder);
        lastSubFoldersId.current = selectedParentFolder.id;
        lastRootFoldersId.current = null;
    }

    function handleFolderSelection(id) {
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
        try {
            const action = selectedItem?.value;
            switch (action) {
                case "DOCUMENTS": {
                    const checkedOutItems = documentList.filter(
                        item => item.status === "CHECKED_OUT",
                    );

                    const ids = checkedOutItems.map(item => item.id);

                    setSelectedDocuments(ids);

                    sessionStorage.setItem("previous-selection-doc", ids);
                    break;
                }
                case "NONE": {
                    setSelectedDocuments([]);
                    break;
                }
                // case "INVERT": {
                //     const ids = sessionStorage.getItem(
                //         "previous-selection-doc",
                //     );
                //     const arrOfIds = ids?.split(",");
                //     setSelectedDocuments(arrOfIds);
                //     break;
                // }
            }
            // setSelectedAction(selectedItem);
        } catch (error) {
            console.log(error);
            setSelectedDocuments([]);
        }
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
        setSelectedFormKey(obj);
        parentFormModal.current.show();
    }

    function handleFolderEdit(node) {
        const nodeId = node.id;
        const selectedSubFolder = allFoldersListMap[nodeId];
        setSelectedFolder(selectedSubFolder);
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
        if (actionType == "COMPLETE") {
            parentFormModal.current.close();
            fetchData(resObj);
            copyAddNewDocFolder(resObj);
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
        }
    }

    function handleEditDocAction(actionType, resObj) {
        if (actionType == "COMPLETE") {
            documentEditModal.current.close();
            fetchData(resObj);
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
        let folderTypes = childTypes;
        childTypes?.forEach(childType => {
            const keys = parseFormKeys(childType);
            keys.forEach(el => {
                if (!el.id) return;
                allKeys.push({
                    id: el.id,
                    label: el["title"],
                    value: el["form_key"],
                    type: el["type"],
                });
            });
            // const keys = parseFormKeys(folder);

            // const formatedFormKeys = keys.map(el => {
            //     return {
            //         id: el.form_key ? el.form_key : makeShortId(5),
            //         label: el["title"],
            //         value: el["form_key"],
            //     };
            // });
        });
        console.log(childTypes);
        console.log(allKeys);

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

    const handleDeleteSelection = async () => {
        const URL = API_URL + "?service.key=update.formData";
        let request = {};

        if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.PURGE) {
            request.data = getDeleteSelectionPurgeRequest(
                selectedFolders,
                selectedDocuments,
                selectedParentFolder,
                repository,
                explorerTree,
                allFoldersListMap,
                allDocumentsListMap,
            );
        }

        if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {
            request.data = getDeleteSelectionArchiveRequest(
                selectedFolders,
                selectedDocuments,
                selectedParentFolder,
                repository,
                explorerTree,
                allFoldersListMap,
                allDocumentsListMap,
            );
        }

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
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getDataByParentId = async parent => {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: repository.id,
                    dataKey: "documents",
                    serviceKey: "dms.get.current.user.checkout.doc",
                    mode: "formData",
                },
                // {
                //     serviceParams: parent?.id,
                //     dataKey: "folders",
                //     serviceKey: "dms.get.folders",
                //     mode: "formData",
                // },
            ],
        };
        // if (parent?.folder_type === "repository") {
        //     dataRequest.dataKeys.push({
        //         serviceParams: parent?.id,
        //         dataKey: "childTypes",
        //         serviceKey: "dms.repo.child.type",
        //         mode: "formData",
        //     });
        // } else {
        //     dataRequest.dataKeys.push({
        //         serviceParams: parent?.folder_type,
        //         dataKey: "childTypes",
        //         serviceKey: "dms.folder.child.type",
        //         mode: "formData",
        //     });
        // }

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const documents = response.data.C_DATA.documents;
                const folders = response.data.C_DATA.folders;
                const childTypes = response.data.C_DATA.childTypes;
                const formattedDocumentDataMap = formatDataToMap(documents);

                const sortedFolders = sortListByFilterType(
                    folders,
                    defaultSorting,
                );
                const sortedDocuments = sortListByFilterType(
                    documents,
                    defaultSorting,
                );
                setFormKeys(formatFormKeys(childTypes));

                setDocumentListMap(formattedDocumentDataMap);
                setSortedDocumentList(sortedDocuments);
                setSortedFolderList(sortedFolders);
                setDocumentList(documents);
                setChildTypes(childTypes);
                setFolderList(folders);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="">
            <ErrorBoundary>
                {/* <code>
                    <pre>{JSON.stringify(selectedDocumentType, null, 2)}</pre>
                </code>
                <code>
                    <pre>{JSON.stringify(documentList, null, 2)}</pre>
                </code>
                <code>
                    <pre>{JSON.stringify(repository, null, 2)}</pre>
                </code> */}
                <RepositoryContext.Provider
                    value={{
                        repository,
                        datalistIds,
                        allFoldersListMap,
                        allDocumentsListMap,
                        explorerTree,
                        dmsConfig,
                        navigationStack,
                        setSelectedFolders,
                        setSelectedDocuments,
                        startProcessInstance7,
                        startProcessInstance8,
                        actions,
                    }}>
                    <div className="d-flex align-items-center justify-content-between p-2 listing-header  s2a-border mb-2">
                        <div className="d-flex align-items-center  gap-3">
                            <input
                                className="form-control w-100 m-1"
                                placeholder="search..."
                                onChange={handleSearch}
                                value={search}
                            />
                            {/* <ReactSelect
                                options={formKeys}
                                selectedOption={INITIAL_CREATE_STATE}
                                handleChange={handleParentFormSelection}
                                isSearchable={false}
                            /> */}
                            {/* <ReactSelect
                                options={SELECT_OPTIONS.filter(
                                    item =>
                                        item.value !== "FOLDERS" &&
                                        item.value !== "ALL" &&
                                        item.value !== "INVERT",
                                )}
                                selectedOption={INITIAL_SELECT_STATE}
                                handleChange={handleSelectActionChange}
                                withIcons={true}
                                isSearchable={false}
                            /> */}

                            {/* <ReactSelect
                                options={SELECTED_ACTIONS?.filter(
                                    item =>
                                        item.value != "MOVE" &&
                                        item.value !== "DELETE",
                                )}
                                selectedOption={INITIAL_SELECTED_ACTIONS_STATE}
                                handleChange={handleSelectedActionChange}
                                withIcons={true}
                                isSearchable={false}
                                disabled={
                                    selectedFolders.length == 0 &&
                                    selectedDocuments.length == 0
                                }
                            /> */}
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
                    {/* <Navigation
                        navigation={navigationStack}
                        backNavigationAction={backNavigationAction}
                        handleNavigationAction={handleNavigationAction}
                    /> */}

                    <div>
                        <ol className="list-group ">
                            {/* <FolderListView
                                folderList={sortedFolderList}
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
                            /> */}
                            <DocumentListView
                                selectedDocuments={selectedDocuments}
                                handleDocumentSelection={
                                    handleDocumentSelection
                                }
                                documentList={sortedDocumentList}
                                handleDocEdit={handleDocEdit}
                                handleDocCheckin={handleDocCheckin}
                                handleDocMove={handleDocMove}
                                selectedParentFolder={selectedParentFolder}
                                handleDocUpdateActions={handleDocUpdateActions}
                                selectedDocumentType={selectedDocumentType}
                                search={search}
                            />
                        </ol>
                    </div>
                    {/* <ChildrenModal
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
                    </ChildrenModal> */}
                    {/* <ChildrenModal
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
                    </ChildrenModal> */}
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
                    {/* <ChildrenModal
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
                    </ChildrenModal> */}
                    {/* <ChildrenModal
                        ref={singleFolderMoveModal}
                        centered={true}
                        hideMaximizeButton={true}
                        header={"Move Folder"}>
                        <MoveFolder
                            singleFolderMoveModal={singleFolderMoveModal}
                            selectedParentFolder={selectedFolder}
                            handleSingleFolderMove={handleSingleFolderMove}
                            parentRepository={repository}
                            allFoldersListMap={allFoldersListMap}
                            parentTree={explorerTree}
                        />
                    </ChildrenModal> */}
                    <ChildrenModal
                        ref={singleDocumentMoveModal}
                        centered={true}
                        hideMaximizeButton={true}
                        header={"Move Document"}>
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
                        header={"Move Folders and Documents"}>
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

// const DeleteFolder = props => {
//     const {
//         selectedFolder,
//         singleFolderDeleteModal,
//         handleSingleFolderDelete,
//     } = props;

//     return (
//         <div className="d-flex justify-content-between">
//             <div>
//                 <div>
//                     Are you sure you want to delete{" "}
//                     <b>{`${selectedFolder.name}`}</b> ?
//                 </div>
//             </div>
//             <div className="d-flex flex-row">
//                 <button
//                     className="btn btn-sm btn-danger mx-1"
//                     onClick={handleSingleFolderDelete}>
//                     Yes
//                 </button>
//                 <button
//                     className="btn btn-sm btn-light mx-1"
//                     onClick={() => {
//                         singleFolderDeleteModal.current.close();
//                     }}>
//                     No
//                 </button>
//             </div>
//         </div>
//     );
// };

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

// const Upload = () => {
//     return (
//         <div
//             className=" p-1 pointer"
//             style={{
//                 minWidth: "100px",
//             }}>
//             <i className="fa-solid fa-upload"></i>
//             Upload
//         </div>
//     );
// };

export default Detailspanel;

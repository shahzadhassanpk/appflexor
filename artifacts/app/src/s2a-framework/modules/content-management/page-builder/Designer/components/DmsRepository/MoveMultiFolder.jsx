import React, { useEffect, useState } from "react";
import Explorer from "./components/Explorer";
import {
    checkIfMoveIsValid,
    checkIfMultiMoveIsValid,
    getMultiFormDataFromFolders,
    getImmediateChildNodeIds,
    setAllSelectedFalse,
    setSelectedFalseExcept,
    updateTreeNode,
    hasProperties,
} from "./utils/helper";
import { API_URL } from "../../../../../../Config";
import axios from "axios";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";

const MoveMultiFolder = props => {
    const {
        parentRepository,
        parentTree,
        selectedGrandParentFolder,
        selectedParentFolder,
        selectedParentFolders,
        selectedParentDocuments,
        multiMoveModal,
        handleMultipleMoveAction,
        documentListMap,
        allFoldersListMap,
    } = props;

    const [explorerTree, setExplorerTree] = useState(parentTree);
    const [repository, setRepository] = useState(parentRepository);
    const [selectedFolder, setSelectedFolder] = useState(
        selectedGrandParentFolder,
    );
    const [selectedFolders, setSelectedFolders] = useState([]);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [sure, setSure] = useState(false);

    useEffect(() => {
        if (
            selectedParentFolders.length > 0 &&
            hasProperties(allFoldersListMap)
        ) {
            const folders = [];
            selectedParentFolders.map(folderId => {
                const folder = allFoldersListMap[folderId];

                if (!selectedGrandParentFolder.id) {
                    if (folder.parent_id == parentRepository.id) {
                        folders.push(folder.id);
                    }
                } else if (folder.parent_id == selectedGrandParentFolder.id) {
                    folders.push(folder.id);
                }
            });
            setSelectedFolders(folders);
        }
    }, [selectedParentFolders, selectedGrandParentFolder, allFoldersListMap]);

    useEffect(() => {
        if (
            selectedParentDocuments.length > 0 &&
            hasProperties(documentListMap)
        ) {
            const documents = [];

            selectedParentDocuments.map(docId => {
                const doc = documentListMap[docId];

                if (doc) {
                    if (!selectedGrandParentFolder.id) {
                        if (doc.parent_id == parentRepository.id) {
                            documents.push(doc.id);
                        }
                    } else if (doc.parent_id == selectedGrandParentFolder.id) {
                        documents.push(doc.id);
                    }
                }
            });

            setSelectedDocuments(documents);
        }
    }, [selectedParentDocuments, selectedGrandParentFolder, documentListMap]);

    const handleFolderSelection = node => {
        const id = node.id;
        const updatedTree = setSelectedFalseExcept(id, explorerTree);
        setExplorerTree(updatedTree);

        const selection = allFoldersListMap[id];

        setSelectedFolder(selection);
        setRepository(prev => ({ ...prev, isSelected: false }));
    };

    const handleFolderExpansion = node => {
        const id = node.id;

        const currentNode = { ...node, isOpen: !node.isOpen };
        const updatedTree = updateTreeNode(id, explorerTree, currentNode);

        setExplorerTree(updatedTree);
    };
    const handleRepositoryExpansion = node => {
        const id = node.id;
        setRepository(prev => ({ ...prev, isOpen: !prev.isOpen }));
    };

    const handleRepositorySelection = node => {
        const id = node.id;
        setSelectedFolder({});
        setRepository(prev => ({ ...prev, isOpen: true, isSelected: true }));

        const updatedTree = setAllSelectedFalse(explorerTree);
        setExplorerTree(updatedTree);
    };

    const handleMove = async () => {
        setSure("");
        const moveIsValid = checkIfMultiMoveIsValid(
            selectedFolders,
            selectedFolder,
            explorerTree,
        );

        if (moveIsValid) {
            const reqData = getMultiFormDataFromFolders(
                selectedFolders,
                selectedDocuments,
                selectedFolder,
                allFoldersListMap,
                documentListMap,
                parentRepository,
            );

            const URL = API_URL + "?service.key=update.formData";
            const request = {
                data: reqData,
            };

            try {
                const response = await axios.post(URL, request);
                if (response.data.C_STATUS === "SUCCESS") {
                    let resObj = {
                        status: response.data.C_STATUS,
                        parent_id: "",
                    };
                    if (!selectedGrandParentFolder.id) {
                        resObj.parent_id = repository.id;
                    } else {
                        resObj.parent_id = selectedGrandParentFolder.id;
                    }

                    handleMultipleMoveAction(resObj);
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            toastEmitter("Invalid Move", true, "error");
        }
    };

    return (
        <div className="d-flex flex-column justify-content-start">
            <div className="d-flex gap-4 mb-2">
                <div className="">
                    <h6>Trarget Folder</h6>
                    <div
                        className="s2a-border p-2 enable-scroll"
                        style={{
                            height: 300,
                        }}>
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
                            modal
                        />
                    </div>
                </div>
                <div>
                    <h6>Confirm Target</h6>
                    <DynamicCheckBoxs
                        items={[
                            {
                                label: "Are you sure to move the selected items?",
                                code: "SURE",
                            },
                        ]}
                        handleChange={() => setSure(prev => !prev)}
                        selectedItem={sure ? "SURE" : ""}
                    />
                </div>
            </div>
            <div className="d-flex  justify-content-end">
                <button
                    className="btn btn-sm button-theme mx-1"
                    disabled={!sure}
                    onClick={handleMove}>
                    Move
                </button>
                <button
                    className="btn btn-sm button-theme mx-1"
                    onClick={() => {
                        multiMoveModal.current.close();
                    }}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default MoveMultiFolder;

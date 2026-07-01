import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_URL } from "../../../../../../Config";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";

import Explorer from "./components/Explorer";
import {
    checkIfMoveIsValid,
    delKeys,
    getFormDataForDocuemnt,
    getFormDataForFolder,
    setAllSelectedFalse,
    setSelectedFalseExcept,
    updateTreeNode,
} from "./utils/helper";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";

const MoveDocument = props => {
    const {
        parentRepository,
        parentTree,
        selectedParentFolder,
        selectedGrandParentFolder,
        selectedParentDoc,
        singleDocumentMoveModal,
        handleSingleDocMove,
        allFoldersListMap,
        parentDocumentListMap,
    } = props;

    const [explorerTree, setExplorerTree] = useState(parentTree);
    const [repository, setRepository] = useState(parentRepository);
    const [selectedFolder, setSelectedFolder] = useState(selectedParentFolder);
    const [sure, setSure] = useState(false);

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
        const formData = getFormDataForDocuemnt(
            selectedParentDoc,
            selectedFolder,
            parentRepository,
        );
        //assumption if selectedFolder undefined then it's repository selected
        const updatedFormData = {
            id: selectedParentDoc.id,
            parent_id: selectedFolder.id
                ? selectedFolder.id
                : parentRepository.id,
        };

        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [],
        };

        const reqData = {
            id: selectedParentDoc.id,
            formId: selectedParentDoc.table,
            entity: selectedParentDoc.table,
            action: "update",
            formData: updatedFormData,
        };
        request.data.push(reqData);

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
                handleSingleDocMove(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="d-flex flex-column justify-content-start">
            <div className="d-flex gap-4 mb-2">
                {/* <div className="">
                    <h6>Repository</h6>
                    <p className="p-1 s2a-border border-opacity-75 pointer">
                        {repository.name}
                    </p>
                </div> */}
                <div className="">
                    <h6>Target Folder:</h6>
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
                    <h6>Confirm Movement</h6>
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
                        singleDocumentMoveModal.current.close();
                    }}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default MoveDocument;

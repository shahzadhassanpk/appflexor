import React, { useEffect, useState } from "react";
import Explorer from "./components/Explorer";
import {
    checkIfMoveIsValid,
    delKeys,
    getFormDataForFolder,
    setAllSelectedFalse,
    setSelectedFalseExcept,
    updateTreeNode,
} from "./utils/helper";
import { API_URL } from "../../../../../../Config";
import axios from "axios";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import DynamicCheckBoxs from "../../../../../../components/dynamic-checkbox/Checkbox";

const MoveFolder = props => {
    const {
        parentRepository,
        parentTree,
        selectedParentFolder,
        singleFolderMoveModal,
        handleSingleFolderMove,
        allFoldersListMap,
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
        const moveIsValid = checkIfMoveIsValid(
            selectedParentFolder,
            selectedFolder,
            explorerTree,
        );

        if (moveIsValid) {
            const updatedFormData = getFormDataForFolder(
                selectedParentFolder,
                selectedFolder,
                parentRepository,
            );

            const URL = API_URL + "?service.key=update.formData";
            const request = {
                data: [],
            };

            const reqData = {
                id: selectedParentFolder.id,
                formId: selectedParentFolder.table,
                entity: selectedParentFolder.table,
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

                    if (
                        selectedParentFolder.parent_id == parentRepository.id ||
                        !selectedParentFolder.id
                    ) {
                        resObj.parent_id = parentRepository.id;
                    } else {
                        resObj.parent_id = selectedParentFolder.id;
                    }

                    handleSingleFolderMove(resObj);
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
            {/* <div className="col-sm-12">
                <h6>Repository: {repository.name}</h6>
            </div> */}
            <div className="d-flex gap-4 mb-2">
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
                        singleFolderMoveModal.current.close();
                    }}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default MoveFolder;

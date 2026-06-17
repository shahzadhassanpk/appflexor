import React, { useState } from "react";
import { FilesystemItem } from "./FilesystemItem";

const Explorer = ({
    repository,
    explorerTree = [],
    handleFolderSelection,
    handleFolderExpansion,
    handleRepositoryExpansion,
    handleRepositorySelection,
    isOpen,
    setIsOpen,
    setSelectedDocumentType,
    selectedDocumentType,
    modal,
    actions,
}) => {
    const handleSelection = name => {
        setSelectedDocumentType(name);
        localStorage.setItem("selectedDocumentType", name);
    };

    return (
        <div className="overflow-hidden">   
            <div className="ps-2">
                {!modal && (
                    <div
                        className="d-flex align-items-center gap-2 "
                        onClick={() => setIsOpen(prev => !prev)}>
                        {isOpen ? (
                            <i className="fa-solid fa-caret-down"></i>
                        ) : (
                            <i className="fa-solid fa-caret-right"></i>
                        )}
                        <span className="fs-6">My Documents</span>
                    </div>
                )}
                {isOpen && (
                    <ul className="list-unstyled ps-2">
                        <li
                            className={`p-2 pointer d-flex gap-3 align-items-center ${
                                selectedDocumentType === "editing"
                                    ? "node-selection-color"
                                    : ""
                            }`}
                            onClick={() => handleSelection("editing")}>
                            <i
                                style={{ width: 12 }}
                                className="fa-regular fa-pen-to-square"></i>{" "}
                            I'm Editing
                        </li>
                        {actions?.includes("FAVOURITES") && (
                            <li
                                className={`p-2  pointer d-flex gap-3 align-items-center ${
                                    selectedDocumentType === "favorites"
                                        ? "node-selection-color"
                                        : ""
                                }`}
                                onClick={() => handleSelection("favorites")}>
                                <i
                                    style={{ width: 12 }}
                                    className="fa-solid fa-heart m-0"></i>
                                My Favorites
                            </li>
                        )}
                        <li
                            className={`p-2 pointer d-flex gap-3 align-items-center ${
                                selectedDocumentType === "recyclebin"
                                    ? "node-selection-color"
                                    : ""
                            }`}
                            onClick={() => handleSelection("recyclebin")}>
                            <i
                                style={{ width: 12 }}
                                className="fa fa-recycle"></i>
                            Archive Bin
                        </li>
                    </ul>
                )}
            </div>
            <ul className="list-unstyled">
                <li style={{ minWidth: 200 }}>
                    <span
                        className={`d-flex align-items-center gap-1 mb-1 pointer py-1 ${
                            !selectedDocumentType && repository.isSelected
                                ? "node-selection-color"
                                : ""
                        }`}>
                        <i
                            style={{
                                fontSize: 22,
                                width: 25,
                            }}
                            onClick={() =>
                                handleRepositoryExpansion(repository)
                            }
                            className={`ms-2 fa-solid ${
                                repository.isOpen
                                    ? "fa-solid fa-database"
                                    : "fa-solid fa-database"
                            } `}></i>

                        <span
                            style={{ minWidth: 200 }}
                            title="Repository Explorer"
                            onClick={() =>
                                handleRepositorySelection(repository)
                            }>
                            {repository.name}
                        </span>
                    </span>
                </li>
                {repository.isOpen && (
                    <ul
                        style={{ minWidth: 200 }}
                        className="ms-2 list-unstyled">
                        {explorerTree.map(
                            node =>
                                node.status !== "ARCHIVE" && (
                                    <FilesystemItem
                                        key={node.id}
                                        node={node}
                                        onNodeSelection={handleFolderSelection}
                                        onNodeExpansion={handleFolderExpansion}
                                        selectedDocumentType={
                                            selectedDocumentType
                                        }
                                    />
                                ),
                        )}
                    </ul>
                )}
            </ul>
        </div>
    );
};

export default Explorer;

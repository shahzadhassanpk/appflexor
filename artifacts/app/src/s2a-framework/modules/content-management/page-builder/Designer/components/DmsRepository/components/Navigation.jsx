import React from "react";

const Navigation = ({
    backNavigationAction,
    navigation = [],
    handleNavigationAction,
    handleFolderMove,
    handleFolderEdit,
    handleDeleteFolder,
    selectedFolder,
    permissionActions,
    repository,
}) => {
    return (
        <div className="d-flex align-items-center gap-2 justify-content-start p-2 s2a-border mb-2">
            <i
                className={`fa-solid fa-circle-left ${
                    navigation.length > 1 ? "pointer" : "text-muted"
                } `}
                onClick={backNavigationAction}></i>
            |
            {navigation.map((nav, index) => {
                return (
                    <React.Fragment key={nav.id}>
                        <span
                            className="pointer"
                            onClick={() => handleNavigationAction(nav.id)}>
                            <i className="fa-regular fa-folder-open"></i>{" "}
                            {nav.name}
                        </span>
                        {index != navigation.length - 1 && ">"}
                    </React.Fragment>
                );
            })}
            {selectedFolder?.id && selectedFolder?.id !== repository?.id && (
                <div className="d-flex flex gap-2 border-s">
                    {/* {JSON.stringify(selectedFolder)} */}
                    {"| "}
                    {selectedFolder.status !== "ARCHIVE" &&
                        (permissionActions === "ALL" ||
                            permissionActions === "WRITE") && (
                            <div
                                onClick={() => {
                                    handleFolderEdit(selectedFolder);
                                }}
                                className="pointer">                                
                                <i className="fa-solid fa-pen-to-square"></i>
                                Edit Properties
                            </div>
                        )}
                    {selectedFolder?.status !== "ARCHIVE" &&
                        permissionActions === "ALL" && (
                            <div
                                onClick={() => handleFolderMove(selectedFolder)}
                                className="pointer">
                                <i className="fa-solid fa-copy"></i>
                                Move to...
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default Navigation;

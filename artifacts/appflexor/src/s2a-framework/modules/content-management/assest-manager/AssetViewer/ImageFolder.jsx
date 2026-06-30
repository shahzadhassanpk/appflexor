import React, { useEffect, useState } from "react";
import { API_URL, FOLDER_ASSETS_DB_TABLE } from "../../../../Config";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import axios from "axios";

export const folderTable = FOLDER_ASSETS_DB_TABLE;

export default function ImageFolder({
    channel,
    activeTab = "ASSET_MANAGER",
    parent,
    setParent,
    showUploader, // to disable folder navigation
    setShowUploader,
    showImageViewer,
    mode = "VIEW", // EDIT, VIEW
}) {
    const [showInputField, setShowInputField] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [child, setChild] = useState([]);
    const [path, setPath] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let currentPath = [];
        let foundCurrent = false;
        path.map((folder, index) => {
            if (folder.id !== parent.id && !foundCurrent) {
                currentPath.push(folder);
            } else if (folder.id === parent.id) {
                foundCurrent = true;
            }
        });
        currentPath.push(parent);
        // console.log(JSON.stringify(currentPath));
        setPath(currentPath);
        // if (parent.id === "1") {
        //     setPath([parent]);
        // } else {
        //     setPath([...path, parent]);
        // }
    }, [parent]);

    useEffect(() => {
        if (channel.id && parent.id) {
            getChildFolders();
        }
    }, [parent]);

    const handleSave = () => {
        if (newFolderName.trim() === "")
            return toastEmitter("Folder name is empty", true, "error");
        if (selectedFolder) {
            addFolder({
                ...selectedFolder,
                title: newFolderName,
                parent: parent.id,
            });
        } else {
            addFolder({ title: newFolderName, parent: parent.id });
        }
    };

    const handleCancel = () => {
        setShowInputField(false);
        setNewFolderName("");
    };

    const addNewFolder = () => {
        setShowUploader(false);
        setSelectedFolder({ id: "new", parent: parent.id });
    };

    function getChildFolders() {
        setLoaded(false);
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.id + "," + parent.id,
                    dataKey: "folders",
                    serviceKey: "list.image.folders",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let folders = response.data.C_DATA.folders;
                    setChild(folders);
                } else {
                    console.error(
                        "Unable to get data from 'list.image.folders'",
                    );
                }
                setLoaded(true);
            })
            .catch(error => {
                console.error(error);
                setLoaded(true);
            });
    }

    function addFolder(folder) {
        const url = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: folderTable,
                    entity: folderTable,
                    id: folder.id || "new",
                    action: "update",
                    formData: {
                        id: folder.id || "new",
                        title: folder.title,
                        parent: folder.parent,
                        channel_id: channel.id,
                    },
                },
            ],
        };

        axios
            .post(url, request)
            .then(response => {
                if (response.status === 200) {
                    toastEmitter(
                        `${folder.title} Created Successfully!`,
                        true,
                        "success",
                    );
                    setNewFolderName("");
                    setShowInputField(false);
                    setSelectedFolder(null);
                    getChildFolders();
                }
            })
            .catch(e => {
                console.error("Error while sending save request:" + e);
            });
    }

    function deleteFolder(folder) {
        const url = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: folderTable,
                    entity: folderTable,
                    id: folder.id,
                    action: "delete",
                },
            ],
        };

        axios
            .post(url, request)
            .then(response => {
                if (response.status === 200) {
                    toastEmitter(
                        `${folder.title} Deleted Successfully!`,
                        true,
                        "success",
                    );
                    getChildFolders();
                }
            })
            .catch(e => {
                console.error("Error while sending delete request:" + e);
            });
    }

    function setFolder(folder) {
        setShowUploader(false);
        setParent(folder);
    }

    const handleGoBack = () => {
        if (path.length > 1) {
            const newPath = path.slice(0, -1);
            setParent(newPath[newPath.length - 1]);
            setPath(newPath);
        }
    };

    const handleFolderClick = folder => {
        setShowUploader(false);
        setParent(folder);
    };

    return (
        // <div className="container-fluid">
        <>
            <div className="row">
                <div className="container">
                    <div className="col-sm-12 flex-between s2a-form-title justify-content-space breadcrumb-header">
                        {/* {JSON.stringify(path)} */}
                        <nav aria-label="breadcrumb-nav">
                            <ol className="breadcrumb m-0">
                                {path
                                    // .filter((folder, index) => index !== 0) // Exclude the root folder
                                    .map((folder, index) => (
                                        <li
                                            key={folder.id}
                                            className={`breadcrumb-item`}
                                            onClick={() => {
                                                setFolder(folder);
                                            }}
                                            style={{
                                                cursor:
                                                    index !== path.length
                                                        ? "pointer"
                                                        : "default",
                                            }}>
                                            {folder.title}
                                        </li>
                                    ))}
                            </ol>
                        </nav>
                        {mode === "EDIT" && (
                            <button
                                type="button"
                                className="button-theme btn btn-sm"
                                disabled={!loaded}
                                onClick={() => {
                                    addNewFolder();
                                    setShowInputField(prev => !prev);
                                }}>
                                <i className="fa-solid fa-plus fs-6"></i> Add
                                Folder
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* <div className="row mb-2">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            {path
                                .filter((folder, index) => index !== 0) // Exclude the root folder
                                .map((folder, index) => (
                                    <li
                                        key={folder.id}
                                        className={`breadcrumb-item ${
                                            index === path.length - 2
                                                ? "active"
                                                : ""
                                        }`}
                                        style={{
                                            cursor:
                                                index !== path.length - 2
                                                    ? "pointer"
                                                    : "default",
                                        }}>
                                        {folder.title}
                                    </li>
                                ))}
                        </ol>
                    </nav>
                </div> */}

            {showInputField && (
                <div className="row mb-3">
                    <div className="col-6 form-group">
                        <label>Folder Name</label>
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Enter folder name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <div className="col-sm-6 p-4">
                        <button
                            type="button"
                            className="button-theme me-1"
                            onClick={handleCancel}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="button-theme"
                            onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            )}
            {/* <div className="row"> */}
            <div className="col-sm-12">
                <h5>Sub Folders ({loaded ? child.length : "..."})</h5>
            </div>

            <div className="col-sm-12 assets-viewer-subfolders container-fluid">
                {loaded
                    ? child.length == 0
                        ? "No folder"
                        : child.map(folder => (
                              <div
                                  key={folder.id}
                                  className="col- d-flex align-items-center"
                                  style={{ cursor: "pointer" }}>
                                  <div className="dropdown">
                                      <span
                                          className="fa-solid fa-ellipsis-vertical p-2"
                                          href="#"
                                          role="button"
                                          data-bs-toggle="dropdown"
                                          aria-expanded="false"></span>
                                      <ul className="dropdown-menu">
                                          <li>
                                              <span
                                                  className="dropdown-item"
                                                  title="Edit"
                                                  onClick={() => {
                                                      setNewFolderName(
                                                          folder.title,
                                                      );
                                                      setShowInputField(true);
                                                      setSelectedFolder(folder);
                                                  }}>
                                                  <i className="fa-regular fa-pen-to-square"></i>{" "}
                                                  Edit
                                              </span>
                                          </li>
                                          <li>
                                              <span
                                                  className="dropdown-item dropdown-item-del"
                                                  title="Delete"
                                                  onClick={() =>
                                                      deleteFolder(folder)
                                                  }>
                                                  <i className="fa-regular fa-trash-can"></i>{" "}
                                                  Delete
                                              </span>
                                          </li>
                                      </ul>
                                  </div>
                                  <span
                                      className="pointer me-auto flex-grow-1"
                                      onClick={() => handleFolderClick(folder)}>
                                      <i className="fa-solid fa-folder fs-5 pe-1"></i>
                                      {folder.title}
                                  </span>
                              </div>
                          ))
                    : "Loading..."}
            </div>
            {/* </div> */}
        </>
        // </div>
    );
}

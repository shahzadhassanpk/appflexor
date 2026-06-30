import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";

import {
    convertDBDateToFromNow,
    formatDateTimeForUserView,
} from "../../../../../../utils/utils";
import { API_URL } from "../../../../../../Config";
import { AppContext } from "../../../../../../../AppContext";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import DataListViewer from "../../../datalist-viewer/viewer/DataListViewer";

import { modeType } from "../../Designer";
import { RepositoryContext } from "./context/RespositoryContext";
import { DELETE_ACTION_TYPES } from "./dmsConfig";
import { delKeys, getDeleteFolderPurgeRequest } from "./utils/helper";
import { STATUS } from "./utils/constants";
import { folderActions } from "./RepositoryViewer";
import FormViewer from "../../../../../data-management/form-builder/Forms/FormViewer";

const TYPE = {
    FAVORITE: "FAVORITE",
    LIKE: "LIKE",
    FOLDER: "FOLDER",
};

const tryToParse = item => {
    try {
        return JSON.parse(item);
    } catch (error) {
        console.log(error);
        return [];
    }
};

function FolderListView({
    folderList,
    handleFolderEdit,
    selectedFolders,
    handleFolderSelection,
    handleNavigationAction,
    handleFolderUpdateActions,
    handleFolderDelete,
    handleFolderMove,
    selectedParentFolder,
    search,
}) {
    const appContext = useContext(AppContext);
    const {
        profile,
        tenantSubscription: { tenantId },
    } = appContext;

    const context = useContext(RepositoryContext);
    const {
        repository,
        datalistIds,
        allDocumentsListMap,
        explorerTree,
        dmsConfig,
        recycleBin = false,
    } = context;
    const checkboxVisible = !localStorage.getItem("selectedDocumentType");

    const handleFavorite = fol => {
        saveFolderFavoriteStatus(fol);
    };
    const handleLike = fol => {
        saveFolderLikeStatus(fol);
    };

    const saveFolderFavoriteStatus = async (fol, status = "") => {
        const formData = {
            id: "new",
            obj_id: fol.id,
            obj_type: TYPE.FOLDER,
            reaction: TYPE.FAVORITE,
            username: profile.username,
        };

        const URL = API_URL + "?service.key=update.formData";

        const request = {
            data: [],
        };

        const reqData = {
            id: fol.id,
            formId: "dms_favorite",
            entity: "dms_favorite",
            action: "update",
            formData,
        };

        request.data.push(reqData);

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                }
                handleFolderUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveFavorite = async fol => {
        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: "dms_favorite",
                    entity: "dms_favorite",
                    id: fol.favorite_id,
                    action: "delete",
                },
            ],
        };

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                }
                handleFolderUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveFolderLikeStatus = async fol => {
        const formData = {
            id: "new",
            obj_id: fol.id,
            obj_type: TYPE.FOLDER,
            reaction: TYPE.LIKE,
            username: profile.username,
        };

        const URL = API_URL + "?service.key=update.formData";

        const request = {
            data: [],
        };

        const reqData = {
            id: fol.id,
            formId: "dms_like",
            entity: "dms_like",
            action: "update",
            formData,
        };

        request.data.push(reqData);

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                }
                handleFolderUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveLike = async fol => {
        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: "dms_like",
                    entity: "dms_like",
                    id: fol.like_id,
                    action: "delete",
                },
            ],
        };

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                }
                handleFolderUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteFolder = async folder => {
        let folCopy = structuredClone(folder);
        let formData = delKeys(folCopy);
        const URL = API_URL + "?service.key=update.formData";
        let request = {};
        // const delete

        if (recycleBin) {
            request.data = getDeleteFolderPurgeRequest(
                formData,
                explorerTree,
                allDocumentsListMap,
            );
        } else if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {
            request = getArchiveDeleteReq(formData);
        }

        // if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {
        //     request = getArchiveDeleteReq(document);
        // }

        // if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.PURGE) {
        //     request.data = getPurgedDeleteReq(documentId);
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
                toastEmitter(`${formData.name} deleted.`);
                handleFolderUpdateActions(resObj);
                // here delete
            }

            const data = response?.data?.C_DATA[0]?.formData;
            // if (process_engine === "CAMUNDA_SEVEN") {
            //     startProcessInstance7(
            //         folder.id,
            //         {
            //             subject: data.title,
            //             action: folderActions.delete,
            //         },
            //         { process_key: folder?.on_delete },
            // appContext
            //     );
            // } else {
            //     startProcessInstance8(
            //         folder.id,
            //         {
            //             subject: data.title,
            //             action: folderActions.delete,
            //         },
            //         { process_key: folder?.on_delete },
            // appContext
            //     );
            // }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRestore = async fol => {
        const formData = {
            // ...fol,
            id: fol.id,
            status: "",
        };

        const URL = API_URL + "?service.key=update.formData";

        const request = {
            data: [],
        };

        const reqData = {
            id: fol.id,
            formId: "dms_folder",
            entity: "dms_folder",
            action: "update",
            formData,
        };

        request.data.push(reqData);

        try {
            const response = await axios.post(URL, request);
            if (response.data.C_STATUS === "SUCCESS") {
                let resObj = {
                    status: response.data.C_STATUS,
                    parent_id: "",
                };

                if (!selectedParentFolder.id) {
                    resObj.parent_id = repository.id;
                }
                handleFolderUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {folderList.map(folder => {
                // for all keys search
                const searchBool = Object.keys(folder).some(key => {
                    // remove tags from this search
                    if (key === "tags") return;

                    return folder?.[key]
                        ?.toLowerCase()
                        ?.includes(search.toLowerCase());
                });

                const tagInclude = folder?.tags
                    ?.replaceAll("_", " ")
                    ?.toLowerCase()
                    ?.includes(search.toLowerCase());

                const find = searchBool || tagInclude;

                if (!find) return;

                return (
                    <FolderView
                        key={folder.id}
                        folder={folder}
                        handleFolderSelection={handleFolderSelection}
                        selectedFolders={selectedFolders}
                        handleFolderMove={handleFolderMove}
                        handleFolderEdit={handleFolderEdit}
                        profile={profile}
                        handleNavigationAction={handleNavigationAction}
                        handleFavorite={handleFavorite}
                        handleRemoveFavorite={handleRemoveFavorite}
                        handleLike={handleLike}
                        handleRemoveLike={handleRemoveLike}
                        datalistIds={datalistIds}
                        handleDeleteFolder={handleDeleteFolder}
                        dmsConfig={dmsConfig}
                        handleRestore={handleRestore}
                        recycleBin={recycleBin}
                        checkboxVisible={checkboxVisible}
                    />
                );
            })}
        </div>
    );
}

const FolderView = props => {
    const {
        folder,
        handleFolderSelection,
        selectedFolders,
        handleFolderMove,
        handleFolderEdit,
        handleDeleteFolder,
        profile,
        handleNavigationAction,
        handleFavorite,
        handleRemoveFavorite,
        handleLike,
        handleRemoveLike,
        datalistIds = {},
        dmsConfig,
        handleRestore,
        recycleBin,
        checkboxVisible,
    } = props;
    const {
        navigationStack: navigation,
        setSelectedFolders,
        setSelectedDocuments,
        actions,
    } = useContext(RepositoryContext);

    const { userGroups } = useContext(AppContext);

    const [folderIsHovered, setFolderIsHovered] = useState("");
    const [favoriteIsHovered, setFavoriteIsHovered] = useState(false);
    const [likeIsHovered, setLikeIsHovered] = useState(false);
    const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);

    const isLiked = folder.like == TYPE.LIKE;
    const isFavorite = folder.favorite == TYPE.FAVORITE;
    const commnetDatalist = datalistIds[dmsConfig.COMMENT_DL_KEY];
    const permissionFormKey = dmsConfig["FOLDER_PERMISSION_FORM_KEY"];
    const permissonsDatalist = datalistIds[dmsConfig.PERMISSONS_DL_KEY];

    const commentModalRef = useRef(null);
    const permissonsModalRef = useRef(null);

    const openCommentModal = () => {
        commentModalRef.current.show();
    };
    const openPermissionsModal = () => {
        permissonsModalRef.current.show();
    };

    const openDeleteDialog = () => {
        setShowDeleteDialogue(true);
    };

    const onDeleteConfirm = () => {
        handleDeleteFolder(folder);
        setShowDeleteDialogue(false);
    };
    const onDeleteCancel = () => {
        setShowDeleteDialogue(false);
    };

    useEffect(() => {
        setSelectedFolders([]);
        setSelectedDocuments([]);
        // console.log(navigation);
    }, [navigation]);

    const permission = parseInt(folder.permission) || 0;

    let permissionActions = null;

    switch (permission) {
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
    return (
        <div>
            {/* <code>{JSON.stringify(folder, null, 2)}</code> */}

            <li
                className="list-group-item d-flex justify-content-between align-items-start position-relative"
                onMouseEnter={() => setFolderIsHovered(folder.id)}
                onMouseLeave={() => setFolderIsHovered("")}>
                {checkboxVisible && (
                    // {folder?.status !== "ARCHIVE" && (
                    <div className="position-absolute top-0 start-0 m-2">
                        <input
                            type="checkbox"
                            onChange={() => handleFolderSelection(folder)}
                            // onClick={() => handleFolderSelection(folder)}
                            checked={selectedFolders.includes(folder.id)}
                        />
                    </div>
                )}
                <div className="ms-2  d-flex flex-grow-1">
                    <img
                        style={{
                            height: 72,
                            width: 72,
                        }}
                        className="p-2  img-fluid"
                        src="../theme/images/folder-icon.png"
                        alt=""
                    />
                    <div className="flex-fill">
                        <div className="d-flex flex-column ">
                            <span
                                className=" pointer"
                                onClick={() =>
                                    handleNavigationAction(folder.id)
                                }>
                                <span
                                    title="Folder Name"
                                    className="fw-bold">
                                    {folder.name}{" "}
                                </span>
                                {folder.title && (
                                    <span title="Folder Title">
                                        ( {folder.title} )
                                    </span>
                                )}
                                {/* {folder.status && (
                                    <span className="text-muted">
                                        [{folder.status}]
                                    </span>
                                )} */}
                            </span>
                            <span className="">
                                Folder Type{": "}
                                {folder?.folder_type_name}
                            </span>
                            <span className="">
                                Physical Archive{": "}
                                {folder?.physical_archive}
                            </span>
                            <span className="">
                                Permission{": "}
                                {permissionActions}
                            </span>
                            <span>
                                Created{": "}
                                {formatDateTimeForUserView(
                                    folder.datecreated,
                                )}{" "}
                                by {folder.createdby}
                            </span>
                            <span>
                                Modified{": "}
                                {formatDateTimeForUserView(
                                    folder.datemodified,
                                )}{" "}
                                by {folder.modifiedby}
                            </span>
                            {folder.description ? (
                                <span>
                                    Description{": "}
                                    {folder.description}
                                </span>
                            ) : (
                                <span className="text-muted">
                                    No Description
                                </span>
                            )}
                            {folder.tags ? (
                                <span>{<Tags items={folder.tags} />}</span>
                            ) : (
                                <span className="text-muted">No Tags</span>
                            )}
                            {folder.status !== "ARCHIVE" && (
                                <div className="d-flex gap-2">
                                    {actions?.includes("FAVOURITES") && (
                                        <>
                                            {folder.favorite_count > 0 ? (
                                                <span
                                                    onMouseEnter={() =>
                                                        setFavoriteIsHovered(
                                                            true,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setFavoriteIsHovered(
                                                            false,
                                                        )
                                                    }>
                                                    {favoriteIsHovered ? (
                                                        <span
                                                            className="title-click pointer"
                                                            onClick={() =>
                                                                handleRemoveFavorite(
                                                                    folder,
                                                                )
                                                            }>
                                                            <i
                                                                style={{
                                                                    width: 16,
                                                                }}
                                                                className="fa-solid fa-cancel text-muted"></i>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            <i
                                                                style={{
                                                                    width: 16,
                                                                }}
                                                                className="fa-solid fa-star text-warning"></i>
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span
                                                    className="title-click pointer"
                                                    onClick={() =>
                                                        handleFavorite(folder)
                                                    }>
                                                    <i className="fa-solid fa-star text-muted"></i>
                                                    Favorite
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {actions?.includes("LIKES") && (
                                        <>
                                            <span className="text-muted">
                                                |
                                            </span>
                                            {folder.like_id ? (
                                                <span
                                                    onMouseEnter={() =>
                                                        setLikeIsHovered(true)
                                                    }
                                                    onMouseLeave={() =>
                                                        setLikeIsHovered(false)
                                                    }>
                                                    {likeIsHovered ? (
                                                        <span
                                                            className="title-click pointer"
                                                            onClick={() =>
                                                                handleRemoveLike(
                                                                    folder,
                                                                )
                                                            }>
                                                            <i
                                                                style={{
                                                                    width: 16,
                                                                }}
                                                                className="fa-solid fa-cancel text-muted"></i>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            <i
                                                                style={{
                                                                    width: 16,
                                                                }}
                                                                className="fa-solid fa-thumbs-up text-primary"></i>
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span
                                                    className="title-click pointer"
                                                    onClick={() =>
                                                        handleLike(folder)
                                                    }>
                                                    <i className="fa-solid fa-thumbs-up text-muted"></i>
                                                    Like
                                                </span>
                                            )}
                                            {folder.like_count ? (
                                                <span>{folder.like_count}</span>
                                            ) : (
                                                0
                                            )}
                                        </>
                                    )}

                                    {actions?.includes("COMMENTS") && (
                                        <>
                                            <span className="text-muted">
                                                |
                                            </span>
                                            <span
                                                onClick={openCommentModal}
                                                className="pointer">
                                                <i className="fa-solid fa-share-nodes text-muted"></i>
                                                Comment
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {folderIsHovered == folder.id && (
                    <div className="d-flex flex-column action-layer border-s">
                        {folder.status !== "ARCHIVE" &&
                            (permissionActions === "ALL" ||
                                permissionActions === "WRITE") && (
                                <div
                                    onClick={() => {
                                        handleFolderEdit(folder);
                                    }}
                                    className="pointer">
                                    <i className="fa-solid fa-pen-to-square"></i>
                                    Edit Properties
                                </div>
                            )}
                        {/* <div
                            onClick={() => {}}
                            className="not-allowed text-muted">
                            <i className="fa-regular fa-copy"></i>
                            Copy to...
                        </div> */}

                        {folder?.status !== "ARCHIVE" &&
                            permissionActions === "ALL" && (
                                <div
                                    onClick={() => handleFolderMove(folder)}
                                    className="pointer">
                                    <i className="fa-solid fa-copy"></i>
                                    Move to...
                                </div>
                            )}

                        {permissionActions === "ALL" && (
                            <>
                                {folder?.status === "ARCHIVE" ? (
                                    <>
                                        <div
                                            onClick={() =>
                                                handleRestore(folder)
                                            }
                                            className="pointer">
                                            <i className="fa fa-trash-restore"></i>
                                            Restore Folder
                                        </div>
                                        {recycleBin && (
                                            <div
                                                onClick={openDeleteDialog}
                                                className="pointer">
                                                <i className="fa-solid fa-trash-can"></i>
                                                Delete Folder
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        onClick={openDeleteDialog}
                                        className="pointer">
                                        <i className="fa-solid fa-trash-can"></i>
                                        Archive Folder
                                    </div>
                                )}
                            </>
                        )}
                        {permissionActions === "ALL" && (
                            <div
                                onClick={openPermissionsModal}
                                className="pointer">
                                <i className="fa-solid fa-key"></i>
                                Manage Permissons
                            </div>
                        )}
                    </div>
                )}
            </li>

            <ChildrenModal
                ref={commentModalRef}
                centered={true}
                header={""}>
                <DataListViewer
                    ids={{
                        id: commnetDatalist.id,
                        form_id: commnetDatalist.form_id,
                    }}
                    mode={modeType.render}
                    modeType={modeType}
                    fkColumn={"obj_id"}
                    fkValue={folder.id}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={permissonsModalRef}
                centered={true}
                header={folder?.name}>
                <FormViewer
                    businessKey={folder?.id}
                    formKey={permissionFormKey}
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
                            Are you sure you want to{" "}
                            {recycleBin ? "delete" : "archive"}{" "}
                            <b> {folder.name} </b>?
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
        </div>
    );
};

function getArchiveDeleteReq(folder) {
    const formData = {
        // ...folder,
        id: folder.id,
        status: STATUS.ARCHIVE,
    };

    const request = {
        data: [],
    };

    const reqData = {
        id: folder.id,
        formId: "dms_folder",
        entity: "dms_folder",
        action: "update",
        formData,
    };

    request.data.push(reqData);

    return request;
}

export default FolderListView;

function Tags({ items }) {
    const parsedTags = tryToParse(items);
    return (
        Array.isArray(parsedTags) &&
        parsedTags?.map(tag => (
            <span
                key={tag?.name}
                className="badge px-2 py-1">
                {tag.name.replaceAll("_", " ")}
            </span>
        ))
    );
}

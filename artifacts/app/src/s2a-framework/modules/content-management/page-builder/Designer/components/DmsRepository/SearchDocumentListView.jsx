import React, { useContext, useRef, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";

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
import { STATUS } from "./utils/constants";
import DataListFormViewer from "../../../../../data-management/form-builder/Forms/FormViewer/DataListFormViewer";
import { docActions } from "./RepositoryViewer";
import { delKeys, getTextByName } from "./utils/helper";
import { Interweave } from "interweave";

const TYPE = {
    FAVORITE: "FAVORITE",
    LIKE: "LIKE",
    DOCUMENT: "DOCUMENT",
};

const tryToParse = item => {
    try {
        return JSON.parse(item);
    } catch (error) {
        console.log(error);
        return [];
    }
};

function SearchDocumentListView({
    documentList,
    handleDocEdit,
    handleDocCheckin,
    selectedDocuments,
    handleDocumentSelection,
    handleDocMove,
    handleDocUpdateActions,
    selectedParentFolder,
    search,
    selectedDocumentType,
}) {
    const appContext = useContext(AppContext);
    const { profile } = appContext;
    const { startProcessInstance7, startProcessInstance8, actions } =
        useContext(RepositoryContext);

    const context = useContext(RepositoryContext);
    const { repository, datalistIds, dmsConfig, recycleBin } = context;
    const checkboxVisible = !localStorage.getItem("selectedDocumentType");

    const handleCancelCheckout = doc => {
        saveDocCheckoutStatus(doc);
    };

    const handleCheckout = async doc => {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: doc.id,
                    dataKey: "document",
                    serviceKey: "dms.doc.checkin.status",
                    mode: "formData",
                },
            ],
        };

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                let document = response.data.C_DATA.document;
                if (document?.length > 0) {
                    const { status, firstname, lastname } = document[0];
                    if (status == "CHECKED_OUT") {
                        const msg = `This Document is checkedout by ${firstname} ${lastname}.`;
                        let resObj = {
                            status: response.data.C_STATUS,
                            parent_id: "",
                        };

                        if (!selectedParentFolder.id) {
                            resObj.parent_id = repository.id;
                        }
                        toastEmitter(msg, true, "warning");
                        handleDocUpdateActions(resObj);
                    } else if (status == "") {
                        saveDocCheckoutStatus(
                            doc,
                            "CHECKED_OUT",
                            profile.username,
                        );
                    }
                } else {
                    saveDocCheckoutStatus(doc, "CHECKED_OUT", profile.username);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveDocCheckoutStatus = async (doc, status = "", profile = "") => {
        const formData = {
            id: doc.id,
            status,
            checked_out_by: profile,
        };

        if (status) formData["checked_out_date"] = "#TIMESTAMP#";

        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [],
        };

        const reqData = {
            id: doc.id,
            formId: doc.table,
            entity: doc.table,
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

                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const restoreDoc = async (doc, status = "") => {
        const formData = {
            // ...doc,
            id: doc.id,
            status: "",
            // checked_out_by: profile,
        };

        // if (status) formData.checked_out_date = "#TIMESTAMP#";

        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [],
        };

        const reqData = {
            id: doc.id,
            formId: "dms_document",
            entity: "dms_document",
            // formId: doc.table,
            // entity: doc.table,
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

                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFavorite = doc => {
        saveDocFavoriteStatus(doc);
    };
    const handleLike = doc => {
        saveDocLikeStatus(doc);
    };

    const saveDocFavoriteStatus = async (doc, status = "") => {
        const formData = {
            id: "new",
            obj_id: doc.id,
            obj_type: TYPE.DOCUMENT,
            reaction: TYPE.FAVORITE,
            username: profile.username,
        };

        const URL = API_URL + "?service.key=update.formData";

        const request = {
            data: [],
        };

        const reqData = {
            id: doc.id,
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
                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveFavorite = async doc => {
        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: "dms_favorite",
                    entity: "dms_favorite",
                    id: doc.favorite_id,
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
                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveDocLikeStatus = async doc => {
        const formData = {
            id: "new",
            obj_id: doc.id,
            obj_type: TYPE.DOCUMENT,
            reaction: TYPE.LIKE,
            username: profile.username,
        };

        const URL = API_URL + "?service.key=update.formData";

        const request = {
            data: [],
        };

        const reqData = {
            id: doc.id,
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
                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveLike = async doc => {
        const URL = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: "dms_like",
                    entity: "dms_like",
                    id: doc.like_id,
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
                handleDocUpdateActions(resObj);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteDocument = async document => {
        let docCopy = structuredClone(document);
        let formData = delKeys(docCopy);
        const URL = API_URL + "?service.key=update.formData";
        let request = {};
        // const documentId = document?.id;

        if (recycleBin) {
            request.data = getPurgedDeleteReq(formData);
        } else if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {
            request = getArchiveDeleteReq(formData);
        }
        // if (dmsConfig.DELETE_ACTION == DELETE_ACTION_TYPES.ARCHIVE) {
        //     request = getArchiveDeleteReq(formData);
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
                }
                const data = recycleBin
                    ? response?.data?.C_DATA?.[0]
                    : response?.data?.C_DATA?.[0]?.formData;
                if (
                    appContext?.tenantSubscription?.process_engine ===
                    "CAMUNDA_SEVEN"
                ) {
                    startProcessInstance7(
                        formData.id,
                        {
                            subject: data.title,
                            action: recycleBin
                                ? docActions.delete
                                : docActions.archive,
                        },
                        { process_key: formData?.on_delete },
                        appContext,
                    );
                } else {
                    startProcessInstance8(
                        formData.id,
                        {
                            subject: data.title,
                            action: recycleBin
                                ? docActions.delete
                                : docActions.archive,
                        },
                        { process_key: formData?.on_delete },
                        appContext,
                    );
                }

                handleDocUpdateActions(resObj);
                toastEmitter(`${formData.name} deleted.`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {documentList.map(doc => {
                const item = doc?._source;
                const highlight = doc?.highlight;

                return (
                    <DocumentView
                        key={item.id}
                        document={item}
                        highlight={highlight}
                        handleDocumentSelection={handleDocumentSelection}
                        selectedDocuments={selectedDocuments}
                        handleCancelCheckout={handleCancelCheckout}
                        handleCheckout={handleCheckout}
                        handleRestore={restoreDoc}
                        handleDocMove={handleDocMove}
                        handleDocCheckin={handleDocCheckin}
                        handleDocEdit={handleDocEdit}
                        profile={profile}
                        handleFavorite={handleFavorite}
                        handleRemoveFavorite={handleRemoveFavorite}
                        handleLike={handleLike}
                        handleRemoveLike={handleRemoveLike}
                        datalistIds={datalistIds}
                        handleDeleteDocument={handleDeleteDocument}
                        dmsConfig={dmsConfig}
                        recycleBin={recycleBin}
                        checkboxVisible={checkboxVisible}
                        actions={actions}
                    />
                );
            })}
        </div>
    );
}

const DocumentView = props => {
    const {
        document,
        handleDocumentSelection,
        selectedDocuments,
        handleCancelCheckout,
        handleCheckout,
        handleDocMove,
        handleDocCheckin,
        handleDocEdit,
        profile,
        handleFavorite,
        handleRemoveFavorite,
        handleLike,
        handleRemoveLike,
        datalistIds,
        handleDeleteDocument,
        dmsConfig,
        handleRestore,
        recycleBin,
        checkboxVisible,
        actions,
        highlight,
    } = props;

    const [documentIsHovered, setDocumentIsHovered] = useState("");
    const [favoriteIsHovered, setFavoriteIsHovered] = useState(false);
    const [likeIsHovered, setLikeIsHovered] = useState(false);
    const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);

    const commnetDLKey = datalistIds[dmsConfig.COMMENT_DL_KEY];
    const permissonsDatalist = datalistIds[dmsConfig.PERMISSONS_DL_KEY];

    const canCheckout = document?.status == "";
    const isCheckedOut = document?.status === "CHECKED_OUT";
    const isArchived = document?.status === "ARCHIVE";

    const canCheckin =
        isCheckedOut && document?.checked_out_by == profile.username;
    const hideProperties =
        isCheckedOut && document?.checked_out_by != profile.username;
    const isFavorite = document?.favorite == TYPE.FAVORITE;
    const isLiked = document?.like == TYPE.LIKE;

    const commentModalRef = useRef(null);
    const permissonsModalRef = useRef(null);
    const revisionModalRef = useRef(null);

    const openCommentModal = () => {
        commentModalRef.current.show();
    };

    const openPermissionsModal = () => {
        permissonsModalRef.current.show();
    };

    const openDeleteDialog = () => {
        setShowDeleteDialogue(true);
    };

    const showRevisionHistoryDialog = () => {
        revisionModalRef.current.show();
    };

    const onDeleteConfirm = () => {
        handleDeleteDocument(document);
        setShowDeleteDialogue(false);
    };
    const onDeleteCancel = () => {
        setShowDeleteDialogue(false);
    };

    const handleActions = () => {};

    const name = getTextByName("name", highlight, document);
    const title = getTextByName("title", highlight, document);
    const doc_type_name = getTextByName("doc_type_name", highlight, document);
    const description = getTextByName("description", highlight, document);
    const createdby = getTextByName("createdby", highlight, document);
    const modifiedby = getTextByName("modifiedby", highlight, document);
    const version = getTextByName("version", highlight, document);
    const content = getTextByName("content", highlight, document);

    return (
        <div>
            {/* <code>{JSON.stringify(document, null, 2)}</code> */}
            <li
                className="list-group-item d-flex justify-content-between align-items-start position-relative"
                onMouseEnter={() => setDocumentIsHovered(document?.id)}
                onMouseLeave={() => setDocumentIsHovered("")}>
                {/* {checkboxVisible && (
                    <div className="position-absolute top-0 start-0 m-2">
                        <input
                            type="checkbox"
                            onChange={() =>
                                handleDocumentSelection(document?.id)
                            }
                            // onClick={() => handleDocumentSelection(document?.id)}
                            checked={selectedDocuments.includes(document?.id)}
                        />
                    </div>
                )} */}
                <div className="ms-2  d-flex flex-grow-1">
                    <img
                        style={{
                            height: 72,
                            width: 72,
                        }}
                        className="p-2  img-fluid"
                        src="../theme/images/file-icon.png"
                        alt=""
                    />
                    <div className="flex-fill">
                        <div className="d-flex flex-column ">
                            {isCheckedOut && (
                                <div
                                    className="s2a-border doc-warning p-1 me-2 "
                                    role="alert">
                                    <i className="fa-solid fa-triangle-exclamation doc-locked-icon ms-2"></i>
                                    This document is checked out by
                                    <span className="">
                                        {canCheckin
                                            ? " you."
                                            : ` ${document?.firstname} ${document?.lastname}.`}
                                    </span>
                                </div>
                            )}

                            <span className="pointer">
                                <span
                                    title="Document Name and Number"
                                    className="fw-bold">
                                    {document?.doc_no &&
                                        `${document?.doc_no} - `}{" "}
                                    <Interweave
                                        className="highlight-text"
                                        content={name}
                                    />
                                </span>
                                <Interweave
                                    title="Document Title"
                                    className="highlight-text"
                                    content={`(${title})`}
                                />
                            </span>
                            <span className="">
                                Document Type{": "}
                                <Interweave
                                    className="highlight-text"
                                    content={doc_type_name}
                                />
                            </span>
                            <span className="date-created">
                                Created{": "}
                                {formatDateTimeForUserView(
                                    document?.datecreated,
                                )}{" "}
                                by{" "}
                                <Interweave
                                    className="highlight-text"
                                    content={createdby}
                                />
                            </span>
                            <span className="">
                                Modified{": "}
                                {formatDateTimeForUserView(
                                    document?.datemodified,
                                )}{" "}
                                by{" "}
                                <Interweave
                                    className="highlight-text"
                                    content={modifiedby}
                                />
                            </span>
                            {description && (
                                <Interweave
                                    className="highlight-text"
                                    content={description || "No Description"}
                                />
                            )}
                            {document?.current_revision ? (
                                <span>
                                    Version: {document?.current_revision}
                                </span>
                            ) : (
                                <span>Version: 1</span>
                            )}
                            <span>
                                Download Content:{" "}
                                {document?.content?.split(";").map(fileName => {
                                    if (!fileName) {
                                        return "";
                                    }
                                    return (
                                        <span>
                                            <br></br>
                                            <a
                                                key={`${document?.table}/${document?.id}/${fileName}`}
                                                href={`/file/service/${document?.table}/${document?.id}/${fileName}`}
                                                target="_blank">
                                                {fileName}
                                            </a>
                                        </span>
                                    );
                                })}
                            </span>
                            {document?.tags ? (
                                <span>
                                    <Tags items={document?.tags} />
                                </span>
                            ) : (
                                <span className="text-muted">No Tags</span>
                            )}
                            {document?.status !== "ARCHIVE" && (
                                <div className="d-flex gap-2">
                                    {actions?.includes("FAVOURITES") && (
                                        <>
                                            {document?.favorite_count !==
                                            "0" ? (
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
                                                                    document,
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
                                                        handleFavorite(document)
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
                                            {document?.like_count > 0 &&
                                            document?.like_id ? (
                                                // {document?.like_count > 0 ? (
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
                                                                    document,
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
                                                    onClick={() => {
                                                        handleLike(document);
                                                    }}>
                                                    <i className="fa-solid fa-thumbs-up text-muted"></i>
                                                    Like
                                                </span>
                                            )}
                                            {document?.like_count ? (
                                                <span>
                                                    {document?.like_count}
                                                </span>
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
                {!hideProperties && documentIsHovered == document?.id && (
                    <div className="d-flex flex-column border-s">
                        {!isCheckedOut && document?.status !== "ARCHIVE" && (
                            <div
                                onClick={() => {
                                    handleDocEdit(document);
                                }}
                                className="pointer">
                                <i className="fa-solid fa-pen-to-square"></i>
                                Edit Properties
                            </div>
                        )}
                        {canCheckin && document?.status !== "ARCHIVE" && (
                            <>
                                <div
                                    onClick={() => handleDocCheckin(document)}
                                    className="pointer">
                                    <i className="fa-solid fa-pen-clip"></i>
                                    Checkin
                                </div>
                                <div
                                    onClick={() =>
                                        handleCancelCheckout(document)
                                    }
                                    className="pointer">
                                    <i className="fa-solid fa-ban"></i>
                                    Cancel Checkin
                                </div>
                            </>
                        )}
                        {/* <div
                            onClick={() => {}}
                            className="not-allowed text-muted">
                            <i className="fa-regular fa-copy"></i>
                            Copy to...
                        </div> */}

                        {canCheckout && (
                            <div
                                onClick={() => handleCheckout(document)}
                                className="pointer">
                                <i className="fa-solid fa-pen-clip"></i>
                                Checkout
                            </div>
                        )}
                        {document?.status !== "ARCHIVE" &&
                            document?.status !== "CHECKED_OUT" && (
                                <div
                                    onClick={() => handleDocMove(document)}
                                    className="pointer">
                                    <i className="fa-solid fa-copy"></i>
                                    Move to...
                                </div>
                            )}
                        {/* <div
                            onClick={openPermissionsModal}
                            className="pointer">
                            <i className="fa-solid fa-key"></i>
                            Manage Permissons
                        </div> */}

                        <div
                            onClick={showRevisionHistoryDialog}
                            className="pointer">
                            <i className="fa-solid fa-file-waveform"></i>
                            Revision History
                        </div>
                        {document?.status === "ARCHIVE" ? (
                            <>
                                <div
                                    onClick={() => handleRestore(document)}
                                    className="pointer">
                                    <i className="fa fa-trash-restore"></i>
                                    Restore Document
                                </div>
                                {recycleBin && (
                                    <div
                                        onClick={openDeleteDialog}
                                        className="pointer">
                                        <i className="fa-solid fa-box-archive"></i>
                                        Delete Document
                                    </div>
                                )}
                            </>
                        ) : (
                            document?.status !== "CHECKED_OUT" && (
                                <div
                                    onClick={openDeleteDialog}
                                    className="pointer">
                                    <i className="fa-solid fa-box-archive"></i>
                                    Archive Document
                                </div>
                            )
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
                        id: commnetDLKey.id,
                        form_id: commnetDLKey.form_id,
                    }}
                    mode={modeType.render}
                    modeType={modeType}
                    fkColumn={"obj_id"}
                    fkValue={document?.id}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={permissonsModalRef}
                centered={true}
                header={""}>
                <DataListViewer
                    ids={{
                        id: permissonsDatalist.id,
                        form_id: permissonsDatalist.form_id,
                    }}
                    mode={modeType.render}
                    modeType={modeType}
                    fkColumn={"obj_id"}
                    fkValue={document?.id}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={revisionModalRef}
                centered={true}
                header={"Revision History"}>
                <DataListFormViewer
                    formKey="doc_revision_history"
                    businessKey={document?.id}
                    handleActions={handleActions}
                    mode={modeType.readonly}
                    handleClose={() => {
                        revisionModalRef.current.close();
                    }}
                    // formVars={{
                    //     repository_id: repository.id,
                    //     parent_id: selectedParentFolder.id
                    //         ? selectedParentFolder.id
                    //         : repository.id,
                    //     doc_type: selectedFormKey.id,
                    // }}
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
                            <b> {document?.name} </b>?
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

function getPurgedDeleteReq(doc) {
    const documentId = doc?.id;
    return [
        {
            formId: "dms_document",
            entity: "dms_document",
            id: documentId,
            action: "delete",
            on_delete: doc?.on_delete,
            title: doc?.title,
        },
        {
            formId: "dms_like",
            entity: "dms_like",
            id: documentId,
            action: "fk_delete",
            fk_id: documentId,
            fk_name: "obj_id",
        },
        {
            formId: "dms_favorite",
            entity: "dms_favorite",
            id: documentId,
            action: "fk_delete",
            fk_id: documentId,
            fk_name: "obj_id",
        },
        {
            formId: "dms_comment",
            entity: "dms_comment",
            id: documentId,
            action: "fk_delete",
            fk_id: documentId,
            fk_name: "obj_id",
        },
    ];
}

function getArchiveDeleteReq(document) {
    const formData = {
        // ...document,
        id: document?.id,
        title: document?.title,
        status: STATUS.ARCHIVE,
    };

    const request = {
        data: [],
    };

    const reqData = {
        id: document?.id,
        formId: "dms_document",
        entity: "dms_document",
        action: "update",
        formData,
    };

    request.data.push(reqData);

    return request;
}

export default SearchDocumentListView;

function Tags({ items }) {
    const parsedItems = tryToParse(items);
    return (
        Array.isArray(parsedItems) &&
        parsedItems?.map(tag => (
            <span
                key={tag?.name}
                className="badge px-2 py-1">
                {tag.name?.replaceAll("_", " ")}
            </span>
        ))
    );
}

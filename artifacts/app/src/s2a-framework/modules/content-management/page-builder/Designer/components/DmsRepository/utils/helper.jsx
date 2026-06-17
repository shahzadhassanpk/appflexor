import axios from "axios";
import { API_URL, BPM_API_URL } from "../../../../../../../Config";
import { SORTING, STATUS } from "./constants";
import { docActions } from "../RepositoryViewer";

export const delKeys = item => {
    const deleteKeys = [
        "like_id",
        "favorite_id",
        "like_count",
        "favorite_count",
    ];
    for (let key of deleteKeys) {
        if (key in item) delete item[key];
    }

    return item;
};

export function formatDataToTree(data, initialState, repositoryId) {
    const idToNodeMap = {};
    const tree = [];

    data.forEach(item => {
        const isSelected = initialState.isSelected == item.id ? true : false;
        const isOpen = initialState.isOpen.includes(item.id) ? true : false;

        idToNodeMap[item.id] = {
            ...item,
            isOpen,
            isSelected,
            nodes: [],
        };
    });

    data.forEach(item => {
        const node = idToNodeMap[item.id];
        if (item.parent_id == repositoryId) {
            tree.push(node);
        } else {
            idToNodeMap[item.parent_id].nodes.push(node);
        }
    });

    return tree;
}
export function formatDataToMap(data) {
    const idToNodeMap = {};

    data.forEach(item => {
        idToNodeMap[item.id] = { ...item };
    });

    return idToNodeMap;
}

export function updateTreeNode(id, currentTree, node) {
    return currentTree.map(item => {
        if (item.id === id) {
            return { ...item, ...node };
        }
        if (item.nodes && item.nodes.length > 0) {
            return {
                ...item,
                nodes: updateTreeNode(id, item.nodes, node),
            };
        }
        return item;
    });
}

export function setAllSelectedFalse(currentTree) {
    return currentTree.map(item => {
        const updatedItem = { ...item, isSelected: false };

        if (updatedItem.nodes && updatedItem.nodes.length > 0) {
            updatedItem.nodes = setAllSelectedFalse(updatedItem.nodes);
        }

        return updatedItem;
    });
}

export function setSelectedFalseExcept(id, currentTree) {
    return currentTree.map(item => {
        const updatedItem = {
            ...item,
            isOpen: item.id === id ? true : item.isOpen,
            isSelected: item.id === id ? true : false,
        };

        if (updatedItem.nodes && updatedItem.nodes.length > 0) {
            updatedItem.nodes = setSelectedFalseExcept(id, updatedItem.nodes);
        }

        return updatedItem;
    });
}

export function getPathToNode(id, tree) {
    for (let node of tree) {
        if (node.id === id) {
            return [{ id: node.id, name: node.name }];
        }

        if (node.nodes && node.nodes.length > 0) {
            const path = getPathToNode(id, node.nodes);
            if (path.length > 0) {
                return [{ id: node.id, name: node.name }, ...path];
            }
        }
    }

    // If not found in the current branch, return an empty array
    return [];
}

export const sortListByFilterType = (
    options = [],
    order = SORTING.ASC,
    filter = "NAME",
) => {
    let result = [];

    switch (filter) {
        case "NAME":
            result = options.sort((a, b) => {
                if (order === SORTING.ASC) {
                    return a.name.localeCompare(b.name);
                } else if (order === SORTING.DESC) {
                    return b.name.localeCompare(a.name);
                }
                return 0;
            });
            break;
    }

    return result;
};

export const getSelectedActionState = (
    action,
    selectedFolder,
    selectedFolders,
    selectedDocuments,
    folderListMap,
    documentListMap,
    repository,
) => {
    let updatedFoldersArr = [];
    let updatedDocumentsArr = [];

    const selectedFolderIds = [];
    const selectedFolderIdsExpectCurrent = [];

    const selectedDocumentIds = [];
    const selectedDocumentIdsExpectCurrent = [];

    if (!selectedFolder.id) {
        selectedFolders.map(id => {
            const folder = folderListMap[id];
            if (folder.parent_id == repository.id) {
                selectedFolderIds.push(id);
            } else {
                selectedFolderIdsExpectCurrent.push(id);
            }
        });

        selectedDocuments.map(id => {
            const doc = documentListMap[id];
            if (doc.parent_id == repository.id) {
                selectedDocumentIds.push(id);
            } else {
                selectedDocumentIdsExpectCurrent.push(id);
            }
        });
    } else {
        selectedFolders.map(id => {
            const folder = folderListMap[id];
            if (folder.parent_id == selectedFolder.id) {
                selectedFolderIds.push(id);
            } else {
                selectedFolderIdsExpectCurrent.push(id);
            }
        });
        selectedDocuments.map(id => {
            const doc = documentListMap[id];
            if (doc?.parent_id == selectedFolder?.id) {
                selectedDocumentIds.push(id);
            } else {
                selectedDocumentIdsExpectCurrent.push(id);
            }
        });
    }
    const allCurrentFolderIds = [];
    const allCurrentDocumentIds = [];
    if (!selectedFolder.id) {
        for (const key in folderListMap) {
            if (folderListMap.hasOwnProperty(key)) {
                let thisFolder = folderListMap[key];
                if (thisFolder.parent_id == repository.id) {
                    allCurrentFolderIds.push(thisFolder.id);
                }
            }
        }
        for (const key in documentListMap) {
            if (documentListMap.hasOwnProperty(key)) {
                let doc = documentListMap[key];
                if (doc.parent_id == repository.id) {
                    allCurrentDocumentIds.push(doc.id);
                }
            }
        }
    } else {
        for (const key in folderListMap) {
            if (folderListMap.hasOwnProperty(key)) {
                let folder = folderListMap[key];
                if (folder.parent_id == selectedFolder.id) {
                    allCurrentFolderIds.push(folder.id);
                }
            }
        }
        for (const key in documentListMap) {
            if (documentListMap.hasOwnProperty(key)) {
                let doc = documentListMap[key];
                if (doc.parent_id == selectedFolder.id) {
                    allCurrentDocumentIds.push(doc.id);
                }
            }
        }
    }

    switch (action) {
        case "FOLDERS":
            updatedFoldersArr = [
                ...selectedFolderIdsExpectCurrent,
                ...allCurrentFolderIds,
            ];
            updatedDocumentsArr = [...selectedDocumentIdsExpectCurrent];
            break;
        case "DOCUMENTS":
            updatedFoldersArr = [...selectedFolderIdsExpectCurrent];
            updatedDocumentsArr = [
                ...selectedDocumentIdsExpectCurrent,
                ...allCurrentDocumentIds,
            ];
            break;
        case "ALL":
            updatedFoldersArr = [
                ...selectedFolderIdsExpectCurrent,
                ...allCurrentFolderIds,
            ];
            updatedDocumentsArr = [
                ...selectedDocumentIdsExpectCurrent,
                ...allCurrentDocumentIds,
            ];

            break;
        case "INVERT":
            const invertedFolderIds = allCurrentFolderIds.filter(
                id => !selectedFolderIds.includes(id),
            );

            const invertedDocumentIds = allCurrentDocumentIds.filter(
                id => !selectedDocumentIds.includes(id),
            );

            updatedFoldersArr = [
                ...selectedFolderIdsExpectCurrent,
                ...invertedFolderIds,
            ];
            updatedDocumentsArr = [
                ...selectedDocumentIdsExpectCurrent,
                ...invertedDocumentIds,
            ];
            break;
        case "NONE":
            updatedFoldersArr = [...selectedFolderIdsExpectCurrent];
            updatedDocumentsArr = [...selectedDocumentIdsExpectCurrent];
            break;
    }
    return [updatedFoldersArr, updatedDocumentsArr];
};

export const getMultiFormDataFromFolders = (
    selectedFolders,
    selectedDocuments,
    destinationFolder,
    folderListMap,
    documentListMap,
    repository,
) => {
    const finalRequest = [];

    selectedFolders.map(folderId => {
        const folder = folderListMap[folderId];
        const folClone = structuredClone(folder);
        const updatedFolder = delKeys(folClone);
        const reqData = {
            id: updatedFolder.id,
            formId: updatedFolder.table,
            entity: updatedFolder.table,
            action: "update",
        };

        if (!destinationFolder.id) {
            reqData.formData = {
                id: updatedFolder.id,
                parent_id: repository.id,
            };
        } else {
            reqData.formData = {
                id: updatedFolder.id,
                parent_id: destinationFolder.id,
            };
        }
        finalRequest.push(reqData);
    });

    selectedDocuments.map(docId => {
        const doc = documentListMap[docId];
        const docClone = structuredClone(doc);
        const updatedDoc = delKeys(docClone);

        const reqData = {
            id: updatedDoc.id,
            formId: updatedDoc.table,
            entity: updatedDoc.table,
            action: "update",
        };

        if (!destinationFolder.id) {
            reqData.formData = {
                id: updatedDoc.id,
                parent_id: repository.id,
            };
        } else {
            reqData.formData = {
                id: updatedDoc.id,
                parent_id: destinationFolder.id,
            };
        }
        finalRequest.push(reqData);
    });

    return finalRequest;
};

// When a folder is moved to root repository or from root repository
//  to any another parent folder but not child of itself
export const getFormDataForFolder = (
    folderToMove,
    destinationFolder,
    repository,
) => {
    let action = "";
    let formData = {};

    if (!destinationFolder.id) {
        action = "TO_ROOT";
    } else if (
        destinationFolder.id &&
        destinationFolder.id == folderToMove.id
    ) {
        action = "SAME_PARENT";
    } else {
        action = "TO_PARENT";
    }
    switch (action) {
        case "TO_PARENT":
            formData = {
                id: folderToMove.id,
                parent_id: destinationFolder.id,
            };
            break;
        case "TO_ROOT":
            formData = {
                id: folderToMove.id,
                parent_id: repository.id,
            };
            break;
        case "SAME_PARENT":
            formData = {
                id: folderToMove.id,
            };
            break;
    }
    return formData;
};

export const checkIfMoveIsValid = (
    folderToMove,
    destinationFolder,
    explorerTree,
) => {
    const childNodeIds = getChildNodeIds(explorerTree, folderToMove.id);

    if (childNodeIds.includes(destinationFolder.id)) {
        return false;
    }
    return true;
};

export const checkIfMultiMoveIsValid = (
    foldersToMove = [],
    destinationFolder,
    explorerTree,
) => {
    if (foldersToMove.includes(destinationFolder.id)) {
        return false;
    }

    const childNodeIds = [];

    foldersToMove.map(folderId => {
        const res = getChildNodeIds(explorerTree, folderId);
        childNodeIds.push(...res);
    });

    if (childNodeIds.includes(destinationFolder.id)) {
        return false;
    }

    return true;
};

function getChildNodeIds(tree, id) {
    function findNodeAndCollectChildren(node) {
        if (node.id === id) {
            const childIds = [];
            function collectChildIds(nodes) {
                for (const child of nodes) {
                    childIds.push(child.id);
                    collectChildIds(child.nodes);
                }
            }
            collectChildIds(node.nodes);
            return childIds;
        }

        for (const child of node.nodes) {
            const result = findNodeAndCollectChildren(child);
            if (result) return result;
        }

        return null;
    }

    for (const rootNode of tree) {
        const result = findNodeAndCollectChildren(rootNode);
        if (result) return result;
    }

    return [];
}

export function getImmediateChildNodeIds(tree, id) {
    function findNode(nodes) {
        for (const node of nodes) {
            if (node.id === id) {
                return node.nodes.map(child => child.id);
                s;
            }
            const result = findNode(node.nodes);
            if (result) return result;
        }
        return null;
    }

    return findNode(tree) || [];
}

// When a Document is moved to root repository or
//  from root repository to any other parent but not child of itself
export const getFormDataForDocuemnt = (
    documentToMove,
    destinationFolder,
    repository,
) => {
    let action = "";
    let formData = {};
    if (!destinationFolder.id) {
        if (documentToMove.parent_id == repository.id) action = "TO_ROOT";
        if (documentToMove.parent_id != repository.id) action = "TO_ROOT";
    } else {
        action = "TO_PARENT";
    }
    switch (action) {
        case "TO_PARENT":
            formData = {
                ...documentToMove,
                parent_id: destinationFolder.id,
            };
            break;
        case "TO_ROOT":
            formData = {
                ...documentToMove,
                parent_id: repository.id,
            };
            break;
    }
    return formData;
};

export function hasProperties(obj) {
    if (obj === undefined || obj === null) {
        return false;
    }
    if (Object.keys(obj).length > 0) {
        return true;
    }
    for (let key in obj) {
        if (obj.hasOwnProperty(key) || key in obj) {
            return true;
        }
    }
    return false;
}

export const getDeleteFolderPurgeRequest = (
    folderToDelete,
    explorerTree,
    allDocumentsListMap,
) => {
    const folderId = folderToDelete.id;
    const childNodeIds = getChildNodeIds(explorerTree, folderId);
    const foldersToDeleteIds = [...childNodeIds, folderId];
    const documentsToDeleteIds = [];

    for (const key in allDocumentsListMap) {
        if (allDocumentsListMap.hasOwnProperty(key)) {
            const parentId = allDocumentsListMap[key].parent_id;
            if (foldersToDeleteIds.includes(parentId)) {
                documentsToDeleteIds.push(key);
            }
        }
    }

    let data = [];

    foldersToDeleteIds.map(folderId => {
        let folders = [
            {
                formId: "dms_folder",
                entity: "dms_folder",
                id: folderId,
                action: "delete",
            },
            {
                formId: "dms_like",
                entity: "dms_like",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
            {
                formId: "dms_favorite",
                entity: "dms_favorite",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
            {
                formId: "dms_comment",
                entity: "dms_comment",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
        ];

        data = [...data, ...folders];
    });

    documentsToDeleteIds.map(documentid => {
        let documents = [
            {
                formId: "dms_document",
                entity: "dms_document",
                id: documentid,
                action: "delete",
            },
            {
                formId: "dms_like",
                entity: "dms_like",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
            {
                formId: "dms_favorite",
                entity: "dms_favorite",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
            {
                formId: "dms_comment",
                entity: "dms_comment",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
        ];

        data = [...data, ...documents];
    });

    return data;
};

export const getDeleteSelectionPurgeRequest = (
    allSelectedFolders,
    allSelectedDocuments,
    selectedParentFolder,
    repository,
    explorerTree,
    allFoldersListMap,
    allDocumentsListMap,
) => {
    const selectedCurrentFolders = [];
    const selectedCurrentDocuments = [];

    allSelectedFolders.map(folderId => {
        const folder = allFoldersListMap[folderId];
        if (folder) {
            if (!selectedParentFolder.id) {
                if (folder.parent_id == repository.id) {
                    selectedCurrentFolders.push(folder.id);
                }
            } else {
                if (folder.parent_id == selectedParentFolder.id) {
                    selectedCurrentFolders.push(folder.id);
                }
            }
        } else console.log("Folder not found.");
    });

    allSelectedDocuments.map(docId => {
        const document = allDocumentsListMap[docId];
        if (document) {
            if (!selectedParentFolder.id) {
                if (document.parent_id == repository.id) {
                    selectedCurrentDocuments.push(document.id);
                }
            } else {
                if (document.parent_id == selectedParentFolder.id) {
                    selectedCurrentDocuments.push(document.id);
                }
            }
        } else console.log("Document not found.");
    });
    let foldersToDeleteIds = [];
    let documentsToDeleteIds = [...selectedCurrentDocuments];

    selectedCurrentFolders.map(folderId => {
        const childNodeIds = getChildNodeIds(explorerTree, folderId);
        const folderIds = [...childNodeIds, folderId];

        for (const key in allDocumentsListMap) {
            if (allDocumentsListMap.hasOwnProperty(key)) {
                const parentId = allDocumentsListMap[key].parent_id;

                if (folderIds.includes(parentId)) {
                    documentsToDeleteIds.push(key);
                }
            }
        }

        foldersToDeleteIds = [...foldersToDeleteIds, ...folderIds];
    });

    let data = [];

    foldersToDeleteIds.map(folderId => {
        let folders = [
            {
                formId: "dms_folder",
                entity: "dms_folder",
                id: folderId,
                action: "delete",
            },
            {
                formId: "dms_like",
                entity: "dms_like",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
            {
                formId: "dms_favorite",
                entity: "dms_favorite",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
            {
                formId: "dms_comment",
                entity: "dms_comment",
                id: folderId,
                action: "fk_delete",
                fk_id: folderId,
                fk_name: "obj_id",
            },
        ];

        data = [...data, ...folders];
    });

    documentsToDeleteIds.map(documentid => {
        let documents = [
            {
                formId: "dms_document",
                entity: "dms_document",
                id: documentid,
                action: "delete",
            },
            {
                formId: "dms_like",
                entity: "dms_like",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
            {
                formId: "dms_favorite",
                entity: "dms_favorite",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
            {
                formId: "dms_comment",
                entity: "dms_comment",
                id: documentid,
                action: "fk_delete",
                fk_id: documentid,
                fk_name: "obj_id",
            },
        ];

        data = [...data, ...documents];
    });
    return data;
};

export const getDeleteSelectionArchiveRequest = (
    allSelectedFolders,
    allSelectedDocuments,
    selectedParentFolder,
    repository,
    explorerTree,
    allFoldersListMap,
    allDocumentsListMap,
) => {
    const selectedCurrentFolders = [];
    const selectedCurrentDocuments = [];

    allSelectedFolders.map(folderId => {
        const folder = allFoldersListMap[folderId];
        if (folder) {
            if (!selectedParentFolder.id) {
                if (folder.parent_id == repository.id) {
                    selectedCurrentFolders.push(folder.id);
                }
            } else {
                if (folder.parent_id == selectedParentFolder.id) {
                    selectedCurrentFolders.push(folder.id);
                }
            }
        } else console.log("Folder not found.");
    });

    allSelectedDocuments.map(docId => {
        const document = allDocumentsListMap[docId];
        if (document) {
            if (!selectedParentFolder.id) {
                if (document.parent_id == repository.id) {
                    selectedCurrentDocuments.push(document.id);
                }
            } else {
                if (document.parent_id == selectedParentFolder.id) {
                    selectedCurrentDocuments.push(document.id);
                }
            }
        } else console.log("Document not found.");
    });

    let foldersToDeleteIds = [];
    let documentsToDeleteIds = [...selectedCurrentDocuments];

    selectedCurrentFolders.map(folderId => {
        const childNodeIds = getChildNodeIds(explorerTree, folderId);
        const folderIds = [...childNodeIds, folderId];

        for (const key in allDocumentsListMap) {
            if (allDocumentsListMap.hasOwnProperty(key)) {
                const parentId = allDocumentsListMap[key].parent_id;

                if (folderIds.includes(parentId)) {
                    documentsToDeleteIds.push(key);
                }
            }
        }

        foldersToDeleteIds = [...foldersToDeleteIds, ...folderIds];
    });

    let data = [];
    foldersToDeleteIds.map(folderId => {
        const folder = allFoldersListMap[folderId];

        const formData = {
            ...folder,
            status: STATUS.ARCHIVE,
        };

        const reqData = {
            id: folder.id,
            formId: "dms_folder",
            entity: "dms_folder",
            action: "update",
            formData,
        };

        data.push(reqData);
    });

    documentsToDeleteIds.map(documentid => {
        const document = allDocumentsListMap[documentid];

        const formData = {
            ...document,
            status: STATUS.ARCHIVE,
        };

        const reqData = {
            id: document.id,
            formId: "dms_document",
            entity: "dms_document",
            action: "update",
            formData,
        };

        data.push(reqData);
    });
    return data;
};

export const saveDocCheckoutStatus = async ({
    doc,
    status = "",
    profile = "",
    selectedFormKey,
    fetchData,
    selectedParentFolder,
    repository,
}) => {
    const formData = {
        id: doc.id,
        status,
        checked_out_by: profile,
        folder_type: selectedFormKey?.type,
    };

    if (status) formData.checked_out_date = "#TIMESTAMP#";

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

            fetchData(resObj);
        }
    } catch (error) {
        console.error(error);
    }
};

export function copyAddNewDocFolder(resObj, callback) {
    var url = API_URL + "?service.key=update.formData";
    var request = {};
    request.data = [];
    const entityForm = {
        formId: "dms_doc_revision", // "formId"
        entity: "dms_doc_revision", // Db - "table name"
        action: "update",
        id: "new",
        formData: {
            id: "new",
            revision: "1",
            content: resObj?.content || "",
            doc_id: resObj?.id || "",
        },
        copyFileData: [
            {
                sourceId: resObj?.id || "",
                sourceEntity: "dms_document",
                targetEntity: "dms_doc_revision",
                fileName: resObj?.content || "",
            },
        ],
    };
    request.data.push(entityForm);
    try {
        axios.post(url, request).then(function (response) {
            if (response.status === 200) {
                callback(response);
                // clearFields();
                // getData();
            }
        });
    } catch (e) {
        console.log("Save error:" + e);
    }
}

export function copyAddNewDocRevision(resObj, callback) {
    var url = API_URL + "?service.key=update.formData";
    var request = {};
    request.data = [];
    const entityForm = {
        formId: "dms_document", // "formId"
        entity: "dms_document", // Db - "table name"
        action: "update",
        id: resObj.doc_id,
        formData: {
            id: resObj.doc_id,
            content: resObj?.content || "",
        },
        copyFileData: [
            {
                sourceId: resObj?.id || "",
                sourceEntity: "dms_doc_revision",
                targetEntity: "dms_document",
                fileName: resObj?.content || "",
            },
        ],
    };
    request.data.push(entityForm);
    try {
        axios.post(url, request).then(function (response) {
            if (response.status === 200) {
                callback(response);
                // clearFields();
                // getData();
            }
        });
    } catch (e) {
        console.log("Save error:" + e);
    }
}

export function handleCheckinDocAction({
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
}) {
    const {
        profile,
        tenantSubscription: { process_engine, tenant_id },
    } = appContext;

    if (actionType == "COMPLETE") {
        if (process_engine === "CAMUNDA_SEVEN") {
            startProcessInstance7(
                resObj.doc_id,
                // resObj.id,
                {
                    // subject: selectedDoc.title,
                    // action: docActions.checkin,
                    tenantId: tenant_id,
                    action: docActions.checkin,
                    username: profile?.username,
                },
                { process_key: selectedDoc?.on_checkin },
                appContext,
            );
        } else {
            startProcessInstance8(
                resObj.doc_id,
                // resObj.id,
                {
                    subject: selectedDoc?.title,
                    action: docActions.checkin,
                },
                { process_key: selectedDoc?.on_checkin },
                appContext,
            );
        }

        documentCheckinModal.current.close();
        const docId = resObj.doc_id;
        // const docId = resObj.id;
        let document = documentListMap[docId];

        if (document) {
            document = { ...document, ...{ content: resObj.content } };
            const updateTheContent = response => {
                console.log(response);
                saveDocCheckoutStatus({
                    doc: document,
                    selectedFormKey,
                    fetchData,
                    selectedParentFolder,
                    repository,
                });
            };
            copyAddNewDocRevision(resObj, updateTheContent);
        } else {
            console.error("Document not found,");
        }
    }
}

function camunda7Variableformat(vars) {
    const updatedVars = {};
    for (let key in vars) {
        updatedVars[key] = {
            value: vars[key] || "",
            type: typeof vars[key] || "",
        };
    }
    return updatedVars;
}

export function startProcessInstance7(
    businessKey,
    taskVariables,
    formDetails,
    appContext,
) {
    const {
        tenantSubscription: { tenant_id: tenantId },
    } = appContext;
    let path = "";

    if (tenantId === "") {
        path = `/process-definition/key/${formDetails.process_key}/start`;
    } else {
        path = `/process-definition/key/${formDetails.process_key}/tenant-id/${tenantId}/start`;
    }
    const dataRequest = {
        path,
        method: "POST",
        data: {
            // businessKey: "test",
            businessKey: businessKey,
            variables: camunda7Variableformat(taskVariables),
        },
    };
    return new Promise((resolve, reject) => {
        axios
            .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    resolve("SUCCESS");
                } else {
                    resolve("FAILED");
                }
            })
            .catch(err => {
                reject(err);
                console.error(err);
            });
    });
}

export function startProcessInstance8(
    businessKey,
    taskVariables,
    formDetails,
    appContext,
) {
    let variables = { ...taskVariables };
    // let variables = taskVariables ? { ...taskVariables } : camundaVars;
    variables.requester = appContext.profile.username;
    const dataRequest = {
        businessKey: businessKey,
        processId: formDetails.process_key,
        subscription: appContext.tenantSubscription.id,
        processVar: {
            ...variables,
        },
    };
    return new Promise((resolve, reject) => {
        axios
            .post(BPM_API_URL + "?service.key=start.process", dataRequest)
            .then(response => {
                resolve(response);
                // if (response.status === 200) {
                //     resolve("SUCCESS");
                // } else {
                //     resolve("FAILED");
                // }
            })
            .catch(err => {
                reject(err);
                console.error(err);
            });
    });
}

export const getTextByName = (name = "", highlight = {}, item = {}) => {
    let text = "";

    if (highlight[name]?.[0]) {
        text = highlight?.[name]?.[0];
    } else if (item?.[name]) {
        text = item?.[name];
    }

    return text;
};

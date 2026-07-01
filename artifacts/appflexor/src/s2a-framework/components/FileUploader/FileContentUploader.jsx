import axios from "axios";
import React, {
    useContext,
    useDebugValue,
    useEffect,
    useRef,
    useState,
} from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";
import { ErrorBoundary } from "../../utils/ErrorBoundry";

const STATUS = {
    uploaded: "UPLOADED",
    deleted: "DELETED",
    added: "ADDED",
};

// datasource => If the component is used to update data from master DB

function FileContentUploader(props) {
    const {
        item,
        orgItem,
        setItem,
        encodedFilesCollection,
        setEncodedFilesCollection,
        filesToDelete,
        setFilesToDelete,
        table,
        dbColumn,
        multiple = true,
    } = props;

    if (isEmpty(item) || !table || !dbColumn) {
        return null;
    }

    const field = item[dbColumn];

    const [fileCollection, setFileCollection] = useState([]);
    const encodeCompleted = useRef(false);

    useEffect(() => {
        if (
            dbColumn === "" ||
            isEmpty(item) ||
            isEmpty(orgItem) ||
            field === undefined
        ) {
            return;
        }

        try {
            let fileNameStatus = item[dbColumn];
            let fileNameStatusOrg = orgItem[dbColumn];

            if (typeof fileNameStatus === "string") {
                let namesArr = fileNameStatus.split(";");
                let namesArrOrg =
                    typeof fileNameStatusOrg === "string"
                        ? fileNameStatusOrg.split(";")
                        : "";

                let nameWithStatus = namesArr.map(name => {
                    let status = "";
                    if (namesArrOrg.includes(name)) {
                        status = STATUS.uploaded;
                    } else {
                        status = STATUS.added;
                    }

                    return { name, status };
                });

                setFileCollection(nameWithStatus);
            } else if (typeof fileNameStatus === "object") {
                if (fileNameStatus && fileNameStatus.length > 0) {
                    setFileCollection(fileNameStatus);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }, [field, orgItem, dbColumn]);

    useEffect(() => {
        if (encodeCompleted.current) {
            if (fileCollection.length > 0) {
                setItem(prev => ({
                    ...prev,
                    [dbColumn]: fileCollection,
                }));
            } else {
                setItem(prev => ({
                    ...prev,
                    [dbColumn]: [],
                }));
            }

            encodeCompleted.current = false;
        }
    }, [encodeCompleted, fileCollection, encodedFilesCollection]);

    const readFileAsBase64 = inputFile => {
        const temporaryFileReader = new FileReader();
        return new Promise((resolve, reject) => {
            temporaryFileReader.onerror = () => {
                temporaryFileReader.abort();
                reject(new DOMException("Problem parsing input file."));
            };

            temporaryFileReader.onload = () => {
                let content = temporaryFileReader.result;
                let newArr = content.split("base64,");
                let encodedData = "";
                if (newArr[1]) {
                    encodedData = newArr[1];
                }

                resolve(encodedData);
            };
            temporaryFileReader.readAsDataURL(inputFile);
        });
    };

    async function handleChange(event) {
        if (!event.target || !event.target.files) {
            return;
        }

        let fileNames = [];
        let fileEncodeCounter = 0;
        const _filesSelected = event.target.files;

        const filesSelected = [];

        for (let i = 0; i < _filesSelected.length; i++) {
            filesSelected.push(_filesSelected[i]);
        }

        for (let i = 0; i < filesSelected.length; i++) {
            let fileName = filesSelected[i].name;
            if (!checkIfFileAlreadyExists(fileName)) {
                try {
                    const encodedData = await readFileAsBase64(
                        filesSelected[i],
                    );
                    fileNames.push({ name: fileName, status: STATUS.added });
                    fileEncodeCounter++;
                    if (multiple) {
                        setEncodedFilesCollection(prev => {
                            return [
                                ...prev,
                                {
                                    fileName: fileName,
                                    fieldName: dbColumn,
                                    content: encodedData,
                                    status: STATUS.added,
                                },
                            ];
                        });
                        setFileCollection(prev => [
                            ...prev,
                            { name: fileName, status: STATUS.added },
                        ]);
                    } else {
                        setEncodedFilesCollection([
                            {
                                fileName: fileName,
                                fieldName: dbColumn,
                                content: encodedData,
                                status: STATUS.added,
                            },
                        ]);
                        setFileCollection([
                            { name: fileName, status: STATUS.added },
                        ]);
                    }

                    if (filesSelected.length === fileEncodeCounter) {
                        encodeCompleted.current = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    function removeFile(fileToRemove) {
        let removedFileArr = fileCollection.map(currenFile => {
            if (currenFile.name === fileToRemove) {
                return { ...currenFile, status: STATUS.deleted };
            } else {
                return currenFile;
            }
        });

        setFileCollection(removedFileArr);

        let newState = { ...item };

        if (removedFileArr.length > 0) {
            let arr = removedFileArr.map(file => {
                if (file.status !== STATUS.deleted) {
                    return file.name;
                } else {
                    return "";
                }
            });

            let arr2 = arr.filter(Boolean);

            newState[dbColumn] = arr2.length > 0 ? arr2.join(";") : "";
            setItem(newState);
        } else {
            newState[dbColumn] = "";
            setItem(newState);
        }

        let arr2 = [];

        if (encodedFilesCollection.length > 0) {
            removedFileArr.map(file => {
                let newArr2 = encodedFilesCollection.filter(currenFile => {
                    if (file === currenFile.fileName) {
                        return true;
                    }
                    return false;
                });

                arr2 = newArr2;
            });
            setEncodedFilesCollection(arr2);
        }

        if (item.id !== "new") {
            deleteFileFromServer(fileToRemove, newState);
        } else {
            deleteFileFromMemory(fileToRemove, newState);
        }

        encodeCompleted.current = true;
    }

    function checkIfFileAlreadyExists(fileName) {
        let doExists = false;

        fileCollection.length > 0 &&
            fileCollection.map(file => {
                if (file.name === fileName) doExists = true;
            });

        return doExists;
    }

    function deleteFileFromServer(fileToRemove) {
        let fileNameStatusOrg = orgItem[dbColumn];

        if (typeof fileNameStatusOrg === "string") {
            if (fileNameStatusOrg.includes(fileToRemove)) {
                let _filesToDelete = [...filesToDelete];

                _filesToDelete.push({
                    fileName: fileToRemove,
                    fieldName: dbColumn,
                });

                setFilesToDelete(_filesToDelete);
            }
        } else {
            let _filesToDelete = [...filesToDelete];

            _filesToDelete.push({
                fileName: fileToRemove,
                fieldName: dbColumn,
            });

            setFilesToDelete(_filesToDelete);
        }
    }
    function deleteFileFromMemory(fileToRemove) {
        let fileNameStatusOrg = orgItem[dbColumn];

        if (typeof fileNameStatusOrg === "string") {
            if (fileNameStatusOrg.includes(fileToRemove)) {
                let _filesToDelete = [...filesToDelete];

                _filesToDelete.push({
                    fileName: fileToRemove,
                    fieldName: dbColumn,
                });

                setFilesToDelete(_filesToDelete);
            }
        } else {
            let _filesToDelete = [...filesToDelete];

            _filesToDelete.push({
                fileName: fileToRemove,
                fieldName: dbColumn,
            });

            setFilesToDelete(_filesToDelete);
        }
    }

    const Error = () => {
        return <div>Error occurred in File Uploader.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary>
            <div>
                <input
                    id={dbColumn}
                    type="file"
                    className={`form-control form-control-sm`}
                    onChange={handleChange}
                    disabled={false}
                    multiple={multiple}
                />

                <div className="d-flex flex-wrap">
                    {fileCollection.map(file => {
                        if (file.name) {
                            return (
                                <FileBadge
                                    key={file.name}
                                    file={file}
                                    id={item.id}
                                    table={table}
                                    fieldName={dbColumn}
                                    removeFile={removeFile}
                                />
                            );
                        } else return null;
                    })}
                </div>
            </div>
        </ErrorBoundary>
    );
}

function FileBadge({ id, file, table, fieldName, removeFile }) {
    const [show, setShow] = useState(false);
    const { status, name } = file;

    return (
        <div className="d-inline bg-light rounded-1 border text-dark me-1 mt-1 py-1 px-2 ">
            {status === STATUS.added && (
                <i
                    title="upload"
                    className="fa-solid fa-cloud-arrow-up opacity-75"></i>
            )}
            {status === STATUS.uploaded && (
                <i
                    title="uploaded"
                    className="fa-solid fa-cloud opacity-75"></i>
            )}
            {status === STATUS.deleted && (
                <i
                    title="delete"
                    className="fa-solid fa-ban text-danger opacity-75"></i>
            )}
            &nbsp; {name}
            &nbsp; &nbsp; &nbsp;
            {status === STATUS.uploaded ? (
                <>
                    <a
                        className="file"
                        title="Download this file"
                        href={`/file/service/${table}/${id}/${fieldName}/${name}`}>
                        <i className="fa-solid fa-file-arrow-down text-dark text-sm pointer opacity-75  me-2"></i>
                    </a>
                </>
            ) : (
                <a title="File not uploaded yet">
                    <i className="fa-solid fa-file-arrow-down text-dark text-sm not-allowed opacity-50  me-2"></i>
                </a>
            )}
            {status === STATUS.deleted ? (
                <a title="File will delete on save">
                    <i className="fa-solid fa-trash text-danger text-sm  not-allowed opacity-50  me-2"></i>
                </a>
            ) : (
                <span
                    onClick={() => {
                        setShow(true);
                    }}>
                    <i className="fa-solid fa-trash text-danger text-sm pointer opacity-75"></i>
                </span>
            )}
            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                centered
                animation={true}>
                <Modal.Header>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex align-tems-center justify-content-between">
                    <div>Are you sure you want to delete this file?</div>
                    <div>
                        <button
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => setShow(false)}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Cancel
                        </button>
                        <button
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => removeFile(name)}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Delete
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export { STATUS, FileContentUploader as default };

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import FileUploaderPropsEditor from "../../props-editors/FileUploaderPropsEditor";
import FilePreview from "./FilePreview";
import { s } from "plotly.js/dist/plotly-cartesian";

const status = {
    uploaded: "UPLOADED",
    deleted: "DELETED",
    added: "ADDED",
};

function FileUploader(props) {
    const [obj, setObj] = useState({});
    const [message, setMessage] = useState("");
    const [metaData, setMetaData] = useState({});
    const [componentData, setComponentData] = useState({});
    const [filesCollection, setFilesCollection] = useState([]);
    const [filesAdded, setFilesAdded] = useState([]);
    const [encodedFilesCollection, setEncodedFilesCollection] = useState([]);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [previewFile, setPreviewFile] = useState(null);

    const encodeCompleted = useRef(false);

    // visibility / disable rules
    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;
                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression({ expression: disableExp }, data),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression({ expression: visibleExp }, data),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    // initial setup
    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({ [key]: value });

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);

    // load form data
    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) return;

        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));

        let tempStr = props.formData[key];
        if (typeof tempStr === "string") {
            let _tempArr = tempStr.split(";");
            let tempArr = Array.from(new Set(_tempArr)).filter(x => x !== "");
            if (tempArr.length > 0) {
                let finalArr = tempArr.map((name, index) => ({
                    id: props.formData["id"],
                    column: key,
                    name,
                    table: metaData.table,
                }));
                setFilesCollection(finalArr);
            }
        }
        setData(props.formData);
        setPreviewFile(null);
    }, [props.formData?.id, metaData]);

    useEffect(() => {
        if (props.formDetails) {
            setMetaData(props.formDetails);
        }
    }, [props.formDetails]);

    // persist files to parent
    useEffect(() => {
        if (encodeCompleted.current) {
            let filesCollectionStr = JSON.stringify(filesCollection);
            let encodedFilesCollectionStr = JSON.stringify(
                encodedFilesCollection,
            );

            if (props.handleInputFields) {
                props.handleInputFields(
                    componentData.db_column,
                    filesCollectionStr,
                    true,
                    "file",
                    encodedFilesCollectionStr,
                );
            }
            encodeCompleted.current = false;
        }
    }, [encodeCompleted, filesCollection, encodedFilesCollection]);

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function checkIfFileAlreadyExists(fileName) {
        return filesCollection.some(file => file.name === fileName);
    }

    // handle drop
    function handleDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFiles(files, status.added);
    }

    // handle browse
    function handleBrowse(e) {
        handleFiles(e.target.files);
    }

    function handleFiles(filesSelected, status = status.uploaded) {
        let key = props.component.data.db_column;
        let fileEncodeCounter = 0;
        for (let i = 0; i < filesSelected.length; i++) {
            let fileReader = new FileReader();
            let fileName = filesSelected[i].name;
            if (!checkIfFileAlreadyExists(fileName)) {
                fileReader.onload = fileLoadedEvent => {
                    fileEncodeCounter++;
                    let content = fileLoadedEvent.target.result;
                    let encodedData = content.split("base64,")[1] || "";

                    // For preview, keep full DataURL (content) instead of only base64
                    const previewUrl = content;

                    // Safe file meta for NEW upload
                    const fileMeta = {
                        id: props.formData?.id || null,
                        column: key,
                        name: fileName,
                        table: metaData?.table || null, // may be null for new
                        isNew: true, // flag for FilePreview
                        previewUrl, // full DataURL for preview
                        status: status, // ADDED / UPLOADED
                    };

                    if (componentData.multi_file === "YES") {
                        setEncodedFilesCollection(prev => [
                            ...prev,
                            { fileName, content: encodedData, column: key },
                        ]);
                        setFilesCollection(prev => [...prev, fileMeta]);
                    } else {
                        setEncodedFilesCollection([
                            { fileName, content: encodedData, column: key },
                        ]);
                        setFilesCollection([fileMeta]);
                    }

                    if (filesSelected.length === fileEncodeCounter) {
                        encodeCompleted.current = true;
                    }
                };
                fileReader.readAsDataURL(filesSelected[i]);
            }
        }
    }

    //   function handleFiles(filesSelected) {
    //     let key = props.component.data.db_column;
    //     let fileEncodeCounter = 0;

    //     for (let i = 0; i < filesSelected.length; i++) {
    //       let fileReader = new FileReader();
    //       let fileName = filesSelected[i].name;

    //       if (!checkIfFileAlreadyExists(fileName)) {
    //         fileReader.onload = fileLoadedEvent => {
    //           fileEncodeCounter++;
    //           let content = fileLoadedEvent.target.result;
    //           let encodedData = content.split("base64,")[1] || "";

    //           const fileMeta = {
    //             id: props.formData["id"],
    //             column: key,
    //             name: fileName,
    //             table: metaData.table,
    //           };

    //           if (componentData.multi_file === "YES") {
    //             setEncodedFilesCollection(prev => [
    //               ...prev,
    //               { fileName, content: encodedData, column: key },
    //             ]);
    //             setFilesCollection(prev => [...prev, fileMeta]);
    //           } else {
    //             setEncodedFilesCollection([{ fileName, content: encodedData, column: key }]);
    //             setFilesCollection([fileMeta]);
    //           }

    //           if (filesSelected.length === fileEncodeCounter) {
    //             encodeCompleted.current = true;
    //           }
    //         };
    //         fileReader.readAsDataURL(filesSelected[i]);
    //       }
    //     }
    //   }

    function removeFile(file) {
        setFilesCollection(prev => prev.filter(f => f.name !== file.name));
        setEncodedFilesCollection(prev =>
            prev.filter(f => f.fileName !== file.name),
        );
        encodeCompleted.current = true;
        deleteFile(file);
    }

    function deleteFile(file) {
        const config = { headers: { "Content-Type": "multipart/form-data" } };
        try {
            axios.delete(
                `/file/service/${file.table}/${file.id}/${file.name}`,
                config,
            );
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }

    const Error = () => <div>Error occurred in File Uploader.</div>;

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result =
                (componentData?.classes ?? "") +
                " " +
                (componentData?.db_column ?? "");
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div className={"s2a-file-uploader " + userDefineClasses()}>
                    {props.mode === props.modeType.design && (
                        <span
                            className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                            onClick={() => setShow(true)}></span>
                    )}

                    {!props.isInDatalistMode && (
                        <label className="form-label">
                            {componentData.label
                                ? componentData.label
                                : "File Uploader"}
                            {componentData.required === "YES" && (
                                <span className="text-danger">&nbsp;*</span>
                            )}
                        </label>
                    )}

                    {props.mode === props.modeType.render && (
                        <>
                            {/* Upload Icon */}
                            <i
                                className="fa-regular fa-cloud-arrow-up text-primary fs-4 cursor-pointer"
                                onClick={() => setShow(true)}
                                title="Upload files"></i>

                            {/* Dropzone Modal */}
                            <Modal
                                show={show}
                                size="lg"
                                onHide={() => setShow(false)}
                                backdrop="static"
                                keyboard={false}>
                                <Modal.Header closeButton>
                                    <Modal.Title>Upload Files</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <div
                                        className="dropzone border border-2 rounded p-4 text-center bg-light"
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    componentData.db_column,
                                                )
                                                .click()
                                        }
                                        style={{ cursor: "pointer" }}>
                                        <input
                                            type="file"
                                            id={componentData.db_column}
                                            style={{ display: "none" }}
                                            multiple={
                                                componentData.multi_file ===
                                                "YES"
                                            }
                                            onChange={handleBrowse}
                                            disabled={
                                                disable ||
                                                componentData.readonly === "YES"
                                            }
                                        />
                                        <div className="dropzone-content">
                                            <p className="dropzone-text fs-5 text-muted">
                                                <strong>Drag & Drop</strong>{" "}
                                                files here <br /> or{" "}
                                                <span className="text-primary fw-bold">
                                                    click to browse
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </Modal.Body>
                            </Modal>
                        </>
                    )}

                    {(props.mode === props.modeType.preview ||
                        props.mode === props.modeType.readonly) && (
                        <input
                            type="file"
                            className="form-control form-control-sm"
                            disabled
                        />
                    )}

                    <div className="d-flex flex-wrap mt-2">
                        {filesCollection.map(file => (
                            <FileBadge
                                key={file.name}
                                file={file}
                                removeFile={removeFile}
                                setPreviewFile={setPreviewFile}
                            />
                        ))}
                    </div>

                    <p className="text-danger">
                        {message && <span>{message}</span>}
                    </p>
                </div>
            )}

            {/* Property editor modal */}
            <Modal
                className="s2a-modal"
                show={show}
                size="lg"
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Edit File Uploader</span>
                        <div className="d-flex">
                            {toggleModalWindow !== "maximize" && (
                                <i
                                    className="fa-regular fa-window-maximize modal-resize"
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }></i>
                            )}
                            {toggleModalWindow !== "restore" && (
                                <i
                                    className="fa-regular fa-window-restore modal-resize"
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }></i>
                            )}
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FileUploaderPropsEditor
                        setShow={setShow}
                        componentData={componentData}
                        setComponentData={setComponentData}
                    />
                </Modal.Body>
            </Modal>

            {previewFile?.id && previewFile.id !== "new" && (
                <>
                    {JSON.stringify(previewFile)}
                    <FilePreview
                        previewFile={previewFile}
                        setPreviewFile={setPreviewFile}
                    />
                </>
            )}
        </ErrorBoundary>
    );
}

function FileBadge({ file, removeFile, setPreviewFile }) {
    const ext = file.name.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
    const isPdf = ext === "pdf";
    const isCsv = ext === "csv";
    return (
        <div className="d-flex bg-light rounded-1 border text-dark me-1 py-1 px-2 position-relative">
            <div
                className="m-auto upload-file-name d-inline-block"
                title={JSON.stringify(file)}>
                {file.name}
            </div>
            <div className="ms-2 mt-0 d-flex align-items-center">
                {(isPdf || isImage || isCsv) && !file.isNew && (
                    <i
                        className="bi bi-eye text-dark text-sm pointer opacity-75 me-2"
                        style={{ fontSize: "1.5rem" }}
                        onClick={() => setPreviewFile(file)}
                        title="Preview File"></i>
                )}
                {file.id && file.status === status.uploaded ? (
                    <a
                        title="Download File"
                        href={`/file/service/${file.table}/${file.id}/${file.name}`}>
                        <i className="fa-solid fa-file-arrow-down text-dark text-sm pointer opacity-75 me-2"></i>
                    </a>
                ) : (
                    <i className="fa-solid fa-file-arrow-down text-dark text-sm not-allowed opacity-50 me-2"></i>
                )}
                <span
                    title="Delete"
                    onClick={() => removeFile(file)}>
                    <i className="fa-solid fa-trash text-danger text-sm pointer opacity-75"></i>
                </span>
            </div>
        </div>
    );
}

export default FileUploader;

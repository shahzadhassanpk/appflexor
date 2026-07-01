import axios from "axios";
import React, { useDebugValue, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import Carousel from "react-bootstrap/Carousel";
import { IMAGE_BASE } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../../utils/utils";
import TextPropsEditor from "../../props-editors/TextPropsEditor";

// import UploaderOld from "./Uploader";
/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

const status = {
    uploaded: "UPLOADED",
    deleted: "DELETED",
    added: "ADDED",
};

function FormCarousel(props) {
    const [obj, setObj] = useState({});
    const [message, setMessage] = useState("");
    const [metaData, setMetaData] = useState({});
    const [componentData, setComponentData] = useState({});
    const [filesCollection, setFilesCollection] = useState([]);
    const [encodedFilesCollection, setEncodedFilesCollection] = useState([]);
    const [forceRender, setForceRender] = useState(false);
    // const [fileNameMapping, setFileNameMapping] = useState({});
    // const [fileStatusMapping, setFileStatusMapping] = useState({});
    const [show, setShow] = useState(false);
    const [showPropsEditor, setShowPropsEditor] = useState(false);

    const encodeCompleted = useRef(false);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }

        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));

        let tempStr = props.formData[key];

        if (typeof tempStr === "string") {
            let _tempArr = tempStr.split(";");
            let tempArr = [];

            _tempArr.forEach(element => {
                if (!tempArr.includes(element)) {
                    tempArr.push(element);
                }
            });
            if (tempArr.length > 0) {
                let finalArr = [];
                for (let i = 0; i < tempArr.length; i++) {
                    if (tempArr[i] !== "") {
                        finalArr.push({
                            id: props.formData["id"],
                            column: key,
                            name: tempArr[i],
                            table: metaData.table,
                            status: status.uploaded,
                        });
                    }
                }
                setFilesCollection(finalArr);
            }
        }
    }, [props.formData, metaData]);

    useEffect(() => {
        if (props.formDetails) {
            setMetaData(props.formDetails);
        }
    }, [props.formDetails]);

    useEffect(() => {
        if (props.fileNameMapping) {
            const map = props.fileNameMapping;
            const keys = Object.keys(map);
            const values = Object.values(map);

            if (keys && values) {
                let updatedArr = filesCollection.map(file => {
                    if (keys.includes(file.column)) {
                        // let currentFileState = filesCollection.find(
                        //     (el) => el.name === file.name
                        // );
                        if (values.toString().includes(file.name)) {
                            file.status = status.added;
                        } else {
                            file.status = status.uploaded;
                        }
                    }
                    return file;
                });
                setFilesCollection(updatedArr);
                setForceRender(true);
            }
        }
    }, [props.fileNameMapping]);

    useEffect(() => {
        if (encodeCompleted.current) {
            // console.log(filesCollection);
            // console.log(encodedFilesCollection);

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

    function checkIfFileAlreadyExists(fileName) {
        let doExists = false;

        filesCollection.map(file => {
            if (file.name.includes(fileName)) doExists = true;
        });

        return doExists;
    }

    function handleChange(event) {
        let key = event.target.id;
        let filesSelected = event.target.files;
        let fileNames = "";
        let fileDataObj = {};

        let fileEncodeCounter = 0;
        for (let i = 0; i < filesSelected.length; i++) {
            let fileReader = new FileReader();
            let fileName = filesSelected[i].name;

            if (!checkIfFileAlreadyExists(fileName)) {
                fileNames += fileName + ";";

                fileReader.onload = fileLoadedEvent => {
                    fileEncodeCounter++;
                    // data: base64
                    let name = filesSelected[i].name;
                    let content = fileLoadedEvent.target.result;
                    let newArr = content.split("base64,");
                    let encodedData = "";
                    if (newArr[1]) {
                        encodedData = newArr[1];
                    }
                    // tempArr.push({
                    //     fileName: name,
                    //     content: content,
                    // });

                    setEncodedFilesCollection(prev => {
                        return [
                            ...prev,
                            {
                                fileName: name,
                                content: encodedData,
                                column: key,
                            },
                        ];
                    });

                    setFilesCollection(prev => {
                        return [
                            ...prev,
                            {
                                id: props.formData["id"],
                                column: key,
                                name,
                                table: metaData.table,
                                // status: status.added,
                            },
                        ];
                    });

                    if (filesSelected.length === fileEncodeCounter) {
                        encodeCompleted.current = true;
                    }

                    // fileDataObj[name] = "Something 64 like";
                };

                fileReader.readAsDataURL(filesSelected[i]);
            }
        }

        setObj(prev => ({
            ...prev,
            [key]: fileNames,
        }));

        // let fileDataStr = JSON.stringify(fileDataObj);
    }

    function handleImagesUplaod(e) {
        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            // props.handleInputFields(
            //     componentData.db_column,
            //     filesCollectionStr,
            //     true,
            //     "file",
            //     encodedFilesCollectionStr,
            // );
        }
    }

    function removeFileNew(file) {
        let newArr = filesCollection.map(currenFile => {
            if (file.name === currenFile.name) {
                currenFile.status = status.deleted;
            }
            return currenFile;
        });

        setFilesCollection(newArr);

        // let newArr2 = encodedFilesCollection.map((currenFile) => {
        //     if (file.name === currenFile.name) {
        //         currenFile.status = status.deleted;
        //     }
        //     return currenFile;
        // });

        let newArr2 = encodedFilesCollection.filter(currenFile => {
            if (file.name === currenFile.name) {
                return false;
            }
            return true;
        });

        setEncodedFilesCollection(newArr2);

        encodeCompleted.current = true;

        // deleteFile(file);
    }

    function removeFile(file) {
        let newArr = filesCollection.filter(currenFile => {
            if (file.name === currenFile.name) {
                return false;
            }
            return true;
        });

        setFilesCollection(newArr);

        let newArr2 = encodedFilesCollection.filter(currenFile => {
            if (file.name === currenFile.name) {
                return false;
            }
            return true;
        });

        setEncodedFilesCollection(newArr2);

        encodeCompleted.current = true;

        deleteFile(file);
    }

    function deleteFile(file) {
        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        };
        try {
            axios
                .delete(
                    `/file/service/${file.table}/${file.id}/${file.name}`,
                    config,
                )
                .then(function (response) {});
        } catch (e) {
            console.error("Error while sending delete request:" + e);
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

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">File Uploader</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                />
            </div>
        );

    const carId = makeid(4);

    return (
        <ErrorBoundary render={() => Error}>
            {forceRender && (
                <RenderCarousel filesCollection={filesCollection} />
            )}
            &nbsp;
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <span
                        className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                        onClick={() => setShowPropsEditor(true)}></span>
                )}
            <button
                className="ms-auto my-2 btn button-theme btn-sm"
                data-bs-toggle="modal"
                data-bs-target={`#${carId}`}>
                Upload Images
            </button>
            <div className="field-padding">
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <input
                            type="file"
                            className="form-control"
                            disabled
                        />
                    )}
            </div>
            <Modal
                show={showPropsEditor}
                onHide={() => setShowPropsEditor(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}
                size="lg">
                <Modal.Header>
                    <Modal.Title>Edit Carousel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TextPropsEditor setShow={setShowPropsEditor} />
                </Modal.Body>
            </Modal>
            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}>
                <Modal.Header>
                    <Modal.Title>Upload images</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        {/* <label className="form-label">
                                {componentData.label
                                    ? componentData.label
                                    : "File Uploader"}
                                {componentData.required &&
                                    componentData.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}
                            </label> */}
                        {props.mode &&
                            props.modeType &&
                            (props.mode === props.modeType.preview ||
                                props.mode === props.modeType.render) && (
                                <>
                                    {/* <input
                            type="text"
                            className={`form-control form-control-sm ${
                                componentData.required && componentData.required === "YES"
                                    ? obj[componentData.db_column] === ""
                                        ? "form-control-danger"
                                        : ""
                                    : ""
                            } `}
                            id={componentData.db_column && componentData.db_column}
                            // value={obj[obj.key] ? obj[obj.key] : ""}
                            value={obj[componentData.db_column]}
                            onChange={handleChange}
                            disabled={props.mode && props.mode === props.modeType.design}
                        /> */}

                                    <Uploader
                                        type="file"
                                        className={`form-control form-control-sm  ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? obj[
                                                      componentData.db_column
                                                  ] === ""
                                                    ? "form-control-danger"
                                                    : ""
                                                : ""
                                        } `}
                                        id={
                                            componentData.db_column &&
                                            componentData.db_column
                                        }
                                        // value={obj[obj.key] ? obj[obj.key] : ""}
                                        // value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        disabled={
                                            props.mode === props.modeType.design
                                                ? true
                                                : componentData.readonly ===
                                                  "YES"
                                                ? true
                                                : false
                                        }
                                    />
                                    <div className="d-flex flex-wrap">
                                        {filesCollection.map(file => (
                                            <FileBadge
                                                key={file.name}
                                                file={file}
                                                removeFile={removeFile}
                                            />
                                        ))}
                                    </div>
                                    {/* <UploaderOld
                                componentData={componentData}
                                tableName={metaData.table}
                            /> */}
                                    <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p>
                                    {/* <code>{JSON.stringify(obj)}</code> */}
                                </>
                            )}

                        <div className="d-flex flex-row justify-content-end">
                            <div className="d-flex flex-row">
                                <button
                                    type="button"
                                    className="btn  button-theme btn-sm"
                                    data-bs-dismiss="modal"
                                    onClick={e => handleImagesUplaod(e)}>
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
            {/* <div
                id={`${carId}`}
                className="modal fade "
                data-bs-backdrop="static"
                data-bs-keyboard="false">
                <div className="modal-dialog modal-dialog-">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Upload images</h5>
                        </div>
                        <div className="modal-body"></div>
                        <div className="modal-footer d-flex justify-content-end">

                        </div>
                    </div>
                </div>
            </div> */}
        </ErrorBoundary>
    );
}

function FileBadge({ file, removeFile }) {
    return (
        <div className="d-inline bg-light rounded-1 border text-dark me-1 mt-1 py-1 px-2 position-relative">
            <div className="position-absolute top-0 start-0 translate-middle">
                {file.status === status.added && (
                    <i
                        title="upload"
                        className="fa-solid fa-cloud-arrow-up opacity-75"></i>
                )}
                {file.status === status.uploaded && (
                    <i
                        title="uploaded"
                        className="fa-solid fa-cloud opacity-75"></i>
                )}
                {file.status === status.deleted && (
                    <i
                        title="delete"
                        className="fa-solid fa-ban text-danger opacity-75"></i>
                )}
            </div>
            <span>
                <img
                    width="30px"
                    height="30px"
                    className="rounded my-2"
                    src={`${IMAGE_BASE}/${file.table}/${file.id}/${file.name}   `}
                    alt=""
                />
            </span>
            {file.name}
            &nbsp; &nbsp; &nbsp;
            {file.id ? (
                <>
                    {file.status === status.uploaded ? (
                        <a
                            className="file"
                            href={`/file/service/${file.table}/${file.id}/${file.name}`}>
                            <i className="fa-solid fa-file-arrow-down text-dark text-sm pointer opacity-75  me-2"></i>
                        </a>
                    ) : (
                        <a>
                            <i className="fa-solid fa-file-arrow-down text-dark text-sm not-allowed opacity-50  me-2"></i>
                        </a>
                    )}
                </>
            ) : (
                <a>
                    <i className="fa-solid fa-file-arrow-down text-dark text-sm not-allowed opacity-50  me-2"></i>
                </a>
            )}
            <span onClick={() => removeFile(file)}>
                <i className="fa-solid fa-trash text-danger text-sm pointer opacity-75"></i>
            </span>
        </div>
    );
}

function Uploader({ id, className, type, value, onChange, disabled }) {
    return (
        <>
            <input
                type={type}
                className={className}
                id={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                multiple
            />

            {/* <code>{JSON.stringify(value)}</code> */}
        </>
    );
}

function RenderCarousel({ filesCollection }) {
    const [index, setIndex] = useState(0);

    const handleSelect = selectedIndex => {
        setIndex(selectedIndex);
    };

    useEffect(() => {
        setIndex(0);
    }, [filesCollection]);

    return (
        <div>
            <Delayed waitBeforeShow={500}>
                <div
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal">
                    <Carousel
                        activeIndex={index}
                        onSelect={handleSelect}
                        controls={false}
                        indicators={filesCollection.length < 2 ? false : true}>
                        {filesCollection &&
                            filesCollection.map(file => {
                                if (file.status === "UPLOADED") {
                                    return (
                                        <Carousel.Item>
                                            <img
                                                className="d-block w-100"
                                                src={`${IMAGE_BASE}/${file.table}/${file.id}/${file.name}`}
                                                alt="Image not found"
                                            />
                                        </Carousel.Item>
                                    );
                                }
                            })}
                    </Carousel>
                </div>
                <div
                    className="modal fade"
                    id="exampleModal">
                    <div className="modal-dialog modal-fullscreen">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1
                                    className="modal-title fs-5"
                                    id="exampleModalLabel">
                                    Modal title
                                </h1>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                            </div>
                            <div className="modal-body d-flex">
                                <div className="container-fluid">
                                    <div className="row">
                                        <Carousel
                                            activeIndex={index}
                                            onSelect={handleSelect}
                                            controls={
                                                filesCollection.length < 2
                                                    ? false
                                                    : true
                                            }
                                            indicators={
                                                filesCollection.length < 2
                                                    ? false
                                                    : true
                                            }>
                                            {filesCollection &&
                                                filesCollection.map(file => {
                                                    if (
                                                        file.status ===
                                                        "UPLOADED"
                                                    ) {
                                                        return (
                                                            <Carousel.Item>
                                                                <img
                                                                    className="d-block img-fluid"
                                                                    src={`${IMAGE_BASE}/${file.table}/${file.id}/${file.name}`}
                                                                    alt="Image not found"
                                                                />
                                                            </Carousel.Item>
                                                        );
                                                    }
                                                })}
                                        </Carousel>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"></div>
                        </div>
                    </div>
                </div>
            </Delayed>
        </div>
    );
}

function Delayed({ children, waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : "Loading...";
}

export default FormCarousel;

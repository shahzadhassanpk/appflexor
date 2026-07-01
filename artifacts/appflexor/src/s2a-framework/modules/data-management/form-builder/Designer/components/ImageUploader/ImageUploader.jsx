import axios from "axios";
import React, { useDebugValue, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import ImageUploaderPropsEditor from "../../props-editors/ImageUploaderPropsEditor";
import FileBadge from "./FileBadge";
import RenderLayoutImage from "./RenderLayoutImage";
import Uploader from "./Uploader";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";

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

function ImageUploader(props) {
    const [obj, setObj] = useState({});
    const [message, setMessage] = useState("");
    const [metaData, setMetaData] = useState({});
    const [componentData, setComponentData] = useState({});
    const [filesCollection, setFilesCollection] = useState([]);
    const [encodedFilesCollection, setEncodedFilesCollection] = useState([]);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

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
    // const [fileNameMapping, setFileNameMapping] = useState({});
    // const [fileStatusMapping, setFileStatusMapping] = useState({});

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
                            id: props.formData["id"] || "new",
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
        setData(props.formData);
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
                // if (props.handleOnFieldBlur) {
                //     props.handleOnFieldBlur(
                //         "FILE",
                //         encodedFilesCollectionStr,
                //         filesCollectionStr,
                //     );
                // }
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
                    let contentBase64 = fileLoadedEvent.target.result;
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
                            {
                                fileName: name,
                                content: encodedData,
                                contentBase64: contentBase64,
                                column: key,
                            },
                        ];
                    });

                    setFilesCollection(prev => {
                        return [
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

        // this `handleInputFields` will be provided by Parent component
        // if (props.handleInputFields) {
        //     props.handleInputFields(
        //         componentData.db_column,
        //         fileNames,
        //         isValid,
        //         "file",
        //         fileDataStr
        //     );
        // }
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

        deleteFile(file);
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
        return <div>Error occurred in Image Uploader.</div>;
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
                <label className="form-label">Image Uploader</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                />
            </div>
        );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {/* <code>{JSON.stringify(filesCollection)}</code>
            <hr />

            <code>{JSON.stringify(encodedFilesCollection)}</code> */}

            {visible && (
                <div className={`s2a-img-uploader ${userDefineClasses()}`}>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}
                    {!props.isInDatalistMode && (
                        <label className="form-label">
                            {componentData.label
                                ? componentData.label
                                : "Image Uploader"}
                            {componentData.required &&
                                componentData.required === "YES" && (
                                    <span className="text-danger">&nbsp;*</span>
                                )}
                        </label>
                    )}
                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.design ||
                            props.mode === props.modeType.readonly ||
                            props.mode === props.modeType.preview) && (
                            <input
                                type="file"
                                className="form-control form-control-sm"
                                // value={obj[componentData.db_column]}
                                disabled
                            />
                        )}
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.render && (
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
                                {/* <div className="d-flex  justify-content-end flex-wrap">
                                    {filesCollection.map(file => (
                                        <FileBadge
                                            key={file.name}
                                            file={file}
                                            removeFile={removeFile}
                                        />
                                    ))}
                                </div> */}
                                {filesCollection.length > 0 ? (
                                    <RenderLayoutImage
                                        data={data}
                                        encodedFilesCollection={
                                            encodedFilesCollection
                                        }
                                        filesCollection={filesCollection}
                                        formDetails={props.formDetails}
                                        componentData={componentData}
                                        removeFile={removeFile}
                                    />
                                ) : (
                                    <Uploader
                                        multiple={
                                            componentData.multi_file === "YES"
                                                ? true
                                                : false
                                        }
                                        type="file"
                                        className={` ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? obj[
                                                      componentData.db_column
                                                  ] === ""
                                                    ? "img-uploader-required"
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
                                                : disable
                                                ? true
                                                : false
                                        }
                                    />
                                )}

                                {/* <div className="mt-1">
                                    {filesCollection.length > 0
                                        ? `${filesCollection.length} files`
                                        : ``}
                                </div> */}
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
                </div>
            )}
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
                        <span>Edit Image Uploader</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ImageUploaderPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export { ImageUploader as default, status };

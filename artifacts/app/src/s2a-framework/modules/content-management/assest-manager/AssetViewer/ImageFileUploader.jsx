import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import Scroll from "../../../../components/Scroll/Scroll";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import { makeShortId } from "../../../../utils/utils";
import { MODE_TYPE } from "./AssetsViewer";
import ImageDropZone from "./ImageDropZone";
import RenderEncodedImage from "./RenderEncodedImage";
import RenderServerImage from "./RenderServerImage";
import RenderUpdateEncodedImage from "./RenderUpdateEncodedImage";
import RenderUpdateServerImage from "./RenderUpdateServerImage";

const fieldColumn = "image";

export const status = {
    uploaded: "UPLOADED",
    deleted: "DELETED",
    added: "ADDED",
};

function ImageFileUploader(props) {
    const {
        list,
        showUploader,
        tableName,
        channelId,
        selectedItem,
        getData,
        hideUploader,
        uploadMode,
        parent
    } = props;

    const appContext = useContext(AppContext);

    const [filesCollection, setFilesCollection] = useState([]);
    const [encodedFilesCollection, setEncodedFilesCollection] = useState([]);
    const encodeCompleted = useRef(false);

    // useEffect(() => {
    //     console.log("ImageFileUploader");
    //     console.log(mode);
    // }, [mode]);

    useEffect(() => {
        if (uploadMode === MODE_TYPE.add) {
            if (!showUploader) {
                setFilesCollection([]);
                setEncodedFilesCollection([]);
            }
        }

        if (uploadMode === MODE_TYPE.update) {
            if (!showUploader) {
                setFilesCollection([]);
                setEncodedFilesCollection([]);
            } else {
                setFilesCollection([
                    { ...selectedItem, status: status.uploaded },
                ]);
                setEncodedFilesCollection([]);
            }
        }
    }, [uploadMode, selectedItem.id, showUploader]);

    function handleChange(event) {
        let key = event.target.id;
        let filesSelected = event.target.files;
        let fileNames = "";

        if (uploadMode === MODE_TYPE.add) {
            let fileEncodeCounter = 0;
            for (let i = 0; i < filesSelected.length; i++) {
                let fileReader = new FileReader();
                let fileName = filesSelected[i].name;

                if (!checkIfFileAlreadyExists(fileName, filesCollection)) {
                    fileNames += fileName + ";";
                    fileReader.onload = fileLoadedEvent => {
                        fileEncodeCounter++;
                        // data: base64
                        let name = filesSelected[i].name;
                        let nameWithoutExt = name
                            .split(".")
                            .slice(0, -1)
                            .join();
                        let content = fileLoadedEvent.target.result;
                        let contentBase64 = fileLoadedEvent.target.result;
                        let newArr = content.split("base64,");
                        let encodedData = "";
                        if (newArr[1]) {
                            encodedData = newArr[1];
                        }
                        setEncodedFilesCollection(prev => {
                            return [
                                ...prev,
                                {
                                    fileName: name,
                                    content: encodedData,
                                    contentBase64: contentBase64,
                                    column: key,
                                },
                            ];
                        });

                        // For image dimensions

                        var image = new Image();

                        //Set the Base64 string return from FileReader as source.
                        image.src = fileLoadedEvent.target.result;

                        //Validate the File Height and Width.
                        image.onload = function () {
                            var height = this.height;
                            var width = this.width;

                            setFilesCollection(prev => {
                                return [
                                    ...prev,
                                    {
                                        id: makeShortId(4),
                                        column: key,
                                        title: nameWithoutExt,
                                        name,
                                        tags: [],
                                        dimensions: `${width} by ${height} pixels`,
                                        table: tableName,
                                        channel_id: channelId,
                                        status: status.added,
                                    },
                                ];
                            });
                        };

                        if (filesSelected.length === fileEncodeCounter) {
                            encodeCompleted.current = true;
                        }
                    };
                    fileReader.readAsDataURL(filesSelected[i]);
                }
            }
        }

        if (uploadMode === MODE_TYPE.update) {
            let fileEncodeCounter = 0;
            for (let i = 0; i < filesSelected.length; i++) {
                let fileReader = new FileReader();
                let fileName = filesSelected[i].name;
                fileName = fileName.split(".").slice(0, -1).join();

                fileNames += fileName + ";";
                fileReader.onload = fileLoadedEvent => {
                    // will return base64
                    fileEncodeCounter++;
                    // Since we are updating file content and not the file itself.
                    // We will keep last file name and discard new one.
                    // Because this is edit case, new file name will break old file reference
                    // `let name = filesSelected[i].name;`
                    let name = fileName;

                    let content = fileLoadedEvent.target.result;
                    let contentBase64 = fileLoadedEvent.target.result;
                    let newArr = content.split("base64,");
                    let encodedData = "";
                    if (newArr[1]) {
                        encodedData = newArr[1];
                    }
                    setEncodedFilesCollection([
                        {
                            fileName: name,
                            content: encodedData,
                            contentBase64: contentBase64,
                            column: key,
                        },
                    ]);

                    // For image dimensions

                    var image = new Image();

                    //Set the Base64 string return from FileReader as source.
                    image.src = fileLoadedEvent.target.result;

                    //Validate the File Height and Width.
                    image.onload = function () {
                        var height = this.height;
                        var width = this.width;

                        setFilesCollection([
                            {
                                id: selectedItem.id,
                                column: key,
                                title: fileName,
                                name:fileName,
                                tags: selectedItem.tags,
                                table: tableName,
                                channel_id: channelId,
                                status: status.added,
                                dimensions: `${width} by ${height} pixels`,
                            },
                        ]);
                    };

                    if (filesSelected.length === fileEncodeCounter) {
                        encodeCompleted.current = true;
                    }
                };
                fileReader.readAsDataURL(filesSelected[i]);
            }
        }
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
            if (file.name === currenFile.fileName) {
                return false;
            }
            return true;
        });

        setEncodedFilesCollection(newArr2);

        encodeCompleted.current = true;

        // deleteFile(file);
    }

    function deleteFile(file) {
        // const config = {
        //     headers: {
        //         "Content-Type": "multipart/form-data",
        //     },
        // };
        // try {
        //     axios
        //         .delete(
        //             `/file/service/${file.table}/${file.id}/${file.name}`,
        //             config,
        //         )
        //         .then(function (response) {});
        // } catch (e) {
        //     console.error("Error while sending delete request:" + e);
        // }
    }

    async function uploadFilesToServer(updatedFileCollection) {
        // const tenantId = appContext?.tenantSubscription?.tenant_id;
        if (uploadMode === MODE_TYPE.add) {
            const request = {
                // tenant_id: tenantId,
                data: [],
            };

            filesCollection.map(async file => {
                const encodedFiles = encodedFilesCollection.filter(
                    f => f.fileName === file.name,
                );

                if (encodedFiles.length > 0) {
                    const encodedFile = encodedFiles[0];
                    request.data.push({
                        formId: tableName,
                        entity: tableName,
                        action: "update",
                        id: "new",
                        formData: {
                            id: "new",
                            [fieldColumn]: file.name,
                            title: file.title,
                            tags: file.tags,
                            channel_id: channelId,
                            folder_id: parent.id,
                            dimensions: file.dimensions,
                        },
                        fileData: [
                            {
                                fileName: file.name,
                                content: encodedFile.content,
                            },
                        ],
                    });
                }
            });

            const response = await axios.post(
                API_URL + "?service.key=update.formData",
                request,
            );
            if (response.status === 200) {
                if (response.data.C_STATUS === "SUCCESS") {
                    hideUploader();
                    getData();
                    setFilesCollection([]);
                }
            }
        }

        if (uploadMode === MODE_TYPE.update) {
            if (
                typeof encodedFilesCollection !== "undefined" &&
                encodedFilesCollection.length > 0
            ) {
                const request = {
                    // datasource: tenantId,
                    data: [],
                };
                updatedFileCollection.map(async file => {
                    const encodedFiles = encodedFilesCollection.filter(
                        f => f.fileName === file.name,
                    );
                    const encodedFile = encodedFiles[0];

                    request.data.push({
                        formId: tableName,
                        entity: tableName,
                        action: "update",
                        id: selectedItem.id,
                        formData: {
                            id: selectedItem.id,
                            [fieldColumn]: file.name,
                            title: file.title,
                            tags: file.tags,
                            channel_id: channelId,
                            dimensions: file.dimensions,
                        },
                        fileData: [
                            {
                                fileName: file.name,
                                content: encodedFile.content,
                            },
                        ],
                    });
                });
                const response = await axios.post(
                    API_URL + "?service.key=update.formData",
                    request,
                );
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        hideUploader();
                        getData();
                    }
                }
            } else {
                let updatedFile = updatedFileCollection.filter(
                    f => f.id === selectedItem.id,
                );
                if (updatedFile.length > 0) {
                    updateData(updatedFile[0]);
                } else {
                    console.log("Unable to find file from collection.");
                }
            }
        }
    }

    function updateData(file) {
        let url = API_URL + "?service.key=update.formData";
        let request = {};
        request.data = [];

        if (file["status"]) {
            delete file.status;
        }

        if (file["imageHash"]) {
            delete file.imageHash;
        }

        let entityForm = {};
        entityForm.formId = tableName; //"formid"
        entityForm.entity = tableName; //Db- "table name"
        entityForm.action = "update";
        entityForm.id = file.id;
        entityForm.formData = { ...file };
        request.data.push(entityForm);

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        hideUploader();
                        getData();
                    } else {
                        console.log(response.data.C_MESSAGE);
                    }
                }
            });
        } catch (e) {
            console.error("Error while sending save request:" + e);
        }
    }

    function removeFileOld(file, index) {
        var fileArray = [...fileNames];
        fileArray.splice(index, 1);
        setFileNames(fileArray);

        try {
            // axios
            //     .delete(
            //         `/file/service/${tableName}/${record_id}/${file}`,
            //         config,
            //     )
            //     .then(function (response) {
            //         console.log(response);
            //         saveData(fileArray);
            //         inputElement.current.value = "";
            //     });
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function checkIfFileAlreadyExists(fileName, filesCollection) {
        let doExists = false;
        filesCollection.map(file => {
            if (file.name.includes(fileName)) doExists = true;
        });

        return doExists;
    }

    const Error = () => {
        return <div>Error occurred in Image Uploader.</div>;
    };

    return (
        <ErrorBoundary render={() => Error}>
            <div
                id="img-file-uploader"
                className="img-file-uploader ">
                {uploadMode === MODE_TYPE.update && (
                    <>
                        {/* <div className="w-100 d-flex">
                            <button
                                type="button"
                                className=" button-theme  btn btn-sm pull-left my-2"
                                onClick={() => uploadFilesToServer()}>
                                <i className="fa-solid fa-cloud-arrow-up pe-1"></i>
                                Update
                            </button>
                        </div> */}

                        {/* <ImageDropZone
                            fieldId={"image"}
                            onChange={handleChange}
                            muliple={false}
                        /> */}

                        {filesCollection.length > -1 &&
                            filesCollection.map((file, index) => {
                                if (file.status === status.uploaded) {
                                    return (
                                        <RenderUpdateServerImage
                                            key={index}
                                            file={file}
                                            filesCollection={filesCollection}
                                            tableName={tableName}
                                            uploadFilesToServer={
                                                uploadFilesToServer
                                            }
                                            handleImageUpload={handleChange}
                                            hideUploader={hideUploader}
                                        />
                                    );
                                }

                                return (
                                    <RenderUpdateEncodedImage
                                        key={index}
                                        file={file}
                                        filesCollection={filesCollection}
                                        tableName={tableName}
                                        uploadFilesToServer={
                                            uploadFilesToServer
                                        }
                                        handleImageUpload={handleChange}
                                        hideUploader={hideUploader}
                                        encodedFiles={encodedFilesCollection}
                                    />
                                );
                            })}
                    </>
                )}
                {uploadMode === MODE_TYPE.add && (
                    <>
                        <div className="w-100 d-flex">
                            <button
                                type="button"
                                disabled={filesCollection.length === 0}
                                className=" button-theme  btn btn-sm pull-left my-2"
                                onClick={() => uploadFilesToServer()}>
                                <i className="fa-solid fa-cloud-arrow-up pe-1"></i>
                                Upload
                            </button>
                        </div>

                        <ImageDropZone
                            fieldId={"image"}
                            onChange={handleChange}
                            muliple={
                                uploadMode === MODE_TYPE.add ? true : false
                            }
                            uploadMode={uploadMode}
                        />

                        <Scroll height="50vh">
                            <div className="row">
                                {filesCollection.length > -1 &&
                                    filesCollection.map((file, index) => {
                                        if (file.status === status.uploaded) {
                                            return (
                                                <RenderServerImage
                                                    key={index}
                                                    index={index}
                                                    file={file}
                                                    removeFile={removeFile}
                                                    list={list}
                                                    filesCollection={
                                                        filesCollection
                                                    }
                                                    setFilesCollection={
                                                        setFilesCollection
                                                    }
                                                    tableName={tableName}
                                                />
                                            );
                                        }

                                        return (
                                            <RenderEncodedImage
                                                key={index}
                                                index={index}
                                                file={file}
                                                encodedFiles={
                                                    encodedFilesCollection
                                                }
                                                removeFile={removeFile}
                                                list={list}
                                                filesCollection={
                                                    filesCollection
                                                }
                                                setFilesCollection={
                                                    setFilesCollection
                                                }
                                            />
                                        );
                                    })}
                            </div>
                        </Scroll>
                    </>
                )}
            </div>
        </ErrorBoundary>
    );
}

export default ImageFileUploader;

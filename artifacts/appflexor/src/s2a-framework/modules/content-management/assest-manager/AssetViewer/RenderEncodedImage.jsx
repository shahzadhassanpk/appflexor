import { useState } from "react";
import { status } from "./ImageFileUploader";

export default function RenderEncodedImage({
    file,
    index,
    encodedFiles = [],
    filesCollection = [],
    list = [],
    removeFile,
    setFilesCollection,
}) {
    const [showConfig, setShowConfig] = useState(false);
    const [enableEditMode, setEnableEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState({});
    const filteredFileArr = encodedFiles.filter(f => f.fileName === file.name);

    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setSelectedItem(prev => {
            return {
                ...prev,
                [name]: value,
            };
        });
    }

    function updateImageDetails() {
        let updatedArr = filesCollection.map(f => {
            if (f.id === selectedItem.id) {
                return selectedItem;
            }

            return f;
        });

        setFilesCollection(updatedArr);
        setSelectedItem({});
        setEnableEditMode(false);
    }
    function revertImageDetails() {
        setSelectedItem({});
        setEnableEditMode(false);
    }

    if (filteredFileArr.length > 0) {
        const encodedFile = filteredFileArr[0];

        return (
            <div
                className="col-sm-6 col-md-4 col-lg-3  col-xl-2 col-xxl-2 position-relative"
                onMouseEnter={() => setShowConfig(true)}
                onMouseLeave={() => setShowConfig(false)}>
                {enableEditMode ? (
                    <>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group text-left  ">
                                    <label className=" mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="form-control mb-2"
                                        value={selectedItem.title}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* <div className="col-sm-12   ">
                                <div className="form-group text-left  ">
                                    <label className=" mb-1">Tags</label>
                                    <input
                                        type="text"
                                        name="tags"
                                        className="form-control mb-2"
                                        value={selectedItem.tags}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div> */}
                            <div className="col-sm-12">
                                <i
                                    title="Save"
                                    className="fa-solid fa-floppy-disk fs-5 float-end pointer me-1"
                                    onClick={() => {
                                        updateImageDetails();
                                        // setEnableEditMode(true);
                                    }}></i>
                                <i
                                    title="Cancel"
                                    className="fa-solid fa-xmark fs-5 float-end pointer me-2"
                                    onClick={() => {
                                        revertImageDetails();
                                        // setEnableEditMode(true);
                                    }}></i>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            className="image-container"
                            style={{
                                height: "120px",
                                width: "100%",
                            }}>
                            <img
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    objectFit: "contain",
                                }}
                                className="img-thumbnail object-fit-contain img-theme-border mb-1"
                                src={encodedFile.contentBase64}
                                alt={file.name}
                            />
                        </div>
                        {showConfig && (
                            <span className="position-absolute top-0 start-0 ms-4 pt-2">
                                <span>
                                    {file.status === status.added && (
                                        <i
                                            title="Edit"
                                            className="fa-regular fa-pen-to-square pointer me-1"
                                            onClick={() => {
                                                setSelectedItem(file);
                                                setEnableEditMode(true);
                                            }}></i>
                                    )}
                                    &nbsp;
                                </span>

                                <span
                                    title="Delete"
                                    className="text-danger fa-solid fa-trash  pointer"
                                    onClick={() =>
                                        removeFile(file, index)
                                    }></span>
                            </span>
                        )}

                        <div
                            className="opacity-75 text-ellipsis"
                            style={{
                                width: "160px",
                            }}>
                            <i
                                title="uploaded"
                                className="fa-solid fa-cloud-arrow-up opacity-75 ps-1"></i>
                            &nbsp;
                            {file.title}
                        </div>
                    </>
                )}
            </div>
        );
    } else {
        return null;
    }
}

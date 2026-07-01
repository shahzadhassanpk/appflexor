import { useState } from "react";
import { IMAGE_BASE } from "../../../../Config";
import { status } from "./ImageFileUploader";

export default function RenderServerImage({
    file,
    index,
    filesCollection = [],
    list = [],
    removeFile,
    setFilesCollection,
    tableName,
}) {
    const [showConfig, setShowConfig] = useState(false);
    const [enableEditMode, setEnableEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState({});

    // const filteredFileArr = encodedFiles.filter(f => f.fileName === file.name);
    const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;
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
                    <img
                        className={`${
                            showConfig ? "opacity-50" : ""
                        }  img-thumbnail img-theme-border mb-1"`}
                        src={imageUrl}
                        alt={file.name}
                    />

                    {showConfig && (
                        <span className="position-absolute top-0 start-0 ms-4 pt-2">
                            <span>
                                <i
                                    title="Edit"
                                    className="fa-regular fa-pen-to-square pointer me-1"
                                    onClick={() => {
                                        setSelectedItem(file);
                                        setEnableEditMode(true);
                                    }}></i>
                                &nbsp;
                            </span>

                            <span
                                title="Delete"
                                className="text-danger fa-solid fa-trash  pointer"
                                onClick={() => removeFile(file, index)}></span>
                        </span>
                    )}
                    <div className="">
                        <i
                            // title="uploaded"
                            className="fa-solid fa-cloud opacity-75"></i>
                        &nbsp;
                        <span className="opacity-75">{file.title}</span>
                    </div>
                </>
            )}
        </div>
    );
}

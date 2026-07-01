import axios from "axios";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL, IMAGE_BASE } from "../../../../Config";
import Scroll from "../../../../components/Scroll/Scroll";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { makeShortId } from "../../../../utils/utils";
import { MODE_TYPE } from "./AssetsViewer";
import RenderImage from "./RenderImage";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { getSelectedItem as globalGetItem } from "../../../../components/CrudApiCall";

const CONFIG = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

export default function RenderImageGallery({
    list,
    selectedItem,
    hoveredItem,
    setHoveredItem,
    tableName,
    setSelectedItem,
    showImageViewer,
    setShowImageViewer,
    setUploadMode,
    handleGetData,
    setShowUploader,
}) {
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopiedStatus = index => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 5000);
    };

    let originUrl = window.location.origin;
    const imageUrl = `${originUrl}${IMAGE_BASE}/${tableName}/${hoveredItem.id}/${hoveredItem.image}`;

    async function deleteFileFromServer(file) {
        try {
            const url = `/file/service/${tableName}/${file.id}/${file.image}`;
            const response = await axios.delete(url, CONFIG);
            if (response.status === 200) {
                deleteFileFromDB(file);

                toastEmitter(`Deleted ${file.image}`, true, "success");
            }
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }

    async function deleteFileFromDB(file) {
        const url = API_URL + "?service.key=update.formData";
        const request = {
            data: [
                {
                    formId: tableName,
                    entity: tableName,
                    id: file.id,
                    action: "delete",
                    formData: {
                        id: file.id,
                    },
                },
            ],
        };
        try {
            const response = await axios.post(url, request);
            if (response.status === 200) {
                handleGetData();
            }
        } catch (e) {
            console.error("Error while sending save request:" + e);
        }
    }

    function deleteAllFromServer() {
        list.map(item => {
            deleteFileFromServer(item);
        });
    }

    async function getSelectedItem(file) {
        try {
            setUploadMode(MODE_TYPE.update);
            setShowUploader(true);
            const res = await getItem(file.id);
            file = res.data.C_DATA[file.id][0] ?? {};
            setSelectedItem(file);
        } catch (error) {
            toastEmitter("item not fount", true, "error");
            console.log(error);
        }
    }

    function getItem(id) {
        return globalGetItem({ id, serviceKey: "sys.selected.asset" });
    }

    return (
        <Scroll
            height="60vh"
            width="100%">
            <div className="row me-2 p-2">
                {list.map((file, index) => (
                    <div
                        key={index}
                        className={` col-sm-4 col-md-3 col-lg-3  col-xl-2 col-xxl-2 position-relative mb-2`}
                        onMouseEnter={() => setHoveredItem(file)}
                        onMouseLeave={() => setHoveredItem({})}>
                        <>
                            {/*
                                ImageHash : when updating an image we are not updating its src.
                                ImageHash will rewrite cache.
                            */}
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
                                    // style={{
                                    //     maxHeight: "200px",
                                    // }}
                                    className={`${
                                        hoveredItem.id === file.id
                                            ? "opacity-50"
                                            : ""
                                    }  img-thumbnail object-fit-contain img-theme-border mb-1"`}
                                    src={`${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`}
                                    alt={file.name}
                                    onDoubleClick={() => {
                                        setSelectedItem(file);
                                        setUploadMode(MODE_TYPE.update);
                                        setShowUploader(true);
                                    }}
                                />
                            </div>

                            {hoveredItem.id === file.id && (
                                <span className="position-absolute top-0 start-0 ms-4 pt-2">
                                    {/* <span>
                                        <i
                                            title="Edit"
                                            className="fa-regular fa-pen-to-square pointer me-1"
                                            onClick={() => {
                                                setSelectedItem(file);
                                                setUploadMode(MODE_TYPE.update);
                                                setShowUploader(true);
                                            }}></i>
                                        &nbsp;
                                    </span> */}

                                    <span
                                        title="Delete"
                                        className="text-danger fa-solid fa-trash  pointer"
                                        onClick={() =>
                                            deleteFileFromServer(file)
                                        }></span>
                                </span>
                            )}

                            {hoveredItem.id === file.id && (
                                <span
                                    className="position-absolute top-50 start-50 translate-middle"
                                    onClick={() => {
                                        getSelectedItem(file);
                                    }}>
                                    <i
                                        title="Edit"
                                        className="fa-regular fa-pen-to-square pointer m-1"></i>
                                </span>
                            )}
                            <div className="d-flex">
                                {/* <i className="fa-solid fa-cloud opacity-75 "></i> */}
                                {/* &nbsp; */}
                                <div
                                    className="opacity-75 text-ellipsis"
                                    title={`${file.title} (${file.dimensions})`}
                                    style={{
                                        width: "120px",
                                    }}>
                                    <span>{file.title}</span>
                                    <p className="m-0">{file.dimensions}</p>
                                </div>
                            </div>
                            <div className="image-url">
                                <CopyToClipboard
                                    text={imageUrl}
                                    onCopy={() => handleCopiedStatus(index)}>
                                    <span
                                        className="text-primary pointer"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        data-bs-title="Copy Image URL">
                                        Copy Image URL
                                    </span>
                                </CopyToClipboard>
                                {copiedIndex === index && (
                                    <span className="copy-msg">
                                        <i className="fa-solid fa-copy"></i>
                                        Copied
                                    </span>
                                )}
                            </div>
                        </>

                        <Modal
                            className="s2a-modal"
                            show={showImageViewer}
                            onHide={() => setShowImageViewer(false)}
                            keyboard={true}
                            animation={true}
                            size="lg"
                            fullscreen>
                            <Modal.Header>
                                <Modal.Title className="modal-title">
                                    <span>Image Viewer</span>
                                    <div className="d-flex">
                                        <i
                                            className="fa-solid fa-xmark modal-close"
                                            onClick={() => {
                                                setShowImageViewer(false);
                                            }}></i>
                                    </div>
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <RenderImage
                                    file={selectedItem}
                                    tableName={tableName}
                                />
                            </Modal.Body>
                        </Modal>
                    </div>
                ))}
            </div>
        </Scroll>
    );
}

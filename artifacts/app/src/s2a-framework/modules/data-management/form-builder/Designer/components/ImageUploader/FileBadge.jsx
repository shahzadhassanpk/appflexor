import { useState } from "react";
import { status } from "./ImageUploader";

export default function FileBadge({ file, componentData, removeFile }) {
    return (
        <div
            onMouseEnter={() => setShow(true)}
            className="img-uploader-border d-inline  rounded-1   me-1  py-1 px-2 position-relative">
            {componentData.show_status === "YES" && (
                <span>
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
                    )}{" "}
                    &nbsp;
                </span>
            )}

            {componentData.show_download === "YES" && (
                <span>
                    {file.id ? (
                        <>
                            {file.status === status.uploaded ? (
                                <a
                                    className="file"
                                    href={`/file/service/${file.table}/${file.id}/${file.name}`}>
                                    <i className="fa-solid fa-file-arrow-down  text-sm pointer opacity-75  me-2"></i>
                                </a>
                            ) : (
                                <a>
                                    <i className="fa-solid fa-file-arrow-down  text-sm not-allowed opacity-50  me-2"></i>
                                </a>
                            )}
                        </>
                    ) : (
                        <a>
                            <i className="fa-solid fa-file-arrow-down  text-sm not-allowed opacity-50  me-2"></i>
                        </a>
                    )}
                </span>
            )}
            <span onClick={() => removeFile(file)}>
                <i className="fa-solid fa-trash text-danger text-sm pointer opacity-75"></i>
            </span>
        </div>
    );
}

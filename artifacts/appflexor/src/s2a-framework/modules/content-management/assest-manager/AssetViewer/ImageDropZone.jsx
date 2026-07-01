import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function ImageDropZone({
    fieldId,
    className = "",
    onChange,
    muliple = true,
    uploadMode,
}) {
    // const onDrop = useCallback(
    //     acceptedFiles => {
    //         let event = { target: {} };

    //         event.target.id = fieldId;
    //         event.target.files = acceptedFiles;

    //         onChange(event);
    //     },
    //     [uploadMode],
    // );

    const onDrop = acceptedFiles => {
        let event = { target: {} };

        event.target.id = fieldId;
        event.target.files = acceptedFiles;

        onChange(event);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: muliple,
        accept: { "image/jpeg": [], "image/png": [], "image/jpg": [] },
        maxFiles: 5242880, // 5 MB
    });

    return (
        <div
            className={`${className} border border-3 my-2 border-color d-flex justify-content-center align-content-center p-4 pointer`}
            {...getRootProps()}>
            <input
                type="file"
                {...getInputProps()}
            />
            {isDragActive ? (
                <p>Drop the files here ...</p>
            ) : (
                <p>Drag 'n' drop image here, or click to select image</p>
            )}
        </div>
    );
}

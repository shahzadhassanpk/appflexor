import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function Uploader({
    id,
    className,
    type,
    value,
    onChange,
    disabled,
    multiple,
}) {
    const onDrop = useCallback(acceptedFiles => {
        let event = { target: {} };
        event.target.id = id;
        event.target.files = acceptedFiles;
        onChange(event);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [],
            "image/png": [],
            "image/jpg": [],
        },
    });

    return (
        <div
            className={`${className} border border-3 border-color d-flex justify-content-center align-content-center p-4`}
            {...getRootProps()}>
            <input
                disabled={disabled}
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

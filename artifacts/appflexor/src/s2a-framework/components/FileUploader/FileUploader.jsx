import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../Config";
import "./FileUploader.css";

function FileUploader({
    item,
    entity,
    record_id,
    setItem,
    field_id,
    getData,
    multiple = true,
    extensionsAllowed, // [ "png", "jpg", "jpeg"]
    serviceKey = "update.formData", // multi tenet support
}) {
    const config = {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    };

    const [files, setFiles] = useState([]);
    const inputElement = useRef();

    useEffect(() => {
        if (item[field_id] && item[field_id] !== "") {
            var fileArray = item[field_id].split(";");
            setFiles(fileArray);
        } else {
            setFiles([]);
        }
    }, [item]);

    async function handleChange(evt) {
        let selectedFiles = evt.target.files;
        let validFilesExtension = [];

        for (var index = 0; index < selectedFiles.length; index++) {
            let _file = selectedFiles[index];

            if (extensionsAllowed) {
                var re = /(?:\.([^.]+))?$/;
                var ext = re.exec(_file.name)[1];
                if (!extensionsAllowed.includes(ext)) {
                    validFilesExtension.push(`${ext}. `);
                }
            }
        }

        if (validFilesExtension.length > 0) {
            inputElement.current.value = "";
            alert(`${validFilesExtension} extensions not allowed.`);
        } else {
            if (multiple) {
                let currentFiles = [...files];

                for (var index = 0; index < selectedFiles.length; index++) {
                    let formData = new FormData();
                    formData.append("file", selectedFiles[index]);

                    currentFiles.push(selectedFiles[index].name);

                    const response = await axios.put(
                        `/file/service/${entity}/${record_id}/`,
                        formData,
                        config,
                    );

                    if (response.data.C_STATUS == "SUCCESS") {
                        saveData(currentFiles, field_id);
                    }
                }
                setFiles(currentFiles);
                if (typeof setItem !== "undefined") {
                    let str = currentFiles.join(";");
                    setItem(prev => ({ ...prev, [field_id]: str }));
                }
            } else {
                let currentFiles = [...files];

                if (currentFiles.length > 0) {
                    let _file = currentFiles[0];
                    currentFiles = currentFiles.splice(index, 1);

                    const deleteResponse = await axios.delete(
                        `/file/service/${entity}/${record_id}/${_file}`,
                        config,
                    );

                    if (deleteResponse.data.C_STATUS == "SUCCESS") {
                        console.log("_file" + _file + "deleted.");
                    }
                }

                for (var index = 0; index < selectedFiles.length; index++) {
                    let formData = new FormData();
                    formData.append("file", selectedFiles[index]);

                    currentFiles.push(selectedFiles[index].name);

                    const response = await axios.put(
                        `/file/service/${entity}/${record_id}/`,
                        formData,
                        config,
                    );

                    if (response.data.C_STATUS == "SUCCESS") {
                        saveData(currentFiles), field_id;
                    }
                }

                setFiles(currentFiles);
                if (typeof setItem !== "undefined") {
                    let str = currentFiles.join(";");
                    setItem(prev => ({ ...prev, [field_id]: str }));
                }
            }
        }
    }

    function saveData(fileArray, field) {
        var url = `${API_URL}?service.key=${serviceKey}`;
        var request = {};
        request.data = [];
        var entityForm = {};
        var record = { ...item };

        if (fileArray && field) {
            record[field] = fileArray;
        }

        entityForm.formId = entity; //"formid"
        entityForm.entity = entity; //Db- "table name"
        entityForm.action = "update";
        if (!record.id || record.id == "") {
            record.id = "new";
            entityForm.id = "new";
        } else {
            entityForm.id = record.id;
            console.log("Update");
        }

        record[field_id] = fileArray.join(";");
        entityForm.formData = { id: record.id, [field_id]: record[field_id] };
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (getData) {
                        getData();
                        inputElement.current.value = "";
                    }
                }
            });
        } catch (e) {
            console.error("Error while sending save request:" + e);
        }
    }

    function removeFile(file, index) {
        var fileArray = [...files];
        fileArray.splice(index, 1);
        setFiles(fileArray);

        if (typeof setItem !== "undefined") {
            let str = fileArray.join(";");
            setItem(prev => ({ ...prev, [field_id]: str }));
        }

        try {
            axios
                .delete(`/file/service/${entity}/${record_id}/${file}`, config)
                .then(function (response) {
                    console.log(response);
                    saveData(fileArray, field_id);
                    inputElement.current.value = "";
                });
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }
    return (
        <div
            id="uploadFile"
            className="file-uploader">
            <input
                type="file"
                ref={inputElement}
                className="form-control file"
                onChange={handleChange}
                multiple={multiple}
                disabled={item.id == "" || item.id == "new"}
            /> 
            <div>
                {files.length > -1 &&
                    files.map((file, index) => {
                        return (
                            file && (
                                <div
                                    key={index}
                                    className="m-0">
                                    <a
                                        className="file"
                                        href={`/file/service/${entity}/${record_id}/${file}`}
                                        key={index}>
                                        {file}
                                    </a>
                                    <span
                                        className="ps-2 text-danger removeBtn"
                                        onClick={() => removeFile(file, index)}>
                                        remove
                                    </span>
                                </div>
                            )
                        );
                    })}
            </div>
        </div>
    );
}

export default FileUploader;

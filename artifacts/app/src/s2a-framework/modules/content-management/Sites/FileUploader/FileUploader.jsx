import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../Config";
import "./FileUploader.css";

function FileUploader({
    item,
    entity,
    record_id,
    field_id,
    getData,
    multiple = true,
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

    function handleChange(evt) {
        let file = evt.target.files;
        let fileArray = [...files];
        for (var index = 0; index < file.length; index++) {
            let formData = new FormData();
            formData.append("file", file[index]);
            fileArray.push(file[index].name);
            axios
                .put(`/file/service/${entity}/${record_id}/`, formData, config)
                .then(function (response) {
                    if (response.data.C_STATUS == "SUCCESS") {
                        saveData(fileArray);
                    }
                });
        }
        setFiles(fileArray);
    }

    function saveData(fileArray) {
        var url = API_URL + "?service.key=update.site";
        var request = {};
        request.data = [];
        var entityForm = {};
        var record = { ...item };
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

        try {
            axios
                .delete(`/file/service/${entity}/${record_id}/${file}`, config)
                .then(function (response) {
                    console.log(response);
                    saveData(fileArray);
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
                        );
                    })}
            </div>
        </div>
    );
}

export default FileUploader;

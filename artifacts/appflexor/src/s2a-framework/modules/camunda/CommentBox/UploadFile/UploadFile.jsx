import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../Config";
import "./UploadFile.css";
function UploadFile({ item, entity, record_id, field_id, getData }) {
    // console.log({ item, entity, record_id, field_id, getData });
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    const $ = window.$;
    const [files, setFiles] = useState([]);
    const [error, setError] = useState("");
    const [filesData, setFilesData] = useState([]);
    const [fileId, setFileId] = useState(item.id);
    const config = {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    };
    useEffect(() => {
        if (item[field_id] && item[field_id] !== "") {
            var fileArray = item[field_id].split(";");
            setFiles(fileArray);
        } else {
            setFiles([]);
        }
    }, [item]);

    useEffect(() => {
        console.log("Files");
        if (filesData.length > 0 && fileId && fileId !== "new") {
            uploadFiles();
        } else if (filesData.length > 0 && (!fileId || fileId === "new")) {
            saveData();
        }
        console.log(files);
    }, [filesData, fileId]);

    function handleChange(evt) {
        let file = evt.target.files;
        let _error = "";
        let fileArray = [...files];
        let filesDataArray = [...filesData];
        for (var index = 0; index < file.length; index++) {
            if (file[index].size < MAX_FILE_SIZE) {
                fileArray.push(file[index].name);
                filesDataArray.push(file[index]);
            } else {
                _error =
                    _error +
                    file[index].name +
                    " exceed file limit " +
                    MAX_FILE_SIZE +
                    " file size " +
                    file[index].size;
                setError(_error);
            }
        }
        setFiles(fileArray);
        setFilesData(filesDataArray);
    }

    function uploadFiles() {
        let file = [...filesData];
        for (var index = 0; index < file.length; index++) {
            let formData = new FormData();
            formData.append("file", file[index]);
            axios
                .put(`/file/service/${entity}/${fileId}/`, formData, config)
                .then(function (response) {
                    if (response.data.C_STATUS == "SUCCESS") {
                        if (getData) {
                            getData();
                        }
                    }
                });
        }
    }

    function saveData() {
        let fileArray = [...files];
        // let file = [...filesData];
        // for (var index = 0; index < file.length; index++) {
        //     fileArray.push(file[index].name)
        // }
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};
        var record = { ...item };
        entityForm.formId = entity;
        entityForm.entity = entity;
        entityForm.action = "update";
        if (!record.id || record.id == "") {
            record.id = "new";
            entityForm.id = "new";
            if (record.id !== record_id) {
                entityForm.record_id = record_id;
            }
        } else {
            entityForm.id = record.id;
            // console.log("Update");
        }

        record[field_id] = fileArray.join(";");
        entityForm.formData = {
            ...record,
            id: record.id,
            [field_id]: record[field_id],
        };
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (response.data.C_STATUS == "SUCCESS") {
                        if (item.id === "" || item.id === "new") {
                            let id = response.data.C_DATA[0].formData.id;
                            setFileId(id);
                        }
                    }
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function removeFile(file, index) {
        var fileArray = [...files];
        fileArray.splice(index, 1);
        setFiles(fileArray);
        axios
            .delete(`/file/service/${entity}/${record_id}/${file}`, config)
            .then(function (response) {
                // console.log(response);
                saveData();
                $(".file").val("");
            });
    }
    return (
        <div className="file-uploader">
            <input
                type="file"
                className="form-control file"
                onChange={handleChange}
                multiple
                disabled={!item.id || item.id == ""}
            />
            <span>{error}</span>
            <div>
                {files.length > -1 &&
                    files.map((file, index) => {
                        return (
                            <div key={index} className="m-0">
                                <a
                                    className="file"
                                    href={`/file/service/${entity}/${record_id}/${file}`}
                                    key={index}
                                >
                                    {file}
                                </a>
                                <span
                                    className="ps-2 text-danger removeBtn"
                                    onClick={() => removeFile(file, index)}
                                >
                                    remove
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export { UploadFile };

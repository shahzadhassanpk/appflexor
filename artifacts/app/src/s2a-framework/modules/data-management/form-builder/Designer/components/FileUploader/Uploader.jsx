import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../../Config";

const config = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

function Uploader({ componentData, tableName }) {
    const [fileList, setFileList] = useState([]);
    const [fileNameList, setFileNameList] = useState("");
    const inputElement = useRef();
    const encodeCompleted = useRef(false);
    const recordId = componentData.id ? componentData.id : "new";
    const columnName = componentData.db_column;

    useEffect(() => {
        console.log(componentData);
        if (componentData[columnName] && componentData[columnName] !== "") {
            var fileArray = componentData[columnName].split(";");
            // setFileList(fileArray);
        } else {
            // setFileList([]);
        }
    }, [componentData]);

    useEffect(() => {
        if (encodeCompleted.current) {
            console.log(fileList);
            console.log(fileNameList);
            if (fileList && fileNameList) {
                saveData(fileNameList, fileList);
            }
        }
    }, [encodeCompleted, fileList, fileNameList]);

    function handleChange(event) {
        try {
            let filesSelected = event.target.files;
            let tempArr = [];
            let tempStr = "";
            let fileEncodeCounter = 0;
            for (let i = 0; i < filesSelected.length; i++) {
                fileEncodeCounter++;
                let fileReader = new FileReader();

                fileReader.onload = fileLoadedEvent => {
                    // data: base64
                    let content = fileLoadedEvent.target.result;
                    let fileName = filesSelected[i].name;
                    tempArr.push({
                        fileName: fileName,
                        content: content,
                    });

                    tempStr += fileName + ";";

                    setFileList(tempArr);
                    setFileNameList(tempStr);
                    if (filesSelected.length === fileEncodeCounter) {
                        encodeCompleted.current = true;
                    }
                };
                fileReader.readAsDataURL(filesSelected[i]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function saveDataOld(fileArray) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};
        var record = { ...componentData };

        entityForm.formId = tableName;
        entityForm.entity = tableName;
        entityForm.action = "update";

        if (!record.id || record.id == "") {
            record.id = "new";
            entityForm.id = "new";
        } else {
            entityForm.id = record.id;
            console.log("Update");
        }

        record[columnName] = fileArray.join(";");

        entityForm.formData = {
            id: record.id,
            [columnName]: record[columnName],
        };

        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    // if (getData) {
                    //     getData();
                    //     inputElement.current.value = "";
                    // }
                }
            });
        } catch (e) {
            console.error("Error while sending save request:" + e);
        }
    }

    function saveData(fileNames, fileArray) {
        const url = API_URL + "?service.key=update.formData";

        let request = {
            data: [
                {
                    formId: tableName,
                    entity: tableName,
                    action: "update",
                    id: recordId,
                    formData: {
                        id: recordId,
                        [columnName]: fileNames,
                    },
                    fileData: fileArray,
                },
            ],
        };

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    // if (getData) {
                    //     getData();
                    //     inputElement.current.value = "";
                    // }
                }
            });
        } catch (e) {
            console.error("Error while sending save request:" + e);
        }
    }

    function removeFile(file, index) {
        var fileArray = [...fileList];
        fileArray.splice(index, 1);
        setFileList(fileArray);

        try {
            axios
                .delete(
                    `/file/service/${tableName}/${recordId}/${file}`,
                    config,
                )
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
        <div className="file-uploader-new">
            <input
                type="file"
                ref={inputElement}
                className="form-control file"
                onChange={handleChange}
                multiple={true}
                disabled={
                    props.mode === props.modeType.design
                        ? true
                        : componentData.readonly === "YES"
                        ? true
                        : false
                }
                // disabled={!record_id.id || record_id.id == "" || record_id.id == "new"}
            />
            <div>
                {fileList &&
                    fileList.length > -1 &&
                    fileList.map((file, index) => {
                        return (
                            <div
                                key={index}
                                className="m-0">
                                <a
                                    className="file"
                                    href={`/file/service/${tableName}/${recordId}/${file.fileName}`}
                                    key={index}>
                                    {file.fileName}
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

export default Uploader;

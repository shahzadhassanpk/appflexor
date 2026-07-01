import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { API_URL } from "../../../../../Config";
import axios from "axios";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import { useState, useEffect } from "react";
import { tryToParse } from "../../../../data-management/form-builder/Forms/FormViewer/utils";
// import { CSVToJSON } from "../datalist-helper/DatalistHelpers";

function ImportModal({
    show,
    setShow,
    // csvToJson,
    selectedItem,
    getForm,
    datasource,
}) {
    const [arrayLength, setArrayLength] = useState(0);
    const [data, setData] = useState([]);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    let importFileType = "";

    const handleClose = () => {
        setShow(prev => ({
            ...prev,
            import: false,
        }));
        setArrayLength(0);
        setData([]);
    };
    const handleInput = event => {
        let file = event.target;
        var reader = new FileReader();
        let fileType = file.value.split(".");
        // const layout = tryToParse(selectedItem.layout);
        // const actions = layout.actions;
        // const exportAction = actions.find(action => action.code === "export");
        // const export_json = exportAction.json_export;
        const export_json = selectedItem?.datalist_export_type;
        importFileType = fileType[1];
        if (export_json === "JSON") {
            if (fileType && fileType[1] === "json") {
                reader.onload = e => {
                    let data = tryToParse(e.target.result);
                    // let data = CSVToJSON(e.target.result, selectedItem);
                    setData(data);
                };

                reader.readAsText(file.files[0]);
            } else {
                toastEmitter("Please upload a json or csv file", true, "error");
            }
        } else {
            if (fileType && fileType[1] === "csv") {
                reader.onload = e => {
                    let data = csvToJson(e.target.result, selectedItem);
                    setData(data);
                };

                reader.readAsText(file.files[0]);
            } else {
                toastEmitter("Please upload a json or csv file", true, "error");
            }
        }
    };

    function csvToJson(csvString) {
        const rows = csvString.split("\n");

        const headers = rows[0].split(",");

        const jsonData = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(",");

            const obj = {};

            for (let j = 0; j < headers.length; j++) {
                const key = headers[j] ? headers[j].trim() : "";
                const value = values[j] ? values[j].trim() : "";

                obj[key] = value;
            }

            jsonData.push(obj);
        }
        return jsonData;
    }

    useEffect(() => {
        if (data && data.length > 0) {
            try {
                let _length =
                    typeof data === "string" ? JSON.parse(data) : data;
                if (data.some(item => item.id === "")) {
                    setArrayLength(_length.length - 1);
                } else {
                    setArrayLength(_length.length);
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    function MultiRequest(jsonArray, selectedItem) {
        let layout = {};
        let updatedArr = [];
        let array = tryToParse(jsonArray);
        if (array.some(item => item.id === "")) {
            array.pop();
        }
        try {
            layout = tryToParse(selectedItem.layout);

            let selected_fields = layout.selected_fields;

            let objParent = {};

            if (selectedItem.type === "SQL") {
                var importObj = layout.actions.find(
                    item => item.code === "import",
                );
            }
            selected_fields.forEach(item => {
                if (
                    item.selected &&
                    (item.type === "checklist" || item.type === "taglist")
                ) {
                    objParent[item.db_column] = item.type;
                }
            });
            array.forEach(item => {
                for (let key in objParent) {
                    if (
                        item[key] &&
                        objParent[key] === "checklist" &&
                        item[key].includes("[")
                    ) {
                        let str = "";
                        let checkList = tryToParse(item[key]);
                        checkList.forEach((check, i, arr) => {
                            arr.length - 1 === i
                                ? (str += `${check}`)
                                : (str += `${check},`);
                        });
                        checkList = str;
                    } else if (
                        item[key] &&
                        objParent[key] === "taglist" &&
                        item[key].includes("[")
                    ) {
                        let str = "";
                        let tagList = tryToParse(item[key]);
                        tagList.forEach((tag, i, arr) => {
                            if (typeof tag === "object") {
                                arr.length - 1 === i
                                    ? (str += `${tag["id"]}`)
                                    : (str += `${tag["id"]},`);
                            } else {
                                arr.length - 1 === i
                                    ? (str += `${tag}`)
                                    : (str += `${tag},`);
                            }
                        });
                        item[key] = str;
                    }
                }
                delete item.datecreated;
                delete item.datemodified;
                updatedArr.push(item);
            });
        } catch (error) {
            console.log(error);
        }
        var url = API_URL + "?service.key=update.formData";
        var request = {
            saveOrUpdate: "YES",
        };
        request.data = [];
        updatedArr.forEach(item => {
            var entityForm = {};
            entityForm.formId =
                selectedItem.type === "FORM"
                    ? selectedItem.table
                    : importObj.table; //"formid"
            entityForm.entity =
                selectedItem.type === "FORM"
                    ? selectedItem.table
                    : importObj.table; //Db- "table name"
            entityForm.action = "update";
            entityForm.formData = item;
            entityForm.formData.id = item.id ? item.id : "new";
            entityForm.id = item.id ? item.id : "new";
            request.data.push(entityForm);
        });
        request.datasource = selectedItem.datasource;
        if (
            (selectedItem.type === "SQL" && importObj.table) ||
            selectedItem.type === "FORM"
        ) {
            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                        selectedItem.type === "FORM"
                            ? getForm(selectedItem.form_id)
                            : getForm(null, selectedItem.id);
                        toastEmitter("Record Saved successfully", true);
                        handleClose();
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else {
            toastEmitter("Table name is required", true, "error");
        }
    }

    return (
        <>
            <Modal
                className="s2a-modal"
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Data Import</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group
                        controlId="formFile"
                        className="mb-3">
                        <Form.Label>
                            Upload File {"( .json or .csv ) "}
                        </Form.Label>
                        <Form.Control
                            type="file"
                            onChange={e => handleInput(e)}
                        />
                        <p>Uploaded {arrayLength} Record(s)</p>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        className="btn btn-sm button-theme"
                        disabled={arrayLength ? false : true}
                        onClick={() => MultiRequest(data, selectedItem)}>
                        Save Changes
                    </Button>
                    <Button
                        className="btn btn-sm button-theme"
                        onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ImportModal;

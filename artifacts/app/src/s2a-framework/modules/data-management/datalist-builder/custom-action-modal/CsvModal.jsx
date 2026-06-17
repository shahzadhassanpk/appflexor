import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { CSVToJSON } from "../../../../utils/utils";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { API_URL } from "../../../../Config";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

function CsvModal(props) {
    const { csvModal, handleClose, getData, tableName, sites } = props;
    const [data, setData] = useState([]);
    const [arrayLength, setArrayLength] = useState(0);
    const [selectedSite, setSelectedSite] = useState("");
    const [selectedOption, setSelectedOption] = useState("");
    const [loading, setLoading] = useState(false);
    const radioOption = [
        { code: "update", title: "Update" },
        { code: "new", title: "Add new" },
    ];
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    useEffect(() => {        
        if (props?.selectedSite) {
            setSelectedSite(props?.selectedSite);
        }
    }, [props?.selectedSite]);

    useEffect(() => {
        setArrayLength(0);
        if (csvModal === false) {
            setSelectedOption("");
            setSelectedSite("");
            setData([]);
        }
    }, [csvModal]);

    useEffect(() => {
        if (data && data.length > 0) {
            try {
                let _data = typeof data === "string" ? JSON.parse(data) : data;
                setArrayLength(_data.length);
                setLoading(false);
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    function csvLoad(e) {
        setLoading(true);
        let file = e.target;
        var reader = new FileReader();

        if (file.value.includes("json")) {
            reader.onload = e => {
                let data = CSVToJSON(e.target.result);
                setData(data);
            };

            reader.readAsText(file.files[0]);
        } else {
            toastEmitter("Please upload a json file", true);
        }
    }

    function MultiRequest(data, table, getData, selectedSite, selectedOption) {
        let _array = [];
        let array = typeof data === "string" ? JSON.parse(data) : data;
        array.forEach(item => {
            if (item.selected === true) {
                delete item.selected;
            }
            if (table === "post" || table === "styles") {
                item.channel_id = selectedSite ? selectedSite : item.channel_id;
                item.id = (item.channel_id == selectedSite) ? item.id : "new";
            } else {
                item.channel = selectedSite ? selectedSite : item.channel;
                item.id = (item.channel == selectedSite) ? item.id : "new";
            }
            // item.id = selectedOption === "new" ? "new" : item.id;
            _array.push(item);
        });
        if (_array.length > 0) {
            let _serviceKey =
                table === "app_site"
                    ? "?service.key=update.site"
                    : "?service.key=update.formData";
            var url = API_URL + _serviceKey;
            var request = {saveOrUpdate: "Yes"};
            request.data = [];
            _array.forEach(item => {
                var entityForm = {};
                entityForm.formId = table; //"formid"
                entityForm.entity = table; //Db- "table name"
                entityForm.action = "update";
                entityForm.formData = item;
                entityForm.formData.id = item.id ? item.id : "new";
                entityForm.id = item.id ? item.id : "new";
                request.data.push(entityForm);
            });

            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                        getData();
                        toastEmitter("Record Saved successfully", true);
                        setArrayLength(0);
                        handleClose();
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else {
            toastEmitter("Select Json File", true, "warning");
        }
    }

    function handleSelectedSite(e) {
        const { value } = e.target;
        setSelectedSite(value);
    }
    return (
        <>
            <Modal
                className="s2a-modal s2a-csv-modal"
                show={csvModal}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{props.title}</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window"
                                title="Maximize window">
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
                                data-bs-title="Restore Window"
                                title="Restore window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                title="Close"
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        {sites && (
                            <div className="col-sm-12">
                                <label>Select Site <span className="text-danger">*</span></label>
                                <select
                                    className="form-select mb-3"
                                    value={selectedSite}
                                    onChange={e => handleSelectedSite(e)}>
                                    <option value="">Select Site</option>
                                    {sites?.map((site, i) => (
                                        <option
                                            key={i}
                                            value={site.id}>
                                            {site.brand_title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* Use SaveOrUpdate this is Not Required <div className="col-sm-6 mt-1">
                            <label>Select Action</label>
                            <div className="d-flex mt-2">
                                {radioOption.map((item, i) => (
                                    <div
                                        key={i}
                                        className="form-check me-2"
                                        onClick={() =>
                                            setSelectedOption(item.code)
                                        }>
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="exampleRadios"
                                            id={item.title}
                                            value="option3"
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={item.title}>
                                            {item.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div> */}
                    </div>
                    <div>
                        <span className="d-flex justify-content-between my-1">
                            <label htmlFor="json-file">
                                Select Json File <span className="text-danger">*</span>{" "}
                                {loading && (
                                    <div
                                        className="spinner-border spinner-border-sm"
                                        role="status"></div>
                                )}
                            </label>
                            <p className="m-0">Total Record: {arrayLength}</p>
                        </span>
                        <input
                            id="json-file"
                            className="form-control"
                            type="file"
                            placeholder="Select Csv File"
                            onChange={e => csvLoad(e)}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        className="btn btn-sm button-theme"
                        onClick={handleClose}>
                        Close
                    </Button>
                    <button
                        type="button"                        
                        disabled={
                            arrayLength === 0 ||
                            // selectedOption === "" || Not required
                            (sites && selectedSite === "")
                        }
                        className="btn btn-sm button-theme"
                        onClick={() =>
                            MultiRequest(
                                data,
                                tableName,
                                getData,
                                selectedSite,
                                selectedOption,
                            )
                        }>
                        Save
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default CsvModal;

import React, { useEffect, useState } from "react";
import { tryToParse } from "../../form-builder/Forms/FormViewer/utils";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { API_URL } from "../../../../Config";
import axios from "axios";

const DatalistImport = props => {
    const { sites, importModalRef, getData } = props;
    const [data, setData] = useState([]);
    const [arrayLength, setArrayLength] = useState(0);

    useEffect(() => {
        setArrayLength(0);
        setData([]);
    }, []);

    useEffect(() => {
        if (data && data.length > 0) {
            let _data = tryToParse(data);
            setArrayLength(_data.length);
        }
    }, [data]);

    function csvLoad(e) {
        let file = e.target;
        var reader = new FileReader();

        if (file.value.includes("json")) {
            reader.onload = e => {
                let data = tryToParse(e.target.result);
                setData(data);
            };

            reader.readAsText(file.files[0]);
        } else {
            toastEmitter("Please upload a json file", true);
        }
    }

    function MultiRequest(data, getData) {
        const dataObj = data[0];
        const datalists = tryToParse(dataObj.datalists);
        const forms = tryToParse(dataObj.forms);
        const allItems = [];

        datalists.forEach(item => {
            item.savetable = "app_datalist";
            allItems.push(item);
        });
        forms.forEach(item => {
            item.savetable = "app_form";
            allItems.push(item);
        });
        if (allItems.length > 0) {
            let _serviceKey = "?service.key=update.formData";
            var url = API_URL + _serviceKey;
            var request = {
                saveOrUpdate: "Yes",
            };
            request.data = [];
            allItems.forEach(item => {
                var entityForm = {};
                entityForm.formId = item.savetable; //"formid"
                entityForm.entity = item.savetable; //Db- "table name"
                delete item.savetable;
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
                        importModalRef.current.close();
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else {
            toastEmitter("Select Json File", true, "warning");
        }
    }

    return (
        <>
            <div className="row s2a-datalist-import-form">
                <div>
                    <span className="d-flex justify-content-between my-1">
                        <label htmlFor="json-file">Select Json File</label>
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
            </div>
            <div className="mt-2 float-end">
                <button
                    type="button"
                    title={
                        sites
                            ? `selected site , select function or json file`
                            : `select function or json file`
                    }
                    disabled={
                        arrayLength === 0 || (sites && selectedSite === "")
                    }
                    className="btn btn-sm button-theme"
                    onClick={() => MultiRequest(data, getData)}>
                    Save
                </button>
            </div>
        </>
    );
};

export default DatalistImport;

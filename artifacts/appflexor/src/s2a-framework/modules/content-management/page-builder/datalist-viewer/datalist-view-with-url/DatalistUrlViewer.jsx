import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { API_URL } from "../../../../../Config";
import DataListViewer from "../viewer/DataListViewer";
import { modeType } from "../../Designer/Designer";
import { useParams } from "react-router-dom";

function DatalistUrlViewer(props) {
    let { id } = useParams();
    const [selectedDatalist, setSelectedDatalist] = useState({
        id: "",
        form_id: "",
    });
    const [url, setUrl] = useState({
        fkColumn: "",
        fkValue: "",
    });

    useEffect(() => {
        try {
            if (props === undefined || JSON.stringify(props) === "{}") {
                let selectedId = id.split(":id=")[1];
                let url = window.location.href;
                let decodeData = url.split("?");
                decodeData = decodeURIComponent(decodeData[1]);
                let values =
                    decodeData !== "undefined" ? decodeData.split(",") : "";
                if (values) {
                    let fkColumn = values[0].split("fkColumn=");
                    let fkValue = values[1].split("fkValue=");
                    let filterCondition = values[2].split("filter=");
                    setUrl(pre => ({
                        ...pre,
                        fkColumn: fkColumn[1],
                        fkValue: fkValue[1],
                        filterCondition:filterCondition[1],
                    }));
                }
                getSelectedDatalist(selectedId);
            }
        } catch (error) {
            console.log(error);
        }
    }, [id]);

    useEffect(() => {
        if (props && props.id) {
            getSelectedDatalist(props.id);
        }
    }, [props]);

    function getSelectedDatalist(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "selectedDatalist",
                    serviceKey: "sys.selected.datalist",
                    mode: "formData",
                },
            ],
        };
        dataRequest.datasource = "";
        let url = API_URL + "?service.key=masterKey.tenantData";
        axios.post(url, dataRequest).then(response => {
            if (response.data.C_DATA.selectedDatalist) {
                let record = response.data.C_DATA.selectedDatalist[0];
                setSelectedDatalist(prev => ({
                    ...prev,
                    id: record.id,
                    form_id: record.form_id,
                }));
            }
        });
    }

    return (
        <>
            {selectedDatalist &&
                selectedDatalist.id !== "" &&
                url.fkColumn === "" && (
                    <DataListViewer
                        ids={selectedDatalist}
                        mode={modeType.render}
                        modeType={modeType}
                        fkColumn={props && props.fkColumn}
                        fkValue={props && props.fkValue}
                    />
                )}
            {selectedDatalist &&
                selectedDatalist.id !== "" &&
                url.fkColumn !== "" && (
                    <DataListViewer
                        ids={selectedDatalist}
                        mode={modeType.render}
                        modeType={modeType}
                        fkColumn={url && url.fkColumn}
                        fkValue={url && url.fkValue}
                    />
                )}
        </>
    );
}

export default DatalistUrlViewer;

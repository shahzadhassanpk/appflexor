import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { BPM_API_URL, API_URL } from "../../../../../Config";
import { tryParseJSONObject } from "../../../../../utils/utils";
import DatalistListing from "../datalist-listing-modal/DatalistListing";
import DataListTableById from "./DataListTableById";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import { isEmpty } from "../../../../data-management/form-builder/Forms/FormViewer/utils";

export default function PEDataListViewer(props) {
    const [selectedForm, setSelectedForm] = useState({});
    const [selectedItem, setSelectedItem] = useState();
    const [selectedComponent, setSelectedComponent] = useState({});
    const [hideActions, setHideActions] = useState(false);
    const [hideSearch, setHideSearch] = useState(false);
    const [hidePagination, setHidePagination] = useState(false);
    const [dataList, setDataList] = useState([]);
    const [filteredDataList, setFilteredDataList] = useState([]);
    const [show, setShow] = useState(false);
    const [hideCheckBoxes, setHideCheckBoxes] = useState(false);
    const [hideLabel, setHideLabel] = useState(false);

    const lastId = useRef(null);

    useEffect(() => {
        if (props?.component?.data) {
            let selectedItem = props.component.data;
            setSelectedComponent(selectedItem);
            // setHidePagination(props.component.data.hidePagination);
            // setHideActions(props.component.data.hideActions);
            // setHideSearch(props.component.data.hideSearch);
            // setHideCheckBoxes(props.component.data.hideCheckBoxes);
            // setHideLabel(props.component.data.hideLabel);
        }
    }, []);

    useEffect(() => {
        if (selectedComponent && selectedComponent.id) {
            if (props.isInsideForm) {
                if (
                    lastId.current === null ||
                    lastId.current !== props.ids.id
                ) {
                    getSelectedDataList(props.ids);
                    lastId.current = props.ids.id;
                }
            } else if (props && checkObject(selectedComponent)) {
                getSelectedDataList(selectedComponent);
            }
        }
    }, [selectedComponent.id]);
    useEffect(() => {
        if (selectedForm?.id && selectedForm?.id !== "") {
            setSelectedItem(prev => ({
                ...prev,
                datasource: selectedForm.datasource,
                user_prefix: selectedForm.useprefix,
            }));
        }
    }, [selectedForm]);

    useEffect(() => {
        if (props.isInsideForm) {
            // isInsideForm Boolean is sent from FormDesigner
            if (lastId.current === null || lastId.current !== props.ids.id) {
                getSelectedDataList(props.ids);
                lastId.current = props.ids.id;
            }
        }
    }, [props]);

    useEffect(() => {
        if (props && checkObject(props?.ids)) {
            getSelectedDataList(props.ids);
        }
    }, [props?.ids?.form_id, props?.ids?.id]);

    function checkObject(object) {
        try {
            for (let key in object) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return false;
    }

    // API calls

    // function getData() {
    //     var dataRequest = {
    //         dataKeys: [                
    //             {
    //                 serviceParams: "",
    //                 dataKey: "dataList",
    //                 serviceKey: "sys.datalist.viewer.list",
    //                 mode: "formData",
    //             },
    //         ],
    //     };

    //     axios
    //         .post(BPM_API_URL + "?service.key=process.data", dataRequest)
    //         .then(response => {
    //             if (response.data.C_STATUS === "UNAUTHORIZED") {
    //                 console.log(`UNAUTHORIZED, please login.`);
    //             } else if (response.data.C_STATUS === "SUCCESS") {
    //                 if (response.data.C_DATA.dataList) {
    //                     // setDataList(
    //                     //     response.data.C_DATA.dataList.sort((a, b) =>
    //                     //         a.name > b.name ? 1 : -1,
    //                     //     ),
    //                     // );
    //                     // setFilteredDataList(response.data.C_DATA.dataList);
    //                     setShow(true);
    //                 } else {
    //                     console.log(
    //                         `Either list.all.forms does not exists or SQL query returns no result.`,
    //                     );
    //                 }
    //             }
    //         })
    //         .catch(error => {
    //             console.error(error);
    //         });
    // }

    function getSelectedForm(form_id) {
        var dataRequest = {};

        dataRequest = {
            dataKeys: [
                {
                    serviceParams: form_id,
                    dataKey: "selectedForm",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(BPM_API_URL + "?service.key=process.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        if (response.data.C_DATA.selectedForm.length > 0) {
                            try {
                                let selectedForm =
                                    response.data.C_DATA.selectedForm[0];
                                if (selectedForm) {
                                    selectedForm.design = tryParseJSONObject(
                                        selectedForm.design,
                                        {},
                                    );
                                    setSelectedForm(selectedForm);
                                }
                            } catch (error) {
                                console.log(error);
                            }
                        } else {
                            setSelectedForm({});
                        }
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getSelectedDataList(selectedItem) {
        var dataRequest = {};

        dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedItem.id,
                    dataKey: "selectedDataList",
                    serviceKey: "sys.selected.datalist",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(BPM_API_URL + "?service.key=process.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        // ;
                        if (response.data.C_DATA.selectedDataList.length > 0) {
                            try {
                                if (selectedItem.id) {
                                    var selectedDataListOnly =
                                        response.data.C_DATA
                                            .selectedDataList[0];

                                    let parsedLayout = tryParseJSONObject(
                                        response.data.C_DATA.selectedDataList[0]
                                            .layout,
                                    );
                                    const actions = [
                                        "add",
                                        "export",
                                        "import",
                                        "refresh",
                                        "resetfilter",
                                    ];
                                    parsedLayout.actions.forEach(item => {
                                        if (
                                            item.code === "pagination" &&
                                            hidePagination
                                        ) {
                                            item.selected = false;
                                        } else if (
                                            item.code === "search" &&
                                            hideSearch
                                        ) {
                                            item.selected = false;
                                        } else if (
                                            item.code === "allowall" &&
                                            hideCheckBoxes
                                        ) {
                                            item.selected = false;
                                        } else if (
                                            actions.includes(item.code) &&
                                            hideActions
                                        ) {
                                            item.selected = false;
                                        }
                                    });
                                    selectedDataListOnly.layout = parsedLayout;
                                    setSelectedItem(selectedDataListOnly);
                                    if (selectedDataListOnly?.form_id) {
                                        getSelectedForm(
                                            selectedDataListOnly.form_id,
                                        );
                                    }
                                }
                            } catch (error) {
                                console.log(error);
                            }
                        } else {
                            setSelectedItem({});
                        }
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function saveDataListIdInLayout() {
        if (props.setComponentPropsData && selectedItem) {
            let tempObj = {
                id: selectedItem.id,
                form_id: selectedItem.form_id,
                title: selectedItem.name,
                datalist_type: selectedItem.datalist_type,
                hidePagination: hidePagination,
                hideActions: hideActions,
                hideSearch: hideSearch,
                hideCheckBoxes: hideCheckBoxes,
                hideLabel: hideLabel,
            };
            props.setComponentPropsData(tempObj, props.component);
            setShow(false);
        } else {
            toastEmitter("Select Datalist First", true, "warning");
        }
    }

    const renderDatalist = () => {
        if (props.mode !== props.modeType.design && !isEmpty(selectedItem)) {
            if (
                selectedItem.type === "FORM" &&
                selectedItem.datalist_type === "TABLE" &&
                selectedForm &&
                JSON.stringify(selectedForm) !== "{}"
            ) {
                return (
                    <DataListTableById
                        selectedItem={selectedItem}
                        selectedForm={selectedForm}
                        fkColumn={props?.fkColumn}
                        fkValue={props?.fkValue}
                        dataKey={props?.dataKey}
                        setDataKeys={props.setDataKeys}
                        dataKeys={props?.dataKeys}
                        datalistUrl={props && props.datalistUrl}
                        mode={props?.mode}
                        modeType={props?.modeType}
                        hideLabel={hideLabel}
                        hideFormDatalistLabel={props.hideFormDatalistLabel}
                        tenantIdMain = {"tenant00061"}
                    />
                );
            } else if (
                selectedItem.type === "FORM" &&
                selectedItem.datalist_type === "EDITABLE-GRID" &&
                selectedForm &&
                JSON.stringify(selectedForm) !== "{}"
            ) {
                return (
                    <>
                        <DataListTableById
                            selectedItem={selectedItem}
                            selectedForm={selectedForm}
                            fkColumn={props?.fkColumn}
                            fkValue={props?.fkValue}
                            dataKey={props?.dataKey}
                            setDataKeys={props.setDataKeys}
                            dataKeys={props?.dataKeys}
                            datalistUrl={props && props.datalistUrl}
                            mode={props?.mode}
                            modeType={props?.modeType}
                            hideLabel={hideLabel}
                            hideFormDatalistLabel={props.hideFormDatalistLabel}
                            tenantIdMain = {"tenant00061"}
                        />
                    </>
                );
            } else if (selectedItem.type === "SQL") {
                return (
                    <DataListTableById
                        selectedItem={selectedItem}
                        selectedForm={selectedForm}
                        fkColumn={props?.fkColumn}
                        fkValue={props?.fkValue}
                        dataKey={props?.dataKey}
                        setDataKeys={props.setDataKeys}
                        dataKeys={props?.dataKeys}
                        datalistUrl={props && props.datalistUrl}
                        mode={props?.mode}
                        modeType={props?.modeType}
                        hideLabel={hideLabel}
                        tenantIdMain = {"tenant00061"}
                    />
                );
            }
        }
    };

    return (
        <div
            // id="datalist"
            className="datalist datalist-viewer">
            <DatalistListing
                selectedItem={selectedItem}
                dataList={dataList}
                saveDataListIdInLayout={saveDataListIdInLayout}
                setShow={setShow}
                show={show}
                getSelectedDataList={getSelectedDataList}
                setHideActions={setHideActions}
                setHideSearch={setHideSearch}
                setHidePagination={setHidePagination}
                hideActions={hideActions}
                hidePagination={hidePagination}
                hideSearch={hideSearch}
                hideCheckBoxes={hideCheckBoxes}
                setHideCheckBoxes={setHideCheckBoxes}
                setHideLabel={setHideLabel}
                hideLabel={hideLabel}
            />
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div
                        className="datalist-setting">
                        <div className="cursor-pointer d-flex">
                            <div className="datalist-setting-btn">
                                <span className="fa-solid fa-cube icon-space"></span>
                            </div>
                            <center>
                                <span>
                                    {props &&
                                    props.component &&
                                    props.component.data &&
                                    props.component.data.title
                                        ? props.component.data.title
                                        : "Datalist added successfully"}
                                </span>
                            </center>
                        </div>
                    </div>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.preview && (
                    <div className="">
                        <center>
                            {props &&
                            props.component &&
                            props.component.data &&
                            props.component.data.title
                                ? props.component.data.title
                                : "Datalist added successfully"}
                        </center>
                    </div>
                )}
            {/* fkColumn: {props.fkColumn} fkValue: {props.fkValue} */}
            {props &&
                (props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) &&
                !(
                    props.fkColumn &&
                    props.fkColumn !== "" &&
                    (!props.fkValue || props.fkValue === "new")
                ) && <>{renderDatalist()}</>}
            {props &&
                (props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) &&
                props.fkColumn &&
                props.fkColumn !== "" &&
                (!props.fkValue || props.fkValue === "new") &&
                !isEmpty(selectedItem) && (
                    <div className="no-task-border">
                        <div className="no-task-wrap">
                            <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                            <span className="no-task-text">
                                Please save form to enable {selectedItem?.name}.
                            </span>
                        </div>
                    </div>
                )}
        </div>
    );
}

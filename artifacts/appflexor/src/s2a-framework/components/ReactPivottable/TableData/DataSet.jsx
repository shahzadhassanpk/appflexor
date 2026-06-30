import React, { useState, useContext } from "react";
import axios from "axios";
import { API_URL } from "../../../Config";
import ChildrenModal from "../../ChildrenModal/ChildrenModal";
import { useRef } from "react";
import { toastEmitter } from "../../Toastify/Toastify";
import { useEffect } from "react";
import { getData as globalGetData, handleMultiSave } from "../../CrudApiCall";
import { isEmpty, JsonToCsv } from "../../../utils/utils";
import {
    ExportForm,
    handleImportIndex,
} from "../../../modules/data-analysis/analytics/analytics-designer/AnalyticsDesigner";
import { AppContext } from "../../../../AppContext";

const DataSet = props => {
    const { handleSelect, list, dataSources, getData, selectedId } = props;

    let initialState = {
        id: "",
        title: "",
        description: "",
        key: "",
        type: "SERVICE-KEY",
        data_source: "",
        sql: "",
    };
    const [tableItem, setTableItem] = useState(initialState);
    const initialType = "SERVICE-KEY";
    const [selectedType, setSelectedType] = useState(initialType);
    const [filteredList, setFilteredList] = useState(list);
    const [exportIds, setExportIds] = useState({});
    const modalRef = useRef(null);
    const types = [
        { name: "Service Key", code: "SERVICE-KEY" },
        { name: "Sql", code: "SQL" },
    ];
    const [multiExport, setMultiExport] = useState({
        fun: () => {},
        title: "",
    });
    const [importReference, setImportReference] = useState({
        fun: () => {},
    });
    const exportModal = useRef(null);
    const importModal = useRef(null);

    const openModal = () => {
        modalRef?.current?.show();
    };

    const appContext = useContext(AppContext);
    const isAdmin = appContext.userGroups?.groupid?.includes("ADMIN") || false;

    useEffect(() => {
        if (list && Array.isArray(list)) setFilteredList(list);
    }, [list]);

    const addNewItem = () => {
        setTableItem(initialState);
        setSelectedType(initialType);
        openModal();
    };

    const closeModal = () => {
        modalRef?.current?.close();
    };

    const handleInput = e => {
        let value = e.target.value;
        let name = e.target.name;
        setTableItem(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleRadio = value => {
        setSelectedType(value);

        setTableItem(prev => ({
            ...prev,
            type: value,
        }));
    };

    const handleAddNew = e => {
        e.preventDefault();
        setSelectedType("SERVICE-KEY");
        setTableItem(initialState);
    };

    const handleSave = e => {
        e.preventDefault();
        let fieldData = { ...tableItem };
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "pivot_table"; //"formid"
        entityForm.entity = "pivot_table"; //Db- "table name"
        entityForm.action = "update";

        if (!fieldData.id || fieldData.id == "" || fieldData.id == "new") {
            entityForm.id = "new";
            fieldData.id = "new";
        } else {
            entityForm.id = fieldData.id;
        }

        entityForm.formData = fieldData;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (fieldData.id === "new" || fieldData.id === "") {
                        tableItem.id = response.data.C_DATA[0].formData.id;
                        console.log(response.data.C_DATA[0].formData.id);
                    }
                    closeModal();
                    // clearFields()
                    getData("SAVE");
                    const su = tableItem.id === "new" ? "Save" : "Update";
                    toastEmitter(`Data set ${su} successfully`, true);
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
    };

    const clearFields = () => {
        setTableItem(initialState);
    };

    const handleDelete = item => {
        if (window.confirm("Are you sure to delete?") == true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "pivot_table";
            entityForm.entity = "pivot_table";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData("DELETE");
                        toastEmitter("Data set deleted successfuly", true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
        }
    };

    const handleEdit = item => {
        setTableItem(item);
        setSelectedType(item.type);
        openModal();
    };

    const handleSearch = e => {
        const { value } = e.target;
        if (value) {
            setFilteredList(list.filter(item => item.title.includes(value)));
        } else {
            setFilteredList(list);
        }
    };

    const selectionForExport = data => {
        let ids = { ...exportIds };
        if (exportIds[data.id]) {
            delete ids[data.id];
        } else {
            ids = {
                ...ids,
                [data.id]: data.id,
            };
        }

        setExportIds(ids);
    };

    const nameExport = async () => {
        const keys = [];
        if (JSON.stringify(exportIds) !== "{}") {
            for (let id in exportIds) {
                let obj = {
                    params: id,
                    serviceKey: "sys.selected.pivot",
                };
                keys.push(obj);
            }

            const res = await globalGetData({ keys });

            if (res.data.C_STATUS == "SUCCESS") {
                exportItem(res);
            }
        } else {
            toastEmitter("Selected Index First", true, "warning");
        }
    };

    function exportItem(res) {
        const exportedIndexes = [];
        const data = res.data.C_DATA;
        for (let key in data) {
            exportedIndexes.push(data[key][0]);
        }
        const length = exportedIndexes.length;
        if (length == 1) {
            JsonToCsv(exportedIndexes, exportedIndexes[0].title);
            setExportIds({});
        } else if (length > 1) {
            const exportReference = title => {
                JsonToCsv(exportedIndexes, title);
                exportModal.current.close();
                setMultiExport({
                    fun: () => {},
                    title: "",
                });
                setExportIds({});
            };

            setMultiExport({ ...multiExport, fun: exportReference });
            exportModal.current.show();
        }
    }

    async function saveItems(items, table) {
        const res = await handleMultiSave({ items, entity: table });
        if (res.status == 200) {
            importModal.current.close();
            getData();
        }
    }

    return (
        <div className="data-set">
            <ChildrenModal
                ref={exportModal}
                header="Export Indexes">
                <ExportForm
                    multiExport={multiExport}
                    setMultiExport={setMultiExport}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={importModal}
                header="Import Indexes">
                <input
                    type="file"
                    className="form-control"
                    onChange={e =>
                        handleImportIndex(
                            e,
                            setImportReference,
                            saveItems,
                            "pivot_table",
                        )
                    }
                />
                <button
                    className="button-theme"
                    onClick={() => importReference.fun()}>
                    Ok
                </button>
            </ChildrenModal>
            <div className="header s2a-form-title">
                <label className="">
                    <i className="fa-solid fa-database"></i> Data Sets
                </label>
                {
                    isAdmin && <div>
                        <span
                            className="fa fa-plus cursor-pointer m-0"
                            onClick={addNewItem}></span>
                        <span
                            onClick={() => importModal.current.show()}
                            className="fa-solid fa-file-import mx-2 cursor-pointer"></span>

                        {exportIds && !isEmpty(exportIds) ? (
                            <span
                                onClick={nameExport}
                                className="fa-solid fa-file-export cursor-pointer m-0"></span>
                        ) : (
                            <span
                                title="Select item(s) to export"
                                style={{ color: "gray" }}
                                className="fa-solid fa-file-export m-0 disabled"></span>
                        )}
                    </div>
                }
            </div>
            <div className="border-dataset"></div>
            <span>
                <input
                    type={"text"}
                    className="form-control form-control-sm mt-1 mb-1"
                    placeholder="Search Dataset"
                    onChange={handleSearch}
                />
            </span>

            <ul className="list-group list-group-flush enable-scroll">
                {filteredList?.map(data => {
                    return (
                        <li
                            key={data["id"]}
                            className={`list-group-item`}
                            style={{
                                backgroundColor:
                                    selectedId === data["id"]
                                        ? "var(--primary-color)"
                                        : "",
                            }}
                            onClick={e => handleSelect(data.id, e)}>
                            <div>
                                <span className="me-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={exportIds[data.id]}
                                        onChange={() =>
                                            selectionForExport(data)
                                        }
                                    />
                                </span>
                                <span className="">{data.title}</span>
                            </div>
                            <span className="dropdown">
                                <i
                                    className="fa-solid fa-ellipsis-vertical ps-1 pe-1"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"></i>
                                <ul className="dropdown-menu">
                                    <li>
                                        <span
                                            className="dropdown-item"
                                            title="Edit"
                                            onClick={() => handleEdit(data)}>
                                            <i className="fa-regular fa-pen-to-square"></i>
                                            Edit
                                        </span>
                                    </li>
                                    <li>
                                        <span
                                            className="dropdown-item dropdown-item-del"
                                            title="Delete"
                                            onClick={() => handleDelete(data)}>
                                            <i className="fa-regular fa-trash-can"></i>
                                            Delete
                                        </span>
                                    </li>
                                </ul>
                            </span>
                        </li>
                    );
                })}
            </ul>
            <ChildrenModal
                header="Data Set"
                size="lg"
                ref={modalRef}>
                <form
                    className="row needs-validation form-background m-0 py-2 px-1"
                    noValidate>
                    <div className="col-sm-5 mb-2">
                        <label
                            htmlFor="title"
                            className="form-label fw-bold">
                            Title
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="title"
                            name="title"
                            value={tableItem.title}
                            onChange={e => handleInput(e)}
                            required
                        />
                        <div className="valid-feedback">Looks good!</div>
                    </div>
                    <div className="col-sm-2 mb-2">
                        <label
                            htmlFor="type"
                            className="form-label fw-bold">
                            Type
                        </label>
                        {types.map((type, i) => (
                            <div
                                className=""
                                key={i}>
                                <span className="me-2">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id={i}
                                        name="type"
                                        value={tableItem.type}
                                        checked={type.code === selectedType}
                                        onChange={() => handleRadio(type.code)}
                                        required
                                    />
                                </span>
                                <label htmlFor={i}>{type.name}</label>
                            </div>
                        ))}
                        <div className="valid-feedback">Looks good!</div>
                    </div>
                    {selectedType === "SERVICE-KEY" && (
                        <div className="col-sm-5 mb-2">
                            <label
                                htmlFor="key"
                                className="form-label fw-bold">
                                Key
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="key"
                                name="key"
                                value={tableItem.key}
                                onChange={e => handleInput(e)}
                                required
                            />
                            <div className="valid-feedback">Looks good!</div>
                        </div>
                    )}
                    {selectedType === "SQL" && (
                        <>
                            <div className="col-sm-5 mb-2">
                                <label
                                    htmlFor="data_source"
                                    className="form-label fw-bold">
                                    Data source
                                </label>

                                <select
                                    type="text"
                                    className="form-select"
                                    id="data_source"
                                    name="data_source"
                                    value={tableItem.data_source}
                                    onChange={e => handleInput(e)}
                                    required>
                                    <option
                                        key="asdf"
                                        value="">
                                        Default Source
                                    </option>
                                    {dataSources.map((datasource, i) => {
                                        return (
                                            <option
                                                key={i}
                                                value={datasource.code}>
                                                {datasource.name}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="valid-feedback">
                                    Looks good!
                                </div>
                            </div>
                            <div className="col-sm-12 mb-2">
                                <label
                                    htmlFor="sql"
                                    className="form-label fw-bold">
                                    Sql
                                </label>
                                <textarea
                                    type="text"
                                    className="form-control"
                                    id="sql"
                                    name="sql"
                                    value={tableItem.sql}
                                    onChange={e => handleInput(e)}
                                    required
                                />
                                <div className="valid-feedback">
                                    Looks good!
                                </div>
                            </div>
                        </>
                    )}
                    <div className="col-sm-12">
                        <label
                            htmlFor="description"
                            className="form-label fw-bold">
                            Description
                        </label>
                        <textarea
                            type="text"
                            className="form-control"
                            id="description"
                            name="description"
                            value={tableItem.description}
                            onChange={e => handleInput(e)}
                            required></textarea>
                        <div className="invalid-feedback">
                            Please provide a valid description.
                        </div>
                    </div>
                    <div className="d-block mt-2 float-end">
                        <button
                            className="btn button-theme btn-sm ms-0 m-2"
                            onClick={e => handleAddNew(e)}>
                            <i className="fa-solid fa-ban pe-1"></i>
                            Clear
                        </button>
                        <button
                            className="btn button-theme btn-sm m-2"
                            type="submit"
                            onClick={e => handleSave(e)}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            {tableItem.id === "" ? "Save" : "Update"}
                        </button>
                    </div>
                </form>
            </ChildrenModal>
        </div>
    );
};

export default DataSet;

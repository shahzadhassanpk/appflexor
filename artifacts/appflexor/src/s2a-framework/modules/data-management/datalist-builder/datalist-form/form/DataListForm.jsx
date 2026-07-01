import React, { useState, useEffect, useRef } from "react";
import FormFields from "../fields/FormFields";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
    dbTagConversion,
    filterArrayByTerms,
} from "../../../../../utils/utils";

import FormActions from "../actions/DatalistFormActions";
import OrderFields from "./OrderFields";
import Tag from "../../../../content-management/page-builder/Designer/components/Tag/Tag";
import { getData } from "../../../../../components/CrudApiCall";
import { API_URL } from "../../../../../Config";
import DynamicRadio from "../../../../../components/dynamic-radio/radio";
import ErrorNotification from "../../../../../components/ErrorNotification";
import { tryToParse } from "../../../form-builder/Forms/FormViewer/utils";
import ChildrenModal from "../../../../../components/ChildrenModal/ChildrenModal";
import TextField from "../../../../../components/Textfield";
import useInput from "../../../../../hooks/useInput";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { v4 as uuid } from "uuid";
import DynamicCheckBoxs from "../../../../../components/dynamic-checkbox/Checkbox";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import DeleteConfimation from "../../../../../components/delete-confimation";
import TextArea from "../../../../../components/TextArea";
import DndWrapper from "../../../../../components/drag-and-drop-listing";
import { ParamDndCard } from "../../../../../components/drag-and-drop-listing/ParamCard";
import MultiValuePropsEditor from "../property-editors/MultiValuePropsEditor";
import BulkActionModal from "../../custom-action-modal/BulkActionModal";
import CustomActionModal from "../../custom-action-modal/CustomActionModal";

export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

const initialBulkLinkTypes = [
    { code: "TRIGGER", title: "Trigger", selected: true },
];

export default function DataListForm(props) {
    const {
        selectedItem,
        handleInputField,
        formList = [],
        handleSelectedFormFieds,
        handleAction,
        saveData,
        handleSelectedForms,
        setShowModal,
        clearFields,
        error,
        types,
        setSelectedItem,
        orders,
        pages,
        instanceItems,
        handleType,
        showAction,
        setShowAction,
        setDefaultAction,
        defaultAction,
        defaultActions,
        customActions,
        customAction,
        setCustomAction,
        setFormFieldCheck,
        formFieldCheck,
        formFieldSelection,
        emailService,
        processCategory,
        datalistType,
        handleDatalistType,
        dataList,
        updateFormFields,
        tenantId,
        handleDatalistExportType,
        showBulkAction,
        setShowBulkAction,
    } = props;

    const [linkTypes, setLinkTypes] = useState([
        { code: "URL", title: "Url", selected: false },
        { code: "FORM", title: "Form", selected: false },
        { code: "POST", title: "Post", selected: false },
        { code: "PROCESS", title: "Process", selected: false },
    ]);

    const [bulkLinkTypes, setBulkLinkTypes] = useState(initialBulkLinkTypes);
    const exportType = [
        {
            code: "JSON",
            title: "Json",
        },
        {
            code: "CSV",
            title: "Csv",
        },
    ];
    const [_selectedItem, _setSelectedItem] = useState({});
    const [showSearch, setShowSearch] = useState(false);
    const serviceParamModalRef = useRef(null);
    const [serviceParamId, setServiceParamId] = useState("");

    useEffect(() => {
        if (selectedItem?.form_id) {
            _setSelectedItem(selectedItem);
        }
    }, [selectedItem?.form_id]);

    useEffect(() => {
        if (selectedItem?.id) {
            _setSelectedItem(selectedItem);
        }
    }, [selectedItem?.id]);

    function handleSelectedField(event, index, selected_field) {
        let _selectedItem = structuredClone(selectedItem);
        let _index = _selectedItem.layout.selected_fields.findIndex(
            item => item.id === selected_field.id,
        );

        const { name, value } = event.target;
        let requiredValues = [
            "include",
            "serviceParam",
            "isHtml",
            "isFilter",
            "includeAggregate",
        ];
        if (requiredValues.includes(name)) {
            if (value === "true") {
                _selectedItem.layout.selected_fields[_index][name] = false;
            } else if (value === "false") {
                _selectedItem.layout.selected_fields[_index][name] = true;
            }
        } else {
            _selectedItem.layout.selected_fields[_index][name] = value;
        }
        let layout = {
            selected_fields: _selectedItem.layout.selected_fields,
            actions: _selectedItem.layout.actions,
        };

        setSelectedItem(prev => ({ ...prev, layout: layout }));
    }

    function handleShowDataList() {
        setShowModal(true);
    }

    function addNewActions() {
        let _linkTypes = [
            { code: "URL", title: "Url", selected: false },
            { code: "FORM", title: "Form", selected: false },
            { code: "POST", title: "Post", selected: false },
            { code: "PROCESS", title: "Process", selected: false },
        ];
        setLinkTypes(_linkTypes);
        setShowAction(prev => ({
            ...prev,
            showModal: true,
            selectedItem: {},
            mode: "addNew",
        }));
    }

    function addNewBulkActions() {
        // for (let initialBulkLinkType of initialBulkLinkTypes) {
        //     initialBulkLinkType.selected = false;
        // }
        setBulkLinkTypes(initialBulkLinkTypes);
        setShowBulkAction(prev => ({
            ...prev,
            showModal: true,
            selectedItem: {},
            mode: "addNew",
        }));
    }

    function handleDefaultActions(e) {
        const { checked } = e.target;
        setDefaultAction(checked);
        defaultActions(checked);
    }

    function handleCustomActions(e) {
        const { checked } = e.target;
        setCustomAction(checked);
        customActions(checked);
    }

    function handleFormFields(e) {
        const { checked } = e.target;
        setFormFieldCheck(checked);
        formFieldSelection(checked);
    }

    function showHide() {
        setShowSearch(!showSearch);
    }

    function getTagSuggestion(params) {
        const keys = [
                {
                    params: params,
                    dataKey: "tagSuggestionList",
                    serviceKey: "sys.tag.suggestion.list",
                    mode: "formData",
                },
            ],
            url = API_URL + "?service.key=masterKey.tenantData",
            datasource = "";
        return getData({ datasource, keys, url, tenantId });
    }

    function handleTag(tags) {
        let db_format_tags = "";
        tags.forEach(tag => {
            db_format_tags += `${tag.id};`;
        });
        setSelectedItem(prev => ({
            ...prev,
            tags: db_format_tags,
        }));
    }

    useEffect(() => {
        if (showSearch === false && _selectedItem?.layout?.selected_fields) {
            setSelectedItem(prev => ({
                ...prev,
                layout: {
                    ...prev.layout,
                    selected_fields: [..._selectedItem.layout.selected_fields],
                },
            }));
        }
    }, [showSearch]);

    function addNewServiceParam() {
        serviceParamModalRef.current.show();
        setServiceParamId("");
    }

    function handleServiceParams() {}

    function handleMoveParams() {}

    return (
        <div className="s2a-datalistform">
            <ChildrenModal
                ref={serviceParamModalRef}
                header="Service Param">
                <ServiceParamForm
                    setSelectedItem={setSelectedItem}
                    serviceParamModalRef={serviceParamModalRef}
                    serviceParamId={serviceParamId}
                    selectedItem={selectedItem}
                />
            </ChildrenModal>
            <div className="col-sm-12 form-background datalist-form">
                <CustomActionModal
                    show={showAction}
                    setShow={setShowAction}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    formList={formList}
                    emailService={emailService}
                    linkType={linkTypes}
                    processCategory={processCategory}
                    dataList={dataList}
                    datasources={instanceItems}
                />
                <BulkActionModal
                    show={showBulkAction}
                    setShow={setShowBulkAction}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    formList={formList}
                    emailService={emailService}
                    linkType={bulkLinkTypes}
                    processCategory={processCategory}
                    dataList={dataList}
                    datasources={instanceItems}
                />
                <div className="row">
                    <div className="col-sm-4 listing-col s2a-border-right">
                        <div className="listing-header">
                            <label className="fw-bold ">Datalist Details</label>
                        </div>
                        <div className="row">
                            <div className="col-sm-12 mb-1">
                                <div className="form-group">
                                    <div className="mt-1 d-flex">
                                        <div className="col-sm-2 fw-bold">
                                            Key&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`${
                                                error.indexOf("db_column") ===
                                                -1
                                                    ? "visually-hidden col-sm-10"
                                                    : "col-sm-10 error-msg"
                                            }`}>
                                            Key Required
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="db_column"
                                        value={
                                            selectedItem &&
                                            selectedItem?.db_column
                                        }
                                        onChange={e => handleInputField(e)}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-12 mb-1">
                                <div className="form-group">
                                    <div className="mt-1 d-flex">
                                        <div className="col-sm-2 fw-bold">
                                            Name&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`${
                                                error.indexOf("name") === -1
                                                    ? "visually-hidden col-sm-10"
                                                    : "col-sm-10 error-msg"
                                            }`}>
                                            Name Required
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={
                                            selectedItem && selectedItem["name"]
                                        }
                                        onChange={e => handleInputField(e)}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-12 mb-1">
                                <div className="form-group">
                                    <div className="mt-1 d-flex">
                                        <div className="col-sm-2 fw-bold">
                                            Title&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`${
                                                error.indexOf("title") === -1
                                                    ? "visually-hidden col-sm-10"
                                                    : "col-sm-10 error-msg"
                                            }`}>
                                            Tilte Required
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={
                                            selectedItem &&
                                            selectedItem["title"]
                                        }
                                        onChange={e => handleInputField(e)}
                                    />
                                </div>
                            </div>
                            <div className="datalist-taglist">
                                <label className="fw-bold my-1">
                                    Search Tag
                                </label>
                                <Tag
                                    handleTags={handleTag}
                                    selectedPostTags={dbTagConversion(
                                        selectedItem.tags,
                                    )}
                                    getData={() => getTagSuggestion("datalist")}
                                    category="datalist"
                                />
                            </div>
                            <div className="col-sm-12 mb-1">
                                <div className="my-1">
                                    <div className="form-group d-flex mt-2">
                                        <label className="fw-bold">
                                            Build Using&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <div
                                            className={`${
                                                error.indexOf("type") === -1
                                                    ? "visually-hidden col-sm-10"
                                                    : "col-sm-10 error-msg"
                                            }`}>
                                            Select Type
                                        </div>
                                    </div>
                                    {types.map((type, index) => (
                                        <div
                                            className="form-check type-check-box"
                                            key={index}>
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="type"
                                                checked={
                                                    type.name ==
                                                    selectedItem.type
                                                }
                                                // checked={type.selected}
                                                value={type.name}
                                                onChange={e => handleType(e)}
                                            />
                                            <label className="form-check-label type-title">
                                                {type.title}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {/* data grid */}
                                {selectedItem.type === "FORM" && (
                                    <div className="my-1">
                                        <div className="d-flex">
                                            <label className="col-sm-5 fw-bold">
                                                Show Data&nbsp;
                                            </label>
                                            <div
                                                className={`${
                                                    error.indexOf(
                                                        "datalist_type",
                                                    ) === -1
                                                        ? "visually-hidden  col-sm-7"
                                                        : "error-msg col-sm-7"
                                                }`}>
                                                Select View
                                            </div>
                                        </div>
                                        {datalistType.map((type, index) => (
                                            <div
                                                key={index}
                                                className="form-check type-check-box">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="datalist_type"
                                                    checked={type.selected}
                                                    value={type.name}
                                                    onChange={e =>
                                                        handleDatalistType(e)
                                                    }
                                                />
                                                <label className="form-check-label type-title">
                                                    {type.title}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="my-1">
                                    <div className="d-flex">
                                        <label className="col-sm-5 fw-bold">
                                            Data Export Type&nbsp;
                                        </label>
                                        <div
                                            className={`${
                                                error.indexOf(
                                                    "datalist_export_type",
                                                ) === -1
                                                    ? "visually-hidden  col-sm-7"
                                                    : "error-msg col-sm-7"
                                            }`}>
                                            Select Export Type
                                        </div>
                                    </div>
                                    {exportType.map((type, index) => (
                                        <div
                                            key={index}
                                            className="form-check type-check-box">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="datalist_export_type"
                                                checked={
                                                    selectedItem?.datalist_export_type ===
                                                    type.code
                                                }
                                                value={type.code}
                                                onChange={e =>
                                                    handleDatalistExportType(e)
                                                }
                                            />
                                            <label className="form-check-label type-title">
                                                {type.title}{" "}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="layout-views">
                                    <label
                                        htmlFor="layout"
                                        className="fw-bold my-1">
                                        Layouts
                                    </label>
                                    <DynamicRadio
                                        items={[
                                            {
                                                label: "gallery",
                                                code: "GALLERY",
                                            },
                                            { label: "list", code: "LIST" },
                                            { label: "table", code: "TABLE" },
                                        ]}
                                        classes={{
                                            main: "d-flex gap-2",
                                            label: "text-capitalize",
                                        }}
                                        selectedItem={selectedItem["view"]}
                                        handleChange={item =>
                                            setSelectedItem(prev => ({
                                                ...prev,
                                                view: item,
                                            }))
                                        }
                                    />
                                </div>
                                {selectedItem?.view === "GALLERY" && (
                                    <div className="gallery-cols">
                                        <label htmlFor="gallery_columns">
                                            Gallery Columns
                                        </label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            name="gallery_columns"
                                            value={
                                                selectedItem?.gallery_columns
                                            }
                                            onChange={handleInputField}
                                        />
                                    </div>
                                )}

                                <div className="actions">
                                    <div className="col-sm-12 mb-1">
                                        <div className="form-group">
                                            <div className="mt-1 d-flex"></div>
                                            {(selectedItem.type === "FORM" ||
                                                selectedItem.type ===
                                                    "SQL") && (
                                                <>
                                                    <div className="col-12 form-group">
                                                        <div className="row">
                                                            <div className="col-sm-5">
                                                                <label className="fw-bold">
                                                                    Default
                                                                    Form&nbsp;
                                                                    {
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    }
                                                                </label>
                                                            </div>
                                                            <div className="col-sm-7">
                                                                <div
                                                                    className={`${
                                                                        error.indexOf(
                                                                            "form_id",
                                                                        ) === -1
                                                                            ? "visually-hidden col-sm-12"
                                                                            : "col-sm-12 error-msg"
                                                                    }`}>
                                                                    Select Form
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <select
                                                        placeholder="No Form"
                                                        className="form-select mb-2"
                                                        name="form_id"
                                                        value={
                                                            selectedItem &&
                                                            selectedItem.form_id
                                                        }
                                                        title="Select Type First"
                                                        onChange={e =>
                                                            handleSelectedForms(
                                                                e,
                                                            )
                                                        }>
                                                        <option
                                                            key={0}
                                                            value="">
                                                            No Form
                                                        </option>
                                                        {formList &&
                                                            JSON.stringify(
                                                                formList,
                                                            ) !== "[]" &&
                                                            formList
                                                                .sort((a, b) =>
                                                                    a.name >
                                                                    b.name
                                                                        ? 1
                                                                        : -1,
                                                                )
                                                                .map(form => {
                                                                    return (
                                                                        <option
                                                                            key={
                                                                                form.id
                                                                            }
                                                                            value={
                                                                                form.id
                                                                            }>
                                                                            {
                                                                                form.name
                                                                            }
                                                                        </option>
                                                                    );
                                                                })}
                                                    </select>
                                                    {/* <FullRefresh
                                                        handleInputField={
                                                            handleInputField
                                                        }
                                                        selectedItem={
                                                            selectedItem
                                                        }
                                                    /> */}
                                                    {selectedItem.type ===
                                                        "FORM" && (
                                                        <>
                                                            <OrderFields
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                handleInputField={
                                                                    handleInputField
                                                                }
                                                                orders={orders}
                                                                pages={pages}
                                                            />
                                                            <div>
                                                                <label className="fw-bold">
                                                                    Extra Filter
                                                                    Condition
                                                                </label>
                                                                <input
                                                                    className="form-control mb-2"
                                                                    name="filter_condition"
                                                                    title="Extra Filter Condition"
                                                                    value={
                                                                        selectedItem &&
                                                                        selectedItem.filter_condition
                                                                    }
                                                                    onChange={
                                                                        handleInputField
                                                                    }
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            {selectedItem.type === "SQL" && (
                                                <>
                                                    <div className="row">
                                                        <div className="col-sm-2">
                                                            <label className="fw-bold">
                                                                SQL
                                                            </label>
                                                        </div>
                                                        <div className="col-sm-10">
                                                            <div
                                                                className={`${
                                                                    error.indexOf(
                                                                        "sql",
                                                                    ) === -1
                                                                        ? "visually-hidden col-sm-12"
                                                                        : "col-sm-12 error-msg"
                                                                }`}>
                                                                Sql Required
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        className="form-control"
                                                        placeholder="Enter Query"
                                                        name="sql"
                                                        value={
                                                            selectedItem &&
                                                            selectedItem["sql"]
                                                        }
                                                        onChange={e =>
                                                            handleInputField(e)
                                                        }
                                                        rows={3}
                                                        // disabled={item.selected}
                                                    />
                                                    {selectedItem.type ===
                                                        "SQL" && (
                                                        <div className="col-sm-12 mb-1">
                                                            <div className="form-group">
                                                                <div className="row">
                                                                    <div className="col-sm-6 fw-bold">
                                                                        Data
                                                                        Source
                                                                    </div>                                                                    
                                                                </div>
                                                                <select
                                                                    placeholder="Default"
                                                                    className="form-select"
                                                                    name="datasource"
                                                                    value={
                                                                        selectedItem &&
                                                                        selectedItem[
                                                                            "datasource"
                                                                        ]
                                                                    }
                                                                    onChange={e =>
                                                                        handleInputField(
                                                                            e,
                                                                        )
                                                                    }>
                                                                    <option value="">
                                                                        Default
                                                                        Datasource
                                                                    </option>
                                                                    {instanceItems &&
                                                                        instanceItems.map(
                                                                            instance => {
                                                                                return (
                                                                                    <option
                                                                                        key={
                                                                                            instance.id
                                                                                        }
                                                                                        value={
                                                                                            instance.code
                                                                                        }>
                                                                                        {
                                                                                            instance.name
                                                                                        }
                                                                                    </option>
                                                                                );
                                                                            },
                                                                        )}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <>
                                                        <div className="col-sm-12">
                                                            <div className="row">
                                                                <div className="col-sm-5">
                                                                    <label className="fw-bold">
                                                                        Primary
                                                                        Key&nbsp;
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                                <div className="col-sm-7">
                                                                    <div
                                                                        className={`${
                                                                            error.indexOf(
                                                                                "primary_key",
                                                                            ) ===
                                                                            -1
                                                                                ? "visually-hidden col-sm-12"
                                                                                : "col-sm-12 error-msg"
                                                                        }`}>
                                                                        Primary
                                                                        Key
                                                                        Required
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-12">
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="primary_key"
                                                                value={
                                                                    selectedItem &&
                                                                    selectedItem[
                                                                        "primary_key"
                                                                    ]
                                                                }
                                                                onChange={e =>
                                                                    handleInputField(
                                                                        e,
                                                                    )
                                                                }
                                                                // disabled={
                                                                //     item.selected
                                                                // }
                                                            />
                                                        </div>

                                                        {selectedItem.type ===
                                                            "SQL" && (
                                                            <OrderFields
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                handleInputField={
                                                                    handleInputField
                                                                }
                                                                orders={orders}
                                                                pages={pages}
                                                            />
                                                        )}
                                                    </>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="datalist-buttons">
                            {selectedItem && selectedItem["id"] === "" && (
                                <>
                                    <button
                                        className="btn button-theme  btn-sm pull-left m-2 ms-0"
                                        onClick={() => saveData(selectedItem)}
                                        // disabled={saveIsDisabled}
                                    >
                                        <i className="fa-solid fa-floppy-disk pe-1 px-1"></i>
                                        Save
                                    </button>
                                </>
                            )}
                            {selectedItem && selectedItem["id"] !== "" && (
                                <>
                                    <button
                                        className="btn button-theme  btn-sm pull-left m-2 ms-0"
                                        disabled={
                                            selectedItem["id"] ? false : true
                                        }
                                        onClick={() => handleShowDataList()}>
                                        Preview
                                    </button>
                                    <button
                                        className="btn button-theme  btn-sm pull-left m-2"
                                        onClick={() => saveData(selectedItem)}
                                        // disabled={saveIsDisabled}
                                    >
                                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                                        Update
                                    </button>
                                </>
                            )}
                            {selectedItem && selectedItem["id"] === "" && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-2 text-light"
                                    onClick={clearFields}>
                                    <i className="fa-solid fa-xmark pe-1 px-1"></i>
                                    Cancel
                                </button>
                            )}
                        </div>
                        <div className="p-2">
                            <ErrorNotification
                                error={error}
                                labels={{
                                    db_column: "Key",
                                    name: "Name",
                                    type: "Type",
                                    datalist_type: "View",
                                }}
                            />
                        </div>
                    </div>
                    {(selectedItem.type === "SQL" ||
                        selectedItem?.datalist_type) && (
                        <>
                            <div className="col-sm-4 listing-col s2a-border-right">
                                <div className="actions">
                                    {selectedItem &&
                                        (selectedItem.type === "FORM" ||
                                            selectedItem.type === "SQL") && (
                                            <>
                                                <div className="listing-header">
                                                    <label className="fw-bold ">
                                                        Datalist Actions
                                                    </label>
                                                </div>
                                                {selectedItem &&
                                                    selectedItem.layout &&
                                                    selectedItem.layout
                                                        .actions && (
                                                        <>
                                                            <div className="actions-row">
                                                                <div className="input-align">
                                                                    <span>
                                                                        Default
                                                                        Actions
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="datalistactions-list">
                                                                <div className="d-flex">
                                                                    <div className="input-align">
                                                                        <input
                                                                            id="default-action"
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={
                                                                                defaultAction
                                                                            }
                                                                            onChange={
                                                                                handleDefaultActions
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="action-list">
                                                                        Select
                                                                        All
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <FormActions
                                                                type="default"
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                handleAction={
                                                                    handleAction
                                                                }
                                                                setSelectedItem={
                                                                    setSelectedItem
                                                                }
                                                                show={
                                                                    showAction
                                                                }
                                                                setShow={
                                                                    setShowAction
                                                                }
                                                                linkTypes={
                                                                    linkTypes
                                                                }
                                                                setLinkTypes={
                                                                    setLinkTypes
                                                                }
                                                            />
                                                            <div className="actions-row mt-2 px-2">
                                                                <span>
                                                                    Custom
                                                                    Actions
                                                                </span>
                                                                <span
                                                                    className="fa fa-plus pointer"
                                                                    title="Add Custom Action"
                                                                    onClick={
                                                                        addNewActions
                                                                    }></span>
                                                            </div>
                                                            <div className="datalistactions-list">
                                                                <div className="d-flex">
                                                                    <div className="input-align">
                                                                        <input
                                                                            id="custom-action"
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={
                                                                                customAction
                                                                            }
                                                                            onChange={
                                                                                handleCustomActions
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="action-list">
                                                                        Select
                                                                        All
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <FormActions
                                                                type="custom"
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                handleAction={
                                                                    handleAction
                                                                }
                                                                setSelectedItem={
                                                                    setSelectedItem
                                                                }
                                                                show={
                                                                    showAction
                                                                }
                                                                setShow={
                                                                    setShowAction
                                                                }
                                                                linkTypes={
                                                                    linkTypes
                                                                }
                                                                setLinkTypes={
                                                                    setLinkTypes
                                                                }
                                                            />
                                                            <div className="actions-row mt-2 px-2">
                                                                <span>
                                                                    Bulk Actions
                                                                </span>
                                                                <span
                                                                    className="fa fa-plus pointer"
                                                                    title="Add Bulk Action"
                                                                    onClick={
                                                                        addNewBulkActions
                                                                    }></span>
                                                            </div>
                                                            <div className="datalistactions-list">
                                                                <div className="d-flex">
                                                                    <div className="input-align">
                                                                        <input
                                                                            id="custom-action"
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={
                                                                                customAction
                                                                            }
                                                                            onChange={
                                                                                handleCustomActions
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="action-list">
                                                                        Select
                                                                        All
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <FormActions
                                                                type="bulk"
                                                                selectedItem={
                                                                    selectedItem
                                                                }
                                                                handleAction={
                                                                    handleAction
                                                                }
                                                                setSelectedItem={
                                                                    setSelectedItem
                                                                }
                                                                show={
                                                                    showBulkAction
                                                                }
                                                                setShow={
                                                                    setShowBulkAction
                                                                }
                                                                linkTypes={
                                                                    bulkLinkTypes
                                                                }
                                                                setLinkTypes={
                                                                    setBulkLinkTypes
                                                                }
                                                            />
                                                        </>
                                                    )}
                                            </>
                                        )}
                                </div>
                                {selectedItem?.type === "SQL" && (
                                    <div className="sql-filter-actions">
                                        <div
                                            title="The order and number of params must be as per SQL where clause"
                                            className="actions-row mt-2 px-2">
                                            <span>
                                                SQL Params{" "}
                                                <i class="fa fa-question-circle"></i>
                                            </span>
                                            <span
                                                className="fa fa-plus pointer"
                                                title="Add Custom Action"
                                                onClick={
                                                    addNewServiceParam
                                                }></span>
                                        </div>
                                        <div className="datalistactions-list">
                                            {/* <code>{JSON.stringify(selectedItem)}</code> */}
                                            <div className="d-flex">
                                                <div className="input-align">
                                                    <input
                                                        id="custom-action"
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={
                                                            selectedItem?.serviceparams && selectedItem?.serviceparams!=='[]' &&
                                                            selectedItem?.serviceparams?.every(
                                                                par =>
                                                                    par.selected,
                                                            )
                                                        }
                                                        onChange={e => {
                                                            setSelectedItem(
                                                                prev => ({
                                                                    ...prev,
                                                                    serviceparams:
                                                                        prev.serviceparams?.map(
                                                                            item => ({
                                                                                ...item,
                                                                                selected:
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                            }),
                                                                        ),
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                <div className="action-list">
                                                    Select All
                                                </div>
                                            </div>
                                        </div>
                                        <DndWrapper>
                                            <ul className="service-params-listing">
                                                <Listing
                                                    items={
                                                        selectedItem?.serviceparams
                                                    }
                                                    renderItem={(
                                                        item,
                                                        index,
                                                    ) => {
                                                        return (
                                                            <ParamDndCard
                                                                mapKey="serviceparams"
                                                                id={item.id}
                                                                index={index}
                                                                setItems={
                                                                    setSelectedItem
                                                                }
                                                                move={true}>
                                                                <ListItem
                                                                    key={
                                                                        item?.id
                                                                    }
                                                                    index={
                                                                        index
                                                                    }
                                                                    item={item}
                                                                    setSelectedItem={
                                                                        setSelectedItem
                                                                    }
                                                                    setServiceParamId={
                                                                        setServiceParamId
                                                                    }
                                                                    serviceParamModalRef={
                                                                        serviceParamModalRef
                                                                    }
                                                                />
                                                            </ParamDndCard>
                                                        );
                                                    }}
                                                />
                                            </ul>
                                        </DndWrapper>
                                    </div>
                                )}
                            </div>
                            <div className="col-sm-4 listing-col">
                                <>
                                    <div className="listing-header">
                                        <label className="fw-bold ">
                                            Datalist Fields
                                        </label>
                                    </div>
                                    {selectedItem &&
                                        selectedItem.type !== "" && (
                                            <div className="actions-row">
                                                <div className="col d-flex input-align">
                                                    <div className="action-font">
                                                        <label htmlFor="fields">
                                                            Fields
                                                        </label>
                                                    </div>
                                                    {/* {check ? `Unselect All` : `Select All`} */}
                                                </div>
                                                <div className="col-sm-2 input-align">
                                                    <div className="d-inline-flex mt-1">
                                                        <div
                                                            className="col-sm pointer"
                                                            title="Search"
                                                            onClick={showHide}>
                                                            <i className="fa-solid fa-magnifying-glass"></i>
                                                        </div>

                                                        <div className="col-sm">
                                                            {selectedItem.type ===
                                                            "SQL" ? (
                                                                <div
                                                                    className="action-font get-fields pointer"
                                                                    title="Refresh"
                                                                    onClick={() =>
                                                                        saveData(
                                                                            selectedItem,

                                                                            "sql",
                                                                        )
                                                                    }>
                                                                    <i className="fa fa-refresh fields-refresh-btn"></i>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="action-font get-fields pointer"
                                                                    title="Refresh"
                                                                    onClick={() =>
                                                                        updateFormFields()
                                                                    }>
                                                                    <i className="fa fa-refresh fields-refresh-btn"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </>
                                {showSearch && (
                                    <div className="search-bar pe-1 pt-1 pb-1">
                                        <SearchItem
                                            setItems={setSelectedItem}
                                            _items={
                                                _selectedItem?.layout
                                                    ?.selected_fields
                                            }
                                        />
                                    </div>
                                )}
                                <div className="datalist-fields">
                                    <div className="d-flex">
                                        <div className="input-align">
                                            <input
                                                id="fields"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={formFieldCheck}
                                                onChange={handleFormFields}
                                            />
                                        </div>
                                        <div className="action-list">
                                            Select All
                                        </div>
                                    </div>
                                </div>
                                <div className="scroll">
                                    {selectedItem &&
                                        selectedItem.layout &&
                                        selectedItem.layout.selected_fields &&
                                        selectedItem.layout.selected_fields
                                            .length > 0 && (
                                            <>
                                                <DndProvider
                                                    backend={HTML5Backend}>
                                                    <FormFields
                                                        selectedItem={
                                                            selectedItem
                                                        }
                                                        setSelectedItem={
                                                            setSelectedItem
                                                        }
                                                        items={
                                                            selectedItem.layout
                                                                .selected_fields
                                                        }
                                                        actions={
                                                            selectedItem.layout
                                                                .actions
                                                        }
                                                        handleSelectedFields={
                                                            handleSelectedFormFieds
                                                        }
                                                        setItems={
                                                            setSelectedItem
                                                        }
                                                        fieldType={
                                                            selectedItem &&
                                                            selectedItem.type
                                                        }
                                                        handleSelectedField={
                                                            handleSelectedField
                                                        }
                                                        handleSave={saveData}
                                                        selectedFieldItem={
                                                            selectedItem
                                                        }
                                                        datalistType={
                                                            selectedItem.type
                                                        }
                                                    />
                                                </DndProvider>
                                            </>
                                        )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// function FullRefresh(props) {
//     const { handleInputField, selectedItem } = props;
//     const handleInput = e => {
//         const { name, checked } = e.target;
//         handleInputField({ target: { name, value: checked } });
//     };

//     return (
//         <div className="mt-2 mb-2">
//             <label
//                 htmlFor="full_refresh"
//                 className="fw-bold me-2">
//                 Full Refresh
//             </label>
//             <input
//                 className="form-check-input"
//                 type="checkbox"
//                 id="full_refresh"
//                 name="full_refresh"
//                 value={selectedItem.full_refresh}
//                 checked={
//                     selectedItem.full_refresh === "true" ||
//                     selectedItem.full_refresh === true
//                         ? true
//                         : false
//                 }
//                 onChange={handleInput}
//             />
//         </div>
//     );
// }

function SearchItem(props) {
    const { setItems, _items } = props;

    const [input, setInput] = useState("");

    function handleSearch(e) {
        const { value } = e.target;
        setInput(value || "");
        const result = filterArrayByTerms(_items, value.toLowerCase(), [
            "label",
            "db_column",
            "type",
        ]);

        setter(result);
    }

    const setter = result => {
        setItems(prev => ({
            ...prev,
            layout: {
                ...prev.layout,
                selected_fields: result,
            },
        }));
    };

    return (
        <div className="search-component mb-1 mt-1">
            <input
                type="text"
                className="form-control"
                value={input}
                onChange={handleSearch}
                placeholder="Search..."
            />
        </div>
    );
}

function ServiceParamForm(props) {
    const {
        setSelectedItem,
        serviceParamModalRef,
        serviceParamId,
        selectedItem,
    } = props;
    const rules = {
        label: value => (value ? "" : "Label is  required"),
        type: value => (value ? "" : "Type is  required"),
    };
    const defaultValues = {
        label: "",
        type: "",
        selected: false,
        mapLabel: "",
        mapValue: "",
        serviceKey: "",
        use_static: "YES",
        options: [],
    };
    const { values, handleOnChange, errors, validateValues, setValues } =
        useInput({
            defaultValues,
            rules,
        });
    const types = [
        {
            label: "Text",
            value: "TEXT",
        },
        {
            label: "Date Range",
            value: "DATE-RANGE",
        },

        // {
        //     label: "Number",
        //     value: "NUMBER",
        // },
        {
            label: "Select",
            value: "SELECT",
        },
        {
            label: "Radio",
            value: "RADIO",
        },
        // {
        //     label: "Checkbox",
        //     value: "CHECKBOX",
        // },
    ];

    const selectedTypeIndex = types?.findIndex(
        type => type?.value === values?.type,
    );
    const selectedType = types?.[selectedTypeIndex];
    const selectedServiceParam =
        Array.isArray(selectedItem?.serviceparams) &&
        selectedItem?.serviceparams?.find(item => item?.id === serviceParamId);

    useEffect(() => {
        if (serviceParamId) {
            setValues(selectedServiceParam);
        } else {
            setValues(defaultValues);
        }
    }, [serviceParamId]);

    const handleTypeChange = item => {
        const event = {
            target: {
                name: "type",
                value: item?.value,
            },
        };
        handleOnChange(event);
    };

    const handleSaveParam = () => {
        if (validateValues()) {
            const serviceParam = values?.id
                ? values
                : {
                      id: uuid(),
                      ...values,
                  };
            values?.id
                ? setSelectedItem(prev => ({
                      ...prev,
                      serviceparams:
                          Array.isArray(prev?.serviceparams) &&
                          prev?.serviceparams?.map(serviceParam =>
                              serviceParam?.id === values?.id
                                  ? values
                                  : serviceParam,
                          ),
                  }))
                : setSelectedItem(prev => {
                      return {
                          ...prev,
                          serviceparams: prev?.serviceparams
                              ? [...prev?.serviceparams, serviceParam]
                              : [serviceParam],
                      };
                  });
            serviceParamModalRef.current.close();
        }
    };

    return (
        <>
            <div className="row">
                <div className="col-sm-6">
                    <TextField
                        label="Label"
                        placeholder="label"
                        name="label"
                        value={values?.label}
                        onChange={handleOnChange}
                        classes={{
                            label: errors?.label ? "text-danger" : "",
                            input: errors?.label ? "is-invalid !important" : "",
                        }}
                        errors={errors}
                    />
                </div>
                <div className="col-sm-6">
                    <label
                        htmlFor=""
                        className={`mb-2 ${errors.type ? "text-danger" : ""}`}>
                        Types
                    </label>
                    <ReactSelect
                        options={types}
                        selectedOption={selectedType}
                        handleChange={handleTypeChange}
                    />
                    <div className="text-danger">{errors?.type}</div>
                </div>
                <div className="col-sm-12">
                    <DynamicCheckBoxs
                        items={[
                            { code: "IS-EXPRESSION", label: "is expression" },
                        ]}
                        handleChange={selectedOption =>
                            handleOnChange({
                                target: {
                                    name: "is_expression",
                                    value: selectedOption,
                                },
                            })
                        }
                        selectedItem={values?.is_expression}
                    />
                    {values?.type !== "DATE-RANGE" && (
                        <TextArea
                            placeholder="Default Value"
                            label="Default Value"
                            name="default_value"
                            value={values?.default_value}
                            onChange={handleOnChange}
                        />
                    )}
                    {values?.type === "DATE-RANGE" && (
                        <div className="row">
                            <div className="col">
                                <TextArea
                                    placeholder="Default Value"
                                    label="Start"
                                    name="start_default_value"
                                    value={values?.start_default_value}
                                    onChange={handleOnChange}
                                />
                            </div>
                            <div className="col">
                                <TextArea
                                    placeholder="Default Value"
                                    label="End"
                                    name="end_default_value"
                                    value={values?.end_default_value}
                                    onChange={handleOnChange}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {(values?.type === "SELECT" ||
                    values?.type === "RADIO" ||
                    values?.type === "CHECKBOX") && (
                    <div className="col-sm-12">
                        {values && (
                            <MultiValuePropsEditor
                                handleOnChange={handleOnChange}
                                values={values}
                                setValues={setValues}
                            />
                        )}
                    </div>
                )}
            </div>
            <button
                className="button-theme float-end"
                onClick={handleSaveParam}>
                Save
            </button>
        </>
    );
}

function Listing(props) {
    const { items, renderItem } = props;
    return (
        Array.isArray(items) &&
        items?.map((item, index) => renderItem(item, index))
    );
}

function ListItem(props) {
    const {
        item,
        index,
        setSelectedItem,
        setServiceParamId,
        serviceParamModalRef,
    } = props;

    const [deleteItemId, setDeleteItemId] = useState("");
    const deleteModalRef = useRef(null);

    const handleItemSelection = id => {
        setSelectedItem(prev => ({
            ...prev,
            serviceparams:
                Array.isArray(prev?.serviceparams) &&
                prev?.serviceparams?.map((serviceParam, i) => {
                    return i === index
                        ? {
                              ...serviceParam,
                              selected: id ? true : false,
                          }
                        : serviceParam;
                }),
        }));
    };

    const editServiceParam = item => {
        setServiceParamId(item?.id);
        serviceParamModalRef.current.show();
    };

    const handleDeleteConfimation = item => {
        setDeleteItemId(item?.id);
        deleteModalRef.current.show();
    };

    const handleDeleteParam = item => {
        setSelectedItem(prev => ({
            ...prev,
            serviceparams:
                Array.isArray(prev?.serviceparams) &&
                prev?.serviceparams?.filter(
                    serviceParam => serviceParam.id !== deleteItemId,
                ),
        }));
    };

    return (
        <li className="d-flex justify-content-between">
            <ChildrenModal
                ref={deleteModalRef}
                size="md"
                centered
                header={"Delete Confirmation"}>
                <DeleteConfimation
                    item={index}
                    deleteModalRef={deleteModalRef}
                    handleDelete={handleDeleteParam}
                    message="Are you sure to delete this service param?"
                />
            </ChildrenModal>
            <DynamicCheckBoxs
                items={[item]}
                mapValue="id"
                mapLabel="label"
                handleChange={handleItemSelection}
                selectedItem={item?.selected ? item?.id : ""}
            />
            <div className="action-icon">
                <i
                    className="fa fa-trash std-icon-size"
                    onClick={() => handleDeleteConfimation(item)}
                />
                <i
                    className="fa-solid fa-gear std-icon-size me-2"
                    title="Edit"
                    onClick={() => editServiceParam(item)}></i>
            </div>
        </li>
    );
}

function ConfigurationDesigner(props) {
    const { handleOnChange, values, setValues } = props;
    const selectMethods = [{ label: "Static", code: "STATIC" }];
    const map_label = values?.map_label;
    const map_value = values?.map_value;
    const disabledServiceKey = !map_label || !map_value;

    const handleOnChangeMethod = user_static => {
        setValues({
            ...values,
            user_static,
            options: [],
            service_key: "",
        });
    };

    const handleOption = options => {
        setValues({
            ...values,
            options,
        });
    };

    const getOptionByKey = async event => {
        try {
            if (event.key === "Enter") {
                const keys = [
                    {
                        dataKey: "options",
                        serviceKey: values?.service_key,
                    },
                ];
                const url = `${API_URL}?service.key=multiKey.data`;
                const response = await getData({ keys, url });
                const options = response?.data?.C_DATA?.options?.map(
                    option => ({
                        option_id: uuid(),
                        [map_label]: option[map_label],
                        [map_value]: option[map_value],
                    }),
                );

                setValues({
                    ...values,
                    options,
                });
            }
        } catch (error) {
            console.log(error);
            toastEmitter("Data fetching error", true, "error");
        }
    };

    return (
        <>
            <DynamicCheckBoxs
                items={selectMethods}
                handleChange={handleOnChangeMethod}
                selectedItem={values?.user_static}
            />
            <div className="row">
                <div className="col">
                    <TextField
                        placeholder="Map Label"
                        label="Map Label"
                        name="map_label"
                        value={values?.map_label}
                        onChange={handleOnChange}
                        onKeyDown={getOptionByKey}
                    />
                </div>
                <div className="col">
                    <TextField
                        placeholder="Map Value"
                        label="Map Value"
                        name="map_value"
                        value={values?.map_value}
                        onChange={handleOnChange}
                        onKeyDown={getOptionByKey}
                    />
                </div>
                <div className="col">
                    {values?.user_static !== "YES" && (
                        <TextField
                            label="Service Key"
                            placeholder={`Service Key ${
                                disabledServiceKey ? "is disabled" : ""
                            }`}
                            name="service_key"
                            value={values?.service_key}
                            onChange={handleOnChange}
                            onKeyDown={getOptionByKey}
                            disabled={disabledServiceKey}
                        />
                    )}
                </div>
            </div>

            <OptionBuilder
                user_static={values?.user_static}
                options={values?.options}
                setOptions={handleOption}
                map_label={values?.map_label}
                map_value={values?.map_value}
            />
        </>
    );
}

function OptionBuilder(props) {
    const {
        options = [],
        setOptions,
        user_static,
        map_label,
        map_value,
    } = props;

    const handleAddNewOption = () => {
        setOptions([
            ...options,
            { option_id: uuid(), [map_label]: "", [map_value]: "" },
        ]);
    };

    return (
        <>
            {user_static === "STATIC" && (
                <button
                    disabled={!map_label || !map_value}
                    className="button-theme"
                    onClick={handleAddNewOption}>
                    Add Option
                </button>
            )}

            <ul className="option-builder p-0">
                <Listing
                    items={options}
                    renderItem={(item, index) => {
                        return (
                            <Option
                                key={item?.option_id}
                                item={item}
                                index={index}
                                options={options}
                                setOptions={setOptions}
                                user_static={user_static}
                                map_label={map_label}
                                map_value={map_value}
                            />
                        );
                    }}
                />
            </ul>
        </>
    );
}

function Option(props) {
    const {
        item,
        index,
        options,
        setOptions,
        user_static,
        map_label,
        map_value,
    } = props;

    const handleOnChange = event => {
        const { name, value } = event.target;
        let selectedOption = structuredClone(options[index]);
        selectedOption = { ...selectedOption, [name]: value };
        setOptions(
            options.map(option => {
                return option.option_id === selectedOption.option_id
                    ? selectedOption
                    : option;
            }),
        );
    };

    const deleteOption = item => {
        setOptions(
            options.filter(option => option.option_id !== item.option_id),
        );
    };

    return (
        <>
            {user_static === "STATIC" && (
                <div className="row align-items-center">
                    <div className="col-sm-5">
                        <TextField
                            placeholder={map_label}
                            label={map_label}
                            name={map_label}
                            value={item?.[map_label]}
                            onChange={e => handleOnChange(e, index)}
                            disabled={user_static === ""}
                        />
                    </div>
                    <div className="col-sm-5">
                        <TextField
                            placeholder={map_value}
                            label={map_value}
                            name={map_value}
                            value={item?.[map_value]}
                            onChange={e => handleOnChange(e)}
                            disabled={user_static === ""}
                        />
                    </div>
                    <div
                        className="col-2"
                        onClick={() => deleteOption(item)}>
                        <button className="btn btn-sm btn-danger  mt-3">
                            <span className="fa fa-trash"></span>
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

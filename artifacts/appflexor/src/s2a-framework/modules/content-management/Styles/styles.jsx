import { css } from "@codemirror/lang-css";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import { ExportForm } from "../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../components/Modal/Modal";
import Scroll from "../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../components/SearchAndBtns/SearchAndBtns";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import {
    deleteItem,
    filterArrayByTerms,
    formatDateForUserView,
    insertItem,
    jsonExport,
    updateDeleteConfig,
    updateItem,
    validArray,
} from "../../../utils/utils";
import CsvModal from "../../data-management/datalist-builder/custom-action-modal/CsvModal";
import Tag from "../page-builder/Designer/components/Tag/Tag";
import { getData as globalGetData } from "../../../components/CrudApiCall";
import ErrorNotification from "../../../components/ErrorNotification";
import useMobileView from "../../../components/custom-hooks/useMobileView";

export default function Styles(props) {
    const { activeTab, channels, channel } = props;
    // const [selectedChannelId, setSelectedChannelId] = useState(channel?.id);
    const [selectedChannelId, setSelectedChannelId] = useState(() => {
        return localStorage.getItem("selectedChannelId") || channel?.id || "";
    });

    let initialState = {
        id: "new",
        title: "",
        tags: "",
        css_styles: "",
        channel_id: selectedChannelId,
    };

    const [style, setStyle] = useState(initialState);
    const [styles, setStyles] = useState([]);
    const [filteredSearchTag, setFilteredSearchTag] = useState([]);
    const [filteredStyle, setFilteredStyle] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagSuggestion, setTagSuggestion] = useState({});
    const [selectedItemId, setSelectedItemId] = useState("");
    const [error, setError] = useState([]);
    const inputReference = useRef(null);
    const [csvModal, setCsvModal] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const [siteSearch, setSiteSearch] = useState("");
    const [filteredChannels, setFilteredChannels] = useState(channels);

    const siteRef = useRef(null);
    const modalRef = useRef(null);
    let fields = Object.keys(style);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const listingRef = useRef(null);
    const formRef = useRef(null);

    const isMobileView = useMobileView();

    const handleListingScroll = () => {
        if (listingRef.current && isMobileView) {
            listingRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const handleFormScroll = () => {
        if (formRef.current && isMobileView) {
            formRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    useEffect(() => {
        if (activeTab === "CUSTOM_STYLES") {
            getData("FIRST_RENDER");
        } else if (selectedChannelId && activeTab === "CUSTOM_STYLES") {
            getData();
        }
    }, [activeTab, selectedChannelId]);

    useEffect(() => {
        if (selectedItemId) {
            getSelectedItem(selectedItemId);
            setError([]);
        }
    }, [selectedItemId]);

    const handleTags = tagFromChild => {
        setStyle(prev => ({
            ...prev,
            tags: tagFromChild,
        }));
    };

    function searchStyle(searchTag) {
        let filteredStyleWithTags = [];
        styles &&
            styles.length > 0 &&
            styles.forEach(item => {
                searchTag &&
                    searchTag.length > 0 &&
                    searchTag.forEach(relatedStyle => {
                        if (relatedStyle.style_id === item.id) {
                            filteredStyleWithTags.push(item);
                        }
                    });
            });
        return filteredStyleWithTags ? filteredStyleWithTags : [];
    }

    function handleSearch(event) {
        let filteredByName;

        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        let findStyle = searchStyle(result);
        if (findStyle.length === 0) {
            if (value.length > 0) {
                filteredByName = filterArrayByTerms(styles, value, fields);
            }
            if (value.length < 1) {
                setFilteredStyle(styles);
            } else setFilteredStyle(filteredByName);
        } else {
            setFilteredStyle(findStyle);
        }
        if (value.length > 1) {
            result = filterArrayByTerms(
                style.tags === "" ? [] : style.tags,
                value,
                fields,
            );
        }

        setFilteredSearchTag(result);
    }

    const handleInput = e => {
        let value = e.target.value;
        let name = e.target.name;

        setStyle(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveStyle = () => {
        if (validatiion()) {
            let fieldData = { ...style };

            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "styles"; //"formid"
            entityForm.entity = "styles"; //Db- "table name"
            entityForm.action = "update";

            if (fieldData.id == "" || fieldData.id == "new") {
                entityForm.id = "new";
                fieldData.id = "new";
            } else {
                entityForm.id = fieldData.id;
            }
            delete fieldData.selected;

            entityForm.formData = fieldData;
            request.data.push(entityForm);

            try {
                axios.post(url, request).then(function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        const data = response.data.C_DATA[0].formData;
                        if (fieldData.id === "new" || !fieldData.id) {
                            insertItem(setStyles, data);
                            insertItem(setFilteredStyle, data);
                        } else {
                            updateItem(setStyles, data);
                            updateItem(setFilteredStyle, data);
                        }
                        setStyle(data);
                        toastEmitter(
                            `${style.title} ${
                                style.id == "new" || style.id == ""
                                    ? "created"
                                    : "updated"
                            } successfully`,
                            true,
                            "success",
                        );
                    }
                    getData("SAVE");
                });
            } catch (e) {
                console.log("saveStyles error:" + e);
            }
        }
    };

    function validatiion() {
        let _error = [];
        let requiredKeys = ["title"];
        for (let key in style) {
            if (style[key] === "" && requiredKeys.includes(key)) {
                _error.push(key);
            }
        }
        setError(_error);

        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function getData(condition) {
        let parsedTagAndStyles = [];
        var dataRequest = {};
        if (condition === "FIRST_RENDER") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: selectedChannelId,
                        dataKey: "styleList",
                        serviceKey: "sys.styles",
                        mode: "formData",
                    },
                    {
                        serviceParams: "style",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
        } else if (
            condition === "SAVE" ||
            condition === "DELETE" ||
            condition === undefined
        ) {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: selectedChannelId,
                        dataKey: "styleList",
                        serviceKey: "sys.styles",
                        mode: "formData",
                    },
                ],
            };
        } else if (condition === "tagSuggestion") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "style",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
        }
        if (dataRequest) {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === undefined) {
                        getData("FIRST_RENDER");
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA) {
                            if (
                                response.data.C_DATA.styleList &&
                                response.data.C_DATA.styleList.length > 0
                            ) {
                                parsedTagAndStyles = tryToParse(
                                    response.data.C_DATA.styleList,
                                );
                                setStyles(parsedTagAndStyles);
                                if (style && style.id && parsedTagAndStyles) {
                                    const _item = parsedTagAndStyles.find(
                                        item => item.id === style.id,
                                    );
                                    if (_item) {
                                        setStyle(_item);
                                    }
                                }
                            } else {
                                setStyles([]);
                            }
                            if (
                                response.data.C_DATA.styleList &&
                                response.data.C_DATA.styleList.length > 0
                            ) {
                                if (inputReference.current.value) {
                                    let result = filterArrayByTerms(
                                        parsedTagAndStyles,
                                        inputReference.current.value,
                                        fields,
                                    );
                                    setFilteredStyle(result);
                                } else {
                                    setFilteredStyle(parsedTagAndStyles);
                                }
                            } else {
                                setFilteredStyle([]);
                            }
                            if (
                                response.data.C_DATA.tagSuggestionList &&
                                response.data.C_DATA.tagSuggestionList.length >
                                    0
                            ) {
                                let _tagsSuggestion =
                                    response.data.C_DATA.tagSuggestionList[0];
                                _tagsSuggestion.list = tryToParseTags(
                                    _tagsSuggestion.list,
                                );
                                setTagSuggestion(_tagsSuggestion);
                            } else {
                                setTagSuggestion({});
                            }
                        } else {
                            console.log(
                                `Either api does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    function getSuggestionOnly() {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: "style",
                    dataKey: "tagSuggestionList",
                    serviceKey: "sys.tag.suggestion.list",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        if (response.data.C_DATA.tagSuggestionList.length > 0) {
                            let _tagsSuggestion =
                                response.data.C_DATA.tagSuggestionList[0];
                            _tagsSuggestion.list = tryToParseTags(
                                _tagsSuggestion.list,
                            );
                            setTagSuggestion(_tagsSuggestion);
                        } else {
                            setTagSuggestion({});
                        }
                    } else {
                        console.log(
                            `Either api does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function tryToParse(styles) {
        let parsedTagsAndStyles = [];
        try {
            styles &&
                styles.forEach(item => {
                    if (item.tags) {
                        item.tags = JSON.parse(
                            item.tags !== "" ? item.tags : "[]",
                        );
                    }
                    parsedTagsAndStyles.push(item);
                });
            return parsedTagsAndStyles ? parsedTagsAndStyles : [];
        } catch (error) {
            console.log(error);
        }
    }

    const handleDeleteStyle = (style, isDelete) => {
        if (isDelete === true) {
            let fieldsData = { ...style };

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "styles";
            entityForm.entity = "styles";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        handleAddNewStyle();
                        updateDeleteConfig(false, {}, setDeleteConfig);

                        deleteItem(setStyles, fieldsData);
                        deleteItem(setFilteredStyle, fieldsData);
                        toastEmitter("Style deleted successfully", true);
                    }
                    getData("DELETE");
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, style, setDeleteConfig);
        }
    };

    function getSelectedItem(id) {
        let selectedStyle = {};
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "styleList",
                    serviceKey: "sys.style",
                    mode: "formData",
                },
            ],
        };

        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA) {
                            if (
                                response.data.C_DATA.styleList &&
                                response.data.C_DATA.styleList.length > 0
                            ) {
                                selectedStyle =
                                    response.data.C_DATA.styleList[0];
                                selectedStyle.tags =
                                    selectedStyle.tags === ""
                                        ? []
                                        : JSON.parse(selectedStyle.tags);
                                setSelectedTags(selectedStyle.tags);
                                setStyle(selectedStyle);
                                resolve(selectedStyle);
                            } else {
                                setStyle(selectedStyle);
                            }
                        } else {
                            console.log(
                                `Either api does not exists or SQL query returns no result.`,
                            );
                            resolve({});
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
    }

    function handleAddNewStyle() {
        let initialState = {
            id: "",
            title: "",
            tags: "",
            css_styles: "",
            channel_id: selectedChannelId,
        };
        setStyle(initialState);
        setSelectedTags([]);
        setSelectedItemId("");
        setError([]);
    }

    function tryToParseTags(tags) {
        let parsedTags = [];
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            console.log(error);
        }
        return parsedTags ? parsedTags : [];
    }

    function liStyles(item) {
        let classStr = "list-group-item p-2";
        if (style && item && item["id"] === style["id"]) {
            classStr = "list-group-item selected-cell p-2";
        }

        return classStr;
    }

    function handleSelectedStyles(selectedStyles, check) {
        selectedStyles.selected = check;
        let _styles = [...filteredStyle];
        _styles.forEach(item => {
            if (item.id === selectedStyles.id && check) {
                item.selected = check;
            }
        });
        setFilteredStyle(_styles);
    }

    function importStyles() {
        handleShowCsv();
    }

    async function nameExport(title, bool) {
        const items = filteredStyle.filter(item => item.selected);
        let exportedItems = [];

        if (items.length === 1) {
            const res = await fetchExportItems(items);
            exportedItems = resIntoItems(res);
            jsonExport(exportedItems, () => {}, title, "_style");

            // remove selection of checkbox
            setStyles(prev => removeSelection(prev));
            setFilteredStyle(prev => removeSelection(prev));
        } else if (items.length > 1) {
            if (bool) {
                //fetch items
                const res = await fetchExportItems(items);
                exportedItems = resIntoItems(res);

                //export items
                jsonExport(exportedItems, () => {}, title, "_style");
                modalRef.current.close();

                // remove selection of checkbox
                setStyles(prev => removeSelection(prev));
                setFilteredStyle(prev => removeSelection(prev));
            } else {
                modalRef.current.show();
            }
        }
    }

    function removeSelection(items) {
        const _items = [...items];
        const newItems = [];

        for (let item of _items) {
            delete item.selected;
            newItems.push(item);
        }

        return newItems;
    }

    function fetchExportItems(items) {
        const request = {
            keys: [],
            datasource: "",
            tenant_id: "",
        };

        for (let item of items) {
            request.keys.push({
                params: item.id,
                dataKey: item.id,
                serviceKey: "sys.style",
            });
        }

        return globalGetData(request);
    }

    function resIntoItems(res) {
        const data = res.data.C_DATA;
        const exportedItems = [];

        for (let key in data) {
            const item = data[key][0];
            item.selected = true;
            exportedItems.push(item);
        }

        return exportedItems;
    }

    async function duplicateItem(item) {
        const selectedItem = await getSelectedItem(item.id);
        let _item = structuredClone(selectedItem);
        _item.id = "";
        _item.title = "";
        setStyle(_item);
    }

    const handleSiteSearch = event => {
        let textToSearch = event.target.value.toLowerCase();
        setSiteSearch(textToSearch);
        const keysToSearch = ["domain", "brand_title"];
        let result;

        result = filterArrayByTerms(channels, textToSearch, keysToSearch);
        setFilteredChannels(result);
    };

    return (
        <React.Fragment>
            <div className="styles">
                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this style?"}
                    operation={handleDeleteStyle}
                    header={"Delete Style"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
                <ChildrenModal
                    ref={modalRef}
                    header="Export Styles">
                    <ExportForm nameExport={nameExport} />
                </ChildrenModal>
                <CsvModal
                    sites={props.channels}
                    csvModal={csvModal}
                    handleClose={handleCloseCsv}
                    getData={getData}
                    tableName="styles"
                    title="Styles Import"
                />
                <div className="row m-0">
                    <div className="col-sm-3 listing-col s2a-border-right ps-2">
                        <div className="">
                            <div className="listing-header">
                                <div className="fw-bold">Sites</div>
                            </div>
                            <SearchInput
                                ref={siteRef}
                                onChange={handleSiteSearch}
                                placeholder="Search Sites"
                                value={siteSearch}
                            />
                            <Scroll height="54.5vh">
                                <ul
                                    name="channel_id"
                                    className="list-group list-group-flush p-1">
                                    {filteredChannels &&
                                        filteredChannels.map((item, index) => (
                                            <li
                                                onClick={() => {
                                                    setSelectedChannelId(
                                                        item.id,
                                                    ),
                                                        handleAddNewStyle();
                                                    handleListingScroll();
                                                }}
                                                className={`list-group-item ${
                                                    selectedChannelId ===
                                                    item.id
                                                        ? "selected-cell"
                                                        : ""
                                                }`}
                                                key={index}>
                                                <div className="row">
                                                    <span className="col-sm-12">
                                                        {item.brand_title}
                                                    </span>
                                                    <span className="col-sm-12">
                                                        {item.domain}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </Scroll>
                        </div>
                    </div>
                    <div
                        className="col-sm-4 listing-col s2a-border-right"
                        ref={listingRef}>
                        <div className="">
                            <SearchAndBtns
                                title="Styles"
                                handleImport={importStyles}
                                handleExport={() => {
                                    const items = filteredStyle.filter(
                                        item => item.selected,
                                    );
                                    if (validArray(items) && items.length > 0)
                                        nameExport(items[0].name);
                                    else
                                        toastEmitter(
                                            "Select post(s) for export",
                                            true,
                                            "warning",
                                        );
                                }}
                                addNewItem={handleAddNewStyle}
                                handleSearch={handleSearch}
                                inputRef={inputReference}
                                SearchPlaceHolder="Search title, tag"
                                handleFormScroll={handleFormScroll}
                            />
                            <div className="col-sm-12 p-0 table-list-height">
                                <Scroll height="54.5vh">
                                    <ul className="list-group list-group-flush pe-1">
                                        {filteredStyle &&
                                            filteredStyle.length > 0 &&
                                            filteredStyle.map(item => {
                                                return (
                                                    <li
                                                        key={item.id}
                                                        onClick={() => {
                                                            handleFormScroll();
                                                        }}
                                                        className={liStyles(
                                                            item,
                                                        )}>
                                                        <div className="d-flex">
                                                            <div className="col-sm-1">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={
                                                                        item.selected
                                                                    }
                                                                    onChange={e =>
                                                                        handleSelectedStyles(
                                                                            item,
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div
                                                                className="col"
                                                                onClick={() =>
                                                                    setSelectedItemId(
                                                                        item.id,
                                                                    )
                                                                }>
                                                                <h6 className="col-sm-12 title1">
                                                                    {item.title}
                                                                </h6>
                                                                <div className="col-sm-12">
                                                                    <div>
                                                                        <ShowTags
                                                                            tags={
                                                                                item.tags
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <span className="title2">
                                                                        <i className="fa-solid fa-calendar-days pe-1"></i>
                                                                        Last
                                                                        Updated:{" "}
                                                                        {formatDateForUserView(
                                                                            item.datemodified,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-1 dropdown">
                                                                <span
                                                                    className="fa-solid fa-ellipsis-vertical p-2"
                                                                    href="#"
                                                                    role="button"
                                                                    data-bs-toggle="dropdown"
                                                                    aria-expanded="false"></span>
                                                                <ul className="dropdown-menu">
                                                                    <li>
                                                                        <span
                                                                            className="dropdown-item"
                                                                            title="Duplicate"
                                                                            onClick={() =>
                                                                                duplicateItem(
                                                                                    item,
                                                                                )
                                                                            }>
                                                                            <i className="fa-regular fa-clone icon"></i>
                                                                            Duplicate
                                                                        </span>
                                                                    </li>
                                                                    <li>
                                                                        <span
                                                                            className="dropdown-item dropdown-item-del"
                                                                            title="Delete"
                                                                            onClick={() =>
                                                                                handleDeleteStyle(
                                                                                    item,
                                                                                )
                                                                            }>
                                                                            <i className="fa-regular fa-trash-can"></i>
                                                                            Delete
                                                                        </span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                    </ul>
                                </Scroll>
                            </div>
                        </div>
                    </div>
                    <div
                        className="col-sm-5 listing-col"
                        ref={formRef}>
                        <div className="listing-header">
                            <div className="fw-bold">Style Details</div>
                        </div>
                        <div className="form form-background p-1">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 mb-1 fw-bold">
                                            Title&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                            {/* <span className="text-danger">
                                                {error &&
                                                    error.indexOf("title") !==
                                                        -1 &&
                                                    "Title is required"}
                                            </span> */}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="title"
                                            value={style ? style.title : ""}
                                            onChange={e => handleInput(e)}
                                        />
                                    </div>
                                </div>

                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 mb-2 fw-bold">
                                            Tags
                                            <span className="text-danger"></span>
                                        </label>
                                        <Tag
                                            handleTags={handleTags}
                                            selectedPostTags={selectedTags}
                                            suggestion={
                                                tagSuggestion &&
                                                tagSuggestion.list
                                            }
                                            tagList={tagSuggestion}
                                            getData={getSuggestionOnly}
                                            category="style"
                                        />
                                    </div>
                                </div>

                                <div className="col-sm-12 p-2">
                                    <div className="form-group">
                                        <label className="my-1 fw-bold">
                                            CSS&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <div className="mb-2">
                                            <CodeMirror
                                                className="code-mirror enable-scroll"
                                                value={style.css_styles}
                                                height="100%"
                                                theme={"dark"}
                                                extensions={[css()]}
                                                onChange={(
                                                    value,
                                                    viewUpdate,
                                                ) => {
                                                    let e = {
                                                        target: {
                                                            value,
                                                            name: "css_styles",
                                                        },
                                                    };
                                                    handleInput(e);
                                                }}
                                            />
                                        </div>

                                        {/* <textarea
                                        rows={6}
                                        type="text"
                                        className="form-control"
                                        name="css_styles"
                                        value={style ? style.css_styles : ""}
                                        onChange={e =>
                                            handleInput(e)
                                        }></textarea> */}
                                    </div>
                                </div>
                                <span className="d-flex justify-content-end my-2">
                                    <button
                                        className="btn-sm btn button-theme  button-theme"
                                        onClick={() => handleSaveStyle()}>
                                        <i className="fa-solid fa-floppy-disk mx-1"></i>
                                        Save
                                    </button>
                                </span>
                                <div className="p-2">
                                    <ErrorNotification
                                        error={error}
                                        labels={{
                                            title: "Title",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

function ShowTags({ tags }) {
    return (
        <>
            {tags &&
                tags.length > 0 &&
                tags.slice(0, 3).map(item => {
                    return <TagOnly name={item.name} />;
                })}
        </>
    );
}

function TagOnly({ name }) {
    return <div className="badge tag-badge">{name}</div>;
}

function SearchInput(props) {
    return (
        <div className="">
            <div className="mb-2 input-group">
                <input
                    type="text"
                    className="form-control"
                    {...props}
                />
            </div>
        </div>
    );
}

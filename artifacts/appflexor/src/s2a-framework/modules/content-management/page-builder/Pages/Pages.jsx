import axios from "axios";
import React, {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import {
    ExportForm,
    exportData,
} from "../../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../../components/Modal/Modal";
import Scroll from "../../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../../components/SearchAndBtns/SearchAndBtns";
import SearchItem from "../../../../components/Searching/SearchItem";
import TagListing from "../../../../components/Taglisting/TagListing";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    filterPagesByTagSelection,
    formatDateForUserView,
    handleSelectItem,
    jsonExport,
    selectTags,
    updateDeleteConfig,
    validArray,
} from "../../../../utils/utils";
import CsvModal from "../../../data-management/datalist-builder/custom-action-modal/CsvModal";
import PageContext from "../Context/PageContext";
import Designer from "../Designer";
import { modeType } from "../Designer/Designer";
import Tag from "../Designer/components/Tag/Tag";
import { getSelectedItem } from "../../../../components/CrudApiCall";
import {
    dbTagConversion,
    insertItem,
    updateItem,
    deleteItem,
} from "../../../../utils/utils";
import { tryToParse } from "../datalist-viewer/datalist-helper/DatalistHelpers";
import { getData as globalGetData } from "../../../../components/CrudApiCall";
import useLogger from "../../../../components/hooks/useLogger";
import ErrorNotification from "../../../../components/ErrorNotification";
import useMobileView from "../../../../components/custom-hooks/useMobileView";

function Pages(props) {
    const [layout, setLayout] = useState([]);
    const [pageList, setPageList] = useState([]);
    const [components, setComponents] = useState({});
    const [channals, setChannals] = useState(props.channels);
    const [filteredPageList, setFilteredPageList] = useState([]);
    const [pageListFilterByTag, setPageListFilterByTag] = useState([]);
    const [htmlCollection, setHtmlCollection] = useState({});
    const [mode, setMode] = useState(modeType.render);
    const [error, setError] = useState([]);
    const [message, setMessage] = useState("");
    const [canDesign, setCanDesign] = useState("");
    const [designMode, setDesignMode] = useState(false);
    const [renderPreview, setRenderPreview] = useState(false);
    const [selectedChannelId, setSelectedChannelId] = useState(() => {
        return localStorage.getItem("selectedChannelId") || props.channel.id;
    });

    const [tagSuggestion, setTagSuggestion] = useState({});
    const [inputSearch, setInputSearch] = useState("");
    const [siteSearch, setSiteSearch] = useState("");
    const inputRef = useRef(null);
    const siteRef = useRef(null);
    const appContext = useContext(AppContext);
    const channel = appContext?.channel;
    const pageListRef = useRef(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [styles, setStyles] = useState([]);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });
    const INITIAL_STATE = {
        id: "new",
        name: "",
        channel: props.channel.id,
        description: "",
        styles: "",
        css_styles: "",
        design: {
            layout: [],
            components: {},
            htmlCollection: {},
        },
        tags: [],
        title_image: "",
        meta_tags: "",
        type: "PROTECTED",
    };
    const [selectedItem, setSelectedItem] = useState({});
    const [selectedPage, setSelectedPage] = useState(INITIAL_STATE);

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
        if (selectedChannelId) {
            console.log(
                "************ selectedChannelId > " + selectedChannelId,
            );
            // let page = INITIAL_STATE;
            // page.channel = selectedChannelId;
            // setSelectedPage();
        }
    }, [selectedChannelId]);

    useEffect(() => {
        if (selectedItem.id) {
            getPage(selectedItem);
        }
    }, [selectedItem.id]);

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        if (selectedChannelId && props.activeTab === "PAGES") {
            getData("FIRST_RENDER");
        }
    }, [selectedChannelId]);

    useEffect(() => {
        if (props && props.activeTab === "PAGES") {
            getData("FIRST_RENDER");
            setDesignMode(false);
        }
        if (props && props.mode) {
            setMode(props.mode);
        } else {
            setMode(modeType.render);
        }
    }, [props?.activeTab, props?.mode]);

    function addNewItem() {
        let page = INITIAL_STATE;
        page.channel = selectedChannelId;
        setError("");
        setLayout([]);
        setComponents({});
        setHtmlCollection({});
        setError([]);
        setSelectedPage(page);
        setCanDesign("");
        setSelectedItem({});
    }

    function clearFields() {
        addNewItem();
    }

    function validation(selectedPage) {
        let _error = [];

        let keysToCheck = ["name", "channel"];

        keysToCheck.map(key => {
            if (selectedPage[key] === "") {
                _error.push(key);
            }
        });

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function handleUpdateData() {
        let temp = { ...selectedPage };
        temp.design = {};

        temp.design = {
            layout: layout,
            components: components,
            htmlCollection: htmlCollection,
        };
        setSelectedPage(temp);
        saveData(temp);
    }

    // event handlers
    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;
        if (name == "type" && layout.length > 0) {
            if (
                confirm(
                    "Changing type will reset Page Layout changes. Are you sure?",
                )
            ) {
                setLayout([]);
                setComponents({});
                setHtmlCollection({});
                setSelectedPage(prev => ({
                    ...prev,
                    design: INITIAL_STATE.design,
                }));
            } else {
                return;
            }
        }

        setSelectedPage(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function getUpdatedState(id, arr) {
        return arr.filter(el => el.id === id);
    }

    const handlePageSearch = event => {
        try {
            let textToSearch = event.target.value.toLowerCase();

            const keysToSearch = ["name", "description", "channel", "tags"];
            let result = [];

            if (selectedTags.length > 0) {
                const filterPagesByTags = pageListRef.current.filterByTags(
                    pageList,
                    selectedTags,
                    setPageListFilterByTag,
                );
                result = filterArrayByTerms(
                    filterPagesByTags,
                    textToSearch,
                    keysToSearch,
                );
                setPageListFilterByTag(result);
            } else {
                result = filterArrayByTerms(
                    pageList,
                    textToSearch,
                    keysToSearch,
                );
                setFilteredPageList(result);
            }

            setInputSearch(event.target.value);
        } catch (error) {
            console.log(error);
        }
    };

    const handleSiteSearch = event => {
        let textToSearch = event.target.value.toLowerCase();
        setSiteSearch(textToSearch);
        const keysToSearch = ["domain", "brand_title"];
        let result = [];

        if (textToSearch.length > 2) {
            result = filterArrayByTerms(
                props.channels,
                textToSearch,
                keysToSearch,
            );
            setChannals(result);
        } else if (textToSearch.length < 2 || textToSearch.length === 0) {
            setChannals(props.channels);
        } else {
            result = filterArrayByTerms(
                props.channels,
                textToSearch,
                keysToSearch,
            );
            setChannals(result);
        }
    };

    async function handlePageSelect(page) {
        setSelectedItem(page);
    }

    async function getPage(page) {
        try {
            // get page
            const res = await getSelectedItem({
                id: page.id,
                serviceKey: "sys.selected.page",
            });
            const selectedPage = res.data.C_DATA[page.id][0];
            selectedPage.design = JSON.parse(selectedPage.design);

            setError([]);
            // set page data
            setSelectedPage(selectedPage);
            setLayout(selectedPage.design.layout);
            setComponents(selectedPage.design.components);
            setHtmlCollection(selectedPage.design.htmlCollection);
            const tags = selectedPage.tags.includes(";")
                ? dbTagConversion(selectedPage.tags)
                : tryToParse(selectedPage.tags);
            setSelectedPage(prev => ({
                ...prev,
                tags: tags,
            }));
        } catch (error) {
            console.log(error);
        }
    }

    function handleCanDesign() {
        if (selectedPage.id === "" || selectedPage.id === "new") {
            setCanDesign("Form needs to be saved first before designing.");
            setDesignMode(false);

            setTimeout(() => {
                setCanDesign("");
            }, 3000);
        } else {
            setCanDesign("");
            setDesignMode(true);
        }
    }

    async function duplicateSelectedPage(page) {
        try {
            const res = await getSelectedItem({
                id: page.id,
                serviceKey: "sys.selected.page",
            });
            const selectedPage = res.data.C_DATA[page.id][0];
            selectedPage.id = "new";
            selectedPage.name = "";
            selectedPage.design = JSON.parse(selectedPage.design);
            selectedPage.tags = selectedPage.tags.includes(";")
                ? dbTagConversion(selectedPage.tags)
                : tryToParse(selectedPage.tags);

            const _layout = [...selectedPage.design.layout];
            const _components = { ...selectedPage.design.components };
            const _htmlCollection = { ...selectedPage.design.htmlCollection };
            const _duplicatedFrom = {
                ...selectedPage,
            };
            setLayout(_layout);
            setComponents(_components);
            setSelectedPage(_duplicatedFrom);
            setHtmlCollection(_htmlCollection);
            setMessage("Page duplicated successfully!");
            setTimeout(() => {
                setMessage("");
            }, 3000);
        } catch (error) {
            console.log(error);
        }
    }
    // API calls

    function saveData(obj) {
        if (validation(obj)) {
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "pages"; //"formid"
            entityForm.entity = "pages"; //Db- "table name"
            entityForm.action = "update";

            if (!obj.id || obj.id == "" || obj.id == "new") {
                entityForm.id = "new";
                obj.id = "new";
            } else {
                entityForm.id = obj.id;
            }
            delete obj.selected;
            obj.channel = selectedChannelId;
            entityForm.formData = obj;
            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        const data = response.data.C_DATA[0].formData;
                        if (
                            (selectedPage.id === "new" ||
                                selectedPage.id === "") &&
                            data.id
                        ) {
                            setSelectedPage(prev => ({
                                ...prev,
                                id: data.id,
                            }));
                            insertItem(setPageList, data);
                            insertItem(setFilteredPageList, data);
                            insertItem(setPageListFilterByTag, data);
                        } else {
                            updateItem(setPageList, data);
                            updateItem(setFilteredPageList, data);
                            updateItem(setPageListFilterByTag, data);
                        }
                        toastEmitter(
                            `${selectedPage.name} ${
                                selectedPage.id == "new" ||
                                selectedPage.id == ""
                                    ? "saved"
                                    : "updated"
                            } successfully.`,
                            3000,
                        );
                    }
                });
            } catch (e) {
                console.log("saveData error:" + e);
            }
        } else {
            return;
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;
            // let deleteRecordChannelId = fieldsData.channel

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "pages";
            entityForm.entity = "pages";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        deleteItem(setPageList, item);
                        deleteItem(setFilteredPageList, item);
                        deleteItem(setPageListFilterByTag, item);
                        updateDeleteConfig(false, {}, setDeleteConfig);
                        toastEmitter("Page deleted successfully", true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    function getData(condition) {
        const channel_id = selectedChannelId
            ? selectedChannelId
            : props.channel.id;
        if (condition === "FIRST_RENDER") {
            var dataRequest = {
                dataKeys: [
                    {
                        serviceParams: channel_id,
                        dataKey: "pageList",
                        serviceKey: "sys.pages",
                        mode: "formData",
                    },
                    {
                        serviceParams: "page",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                    {
                        serviceParams: channel_id,
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
                        serviceParams: "page",
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
                        dataKey: "pageList",
                        serviceKey: "sys.pages",
                        mode: "formData",
                    },
                ],
            };
        }
        try {
            return new Promise((resolve, reject) => {
                axios
                    .post(
                        API_URL + "?service.key=masterKey.tenantData",
                        dataRequest,
                    )
                    .then(async response => {
                        // console.log(response);

                        if (response.data.C_STATUS === undefined) {
                            getData("FIRST_RENDER");
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                            console.log(`UNAUTHORIZED, please login.`);
                        } else if (response.data.C_STATUS === "SUCCESS") {
                            resolve(response);
                            if (siteSearch) {
                                handleSiteSearch({
                                    target: { value: siteSearch },
                                });
                            }

                            if (response.data.C_DATA.pageList) {
                                let _pageList = response.data.C_DATA.pageList;

                                setPageList(_pageList);

                                // filter pages by selected channel
                                let selectedChannelPages = filterArrayByTerms(
                                    response.data.C_DATA.pageList,
                                    selectedChannelId,
                                    ["channel"],
                                );

                                // search channel if any input provided
                                if (inputSearch) {
                                    const keysToSearch = [
                                        "name",
                                        "description",
                                        "channel",
                                        "tags",
                                    ];
                                    let array =
                                        selectedChannelPages.length > 0
                                            ? selectedChannelPages
                                            : _pageList;
                                    let final = filterArrayByTerms(
                                        array,
                                        inputSearch,
                                        keysToSearch,
                                    );
                                    if (selectedTags.length) {
                                        final =
                                            pageListRef.current.filterByTags(
                                                final,
                                                selectedTags,
                                                setPageListFilterByTag,
                                            );
                                    }
                                    setPageList(selectedChannelPages);
                                    setFilteredPageList(final);
                                } else {
                                    const tagLen = selectedTags.length;

                                    if (selectedChannelPages) {
                                        if (tagLen)
                                            pageListRef.current.filterByTags(
                                                selectedChannelPages,
                                                selectedTags,
                                                setPageListFilterByTag,
                                            );
                                        else
                                            setFilteredPageList(
                                                selectedChannelPages,
                                            );
                                    } else {
                                        if (tagLen)
                                            pageListRef.current.filterByTags(
                                                selectedChannelPages,
                                                selectedTags,
                                                setPageListFilterByTag,
                                            );
                                        else setFilteredPageList(_pageList);
                                    }
                                }
                                if (
                                    selectedPage.id &&
                                    selectedPage.id !== "new"
                                ) {
                                    const res = await getSelectedItem({
                                        id: selectedPage.id,
                                        serviceKey: "sys.selected.page",
                                    });
                                    let updatedState =
                                        res.data.C_DATA[selectedPage.id];

                                    updatedState[0].design = JSON.parse(
                                        updatedState[0].design,
                                    );
                                    if (updatedState.length !== 0) {
                                        setSelectedPage(updatedState[0]);
                                        setLayout(
                                            updatedState[0].design.layout,
                                        );
                                        setComponents(
                                            updatedState[0].design.components,
                                        );
                                        setHtmlCollection(
                                            updatedState?.design?.htmlCollection,
                                        );
                                    } else {
                                        setSelectedPage(INITIAL_STATE);
                                        setLayout([]);
                                        setComponents({});
                                        setHtmlCollection({});
                                    }
                                }
                            } else {
                                console.log(
                                    `Either list.all.pages does not exists or SQL query returns no result.`,
                                );
                            }
                            if (response.data.C_DATA.styleList) {
                                setStyles(response.data.C_DATA.styleList);
                            } else {
                                // setStyles([]);
                            }
                        }
                        if (response.data.C_STATUS === "SUCCESS") {
                            if (
                                checkArray(
                                    response.data.C_DATA.tagSuggestionList,
                                )
                            ) {
                                let _tagsSuggestion =
                                    response.data.C_DATA.tagSuggestionList.find(
                                        item => item.category === "page",
                                    );
                                _tagsSuggestion.list = tryToParseTags(
                                    _tagsSuggestion.list,
                                );
                                setTagSuggestion(_tagsSuggestion);
                            } else if (
                                condition === "FIRST_RENDER" ||
                                condition === "tagSuggestion"
                            ) {
                                setTagSuggestion({});
                            }
                        } else {
                            console.log(
                                `Either sys.tag.suggestion.list does not exists or SQL query returns no result.`,
                            );
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            });
        } catch (error) {
            console.log(error);
            toastEmitter(error, true, "error");
        }
    }

    function checkArray(obj) {
        try {
            for (let key in obj) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
        }

        return false;
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

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    function handleChannelChange(value) {
        setSelectedChannelId(value);
        let page = INITIAL_STATE;
        page.channel = value;
        setSelectedPage(page);
        // setSelectedPage(prev => ({
        //     ...prev,
        //     channel: value,
        // }));
    }

    const handleTags = tagFromChild => {
        setSelectedPage(prev => ({
            ...prev,
            tags: tagFromChild,
        }));
    };

    return (
        <ErrorBoundary>
            <PageContext.Provider
                value={{
                    layout,
                    components,
                    htmlCollection,
                    selectedForm: selectedPage,
                    renderPreview,
                    selectedChannelId,
                    setLayout,
                    setHtmlCollection,
                    setComponents,
                    setSelectedForm: setSelectedPage,
                    setRenderPreview,
                }}>
                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this item"}
                    operation={deleteData}
                    header={"Delete Page"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
                <div
                    id="pages"
                    className="pages page-builder">
                    {mode === modeType.design || mode === modeType.preview ? (
                        <div className="d-flex justify-content-center align-items-center form-dnd-preview">
                            <div>
                                <span className="text-danger">
                                    Page builder
                                </span>{" "}
                                added successfully.
                            </div>
                        </div>
                    ) : null}
                    {mode === modeType.render && (
                        <div className="">
                            <div className="">
                                {!designMode ? (
                                    <PageList
                                        designMode={designMode}
                                        ref={pageListRef}
                                        siteSearch={siteSearch}
                                        selectedTags={selectedTags}
                                        setSelectedTags={setSelectedTags}
                                        selectedChannelId={selectedChannelId}
                                        pageList={pageList}
                                        setPageList={setPageList}
                                        addNewItem={addNewItem}
                                        handlePageSearch={handlePageSearch}
                                        inputSearch={inputSearch}
                                        inputRef={inputRef}
                                        filteredPageList={filteredPageList}
                                        pageListFilterByTag={
                                            pageListFilterByTag
                                        }
                                        setPageListFilterByTag={
                                            setPageListFilterByTag
                                        }
                                        handlePageSelect={handlePageSelect}
                                        duplicateSelectedPage={
                                            duplicateSelectedPage
                                        }
                                        deleteData={deleteData}
                                        error={error}
                                        selectedPage={selectedPage}
                                        message={message}
                                        canDesign={canDesign}
                                        layout={layout}
                                        components={components}
                                        handleCanDesign={handleCanDesign}
                                        handleInputField={handleInputField}
                                        saveData={saveData}
                                        channals={channals}
                                        handleChannelChange={
                                            handleChannelChange
                                        }
                                        handleTags={handleTags}
                                        pageSelectedTags={selectedPage.tags}
                                        tagSuggestion={tagSuggestion}
                                        getData={getData}
                                        setFilteredPageList={
                                            setFilteredPageList
                                        }
                                        handleSiteSearch={handleSiteSearch}
                                        siteRef={siteRef}
                                        styles={styles}
                                        listingRef={listingRef}
                                        formRef={formRef}
                                        handleListingScroll={
                                            handleListingScroll
                                        }
                                        handleFormScroll={handleFormScroll}
                                    />
                                ) : (
                                    <Designer
                                        designMode={designMode}
                                        setDesignMode={setDesignMode}
                                        selectedPage={selectedPage}
                                        updateData={handleUpdateData}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </PageContext.Provider>
        </ErrorBoundary>
    );
}

const PageList = forwardRef(function PageList(props, ref) {
    const {
        selectedTags,
        setSelectedTags,
        setPageListFilterByTag,
        pageList,
        filteredPageList,
        tagSuggestion,
        designMode,
        styles,
        error,
        listingRef,
        formRef,
        handleListingScroll,
        handleFormScroll,
    } = props;
    const [csvModal, setCsvModal] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const [selectedSite, setSelectedSite] = useState(props.selectedChannelId);
    const modalRef = useRef(null);
    const filterTagRef = useRef(null);

    const tagSearchRef = useRef(null);
    const [searchFilterTags, setSearchFilterTags] = useState();

    useEffect(() => {
        filterPagesByTagSelection(
            pageList,
            selectedTags,
            setPageListFilterByTag,
        );
    }, [designMode]);

    useEffect(() => {
        setSearchFilterTags(tagSuggestion.list);
    }, [tagSuggestion?.list]);

    useEffect(() => {
        if (selectedTags && selectedTags.length < 1)
            props.setPageListFilterByTag(props.filteredPageList);
    }, [props.filteredPageList]);

    useImperativeHandle(
        ref,
        () => {
            return {
                filterByTags: filterPagesByTagSelection,
            };
        },
        [],
    );

    function checkTags(tags) {
        try {
            for (let key in tags) {
                if (key) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function importPages() {
        handleShowCsv();
    }

    async function nameExport(title, bool) {
        const items = props.pageListFilterByTag.filter(item => item.selected);
        let exportedItems = [];

        if (items.length === 1) {
            const res = await fetchExportItems(items);
            exportedItems = resIntoItems(res);
            jsonExport(exportedItems, () => {}, title, "_page");

            // remove selection of checkbox
            props.setPageList(prev => removeSelection(prev));
            props.setFilteredPageList(prev => removeSelection(prev));
            setPageListFilterByTag(prev => removeSelection(prev));
        } else if (items.length > 1) {
            if (bool) {
                //fetch items
                const res = await fetchExportItems(items);
                exportedItems = resIntoItems(res);

                //export items
                jsonExport(exportedItems, () => {}, title, "_page");
                modalRef.current.close();

                // remove selection of checkbox
                props.setPageList(prev => removeSelection(prev));
                props.setFilteredPageList(prev => removeSelection(prev));
                setPageListFilterByTag(prev => removeSelection(prev));
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
                serviceKey: "sys.selected.page",
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
    function handleSelectedItems(item, items, checked) {
        const result = [];
        const _items = structuredClone(items);
        _items.forEach(_item => {
            if (_item.id === item.id) {
                _item.selected = checked;
                result.push(_item);
            } else {
                result.push(_item);
            }
        });
        props.setFilteredPageList(result);
    }
    const handleSelection = item => {
        selectTags(
            item,
            selectedTags,
            setSelectedTags,
            setPageListFilterByTag,
            pageList,
            filteredPageList,
        );
    };

    const showTags = () => {
        filterTagRef.current.show();
    };

    const parseSelectedTags = tags => {
        try {
            if (!tags) return [];

            const type = typeof tags;
            let parsedTags = [];

            const bool = tags.includes(";");

            if (bool && type == "string") {
                parsedTags = dbTagConversion(tags);
            } else if (type == "string") {
                parsedTags = JSON.parse(tags);
            } else {
                parsedTags = tags;
            }

            return parsedTags;
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="page-builder">
            {/* Header */}
            <CsvModal
                sites={props.channals}
                csvModal={csvModal}
                handleClose={handleCloseCsv}
                getData={props.getData}
                tableName="pages"
                title={"Pages Import"}
            />
            <ChildrenModal
                ref={modalRef}
                header="Export Pages">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <ChildrenModal
                header="Filter Pages By Tags"
                ref={filterTagRef}>
                <div className="row">
                    <div className="col-sm-12">
                        <div className="mb-2 fw-bold">Tags</div>
                        <SearchItem
                            keysToSearch={["id"]}
                            items={searchFilterTags}
                            setItems={setSearchFilterTags}
                            placeholder="Search tags..."
                            _items={props.tagSuggestion.list}
                            searchInput={tagSearchRef}
                        />
                        {props.tagSuggestion && (
                            <TagListing
                                items={searchFilterTags}
                                selectItem={selectTags}
                                selectedTags={selectedTags}
                                setSelectedTags={setSelectedTags}
                                setPageListFilterByTag={setPageListFilterByTag}
                                pageList={props?.pageList}
                                filteredPageList={props?.filteredPageList}
                                handleSelection={handleSelection}
                                searchInput={tagSearchRef?.current?.value}
                            />
                        )}
                    </div>
                </div>
            </ChildrenModal>

            {/* Views */}
            <div className="row m-0">
                <div className="col-sm-4 listing-col s2a-border-right ps-2">
                    <div className="">
                        <div className="listing-header">
                            <div className="">
                                Sites ({props?.channals?.length})
                            </div>
                        </div>
                        <SearchInput
                            ref={props.siteRef}
                            onChange={props.handleSiteSearch}
                            placeholder="Search Sites"
                            value={props.siteSearch}
                        />
                        <Scroll>
                            <ul
                                name="channel_id"
                                className="list-group list-group-flush pe-1">
                                {props.channals &&
                                    props.channals.map((item, index) => (
                                        <li
                                            onClick={() => {
                                                props.handleChannelChange(
                                                    item.id,
                                                ),
                                                    setSelectedSite(item.id);
                                                handleListingScroll();
                                            }}
                                            className={`list-group-item ${
                                                selectedSite === item.id
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
                    <SearchAndBtns
                        title={
                            `Pages (` + props.pageListFilterByTag.length + `)`
                        }
                        addNewItem={props.addNewItem}
                        handleSearch={props.handlePageSearch}
                        inputRef={props.inputRef}
                        searchValue={props.inputSearch}
                        showTags={showTags}
                        tagsCanvasId="pageCanvas"
                        selectedTags={selectedTags}
                        SearchPlaceHolder="Search Pages"
                        handleFormScroll={handleFormScroll}
                        handleExport={nameExport}
                        handleImport={importPages}
                    />
                    {selectedTags && selectedTags.length > 0 && (
                        <div className="mb-2 input-group">
                            <TagListing
                                items={selectedTags}
                                removeTag={true}
                                handleSelection={handleSelection}
                            />
                        </div>
                    )}
                    <Scroll height="52vh">
                        <ul className="list-group list-group-flush pe-1">
                            {props.pageListFilterByTag.map(page => {
                                return (
                                    <li
                                        key={page.id}
                                        onClick={() => {
                                            handleFormScroll();
                                        }}
                                        className={`list-group-item
                                    ${
                                        props.selectedPage &&
                                        props.selectedPage["id"] === page["id"]
                                            ? "selected-cell"
                                            : ""
                                    }`}>
                                        <div className="col-sm-12 d-flex">
                                            <input
                                                type="checkbox"
                                                className="form-check-input me-2"
                                                checked={
                                                    page.selected ? true : false
                                                }
                                                onChange={e =>
                                                    handleSelectedItems(
                                                        page,
                                                        props.pageListFilterByTag,
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            <div className="col-sm-10 flex-column">
                                                <div
                                                    className="pointer me-auto flex-grow-1"
                                                    onClick={() =>
                                                        props.handlePageSelect(
                                                            page,
                                                        )
                                                    }>
                                                    {page.name}
                                                </div>
                                                <div
                                                    className="pointer me-auto flex-grow-1"
                                                    onClick={() =>
                                                        props.handlePageSelect(
                                                            page,
                                                        )
                                                    }>
                                                    {/* {form.brand_title} (
                                                {form.domain}) */}
                                                    <div className="pointer me-auto">
                                                        <span
                                                            className="title2"
                                                            title="Last Updated">
                                                            <i className="fa-solid fa-calendar-days pe-1"></i>
                                                            {formatDateForUserView(
                                                                page.datemodified,
                                                            )}
                                                            {" | "}
                                                            {page.modifiedby}
                                                            {" | "}
                                                            {page.type
                                                                ? page.type
                                                                : "PROTECTED"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className="pointer me-auto flex-grow-1"
                                                    onClick={() =>
                                                        props.handlePageSelect(
                                                            page,
                                                        )
                                                    }>
                                                    <ShowTags
                                                        tags={page.tags}
                                                        checkTags={checkTags}
                                                    />
                                                </div>
                                            </div>
                                            <div className="dropdown col">
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
                                                                props.duplicateSelectedPage(
                                                                    page,
                                                                )
                                                            }>
                                                            <i className="fa-regular fa-clone"></i>{" "}
                                                            Duplicate
                                                        </span>
                                                    </li>
                                                    <li>
                                                        <span
                                                            className="dropdown-item dropdown-item-del"
                                                            onClick={() =>
                                                                props.deleteData(
                                                                    page,
                                                                )
                                                            }
                                                            title="Delete">
                                                            <i className="fa-regular fa-trash-can"></i>{" "}
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
                <div
                    className="col-sm-4 listing-col"
                    ref={formRef}>
                    <div className="listing-header s2a-border-bottom">
                        <div className="">Page Details</div>
                    </div>
                    <div className="form-background py-1 pe-2">
                        <div className="form-group mb-2">
                            <div className="form-label flex-between">
                                <span className="fw-bold">
                                    Site&nbsp;
                                    <span className="text-danger">*</span>
                                </span>
                                {/* <span
                                    className={`text-danger ${
                                        props.error.indexOf("channel") > -1
                                            ? "d-inline-block"
                                            : "d-none"
                                    }`}>
                                    Site cannot be empty.
                                </span> */}
                            </div>
                            <select
                                className="form-select"
                                name="channel"
                                disabled={true}
                                value={props?.selectedChannelId}
                                onChange={e => props.handleInputField(e)}>
                                <option defaultValue=" ">Select Site</option>
                                {props.channals.map(channel => {
                                    return (
                                        <option
                                            key={channel.id}
                                            value={channel.id}>
                                            {channel.brand_title}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="form-group mb-2">
                            <label className="form-label flex-between">
                                <span className="fw-bold">
                                    Name&nbsp;
                                    <span className="text-danger">*</span>
                                </span>
                                <span
                                    className={`text-danger ${
                                        props.error.indexOf("name") > -1
                                            ? "d-inline-block"
                                            : "d-none"
                                    }`}>
                                    Name cannot be empty.
                                </span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["name"]
                                }
                                onChange={e => props.handleInputField(e)}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 mb-1 fw-bold title-error">
                                <span>
                                    Type&nbsp;
                                    <span className="text-danger">*</span>
                                </span>
                            </label>
                            <select
                                className="form-select"
                                // disabled={props?.selectedPage?.id!=='new' && props?.selectedPage?.type!=='PUBLIC'}
                                name="type"
                                value={
                                    props.selectedPage.type
                                        ? props.selectedPage.type
                                        : "PROTECTED"
                                }
                                onChange={e => props.handleInputField(e)}>
                                <option value="">Select Type</option>
                                <option value="PUBLIC">Public</option>
                                <option value="PROTECTED">Protected</option>
                            </select>
                        </div>

                        <div className="form-group mb-2">
                            <label className="form-label">
                                <span className="fw-bold">Tags&nbsp;</span>
                            </label>
                            <Tag
                                handleTags={props.handleTags}
                                selectedPostTags={parseSelectedTags(
                                    props.pageSelectedTags,
                                )}
                                suggestion={
                                    props &&
                                    props.tagSuggestion &&
                                    props.tagSuggestion.list
                                }
                                tagList={props && props.tagSuggestion}
                                getData={props.getData}
                                category="page"
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="form-label flex-between">
                                <span className="fw-bold">
                                    Title Image URL&nbsp;
                                </span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="title_image"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["title_image"]
                                }
                                onChange={e => props.handleInputField(e)}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="form-label fw-bold">
                                Keywords
                            </label>
                            <textarea
                                className="form-control"
                                name="meta_tags"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["meta_tags"]
                                }
                                onChange={e =>
                                    props.handleInputField(e)
                                }></textarea>
                        </div>
                        <div className="form-group mb-2">
                            <label className="form-label flex-between">
                                <span className="fw-bold">
                                    Custom CSS Classes&nbsp;
                                </span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="css_classes"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["css_classes"]
                                }
                                onChange={e => props.handleInputField(e)}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="form-label fw-bold">
                                Custom CSS Style
                            </label>
                            <select
                                className="form-select"
                                name="styles"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["styles"]
                                }
                                onChange={e => props.handleInputField(e)}>
                                <option value="">Select Style</option>
                                {styles.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 d-flex justify-content-between">
                                <span className="d-inline-block fw-bold mb-2">
                                    Description&nbsp;
                                    {/* <span className="text-danger">*</span> */}
                                </span>
                                <span
                                    className={`text-danger ${
                                        props.error.indexOf("description") > -1
                                            ? "d-inline-block"
                                            : "d-none"
                                    }`}>
                                    Description cannot be empty.
                                </span>
                            </label>
                            <textarea
                                rows={3}
                                type="text"
                                className="form-control"
                                name="description"
                                value={
                                    props.selectedPage &&
                                    props.selectedPage["description"]
                                }
                                onChange={e => props.handleInputField(e)}
                            />
                        </div>
                        <span className="">
                            <ErrorNotification
                                error={error}
                                labels={{
                                    name: "Name",
                                    // channel: "Site",
                                }}
                            />
                        </span>
                        {props.canDesign !== "" && (
                            <div
                                className="alert alert-danger mb-0 p-1"
                                role="alert">
                                {props.canDesign}
                            </div>
                        )}
                        {props.message !== "" && (
                            <div
                                className="alert alert-info mb-0 p-1"
                                role="alert">
                                {props.message}
                            </div>
                        )}
                        <div className="row float-end">
                            <div className="col">
                                <button
                                    className="m-2 ms-0 btn button-theme btn-sm"
                                    onClick={() =>
                                        props.saveData(props.selectedPage)
                                    }>
                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                                <button
                                    className="m-2 btn button-theme  btn-sm ms-0"
                                    onClick={() => {
                                        props.handleCanDesign();
                                    }}
                                    title="The page needs to be saved before designing.">
                                    <i className="fa-solid fa-pen-nib pe-1"></i>
                                    Design Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

function ShowTags({ tags, checkTags }) {
    if (tags) {
        const bool = tags.includes(";");
        var parseedTags = bool ? dbTagConversion(tags) : tryToParse(tags);
        return (
            <>
                {checkTags(parseedTags) &&
                    parseedTags.length > 0 &&
                    parseedTags.slice(0, 3).map(item => {
                        return (
                            <>
                                <TagOnly name={item.name} />
                            </>
                        );
                    })}
            </>
        );
    }
}

function SearchInput(props) {
    return (
        <div className="mb-2 input-group">
            <input
                type="text"
                className="form-control"
                {...props}
            />
        </div>
    );
}
function TagOnly({ name }) {
    return <div className="badge tag-badge">{name}</div>;
}

export default Pages;

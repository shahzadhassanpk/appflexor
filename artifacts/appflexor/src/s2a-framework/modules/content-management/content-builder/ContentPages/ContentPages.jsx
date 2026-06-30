import axios from "axios";
import React, {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import { getData as globalGetData } from "../../../../components/CrudApiCall";
import ErrorNotification from "../../../../components/ErrorNotification";
import { ExportForm } from "../../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../../components/Modal/Modal";
import Scroll from "../../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../../components/SearchAndBtns/SearchAndBtns";
import SearchItem from "../../../../components/Searching/SearchItem";
import TagListing from "../../../../components/Taglisting/TagListing";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { CONTENT_STATUS } from "../../../../contants";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    deleteItem,
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    filterPagesByTagSelection,
    formatDateForUserView,
    formatDateTimeForUserView,
    handleSelectItem,
    insertItem,
    jsonExport,
    selectTags,
    updateDeleteConfig,
    updateItem,
    validArray,
} from "../../../../utils/utils";
import CsvModal from "../../../data-management/datalist-builder/custom-action-modal/CsvModal";
import { tryToParse } from "../../../data-management/form-builder/Forms/FormViewer/utils";
import Tag from "../../page-builder/Designer/components/Tag/Tag";
import RenderContentPage from "../RenderContentPage/RenderContentPage";
import useMobileView from "../../../../components/custom-hooks/useMobileView";
export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

function ContentPages(props) {
    const { channels } = props;
    const [pageList, setPageList] = useState([]);
    const [channals, setChannals] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState(
        props.channel.id,
    );
    const INITIAL_STATE = {
        id: "new",
        name: "",
        channel: selectedChannelId,
        type: "PROTECTED",
        description: "",
        layout: {},
        tags: [],
        meta_tags: "",
        slug: "",
        status: "DRAFT",
        stagging: "",
    };
    const [selectedPage, setSelectedPage] = useState(INITIAL_STATE);
    const [filteredPageList, setFilteredPageList] = useState([]);
    const [pageListFilterByTag, setPageListFilterByTag] = useState([]);
    const pageListRef = useRef(null);
    const [selectedTags, setSelectedTags] = useState([]);

    const [mode, setMode] = useState(modeType.render);
    const [error, setError] = useState([]);
    const [message, setMessage] = useState("");
    const [canDesign, setCanDesign] = useState("");
    const [revisionList, setRevisionList] = useState([]);
    const [tabs, setTabs] = useState({
        contentForm: "true",
        contentRevision: "false",
    });

    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [tagSuggestion, setTagSuggestion] = useState({});
    const [inputSearch, setInputSearch] = useState("");
    const [siteSearch, setSiteSearch] = useState("");
    const inputRef = useRef(null);
    const siteRef = useRef(null);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const appContext = useContext(AppContext);
    const channel = appContext?.channel;

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
        enableTooltip();
        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        setChannals(channels);
    }, [channels]);

    useEffect(() => {
        if (
            tabs.contentRevision === "true" &&
            selectedPage.id !== "new" &&
            selectedPage.id !== ""
        ) {
            getContentRevisions(selectedPage.id);
        }
    }, [tabs, selectedPage?.id]);

    useEffect(() => {
        if (selectedPage?.id !== "new" && selectedPage?.id !== "") {
            getContentRevisions(selectedPage.id);
        }
    }, [selectedPage?.id]);

    useEffect(() => {
        if (props && props.activeTab === "WEB_CONTENT") {
            getData("FIRST_RENDER");
        }
        if (props && props.mode) {
            setMode(props.mode);
        } else {
            setMode(modeType.render);
        }
    }, [props?.activeTab, props?.mode]);

    function addNewItem() {
        setError([]);
        setSelectedPage(INITIAL_STATE);
        setCanDesign("");
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

    // event handlers
    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedPage(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function getUpdatedState(id, arr) {
        return arr.filter(el => el.id === id);
    }

    function handleConfirmRevert(data) {
        setSelectedPage(prev => ({
            ...prev,
            stagging: data.content,
            status: CONTENT_STATUS.draft,
        }));
        toastEmitter(`Reverted changes for ${selectedPage.name}.`);
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
        setError([]);
        setSelectedPage(page);
        // setSelectedPage(prev => ({
        //     ...prev,
        //     tags: page.tags,
        // }));

        // getContentRevisions(page.id);
    }

    async function getContentRevisions(id) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "revisions",
                    serviceKey: "list.content.revisions",
                    mode: "formData",
                },
                {
                    serviceParams: id,
                    dataKey: "selectedPage",
                    serviceKey: "sys.selected.content.page",
                    mode: "formData",
                },
            ],
        };

        const response = await axios.post(
            API_URL + "?service.key=masterKey.tenantData",
            dataRequest,
        );

        if (response.data.C_STATUS === "SUCCESS") {
            const data = response.data.C_DATA;
            setRevisionList(data.revisions);
            if (data.selectedPage[0]) {
                data.selectedPage[0].tags = tryToParse(
                    data.selectedPage[0].tags,
                );
                setSelectedPage(data.selectedPage[0]);
            }
        } else {
            setRevisionList([]);
        }
    }

    async function getSelectedContent(id) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "selectedPage",
                    serviceKey: "sys.selected.content.page",
                    mode: "formData",
                },
            ],
        };

        return new Promise((resolve, reject) => {
            const promise = axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );
            resolve(promise);
        });
    }

    function handleCanDesign() {
        if (selectedPage.id === "" || selectedPage.id === "new") {
            setCanDesign(
                "Content Page needs to be saved first before designing.",
            );

            setTimeout(() => {
                setCanDesign("");
            }, 3000);
        } else {
            setCanDesign("");

            window.open(
                `/app/content-page-design/${selectedPage.id}&embed=true`,
                "_blank",
            );
        }
    }

    function viewContentPage(newWindow = false) {
        if (selectedPage.id === "" || selectedPage.id === "new") {
            setCanDesign(
                "Content Page needs to be saved first before viewing.",
            );

            setTimeout(() => {
                setCanDesign("");
            }, 3000);
        } else {
            if (newWindow) {
                const newWin = window.open(
                    `/content-page-viewer/${selectedPage.id}&embed=true`,
                    "_blank",
                );

                if (
                    !newWin ||
                    newWin.closed ||
                    typeof newWin.closed == "undefined"
                ) {
                    toastEmitter("Please allow popups.", true, "warning");
                }
            } else {
                setShowPreviewModal(true);
            }
        }
    }

    async function duplicateSelectedPage(page) {
        let duplicatedPage = { ...page };
        const res = await getSelectedContent(page.id);
        const selectedItem = res.data.C_DATA.selectedPage[0];
        selectedItem.tags = tryToParse(selectedItem.tags);
        duplicatedPage = selectedItem;
        duplicatedPage.id = "";
        duplicatedPage.name = "";
        duplicatedPage.status = CONTENT_STATUS.draft;
        setSelectedPage(duplicatedPage);

        setMessage("Page duplicated successfully!");
        setTimeout(() => {
            setMessage("");
        }, 3000);
    }

    // API calls

    function saveData(obj) {
        if (validation(obj)) {
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "app_content"; //"formid"
            entityForm.entity = "app_content"; //Db- "table name"
            entityForm.action = "update";

            if (!obj.id || obj.id == "" || obj.id == "new") {
                entityForm.id = "new";
                obj.id = "new";
            } else {
                entityForm.id = obj.id;
            }
            delete obj.selected;
            entityForm.status = obj.status;

            entityForm.formData = obj;
            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        const fieldsData = { ...selectedPage };
                        fieldsData.id = response.data.C_DATA[0].formData.id;
                        fieldsData.modifiedby =
                            response.data.C_DATA[0].formData.modifiedby;
                        if (
                            (selectedPage.id === "new" ||
                                selectedPage.id === "") &&
                            response.data.C_DATA[0].formData.id
                        ) {
                            setSelectedPage(prev => ({
                                ...prev,
                                id: fieldsData.id,
                            }));
                            insertItem(setPageList, fieldsData);
                            insertItem(setFilteredPageList, fieldsData);
                        } else {
                            updateItem(setPageList, fieldsData);
                            updateItem(setFilteredPageList, fieldsData);
                        }
                        toastEmitter(
                            `${selectedPage.name} saved successfully.`,
                            3000,
                            "warn",
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

    async function publishPage(obj) {
        if (validation(obj)) {
            let url = API_URL + "?service.key=update.formData";

            let request = {};
            request.data = [];
            let entityForm = {};

            entityForm.formId = "app_content"; //"formid"
            entityForm.entity = "app_content"; //Db- "table name"
            entityForm.action = "update";

            if (!obj.id || obj.id == "" || obj.id == "new") {
                entityForm.id = "new";
                obj.id = "new";
            } else {
                entityForm.id = obj.id;
            }
            delete obj.selected;

            obj.status = CONTENT_STATUS.published;
            obj.published = obj.stagging;

            entityForm.formData = obj;
            request.data.push(entityForm);
            try {
                const response = await axios.post(url, request);

                if (response.data.C_STATUS === "SUCCESS") {
                    toastEmitter(
                        `${selectedPage.name} saved successfully.`,
                        3000,
                        "warn",
                    );

                    let id = response.data.C_DATA[0].formData.id;

                    if (
                        (selectedPage.id === "new" || selectedPage.id === "") &&
                        id
                    ) {
                        setSelectedPage(prev => ({
                            ...prev,
                            id: id,
                        }));
                    }
                    let revisionRequest = {
                        data: [
                            {
                                formId: "content_revision",
                                entity: "content_revision",
                                action: "update",
                                id: "new",
                                formData: {
                                    id: "new",
                                    content_id: id,
                                    content: obj.published,
                                },
                                executeUpdate: [
                                    {
                                        serviceKey:
                                            "delete.old.content.revisions",
                                        serviceParams: id,
                                    },
                                ],
                            },
                        ],
                    };
                    getData("PUBLISH");

                    const revisionResponse = await axios.post(
                        url,
                        revisionRequest,
                    );

                    // getData("SAVE");
                }
            } catch (e) {
                console.log("saveData error:" + e);
            }
        }
    }

    function deleteRevision(id) {
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "content_revision";
        entityForm.entity = "content_revision";
        entityForm.action = "delete";

        entityForm.id = id;
        request.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;
            // let deleteRecordChannelId = fieldsData.channel

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_content";
            entityForm.entity = "app_content";
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
                        deleteAllContentRevision(item);
                        updateDeleteConfig(false, {}, setDeleteConfig);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    function deleteAllContentRevision(content) {
        const request = {
            method: "POST",
            path: "?service.key=update.formData",
            data: [
                {
                    action: "update",
                    formId: "content_revision",
                    entity: "content_revision",
                    id: content.id,
                    executeUpdate: [
                        {
                            serviceKey: "delete.all.content.revisions",
                            serviceParams: content.id,
                        },
                    ],
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function handleRevisionDelete(item) {
        let fieldsData = item;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "content_revision";
        entityForm.entity = "content_revision";
        entityForm.action = "delete";

        entityForm.id = fieldsData.id;
        request.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    toastEmitter(`Delete was successfull.`);
                    getContentRevisions(selectedPage.id);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getData(condition = "CHANNEL", channelId = selectedChannelId) {
        if (condition === "FIRST_RENDER") {
            var dataRequest = {
                dataKeys: [
                    {
                        serviceParams: channelId ? channelId : props.channel.id,
                        dataKey: "pageList",
                        serviceKey: "sys.content.pages",
                        mode: "formData",
                    },
                    {
                        serviceParams: "content-page",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
        } else if (condition === "tagSuggestion") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "content-page",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
        } else if (condition === "CHANNEL" || condition === "PUBLISH") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: channelId ? channelId : props.channel.id,
                        dataKey: "pageList",
                        serviceKey: "sys.content.pages",
                        mode: "formData",
                    },
                ],
            };
        }

        if (dataRequest.dataKeys.length > 0)
            return new Promise((resolve, reject) => {
                axios
                    .post(
                        API_URL + "?service.key=masterKey.tenantData",
                        dataRequest,
                    )
                    .then(response => {
                        // console.log(response);
                        resolve(response);
                        if (response.data.C_STATUS === undefined) {
                            getData("FIRST_RENDER");
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                            console.log(`UNAUTHORIZED, please login.`);
                        } else if (response.data.C_STATUS === "SUCCESS") {
                            if (siteSearch) {
                                handleSiteSearch({
                                    target: { value: siteSearch },
                                });
                            }

                            if (response.data.C_DATA.pageList) {
                                let _pageList = response.data.C_DATA.pageList;

                                _pageList.map(item => {
                                    if (item.tags !== "") {
                                        item.tags = tryToParseTags(item.tags);
                                    } else if (item.tags === "") {
                                        item.tags = [];
                                    }
                                });

                                setPageList(_pageList);
                                let selectedChannelPages = filterArrayByTerms(
                                    response.data.C_DATA.pageList,
                                    channelId,
                                    ["channel"],
                                );
                                if (inputRef?.current?.value) {
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
                                        inputRef.current.value,
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
                                    // let updatedState = getUpdatedState(
                                    //     selectedPage.id,
                                    //     _pageList,
                                    // );
                                }
                            } else {
                                console.log(
                                    `Either list.all.pages does not exists or SQL query returns no result.`,
                                );
                            }
                            // if (response.data.C_DATA.styleList) {
                            //     setStyles(response.data.C_DATA.styleList);
                            // } else {
                            //     // setStyles([]);
                            // }
                        }
                        if (response.data.C_STATUS === "SUCCESS") {
                            if (
                                checkArray(
                                    response.data.C_DATA.tagSuggestionList,
                                )
                            ) {
                                let _tagsSuggestion =
                                    response.data.C_DATA.tagSuggestionList.find(
                                        item =>
                                            item.category === "content-page",
                                    );
                                _tagsSuggestion.list = tryToParseTags(
                                    _tagsSuggestion.list,
                                );
                                setTagSuggestion(_tagsSuggestion);
                            } else if (
                                condition === "tagSuggestion" ||
                                condition === "FIRST_RENDER"
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

    function handleChannelChange(value) {
        if (value === selectedChannelId) return;
        getData("CHANNEL", value);
        setSelectedChannelId(value);
        // setSelectedChannelId(value);
    }

    const handleTags = tagFromChild => {
        setSelectedPage(prev => ({
            ...prev,
            tags: tagFromChild,
        }));
    };

    return (
        <ErrorBoundary>
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Web Page"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <div
                id="content-builder"
                className="content-builder">
                {mode === modeType.design || mode === modeType.preview ? (
                    <div className="d-flex justify-content-center align-items-center form-dnd-preview">
                        <div>
                            <span className="text-danger">Page builder</span>{" "}
                            added successfully.
                        </div>
                    </div>
                ) : null}
                {mode === modeType.render && (
                    <ContentPageList
                        ref={pageListRef}
                        filteredPageList={filteredPageList}
                        setFilteredPageList={setFilteredPageList}
                        pageList={pageList}
                        setPageList={setPageList}
                        tagSuggestion={tagSuggestion}
                        setPageListFilterByTag={setPageListFilterByTag}
                        filteredTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                        pageListFilterByTag={pageListFilterByTag}
                        siteSearch={siteSearch}
                        selectedChannelId={selectedChannelId}
                        addNewItem={addNewItem}
                        handlePageSearch={handlePageSearch}
                        inputSearch={inputSearch}
                        inputRef={inputRef}
                        handlePageSelect={handlePageSelect}
                        duplicateSelectedPage={duplicateSelectedPage}
                        deleteData={deleteData}
                        error={error}
                        selectedPage={selectedPage}
                        message={message}
                        canDesign={canDesign}
                        handleCanDesign={handleCanDesign}
                        handleInputField={handleInputField}
                        saveData={saveData}
                        publishPage={publishPage}
                        channals={channals}
                        handleChannelChange={handleChannelChange}
                        handleTags={handleTags}
                        selectedTags={selectedPage.tags}
                        getData={getData}
                        handleSiteSearch={handleSiteSearch}
                        siteRef={siteRef}
                        viewContentPage={viewContentPage}
                        // styles={styles}
                        revisionList={revisionList}
                        handleConfirmRevert={handleConfirmRevert}
                        tabs={tabs}
                        setTabs={setTabs}
                        handleRevisionDelete={handleRevisionDelete}
                        listingRef={listingRef}
                        formRef={formRef}
                        handleListingScroll={handleListingScroll}
                        handleFormScroll={handleFormScroll}
                    />
                )}
            </div>
            <Modal
                className="content-viewer-modal"
                show={showPreviewModal}
                onHide={() => setShowPreviewModal(false)}
                keyboard={true}
                fullscreen
                animation={true}>
                <Modal.Header>
                    <div className="w-100 d-flex justify-content-between align-items-center">
                        <Modal.Title>
                            {selectedPage.name}&nbsp;
                            <small className="text-body-secondary">
                                {selectedPage.status}
                            </small>{" "}
                        </Modal.Title>
                        <i
                            onClick={() => setShowPreviewModal(false)}
                            className="fa-solid fa-close p-1 pointer"></i>
                    </div>
                </Modal.Header>
                <Modal.Body className="">
                    <RenderContentPage
                        contentPageId={selectedPage.id}
                        status={CONTENT_STATUS.draft}
                    />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

const ContentPageList = forwardRef((props, ref) => {
    const {
        filteredTags,
        setSelectedTags,
        filteredPageList,
        setFilteredPageList,
        setPageList,
        pageList,
        tagSuggestion,
        setPageListFilterByTag,
        // styles,
        revisionList,
        handleConfirmRevert,
        tabs,
        setTabs,
        handleRevisionDelete,
        listingRef,
        formRef,
        handleListingScroll,
        handleFormScroll,
    } = props;
    const [csvModal, setCsvModal] = useState(false);
    const [confirmModal, setShowConfirmModal] = useState(false);
    const [selectedContentVersion, setSelectedContentVersion] = useState({});
    const [previewModal, setPreviewModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState(props.selectedChannelId);
    const [searchFilterTags, setSearchFilterTags] = useState();
    const [hoveredItemId, setHoveredItemId] = useState("");
    const [selectedRevision, setSelectedRevision] = useState({});

    const modalRef = useRef(null);
    const tagSearchRef = useRef(null);
    const filterTagRef = useRef(null);

    useEffect(() => {
        setSearchFilterTags(tagSuggestion.list);
    }, [tagSuggestion?.list]);

    useEffect(() => {
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

    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);

    const showTags = () => {
        filterTagRef.current.show();
    };

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

    function handleTabsChange(event) {
        let name = event.target.name;
        let keys = Object.keys(tabs);
        let obj = {};

        keys.forEach(key => {
            if (name == key) obj[key] = "true";
            else obj[key] = "false";
        });
        // console.log(obj);
        setTabs(obj);
    }

    function importPages() {
        handleShowCsv();
    }

    async function nameExport(title, bool) {
        try {
            const items = props.pageListFilterByTag.filter(
                item => item.selected,
            );
            let exportedItems = [];

            if (items.length === 1) {
                const res = await fetchExportItems(items);
                exportedItems = resIntoItems(res);
                jsonExport(exportedItems, () => {}, title, "_web_content");

                // remove selection of checkbox
                setPageList(prev => removeSelection(prev));
                setFilteredPageList(prev => removeSelection(prev));
                setPageListFilterByTag(prev => removeSelection(prev));
            } else if (items.length > 1) {
                if (bool) {
                    //fetch items
                    const res = await fetchExportItems(items);
                    exportedItems = resIntoItems(res);

                    //export items
                    jsonExport(exportedItems, () => {}, title, "_web_content");
                    modalRef.current.close();

                    // remove selection of checkbox
                    setPageList(prev => removeSelection(prev));
                    setFilteredPageList(prev => removeSelection(prev));
                    setPageListFilterByTag(prev => removeSelection(prev));
                } else {
                    modalRef.current.show();
                }
            }
        } catch (error) {
            console.log(error);
        }
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
                serviceKey: "sys.selected.content.page",
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

    function removeSelection(items) {
        const _items = [...items];
        const newItems = [];

        for (let item of _items) {
            delete item.selected;
            newItems.push(item);
        }

        return newItems;
    }

    const handleSelection = item => {
        selectTags(
            item,
            filteredTags,
            setSelectedTags,
            setPageListFilterByTag,
            pageList,
            filteredPageList,
        );
    };

    // utility
    const tryToParse = item => {
        let _item = item;
        if (typeof item === "string" && item !== "") {
            _item = JSON.parse(_item);
        } else {
            _item = {
                html: "<div>Welcome to content builder</div>",
                css: "",
            };
        }
        return _item;
    };

    return (
        <div className="page-builder container-fluid px-0">
            {/* Header */}
            <CsvModal
                sites={props.channals}
                selectedSite={selectedSite}
                csvModal={csvModal}
                handleClose={handleCloseCsv}
                getData={props.getData}
                tableName="app_content"
                title={"Web Pages Import"}
            />
            <ChildrenModal
                ref={modalRef}
                header="Export Pages">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <ChildrenModal
                header="Filter Web Pages By Tags"
                ref={filterTagRef}>
                <div className="row">
                    <div className="col-sm-12">
                        <div className="mt-3 mb-2 fw-bold">Tags</div>
                        <SearchItem
                            keysToSearch={["id"]}
                            items={searchFilterTags}
                            setItems={setSearchFilterTags}
                            placeholder="Search tags..."
                            _items={tagSuggestion.list}
                            searchInput={tagSearchRef}
                        />
                        {props.tagSuggestion && (
                            <TagListing
                                items={searchFilterTags}
                                selectItem={selectTags}
                                selectedTags={filteredTags}
                                setSelectedTags={setSelectedTags}
                                setPageListFilterByTag={setPageListFilterByTag}
                                pageList={pageList}
                                filteredPageList={filteredPageList}
                                handleSelection={handleSelection}
                                searchInput={tagSearchRef?.current?.value}
                            />
                        )}
                    </div>
                </div>
            </ChildrenModal>
            {/* Views */}
            <div className="row m-0">
                <div className="col-sm-4 listing-col s2a-border-right">
                    <div className="listing-header">
                        <div className="">Sites</div>
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
                            className="list-group list-group-flush p-1">
                            {props.channals &&
                                props.channals.map((item, index) => (
                                    <li
                                        onClick={() => {
                                            props.handleChannelChange(item.id),
                                                setSelectedSite(item.id);
                                            props.addNewItem();
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
                <div
                    className="col-sm-4 listing-col s2a-border-right"
                    ref={listingRef}>
                    <SearchAndBtns
                        title="Pages List"
                        handleImport={importPages}
                        handleExport={() => {
                            const items = props.pageListFilterByTag.filter(
                                item => item.selected,
                            );
                            if (validArray(items) && items.length > 0)
                                nameExport(items[0].name);
                            else
                                toastEmitter(
                                    "Select content page(s) for export",
                                    true,
                                    "warning",
                                );
                        }}
                        addNewItem={props.addNewItem}
                        handleSearch={props.handlePageSearch}
                        inputRef={props.inputRef}
                        searchValue={props.inputSearch}
                        SearchPlaceHolder="Search Pages"
                        showTags={showTags}
                        selectedTags={filteredTags}
                        handleFormScroll={handleFormScroll}
                    />
                    {filteredTags && filteredTags.length > 0 && (
                        <div className="mb-2 input-group">
                            <TagListing
                                items={filteredTags}
                                removeTag={true}
                                handleSelection={handleSelection}
                            />
                        </div>
                    )}
                    <Scroll
                        height="52vh"
                        overflowY="auto">
                        <ul className="list-group list-group-flush p-1">
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
                                            <div className="col-sm-1">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={page.selected}
                                                    onChange={e =>
                                                        handleSelectItem(
                                                            page,
                                                            e.target.checked,
                                                            props.setPageListFilterByTag,
                                                            props.pageListFilterByTag,
                                                        )
                                                    }
                                                />
                                            </div>
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
                                                            {page.status}
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
                    <div className="listing-header">
                        <div className="">Page</div>
                    </div>
                    <nav className="">
                        <div
                            className="nav nav-tabs"
                            id="nav-tab"
                            role="tablist">
                            <button
                                className="nav-link active"
                                name="contentForm"
                                data-bs-toggle="tab"
                                data-bs-target="#contentForm"
                                type="button"
                                onClick={event => handleTabsChange(event)}>
                                Details
                            </button>
                            <button
                                className="nav-link"
                                name="contentRevision"
                                data-bs-toggle="tab"
                                data-bs-target="#contentRevision"
                                type="button"
                                onClick={event => handleTabsChange(event)}>
                                Revision
                            </button>
                        </div>
                    </nav>
                    <div className="tab-content">
                        <div
                            className="tab-pane fade show active"
                            id="contentForm"
                            tabIndex="0">
                            <div className="form-background p-2">
                                <div className="row">
                                    <div className="mb-2 form-group">
                                        <div className="flex-between">
                                            <span className="d-inline-block fw-bold page-design-header">
                                                Site&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </span>
                                            <span
                                                className={`text-danger ${
                                                    props.error.indexOf(
                                                        "channel",
                                                    ) > -1
                                                        ? "d-inline-block"
                                                        : "d-none"
                                                }`}>
                                                Site cannot be empty.
                                            </span>
                                        </div>
                                        <select
                                            className="form-select"
                                            name="channel"
                                            value={
                                                props.selectedPage.channel
                                                    ? props.selectedPage.channel
                                                    : props.selectedChannelId
                                            }
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }>
                                            <option
                                                disabled
                                                defaultValue=" ">
                                                Select Site
                                            </option>
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
                                </div>
                                <div className="row ">
                                    <div className="mb-2 form-group">
                                        <label className="mt-1 d-flex justify-content-between">
                                            <span className="d-inline-block fw-bold mb-2">
                                                Name&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </span>
                                            <span
                                                className={`text-danger ${
                                                    props.error.indexOf(
                                                        "name",
                                                    ) > -1
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
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }
                                        />
                                        <div className="form-group">
                                            <label className="mt-1 mb-1 fw-bold title-error">
                                                <span>
                                                    Type&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="type"
                                                value={
                                                    props.selectedPage.type
                                                        ? props.selectedPage
                                                              .type
                                                        : "PROTECTED"
                                                }
                                                onChange={e =>
                                                    props.handleInputField(e)
                                                }>
                                                <option value="">
                                                    Select Type
                                                </option>
                                                <option value="PUBLIC">
                                                    Public
                                                </option>
                                                <option value="PROTECTED">
                                                    Protected
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="row ">
                                    <div className="mb-2 form-group">
                                        <label className="mt-1 fw-bold">
                                            Slug&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="slug"
                                            value={props.selectedPage.slug}
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="mb-2 ">
                                        <div className="form-group">
                                            <label className="mt-1 d-flex justify-content-between">
                                                <span className="d-inline-block fw-bold mb-2">
                                                    Tags&nbsp;
                                                </span>
                                            </label>
                                            <Tag
                                                handleTags={props.handleTags}
                                                selectedPostTags={
                                                    props && props.selectedTags
                                                }
                                                suggestion={
                                                    props &&
                                                    props.tagSuggestion &&
                                                    props.tagSuggestion.list
                                                }
                                                tagList={
                                                    props && props.tagSuggestion
                                                }
                                                getData={props.getData}
                                                category="content-page"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-2 ">
                                        <div className="form-group">
                                            <label className="mt-1 d-flex justify-content-between">
                                                <span className="d-inline-block fw-bold mb-2">
                                                    SEO Keywords&nbsp;
                                                    {/* <span className="text-danger">*</span> */}
                                                </span>
                                            </label>
                                            <textarea
                                                rows={1}
                                                type="text"
                                                className="form-control"
                                                name="meta_tags"
                                                value={
                                                    props.selectedPage &&
                                                    props.selectedPage[
                                                        "meta_tags"
                                                    ]
                                                }
                                                onChange={e =>
                                                    props.handleInputField(e)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="row">
                            <div className="mb-2 ">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Styles
                                    </label>
                                    <select
                                        className="form-select"
                                        name="styles"
                                        value={
                                            props.selectedPage &&
                                            props.selectedPage["styles"]
                                        }
                                        onChange={e =>
                                            props.handleInputField(e)
                                        }>
                                        <option value="">Select Styles</option>
                                        {styles.map((item, index) => (
                                            <option
                                                key={index}
                                                value={item.id}>
                                                {item.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div> */}
                                <div className="row">
                                    <div className="mb-2 ">
                                        <div className="form-group">
                                            <label className="mt-1 d-flex justify-content-between">
                                                <span className="d-inline-block fw-bold mb-2">
                                                    Description&nbsp;
                                                    {/* <span className="text-danger">*</span> */}
                                                </span>
                                                <span
                                                    className={`text-danger ${
                                                        props.error.indexOf(
                                                            "description",
                                                        ) > -1
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
                                                    props.selectedPage[
                                                        "description"
                                                    ]
                                                }
                                                onChange={e =>
                                                    props.handleInputField(e)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="row float-end">
                                        <div className="col">
                                            <button
                                                className="m-2 ms-0 btn button-theme btn-sm"
                                                onClick={() =>
                                                    props.saveData(
                                                        props.selectedPage,
                                                    )
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
                                                Design
                                            </button>
                                            <button
                                                className="m-2 btn button-theme  btn-sm ms-0"
                                                onClick={() => {
                                                    props.viewContentPage(
                                                        false,
                                                    );
                                                }}
                                                title="The page needs to be saved before designing.">
                                                <i className="fa-solid fa-eye pe-1"></i>
                                                Preview
                                            </button>
                                            <button
                                                className="m-2 ms-0 btn button-theme btn-sm"
                                                disabled={
                                                    props.selectedPage.status ==
                                                        "PUBLISHED" ||
                                                    props.selectedPage
                                                        .stagging == ""
                                                }
                                                onClick={() =>
                                                    props.publishPage(
                                                        props.selectedPage,
                                                    )
                                                }>
                                                <i className="fa-solid fa-arrow-up-right-from-square ps-1"></i>
                                                Publish
                                            </button>
                                            {" | "}
                                            {props.selectedPage.status}
                                            {/* <button
                                        className="m-2 btn button-theme  btn-sm ms-0"
                                        onClick={() => {
                                            props.viewContentPage(true);
                                        }}
                                        title="The page needs to be saved before designing.">
                                        <i className="fa-solid fa-eye pe-1"></i>
                                        Live
                                        <i className="fa-solid fa-arrow-up-right-from-square ps-1"></i>
                                    </button> */}
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <ErrorNotification
                                            error={props.error}
                                            labels={{
                                                name: "Name",
                                                channel: "Site",
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="row">
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
                                </div>
                            </div>
                        </div>
                        <div
                            className="tab-pane fade"
                            id="contentRevision">
                            <ul className="list-group list-group-flush">
                                {revisionList.map(revision => {
                                    return (
                                        <li
                                            key={revision.id}
                                            onMouseEnter={() =>
                                                setHoveredItemId(revision.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredItemId("")
                                            }
                                            className={`list-group-item ${
                                                selectedRevision.id ===
                                                revision.id
                                                    ? "selected-cell"
                                                    : ""
                                            }`}>
                                            <i className="fa-solid fa-calendar-days pe-1"></i>
                                            {formatDateTimeForUserView(
                                                revision.datecreated,
                                            )}
                                            {revision.id === hoveredItemId && (
                                                <span className="float-end">
                                                    <i
                                                        title="Delete Revision"
                                                        className="fa-solid fa-trash text-danger pointer pe-1 "
                                                        onClick={() =>
                                                            handleRevisionDelete(
                                                                revision,
                                                            )
                                                        }></i>
                                                    <i
                                                        title="Revert Revision"
                                                        className="fa-solid fa-arrow-rotate-left text-warning pe-1 pointer"
                                                        onClick={() => {
                                                            setSelectedRevision(
                                                                revision,
                                                            );
                                                            setShowConfirmModal(
                                                                true,
                                                            );
                                                        }}></i>
                                                    <i
                                                        title="Preview Revision"
                                                        className="fa-solid fa-eye pe-1 pointer"
                                                        onClick={() => {
                                                            setPreviewModal(
                                                                true,
                                                            );
                                                            setSelectedRevision(
                                                                revision,
                                                            );
                                                            let parsedContent =
                                                                tryToParse(
                                                                    revision.content,
                                                                );
                                                            setSelectedContentVersion(
                                                                {
                                                                    ...revision,
                                                                    content:
                                                                        parsedContent,
                                                                },
                                                            );
                                                        }}></i>
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <Modal
                            className="content-preview-modal"
                            show={previewModal}
                            onHide={() => setPreviewModal(false)}
                            keyboard={true}
                            fullscreen
                            animation={true}>
                            <Modal.Header>
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                    <Modal.Title>
                                        {props.selectedPage.name}&nbsp;
                                        <small className="text-body-secondary">
                                            {props.selectedPage.status}
                                        </small>{" "}
                                    </Modal.Title>
                                    <i
                                        onClick={() => setPreviewModal(false)}
                                        className="fa-solid fa-close p-1 pointer"></i>
                                </div>
                            </Modal.Header>
                            <Modal.Body className="">
                                {selectedContentVersion.content &&
                                    selectedContentVersion.content.html && (
                                        <>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: selectedContentVersion
                                                        .content.html,
                                                }}
                                            />
                                            <style>
                                                {
                                                    selectedContentVersion
                                                        .content.css
                                                }
                                            </style>
                                        </>
                                    )}
                            </Modal.Body>
                        </Modal>
                        <Modal
                            show={confirmModal}
                            onHide={() => setShowConfirmModal(false)}
                            keyboard={false}
                            backdrop="static"
                            animation={true}>
                            <Modal.Header>
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                    <Modal.Title>Confirm</Modal.Title>
                                    <i
                                        onClick={() =>
                                            setShowConfirmModal(false)
                                        }
                                        className="fa-solid fa-close p-1 pointer"></i>
                                </div>
                            </Modal.Header>
                            <Modal.Body className="">
                                This will revert changes of current staging
                                content. Are you sure to revert?
                            </Modal.Body>
                            <Modal.Footer>
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => {
                                        handleConfirmRevert(selectedRevision);
                                        setShowConfirmModal(false);
                                    }}>
                                    Yes
                                </button>
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => setShowConfirmModal(false)}>
                                    No
                                </button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                </div>
            </div>
        </div>
    );
});

function ShowTags({ tags = [], checkTags }) {
    return (
        <>
            {tags &&
                checkTags(tags) &&
                tags.length > 0 &&
                tags.slice(0, 3).map(item => {
                    return (
                        <>
                            <TagOnly name={item.name} />
                        </>
                    );
                })}
        </>
    );
}

function SearchInput(props) {
    return (
        <div className="row p-0">
            <div className="mb-2 input-group">
                <input
                    type="text"
                    className="form-control"
                    {...props}
                />
                {/* <span className="input-group-text">
                    <i className="fa-solid fa-magnifying-glass"></i>
                </span> */}
            </div>
        </div>
    );
}
function TagOnly({ name }) {
    return <div className="badge tag-badge">{name}</div>;
}

export default ContentPages;

import axios from "axios";
import { Interweave } from "interweave";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL } from "../../../../../../Config";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { getData as globalGetData } from "../../../../../../components/CrudApiCall";
import {
    ExportForm,
    exportData,
} from "../../../../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../../../../components/Modal/Modal";
import Scroll from "../../../../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../../../../components/SearchAndBtns/SearchAndBtns";
import SearchItem from "../../../../../../components/Searching/SearchItem";
import TagListing from "../../../../../../components/Taglisting/TagListing";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import useKeyboardShortcut from "../../../../../../utils/useKeyboardShortcut";
import {
    deleteItem,
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
} from "../../../../../../utils/utils";
import CsvModal from "../../../../../data-management/datalist-builder/custom-action-modal/CsvModal";
import Tag from "../Tag/Tag";
import ErrorNotification from "../../../../../../components/ErrorNotification";
import useMobileView from "../../../../../../components/custom-hooks/useMobileView";

const status = {
    staging: "STAGING",
    published: "PUBLISHED",
};

export default function Post(props) {
    const { activeTab, channels: channelArr, channel } = props;

    const [selectedChannelId, setSelectedChannelId] = useState(channel?.id);
    const initialState = {
        id: "new",
        title: "",
        type: "PROTECTED",
        published: "",
        staging: "",
        tags: [],
        css_styles: "",
        meta_tags: "",
        status: status.staging,
        channel_id: channel?.id,
        slug: "",
    };
    const [selectedPost, setSelectedPost] = useState(initialState);
    const [selectedPostStaging, setSelectedPostStaging] = useState("");
    const [styles, setStyles] = useState([]);
    const [postList, setPostList] = useState([]);
    const [filteredPostList, setFilteredPostList] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedFilterTags, setSelectedFilterTags] = useState([]);
    const [pageListFilterByTag, setPageListFilterByTag] = useState([]);
    const [tagSuggestion, setTagSuggestion] = useState({});
    const [selectedItemId, setSelectedItemId] = useState("");
    const [error, setError] = useState([]);
    const tagSearchRef = useRef(null);
    const [searchFilterTags, setSearchFilterTags] = useState();
    const [siteSearch, setSiteSearch] = useState();
    const [channels, setChannels] = useState(channelArr);
    const [revisionList, setRevisionList] = useState([]);
    const siteRef = useRef(null);
    const filterTagRef = useRef(null);
    const [hoveredItemId, setHoveredItemId] = useState("");
    const [tabs, setTabs] = useState({
        postForm: "true",
        postRevision: "false",
    });
    const [confirmModal, setShowConfirmModal] = useState(false);
    const [selectedRevision, setSelectedRevision] = useState({});

    const [previewModal, setPreviewModal] = useState(false);

    const inputReference = useRef(null);
    const [csvModal, setCsvModal] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const modalRef = useRef(null);
    let fields = Object.keys(selectedPost);
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
        if (activeTab === "WEB_POSTS") {
            getData("FIRST_RENDER");
            setChannels(channelArr);
        }
        // getData();
    }, [activeTab, selectedChannelId]);

    useEffect(() => {
        setSearchFilterTags(tagSuggestion.list);
    }, [tagSuggestion?.list]);

    useEffect(() => {
        if (selectedItemId) {
            getSelectedItem(selectedItemId);
            setError([]);
        }
    }, [selectedItemId]);

    useEffect(() => {
        if (selectedItemId) {
            if (tabs.postRevision === "true") {
                getPostRevisions(selectedItemId);
            }
            setError([]);
        }
    }, [selectedItemId, tabs]);

    useEffect(() => {
        setPageListFilterByTag(filteredPostList);
    }, [filteredPostList]);

    const showTags = () => {
        filterTagRef.current.show();
    };

    const handleTags = tagFromChild => {
        setSelectedPost(prev => ({
            ...prev,
            tags: tagFromChild,
        }));
    };

    function handleConfirmRevert(data) {
        setSelectedPostStaging(data.post);
        setSelectedPost(prev => ({
            ...prev,
            // stagging: data.content,
            status: status.staging,
        }));
        setShowConfirmModal(false);
        toastEmitter(`Reverted changes for ${selectedPost.title}.`);
    }

    function searchPost(searchTag) {
        let filteredPostWithTags = [];
        postList &&
            postList.length > 0 &&
            postList.forEach(item => {
                searchTag &&
                    searchTag.length > 0 &&
                    searchTag.forEach(relatedPost => {
                        if (relatedPost.post_id === item.id) {
                            filteredPostWithTags.push(item);
                        }
                    });
            });
        return filteredPostWithTags ? filteredPostWithTags : [];
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
        if (selectedFilterTags.length > 0) {
            const filterPagesByTags = filterPagesByTagSelection(
                postList,
                selectedFilterTags,
                setPageListFilterByTag,
            );
            result = filterArrayByTerms(filterPagesByTags, value, [
                "title",
                "tags",
            ]);
            setPageListFilterByTag(result);
        } else {
            let findPost = searchPost(result);
            if (findPost.length === 0) {
                if (value.length > 0) {
                    filteredByName = filterArrayByTerms(
                        postList,
                        value,
                        fields,
                    );
                }
                if (value.length > 0) {
                    setFilteredPostList(filteredByName);
                } else {
                    setFilteredPostList(postList);
                }
            } else {
                setFilteredPostList(findPost);
            }
            if (value.length > 1) {
                result = filterArrayByTerms(
                    selectedPost.tags === "" ? [] : selectedPost.tags,
                    value,
                    fields,
                );
            }
        }
    }

    useKeyboardShortcut(
        ["Control", "/"],
        shortcutKeys => {
            inputReference.current.focus();
        },
        {
            overrideSystem: false,
            ignoreInputFields: false,
            repeatOnHold: false,
        },
    );

    const handleInput = e => {
        let value = e.target.value;
        let name = e.target.name;
        setSelectedPost(prev => ({ ...prev, [name]: value }));
    };

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

    function handleSavePost(currentStatus) {
        if (validation()) {
            let fieldData = {};
            if (currentStatus === status.staging) {
                fieldData = {
                    ...selectedPost,
                    staging: selectedPostStaging,
                    status: status.staging,
                };
            }

            if (currentStatus === status.published) {
                fieldData = {
                    ...selectedPost,
                    staging: selectedPostStaging,
                    published: selectedPostStaging,
                    status: status.published,
                };
            }
            if (!fieldData.channel_id) {
                fieldData.channel_id = selectedChannelId;
            }

            // fieldData.tags = tagForDb && tagForDb.tags;

            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "post"; //"formid"
            entityForm.entity = "post"; //Db- "table name"
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
                axios.post(url, request).then(async function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        const data = response.data.C_DATA[0].formData;
                        if (selectedPost.id === "new" || !selectedPost.id) {
                            insertItem(setPostList, data);
                            insertItem(setFilteredPostList, data);
                            setSelectedPost(prev => ({
                                ...prev,
                                id: data.id,
                                status: data.status,
                            }));
                        } else {
                            updateItem(setPostList, data);
                            updateItem(setFilteredPostList, data);
                            setSelectedPost(prev => ({
                                ...prev,
                                status: data.status,
                            }));
                        }
                        setSelectedPostStaging(data.staging);
                        toastEmitter(
                            `${selectedPost.title} ${
                                currentStatus === status.published
                                    ? "published"
                                    : "saved"
                            } successfully`,
                            true,
                            "success",
                        );
                        if (currentStatus === status.published) {
                            let revisionRequest = {
                                data: [
                                    {
                                        formId: "post_revision",
                                        entity: "post_revision",
                                        action: "update",
                                        id: "new",
                                        formData: {
                                            id: "new",
                                            post_id: selectedPost.id,
                                            post: selectedPost.staging,
                                        },
                                        executeUpdate: [
                                            {
                                                serviceKey:
                                                    "delete.old.post.revisions",
                                                serviceParams: selectedPost.id,
                                            },
                                        ],
                                    },
                                ],
                            };

                            const revisionResponse = await axios.post(
                                url,
                                revisionRequest,
                            );
                        }
                    }
                });
            } catch (e) {
                console.log("savePost error:" + e);
            }
        }
    }

    function validation() {
        let _error = [];
        let requiredKeys = ["title", "channel_id", "type"];
        for (let key in selectedPost) {
            if (selectedPost[key] === "" && requiredKeys.includes(key)) {
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

    async function getPostRevisions(id) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "revisions",
                    serviceKey: "list.post.revisions",
                    mode: "formData",
                },
            ],
        };

        const response = await axios.post(
            API_URL + "?service.key=masterKey.tenantData",
            dataRequest,
        );

        if (response.data.C_STATUS === "SUCCESS") {
            setRevisionList(response.data.C_DATA.revisions);
        } else {
            setRevisionList([]);
        }
    }

    function getData(condition) {
        let parsedTagAndPosts = [];
        var dataRequest = {};
        if (condition === "FIRST_RENDER") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: selectedChannelId,
                        dataKey: "postList",
                        serviceKey: "sys.posts",
                        mode: "formData",
                    },
                    {
                        serviceParams: selectedChannelId,
                        dataKey: "styleList",
                        serviceKey: "sys.styles",
                        mode: "formData",
                    },
                    {
                        serviceParams: "post",
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
                        serviceParams: "post",
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
        } else {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: selectedChannelId,
                        dataKey: "postList",
                        serviceKey: "sys.posts",
                        mode: "formData",
                    },
                    // {
                    //     serviceParams: "",
                    //     dataKey: "styleList",
                    //     serviceKey: "sys.styles",
                    //     mode: "formData",
                    // },
                ],
            };
        }
        if (dataRequest) {
            return new Promise((resolve, reject) => {
                axios
                    .post(
                        API_URL + "?service.key=masterKey.tenantData",
                        dataRequest,
                    )
                    .then(response => {
                        resolve(response);
                        if (response.data.C_STATUS === undefined) {
                            getData("FIRST_RENDER");
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        } else if (response.data.C_STATUS === "SUCCESS") {
                            if (response.data.C_DATA) {
                                if (response.data.C_DATA.postList.length > 0) {
                                    parsedTagAndPosts = tryToParse(
                                        response.data.C_DATA.postList,
                                    );

                                    setPostList(parsedTagAndPosts);
                                    // if (post && post.id) {
                                    //     const _item = parsedTagAndPosts.find(
                                    //         item => item.id === post.id,
                                    //     );
                                    //     ;
                                    //     if (_item) {
                                    //         setPost(_item);
                                    //     }
                                    // }
                                } else {
                                    setPostList([]);
                                }

                                if (response.data.C_DATA.styleList) {
                                    setStyles(response.data.C_DATA.styleList);
                                }

                                if (
                                    response.data.C_DATA?.postList?.length > 0
                                ) {
                                    if (inputReference.current.value) {
                                        let result = filterArrayByTerms(
                                            parsedTagAndPosts,
                                            inputReference.current.value,
                                            fields,
                                        );
                                        result = filterArrayByTerms(
                                            array,
                                            inputRef.current.value,
                                            keysToSearch,
                                        );
                                        if (selectedFilterTags.length) {
                                            result = filterPagesByTagSelection(
                                                result,
                                                selectedFilterTags,
                                                setPageListFilterByTag,
                                            );
                                        }
                                        setFilteredPostList(result);
                                    } else {
                                        const tagLen =
                                            selectedFilterTags.length;

                                        if (parsedTagAndPosts) {
                                            if (tagLen && tagLen > 0)
                                                filterPagesByTagSelection(
                                                    parsedTagAndPosts,
                                                    selectedFilterTags,
                                                    setPageListFilterByTag,
                                                );
                                            else
                                                setFilteredPostList(
                                                    parsedTagAndPosts,
                                                );
                                        } else {
                                            if (tagLen && tagLen > 0)
                                                filterPagesByTagSelection(
                                                    parsedTagAndPosts,
                                                    selectedFilterTags,
                                                    setPageListFilterByTag,
                                                );
                                            else setFilteredPostList(_pageList);
                                        }
                                    }
                                } else {
                                    setFilteredPostList([]);
                                }
                                // handleAddNewPost();
                            } else {
                                console.log(
                                    `Either api does not exists or SQL query returns no result.`,
                                );
                            }
                        }
                        if (response.data.C_STATUS === "UNAUTHORIZED") {
                        }
                        if (response.data.C_DATA) {
                            if (
                                response.data.C_DATA.tagSuggestionList.length >
                                0
                            ) {
                                let _tagsSuggestion =
                                    response.data.C_DATA.tagSuggestionList.find(
                                        item => item.category === "post",
                                    );
                                _tagsSuggestion.list = tryToParseTags(
                                    _tagsSuggestion.list,
                                );
                                setTagSuggestion(_tagsSuggestion);
                            }
                        } else {
                            console.log(
                                `Either sys.tag.suggestion.list sys.styles sys.posts does not exists or SQL query returns no result.`,
                            );
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            });
        }
    }

    function getSuggestionOnly() {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: "post",
                    dataKey: "tagSuggestionList",
                    serviceKey: "sys.tag.suggestion.list",
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
                    resolve(response);
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA) {
                            if (
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
                                `Either dir.group does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
    }

    function tryToParse(posts) {
        let parsedTagsAndPosts = [];
        try {
            posts &&
                posts.forEach(item => {
                    if (item.tags) {
                        item.tags = JSON.parse(
                            item.tags !== "" ? item.tags : "[]",
                        );
                    }
                    parsedTagsAndPosts.push(item);
                });
            return parsedTagsAndPosts ? parsedTagsAndPosts : [];
        } catch (error) {
            console.log(error);
        }
    }

    function handleRevisionDelete(item) {
        let fieldsData = item;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "post_revision";
        entityForm.entity = "post_revision";
        entityForm.action = "delete";

        entityForm.id = fieldsData.id;
        request.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    toastEmitter(`Delete was successfull.`);
                    getPostRevisions(selectedItemId);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    const handleDeletePost = (post, isDelete) => {
        if (isDelete === true) {
            let fieldsData = post;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "post";
            entityForm.entity = "post";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        handleAddNewPost();
                        // handleDeleteTags(response.data.C_DATA[0].id)
                    }
                    deleteItem(setPostList, post);
                    deleteItem(setFilteredPostList, post);
                    deleteAllPostRevision(post);
                    toastEmitter("Record Deleted", true);
                    // getData("DELETE");
                    updateDeleteConfig(false, {}, setDeleteConfig);
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, post, setDeleteConfig);
        }
    };

    function deleteAllPostRevision(post) {
        const request = {
            method: "POST",
            path: "?service.key=update.formData",
            data: [
                {
                    action: "update",
                    formId: "post_revision",
                    entity: "post_revision",
                    id: post.id,
                    executeUpdate: [
                        {
                            serviceKey: "delete.all.post.revisions",
                            serviceParams: post.id,
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

    function getSelectedItem(id) {
        let selectedPost = {};
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "postList",
                    serviceKey: "sys.post",
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
                                response.data.C_DATA.postList &&
                                response.data.C_DATA.postList.length > 0
                            ) {
                                selectedPost = response.data.C_DATA.postList[0];
                                selectedPost.tags =
                                    selectedPost.tags === ""
                                        ? []
                                        : JSON.parse(selectedPost.tags);
                                setSelectedTags(selectedPost.tags);
                                resolve(selectedPost);
                                if (!selectedPost.meta_tags) {
                                    selectedPost.meta_tags = "";
                                }
                                setSelectedPost(selectedPost);
                                setSelectedPostStaging(selectedPost.staging);
                            } else {
                                setSelectedPost(selectedPost);
                                setSelectedPostStaging(selectedPost.staging);
                            }
                        } else {
                            console.log(
                                `Either dir.group does not exists or SQL query returns no result.`,
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

    function handleAddNewPost(channel) {
        let initialState = {
            id: "",
            title: "",
            type: "PROTECTED",
            staging: "",
            published: "",
            tags: [],
            styles: "",
            meta_tags: "",
            channel_id: channel,
            slug: "",
        };
        // setSelectedChannelId(channel);
        setSelectedPost(initialState);
        setSelectedPostStaging("");
        setSelectedTags([]);
        setSelectedItemId("");
        setError([]);
        // TextEditor();
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

    function unescapeSlashes(str = "") {
        let parsedStr = "";
        try {
            parsedStr = str.replaceAll("\n", "");
        } catch (e) {
            return str;
        }
        return parsedStr;
    }

    function handleChange(event) {
        let id = event.target.id;
        let value = event.target.value;

        // setSelectedPost(prevState => ({
        //     ...prevState,
        //     [id]: value,
        // }));
        setSelectedPostStaging(value);
    }

    function liStyles(item) {
        let classStr = "list-group-item p-2";
        if (selectedPost && item && item["id"] === selectedPost["id"]) {
            classStr = "list-group-item selected-cell p-2";
        }

        return classStr;
    }

    function importPosts() {
        handleShowCsv();
    }

    async function nameExport(title, bool) {
        const items = pageListFilterByTag.filter(item => item.selected);
        let exportedItems = [];

        if (items.length === 1) {
            const res = await fetchExportItems(items);
            exportedItems = resIntoItems(res);
            jsonExport(exportedItems, () => {}, title, "_web_post");

            // remove selection of checkbox
            setPostList(prev => removeSelection(prev));
            setFilteredPostList(prev => removeSelection(prev));
            setPageListFilterByTag(prev => removeSelection(prev));
        } else if (items.length > 1) {
            if (bool) {
                //fetch items
                const res = await fetchExportItems(items);
                exportedItems = resIntoItems(res);

                //export items
                jsonExport(exportedItems, () => {}, title, "_web_post");
                modalRef.current.close();

                // remove selection of checkbox
                setPostList(prev => removeSelection(prev));
                setFilteredPostList(prev => removeSelection(prev));
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
                serviceKey: "sys.post",
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
        setSelectedPost(_item);
        setSelectedPostStaging(_item.staging);
    }

    const handleSelection = item => {
        selectTags(
            item,
            selectedFilterTags,
            setSelectedFilterTags,
            setPageListFilterByTag,
            postList,
            filteredPostList,
        );
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
            setChannels(result);
        } else if (textToSearch.length < 2 || textToSearch.length === 0) {
            setChannels(props.channels);
        } else {
            result = filterArrayByTerms(
                props.channels,
                textToSearch,
                keysToSearch,
            );
            setChannels(result);
        }
    };

    function handleChannelChange(value) {
        setSelectedChannelId(value);
        handleAddNewPost(value);
    }

    return (
        <React.Fragment>
            <div className="pb-2 post">
                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this item"}
                    operation={handleDeletePost}
                    header={"Delete Post"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
                <ChildrenModal
                    ref={modalRef}
                    header="Export Posts">
                    <ExportForm nameExport={nameExport} />
                </ChildrenModal>
                <CsvModal
                    sites={props.channels}
                    selectedSite={""}
                    csvModal={csvModal}
                    handleClose={handleCloseCsv}
                    getData={getData}
                    tableName="post"
                    title={"Posts Import"}
                />
                <ChildrenModal
                    header="Filter Post By Tags"
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
                            {tagSuggestion && (
                                <TagListing
                                    items={searchFilterTags}
                                    selectItem={selectTags}
                                    selectedTags={selectedFilterTags}
                                    setSelectedTags={setSelectedFilterTags}
                                    setPageListFilterByTag={
                                        setPageListFilterByTag
                                    }
                                    pageList={postList}
                                    filteredPageList={filteredPostList}
                                    handleSelection={handleSelection}
                                    searchInput={tagSearchRef?.current?.value}
                                />
                            )}
                        </div>
                    </div>
                </ChildrenModal>
                <div className="row m-0">
                    <div className="col-sm-3 listing-col s2a-border-right">
                        <div className="listing-header">
                            <div className="fw-bold">Sites</div>
                        </div>
                        <SearchInput
                            ref={siteRef}
                            onChange={handleSiteSearch}
                            placeholder="Search Sites"
                            value={siteSearch}
                        />
                        <Scroll>
                            <ul
                                name="channel_id"
                                className="list-group list-group-flush p-1">
                                {channels &&
                                    channels.map((item, index) => (
                                        <li
                                            onClick={() => {
                                                handleChannelChange(item.id);
                                                handleListingScroll();
                                            }}
                                            className={`list-group-item ${
                                                selectedChannelId === item.id
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
                            title="Posts"
                            handleImport={importPosts}
                            handleExport={() => {
                                const items = pageListFilterByTag.filter(
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
                            addNewItem={handleAddNewPost}
                            handleSearch={handleSearch}
                            inputRef={inputReference}
                            SearchPlaceHolder="Search title, tag"
                            showTags={showTags}
                            selectedTags={selectedFilterTags}
                            handleFormScroll={handleFormScroll}
                        />
                        {selectedFilterTags &&
                            selectedFilterTags.length > 0 && (
                                <div className="mb-2 input-group">
                                    <TagListing
                                        items={selectedFilterTags}
                                        removeTag={true}
                                        handleSelection={handleSelection}
                                    />
                                </div>
                            )}
                        <div className="col-sm-12 p-0 table-list-height">
                            <Scroll height="61vh">
                                <ul className="list-group list-group-flush p-1">
                                    {pageListFilterByTag &&
                                        pageListFilterByTag.length > 0 &&
                                        pageListFilterByTag.map(post => {
                                            return (
                                                <li
                                                    key={post.id}
                                                    className={liStyles(post)}
                                                    onClick={() => {
                                                        handleFormScroll();
                                                    }}>
                                                    <div className="d-flex">
                                                        <div className="col-sm-1 pe-2">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={
                                                                    post.selected
                                                                }
                                                                onChange={e =>
                                                                    handleSelectItem(
                                                                        post,
                                                                        e.target
                                                                            .checked,
                                                                        setPageListFilterByTag,
                                                                        pageListFilterByTag,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            className="col"
                                                            onClick={() =>
                                                                setSelectedItemId(
                                                                    post.id,
                                                                )
                                                            }>
                                                            <span className="col-sm-12">
                                                                {post.title}{" "}
                                                            </span>
                                                            <div className="col-sm-12">
                                                                <div className="mb-2">
                                                                    <ShowTags
                                                                        tags={
                                                                            post.tags
                                                                        }
                                                                    />
                                                                </div>
                                                                <span className="">
                                                                    <i
                                                                        className="fa-solid fa-calendar-days pe-1"
                                                                        title="Last Updated"></i>
                                                                    {formatDateForUserView(
                                                                        post.datemodified,
                                                                    )}{" "}
                                                                    |{" "}
                                                                    {post.status &&
                                                                        `${post.status}`}
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
                                                                                post,
                                                                            )
                                                                        }>
                                                                        <i className="fa-regular fa-clone"></i>
                                                                        Duplicate
                                                                    </span>
                                                                </li>
                                                                <li>
                                                                    <span
                                                                        className="dropdown-item dropdown-item-del"
                                                                        title="Delete"
                                                                        onClick={() =>
                                                                            handleDeletePost(
                                                                                post,
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
                    <div
                        className="col-sm-5 listing-col"
                        ref={formRef}>
                        <div className="listing-header">
                            <div className="fw-bold">Post</div>
                        </div>
                        <nav className="">
                            <div
                                className="nav nav-tabs"
                                id="nav-tab"
                                role="tablist">
                                <button
                                    className="nav-link active mb-1"
                                    name="postForm"
                                    data-bs-toggle="tab"
                                    data-bs-target="#postForm"
                                    type="button"
                                    onClick={event => handleTabsChange(event)}>
                                    Details
                                </button>
                                <button
                                    className="nav-link mb-1"
                                    name="postRevision"
                                    data-bs-toggle="tab"
                                    data-bs-target="#postRevision"
                                    type="button"
                                    onClick={event => handleTabsChange(event)}>
                                    Revision
                                </button>
                            </div>
                        </nav>
                        <div className="tab-content">
                            <div
                                className="tab-pane fade show active"
                                id="postForm"
                                tabIndex="0">
                                <div className="form form-background p-2">
                                    <div className="row">
                                        <div className="col-sm-12 mb-2 form-group">
                                            <div className="flex-between">
                                                <span className="d-inline-block fw-bold page-design-header">
                                                    Site&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                                <span
                                                    className={`fw-bold text-danger ${
                                                        error.indexOf(
                                                            "channel_id",
                                                        ) > -1
                                                            ? "d-inline-block"
                                                            : "d-none"
                                                    }`}>
                                                    Site cannot be empty.
                                                </span>
                                            </div>
                                            <select
                                                className="form-select"
                                                name="channel_id"
                                                value={
                                                    selectedPost?.channel_id
                                                        ? selectedPost.channel_id
                                                        : selectedChannelId
                                                }
                                                onChange={e => handleInput(e)}>
                                                <option
                                                    disabled
                                                    value="">
                                                    Select Site
                                                </option>
                                                {channels.map(channel => {
                                                    return (
                                                        <option
                                                            key={channel.id}
                                                            value={channel.id}>
                                                            {
                                                                channel.brand_title
                                                            }
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="col-sm-12 form-group mb-2">
                                            <label className="mt-1 mb-1 fw-bold title-error">
                                                <span>
                                                    Title&nbsp;
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </span>
                                                <span className="text-danger">
                                                    {error &&
                                                        error.indexOf(
                                                            "title",
                                                        ) !== -1 &&
                                                        "Title is required"}
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={
                                                    selectedPost
                                                        ? selectedPost.title
                                                        : ""
                                                }
                                                onChange={e => handleInput(e)}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-sm-6">
                                            <div className="form-group">
                                                <label className="mt-1 mb-1 fw-bold title-error">
                                                    <span>
                                                        Type&nbsp;
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </span>
                                                    <span className="text-danger">
                                                        {error &&
                                                            error.indexOf(
                                                                "type",
                                                            ) !== -1 &&
                                                            "Type is required"}
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="type"
                                                    value={
                                                        selectedPost.type
                                                            ? selectedPost.type
                                                            : "PROTECTED"
                                                    }
                                                    onChange={e =>
                                                        handleInput(e)
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
                                                        value={
                                                            selectedPost.slug
                                                        }
                                                        onChange={e =>
                                                            handleInput(e)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="mt-1 mb-1 fw-bold">
                                                    Styles
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="styles"
                                                    value={selectedPost?.styles}
                                                    onChange={e =>
                                                        handleInput(e)
                                                    }>
                                                    <option value="">
                                                        Select Styles
                                                    </option>
                                                    {styles.map(
                                                        (item, index) => (
                                                            <option
                                                                key={index}
                                                                value={item.id}>
                                                                {item.title}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label
                                                htmlFor="meta_tags"
                                                className="fw-bold">
                                                SEO Keywords
                                            </label>
                                            <textarea
                                                className="form-control mt-2"
                                                name="meta_tags"
                                                value={selectedPost.meta_tags}
                                                id="meta_tags"
                                                onChange={handleInput}
                                                rows="7"></textarea>
                                        </div>
                                        <div className="col-sm-12">
                                            <div className="form-group">
                                                <label className="mt-1 fw-bold">
                                                    Tags
                                                    <span className="text-danger"></span>
                                                </label>
                                                <Tag
                                                    handleTags={handleTags}
                                                    selectedPostTags={
                                                        selectedTags
                                                    }
                                                    suggestion={
                                                        tagSuggestion &&
                                                        tagSuggestion.list
                                                    }
                                                    tagList={tagSuggestion}
                                                    getData={getSuggestionOnly}
                                                    category="post"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-sm-12">
                                            <div className="form-group ">
                                                <label className="mt-1 fw-bold pe-2">
                                                    Content
                                                    <span className="text-danger"></span>
                                                </label>
                                                {/* {post.styles} */}

                                                {activeTab === "WEB_POSTS" && (
                                                    <TextEditor
                                                        id="staging"
                                                        value={
                                                            selectedPostStaging
                                                        }
                                                        onChange={handleChange}
                                                        viewMode="ADVANCE"
                                                        // styles={
                                                        //     post && post.styles
                                                        //         ? post.styles
                                                        //         : ""
                                                        // }
                                                        // styles={
                                                        //     post && post.styles
                                                        //         ? convert(post.styles)
                                                        //         : ""
                                                        // }
                                                        // styles={mystyle}
                                                        styles={unescapeSlashes(
                                                            selectedPost.css_styles,
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <span className="flex-between my-2">
                                            <label className="mt-1 fw-bold pe-2">
                                                Post Status :{" "}
                                                {selectedPost.status}
                                            </label>
                                            <div>
                                                {/* <button
                                        className="btn-sm btn button-theme  button-theme"
                                        onClick={() => handleSavePost()}>
                                        <i className="fa-solid fa-floppy-disk mx-1"></i>
                                        Save
                                    </button> */}
                                                <button
                                                    className="m-2 ms-0 btn button-theme btn-sm"
                                                    disabled={
                                                        selectedPost?.status ===
                                                        status.published
                                                    }
                                                    onClick={() =>
                                                        handleSavePost(
                                                            status.published,
                                                        )
                                                    }>
                                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                                    Publish
                                                </button>
                                                <button
                                                    className="m-2 ms-0 btn button-theme btn-sm"
                                                    onClick={() =>
                                                        handleSavePost(
                                                            status.staging,
                                                        )
                                                    }>
                                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                                    Save
                                                </button>
                                            </div>
                                        </span>
                                        <div className="p-2">
                                            <ErrorNotification
                                                error={error}
                                                labels={{
                                                    title: "Title",
                                                    channel: "Site",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="postRevision">
                                <ul className="list-group list-group-flush">
                                    {revisionList.map(revision => {
                                        return (
                                            <li
                                                key={revision.id}
                                                onMouseEnter={() =>
                                                    setHoveredItemId(
                                                        revision.id,
                                                    )
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
                                                {revision.id ===
                                                    hoveredItemId && (
                                                    <span className="float-end">
                                                        <i
                                                            className="fa-solid fa-trash text-danger pointer pe-1 "
                                                            onClick={() =>
                                                                handleRevisionDelete(
                                                                    revision,
                                                                )
                                                            }></i>
                                                        <i
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
                                                            className="fa-solid fa-eye pe-1 pointer"
                                                            onClick={() => {
                                                                setPreviewModal(
                                                                    true,
                                                                );

                                                                setSelectedRevision(
                                                                    revision,
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
                                show={previewModal}
                                onHide={() => setPreviewModal(false)}
                                keyboard={true}
                                fullscreen
                                animation={true}>
                                <Modal.Header>
                                    <div className="w-100 d-flex justify-content-between align-items-center">
                                        <Modal.Title>
                                            {selectedPost.title}&nbsp;
                                            <small className="text-body-secondary">
                                                {selectedPost.status}
                                            </small>{" "}
                                        </Modal.Title>
                                        <i
                                            onClick={() =>
                                                setPreviewModal(false)
                                            }
                                            className="fa-solid fa-close p-1 pointer"></i>
                                    </div>
                                </Modal.Header>
                                <Modal.Body className="">
                                    {selectedRevision.post && (
                                        <Interweave
                                            content={selectedRevision.post}
                                        />
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
                                    post. Are you sure to revert?
                                </Modal.Body>
                                <Modal.Footer>
                                    <button
                                        className="btn btn-sm button-theme"
                                        onClick={() =>
                                            handleConfirmRevert(
                                                selectedRevision,
                                            )
                                        }>
                                        Yes
                                    </button>
                                    <button
                                        className="btn btn-sm button-theme"
                                        onClick={() =>
                                            setShowConfirmModal(false)
                                        }>
                                        No
                                    </button>
                                </Modal.Footer>
                            </Modal>
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
        <div className="row">
            <div className="mb-3 input-group">
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

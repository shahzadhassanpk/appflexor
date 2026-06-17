import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import TextEditor from "../../../../components/TextEditor/RichTextEditor";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { formatDateTimeForUserView } from "../../../../utils/utils";
import { tryToParse } from "../../../data-management/form-builder/Forms/FormViewer/utils";
import Tag from "../Designer/components/Tag/Tag";

const status = {
    staging: "STAGING",
    published: "PUBLISHED",
};

function PostEditURL() {
    var id = useParams().id;
    const { channel } = useContext(AppContext);

    const [post, setPost] = useState({});
    const [error, setError] = useState([]);
    const [styles, setStyles] = useState([]);
    const [tagSuggestion, setTagSuggestion] = useState({});
    const [tabs, setTabs] = useState({
        postForm: "true",
        postRevision: "false",
    });
    const [confirmModal, setShowConfirmModal] = useState(false);
    const [selectedRevision, setSelectedRevision] = useState({});
    const [hoveredItemId, setHoveredItemId] = useState("");
    const [previewModal, setPreviewModal] = useState(false);
    const [revisionList, setRevisionList] = useState([]);

    useEffect(() => {
        if (id) {
            getPostData(id);
        }
    }, [id]);

    useEffect(() => {
        if (post) {
            if (tabs.postRevision === "true") {
                getPostRevisions(post.id);
            }
            setError([]);
        }
    }, [post, tabs]);

    const handleInput = e => {
        let value = e.target.value;
        let name = e.target.name;
        setPost(prev => ({ ...prev, [name]: value }));
    };

    function handleChange(event) {
        let id = event.target.id;
        let value = event.target.value;

        setPost(prevState => ({
            ...prevState,
            [id]: value,
        }));
    }

    const handleTags = tagFromChild => {
        setPost(prev => ({
            ...prev,
            tags: tagFromChild,
        }));
    };

    function validatiion() {
        let _error = [];
        let requiredKeys = ["title"];
        for (let key in post) {
            if (post[key] === "" && requiredKeys.includes(key)) {
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

    function handleConfirmRevert(data) {
        // setSelectedPostStaging(data.post);
        setPost(prev => ({
            ...prev,
            staging: data.post,
            status: status.staging,
        }));
        setShowConfirmModal(false);
        toastEmitter(`Reverted changes for ${post.title}.`);
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

    function getPostData(id) {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "post",
                    serviceKey: "sys.post",
                    mode: "formData",
                },
                {
                    serviceParams: channel.id,
                    dataKey: "styleList",
                    serviceKey: "sys.styles",
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
                            if (response.data.C_DATA.post.length > 0) {
                                let post = response.data.C_DATA.post[0];

                                setPost(post);
                            }

                            if (response.data.C_DATA.styleList) {
                                setStyles(response.data.C_DATA.styleList);
                            }
                        } else {
                            console.log(
                                `Either sys.post does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
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
                    getPostRevisions(post.id);
                }
            })
            .catch(error => {
                console.error(error);
            });
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

    function tryToParseTags(tags) {
        let parsedTags = [];
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            console.log(error);
        }
        return parsedTags ? parsedTags : [];
    }

    const handleSavePost = currentStatus => {
        if (validatiion()) {
            let fieldData = {};
            if (currentStatus === status.staging) {
                fieldData = { ...post, status: status.staging };
            }

            if (currentStatus === status.published) {
                fieldData = {
                    ...post,
                    published: post.staging,
                    status: status.published,
                };
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
                        setPost(data);
                        toastEmitter(
                            `${post.title} ${
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
                                            post_id: post.id,
                                            post: post.staging,
                                        },
                                    },
                                ],
                            };

                            const revisionResponse = await axios.post(
                                url,
                                revisionRequest,
                            );
                        }
                    }
                    // getData("SAVE");
                });
            } catch (e) {
                console.log("savePost error:" + e);
            }
        }
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

    function unescapeSlashes(str = "") {
        let parsedStr = "";
        try {
            parsedStr = str.replaceAll("\n", "");
        } catch (e) {
            return str;
        }
        return parsedStr;
    }

    return (
        <div className="container">
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
                        Editor
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
                    <div className="form form-background">
                        <div className="row m-0">
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 mb-1 fw-bold title-error">
                                        Title
                                        <span className="text-danger">
                                            {error &&
                                                error.indexOf("title") !== -1 &&
                                                "Title is required"}
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={post ? post.title : ""}
                                        onChange={e => handleInput(e)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="mt-1 mb-1 fw-bold">
                                        Styles
                                    </label>
                                    <select
                                        className="form-select"
                                        name="styles"
                                        value={post?.styles}
                                        onChange={e => handleInput(e)}>
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
                            <div className="col-sm-8">
                                <label
                                    htmlFor="meta_tags"
                                    className="fw-bold">
                                    SEO Keywords
                                </label>
                                <textarea
                                    className="form-control mt-2"
                                    name="meta_tags"
                                    value={post.meta_tags}
                                    id="meta_tags"
                                    onChange={handleInput}
                                    rows="4"></textarea>
                            </div>
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Tags
                                        <span className="text-danger"></span>
                                    </label>
                                    <Tag
                                        handleTags={handleTags}
                                        selectedPostTags={tryToParse(post.tags)}
                                        suggestion={
                                            tagSuggestion && tagSuggestion.list
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
                                    <TextEditor
                                        id="staging"
                                        value={post.staging}
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
                                            post.css_styles,
                                        )}
                                    />
                                </div>
                            </div>
                            <span className="d-flex justify-content-between my-2">
                                <label className="mt-1 fw-bold pe-2">
                                    Post Status : {post.status}
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
                                            post?.status === status.published
                                        }
                                        onClick={() =>
                                            handleSavePost(status.published)
                                        }>
                                        <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                        Publish
                                    </button>
                                    <button
                                        className="m-2 ms-0 btn button-theme btn-sm"
                                        onClick={() =>
                                            handleSavePost(status.staging)
                                        }>
                                        <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                        Save
                                    </button>
                                </div>
                            </span>
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
                                        setHoveredItemId(revision.id)
                                    }
                                    onMouseLeave={() => setHoveredItemId("")}
                                    className={`list-group-item ${
                                        selectedRevision.id === revision.id
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
                                                    setShowConfirmModal(true);
                                                }}></i>
                                            <i
                                                className="fa-solid fa-eye pe-1 pointer"
                                                onClick={() => {
                                                    setPreviewModal(true);

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
                                {post.title}&nbsp;
                                <small className="text-body-secondary">
                                    {post.status}
                                </small>{" "}
                            </Modal.Title>
                            <i
                                onClick={() => setPreviewModal(false)}
                                className="fa-solid fa-close p-1 pointer"></i>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="">
                        {selectedRevision.post && (
                            <Interweave content={selectedRevision.post} />
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
                                onClick={() => setShowConfirmModal(false)}
                                className="fa-solid fa-close p-1 pointer"></i>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="">
                        This will revert changes of current staging post. Are
                        you sure to revert?
                    </Modal.Body>
                    <Modal.Footer>
                        <button
                            className="btn btn-sm button-theme"
                            onClick={() =>
                                handleConfirmRevert(selectedRevision)
                            }>
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
    );
}

export default PostEditURL;

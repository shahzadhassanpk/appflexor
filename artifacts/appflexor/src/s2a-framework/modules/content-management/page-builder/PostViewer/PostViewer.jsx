import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import useKeyboardShortcut from "../../../../utils/useKeyboardShortcut";
import { filterArrayByTerms, makeid } from "../../../../utils/utils";
import PageContext from "../Context/PageContext";
import PostList from "./PostList";

let initialState = {
    id: "new",
    title: "",
    stagging: "",
};

export default function PostViewer(props) {
    const pageContext = useContext(PageContext);
    const [post, setPost] = useState(initialState);
    const [posts, setPosts] = useState([]);
    const [filteredPost, setFilteredPost] = useState([]);
    const [tags, setTags] = useState([]);
    const [size, setSize] = useState(3);
    const [current, setCurrent] = useState(1);
    const getPaginateData = (current, pageSize) => {
        return filteredPost.slice((current - 1) * pageSize, current * pageSize);
    };
    const [show, setShow] = useState(false);
    const inputReference = useRef(null);
    const { channel, userGroups } = useContext(AppContext);

    let modalId = makeid(8);

    useEffect(() => {
        if (props?.component?.data) {
            setPost(prev => ({
                ...prev,
                id: props.component.data.id,
                title: props.component.data.title,
            }));
            let id = props.component.data.id;
            getSelectedPost(id);
        }
    }, []);

    function getData() {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: pageContext.selectedChannelId,
                    dataKey: "postList",
                    serviceKey: "sys.posts",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "tagList",
                    serviceKey: "sys.tags",
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
                        if (response.data.C_DATA.postList.length > 0) {
                            setPosts(response.data.C_DATA.postList);
                        } else {
                            setPosts([]);
                        }
                        if (response.data.C_DATA.postList.length > 0) {
                            setFilteredPost(response.data.C_DATA.postList);
                        } else {
                            setFilteredPost([]);
                        }
                        if (response.data.C_DATA.tagList.length > 0) {
                            setTags(response.data.C_DATA.tagList);
                        } else {
                            setTags([]);
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

    function handlePostAndTags(item, condition) {
        if (condition === "unlink") {
            setPost(initialState);
        } else {
            setPost(item);
        }
    }

    function searchPost(searchTag) {
        let filteredPostWithTags = [];
        posts &&
            posts.length > 0 &&
            posts.forEach(item => {
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

    function handleSearch(event) {
        let postObj = posts && posts[0];
        let tagObj = tags && tags[0];
        let filteredByName;
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        if (value.length > 1 && checkObject(tagObj)) {
            result = filterArrayByTerms(tags, value, Object.keys(tagObj));
        }
        let findPost = searchPost(result);
        if (findPost.length === 0) {
            if (value.length > 1 && checkObject(postObj)) {
                filteredByName = filterArrayByTerms(
                    posts,
                    value,
                    Object.keys(postObj),
                );
            }
            if (filteredByName !== undefined && filteredByName.length > 0) {
                setFilteredPost(filteredByName);
            } else if (
                filteredByName !== undefined &&
                filteredByName.length === 0 &&
                value.length > 2
            ) {
                setFilteredPost([]);
            } else {
                setFilteredPost(posts);
            }
        } else {
            setFilteredPost(findPost);
        }
        if (value.length > 2) {
            setCurrent(1);
        }
    }

    function savePostInlayout() {
        if (props.setComponentPropsData) {
            let tempObj = {
                id: post.id,
                title: post.title,
            };

            props.setComponentPropsData(tempObj, props.component);
        }
        getSelectedPost(post.id);
        setShow(false);
    }

    function handlePostData() {
        // setShow((prev) => !prev)
        getData();
    }

    function getSelectedPost(id) {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "selectedPost",
                    serviceKey: "sys.post",
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
                        if (response.data.C_DATA.selectedPost.length > 0) {
                            let selectedPostOnly =
                                response.data.C_DATA.selectedPost[0];
                            setPost(selectedPostOnly);
                        } else {
                            setPost(initialState);
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

    function unescapeSlashes(str = "") {
        let parsedStr = "";
        try {
            parsedStr = str.replaceAll("\n", "");
        } catch (e) {
            return str;
        }
        return parsedStr;
    }

    const isAdmin = userGroups?.groupid?.includes("ADMIN") || false;

    function editPost() {
        const newWin = window.open(
            `/app/post-edit/${post.id}&embed=true`,
            "_blank",
        );

        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    }

    return (
        <div>
            <style>{unescapeSlashes(post.css_styles)}</style>

            {/* {props.mode} */}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.render && (
                    <div>
                        <div className="post-viewer position-relative">
                            {isAdmin ? (
                                <div className="position-absolute top-0 end-0">
                                    <button
                                        className="btn btn-sm btn-warning my-2"
                                        onClick={() => editPost()}>
                                        Edit{" "}
                                        <i className="fa-solid fa-arrow-up-right-from-square ps-1"></i>
                                    </button>
                                </div>
                            ) : null}
                            <div className="p-1">
                                {/* {post.published} */}
                                {post && (
                                    <Interweave content={post.published} />
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.readonly) && (
                    <div>
                        <div className="post-viewer position-relative">
                            <div className="p-1">
                                {/* {post.published} */}
                                {post && (
                                    <Interweave content={post.published} />
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div onClick={() => setShow(true)}>
                        <div className=" mt-2 d-flex">
                            <div className="container">
                                <div className="row mt-3">
                                    <div
                                        className="col-sm-12"
                                        onClick={() => handlePostData()}
                                        data-bs-toggle="modal"
                                        data-bs-target={`#${modalId}`}>
                                        <div
                                            //   style={{ minHeight: "100px", maxWidth:"50vh"}}
                                            className="d-flex align-items-center d-flex justify-content-center">
                                            {(props &&
                                                props.component &&
                                                props.component.data &&
                                                props.component.data.id ===
                                                    "") ||
                                            (props &&
                                                props.component &&
                                                props.component.data &&
                                                props.component.data.id ===
                                                    undefined) ? (
                                                <div className="text-center">
                                                    <p className="text-muted cursor-pointer">
                                                        <span className="fa-solid fa-calendar icon-space"></span>
                                                        No{" "}
                                                        <span className="text-danger">
                                                            Post{" "}
                                                        </span>
                                                        Selected.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-muted">
                                                        
                                                        <span className="fa-solid fa-calendar icon-space"></span>
                                                        Click{" "}
                                                        <span className="text-danger">
                                                            to{" "}
                                                        </span>
                                                        change {" Post "}
                                                        {props &&
                                                            props.component &&
                                                            props.component
                                                                .data &&
                                                            props.component.data
                                                                .title}
                                                        .
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-post">
                                <div
                                    className="modal fade"
                                    data-bs-backdrop="static"
                                    data-bs-keyboard="false"
                                    id={`${modalId}`}>
                                    <div className="modal-dialog modal-xl">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                {/*  <h1
                                                    className="modal-title fs-5"
                                                    id="postViewerLabel">
                                                    Edit post
                                                </h1>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    data-bs-dismiss="modal"
                                                    aria-label="Close"></button>
                                            </div>*/}
                                                <h5 className="modal-title">
                                                    Edit post
                                                </h5>
                                                <div
                                                    className=""
                                                    data-bs-dismiss="modal"
                                                    data-bs-toggle="tooltip"
                                                    data-bs-title="Close">
                                                    <i className="fa-solid fa-x modal-close"></i>
                                                </div>
                                            </div>
                                            <PostList
                                                inputReference={inputReference}
                                                handleSearch={handleSearch}
                                                getPaginateData={
                                                    getPaginateData
                                                }
                                                tags={tags}
                                                handlePostAndTags={
                                                    handlePostAndTags
                                                }
                                                post={post}
                                                size={size}
                                                setSize={setSize}
                                                current={current}
                                                setCurrent={setCurrent}
                                                posts={posts}
                                                Tags={Tags}
                                            />
                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn button-theme btn-sm"
                                                    data-bs-dismiss="modal">
                                                    Close
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn button-theme  btn-sm"
                                                    // disabled={post.id ? false : true}
                                                    data-bs-dismiss="modal"
                                                    onClick={() =>
                                                        savePostInlayout()
                                                    }>
                                                    Save Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

function Tags(props) {
    const { tag } = props;
    const [allTags, setAllTags] = useState([]);

    useEffect(() => {
        setAllTags(formatTags(tag));
    }, [tag]);

    const formatTags = tags => {
        let parseTag = [];
        let result = [];
        try {
            parseTag = JSON.parse(tags);
            result = [];
            parseTag &&
                parseTag.length > 0 &&
                parseTag.forEach(tag => {
                    result.push(tag);
                });
        } catch (error) {
            console.log(error);
        }
        return result ? result : [];
    };

    return (
        <>
            <span>
                {allTags &&
                    allTags.length > 0 &&
                    allTags.map((item, index) => {
                        return (
                            <SelectedPostTag
                                tag={item.name}
                                index={index}
                            />
                        );
                    })}
            </span>
        </>
    );
}

function SelectedPostTag({ tag, index }) {
    return (
        <div
            className="badge text-bg-primary"
            key={index}>
            {tag}
        </div>
    );
}

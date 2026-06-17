import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import useKeyboardShortcut from "../../../../utils/useKeyboardShortcut";
import { filterArrayByTerms, makeid } from "../../../../utils/utils";
import ContentList from "./ContentList";
import RenderContent from "./RenderContent";
import PageContext from "../Context/PageContext";

const initialState = {
    id: "new",
    title: "",
    content: "",
};
export default function ContentViewer(props) {
    const appContext = useContext(AppContext);
    const pageContext = useContext(PageContext);
    const [content, setContent] = useState(initialState);
    const [contentList, setContentList] = useState([]);
    const [filteredContentList, setFilteredContentList] = useState([]);
    const [tags, setTags] = useState([]);
    const [size, setSize] = useState(3);
    const [current, setCurrent] = useState(1);
    const getPaginateData = (current, pageSize) => {
        return filteredContentList.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };
    const [show, setShow] = useState(false);
    const inputReference = useRef(null);

    let modalId = makeid(8);

    useEffect(() => {
        if (
            props &&
            props.component &&
            props.mode !== props.modeType.readonly
        ) {
            if (props.component.data) {
                setContent(prev => ({
                    ...prev,
                    id: props.component.data.id,
                    title: props.component.data.title,
                }));
                let id = props.component.data.id;
                getSelectedContent(id);
            }
        }
    }, [props]);

    function getData() {
        let selectedChannelId = pageContext.selectedChannelId;
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedChannelId,
                    dataKey: "contentlist",
                    serviceKey: "sys.list.content",
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
                        if (response.data.C_DATA.contentlist.length > 0) {
                            setContentList(response.data.C_DATA.contentlist);
                        } else {
                            setContentList([]);
                        }
                        if (response.data.C_DATA.contentlist.length > 0) {
                            setFilteredContentList(
                                response.data.C_DATA.contentlist,
                            );
                        } else {
                            setFilteredContentList([]);
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

    function handleContentAndTags(item, condition) {
        if (condition === "unlink") {
            setContent(initialState);
        } else {
            setContent(item);
        }
    }

    function searchContent(searchTag) {
        let filteredContentWithTags = [];
        contentList &&
            contentList.length > 0 &&
            contentList.forEach(item => {
                searchTag &&
                    searchTag.length > 0 &&
                    searchTag.forEach(relatedPost => {
                        if (relatedPost.post_id === item.id) {
                            filteredContentWithTags.push(item);
                        }
                    });
            });
        return filteredContentWithTags ? filteredContentWithTags : [];
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
        let contentObj = contentList && contentList[0];
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
        let findPost = searchContent(result);
        if (findPost.length === 0) {
            if (value.length > 1 && checkObject(contentObj)) {
                filteredByName = filterArrayByTerms(
                    contentList,
                    value,
                    Object.keys(contentObj),
                );
            }
            if (filteredByName !== undefined && filteredByName.length > 0) {
                setFilteredContentList(filteredByName);
            } else if (
                filteredByName !== undefined &&
                filteredByName.length === 0 &&
                value.length > 2
            ) {
                setFilteredContentList([]);
            } else {
                setFilteredContentList(contentList);
            }
        } else {
            setFilteredContentList(findPost);
        }
        if (value.length > 2) {
            setCurrent(1);
        }
    }

    function filterIt(terms, arr) {
        if ("" === terms || terms.length < 3) return arr;
        const words = terms.match(/\w+|"[^"]+"/g);
        words.push(terms);
        return arr.filter(a => {
            const v = Object.values(a);
            const f = JSON.stringify(v).toLowerCase();

            return words.every(val => f.includes(val));
        });
    }

    function saveContentInlayout() {
        if (props.setComponentPropsData) {
            let tempObj = {
                id: content.id,
                title: content.name,
            };

            props.setComponentPropsData(tempObj, props.component);
        }
        getSelectedContent(content.id);
        setShow(false);
    }

    function handleContentData() {
        // setShow((prev) => !prev)
        getData();
    }

    function getSelectedContent(id) {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "selectedcontent",
                    serviceKey: "sys.content",
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
                        // ;
                        if (response.data.C_DATA.selectedcontent.length > 0) {
                            let selectedcontentOnly =
                                response.data.C_DATA.selectedcontent[0];
                            setContent(selectedcontentOnly);
                        } else {
                            setContent(initialState);
                        }
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

    const isAdmin = appContext.userGroups?.groupid?.includes("ADMIN") || false;

    function editContent() {
        const newWin = window.open(
            `/app/content-page-design/${content.id}&embed=true`,
            "_blank",
        );

        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    }

    return (
        <div>
            <style>{unescapeSlashes(content.css_styles)}</style>

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.render && (
                    <div className="content-viewer position-relative">
                        {isAdmin ? (
                            <div className="position-absolute top-0 end-0">
                                <button
                                    className="btn btn-sm btn-warning my-2"
                                    onClick={() => editContent()}>
                                    Edit{" "}
                                    <i className="fa-solid fa-arrow-up-right-from-square ps-1"></i>
                                </button>
                            </div>
                        ) : null}

                        {content && <RenderContent content={content} />}
                    </div>
                )}

            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.readonly) && (
                    <div className="content-viewer position-relative">
                        {content && <RenderContent content={content} />}
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
                                        onClick={() => handleContentData()}
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
                                                            Web Page{" "}
                                                        </span>
                                                        Selected.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-muted">
                                                    {/* {JSON.stringify(props?.component?.data)} */}
                                                        <span className="fa-solid fa-calendar icon-space"></span>
                                                        Click{" "}
                                                        <span className="text-danger">
                                                            to{" "}
                                                        </span>
                                                        change{" Web Content"}{" "}
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
                                                    Edit Web Page
                                                </h5>
                                                <div
                                                    className=""
                                                    data-bs-dismiss="modal"
                                                    data-bs-toggle="tooltip"
                                                    data-bs-title="Close">
                                                    <i className="fa-solid fa-x modal-close"></i>
                                                </div>
                                            </div>
                                            <ContentList
                                                inputReference={inputReference}
                                                handleSearch={handleSearch}
                                                getPaginateData={
                                                    getPaginateData
                                                }
                                                tags={tags}
                                                handlePostAndTags={
                                                    handleContentAndTags
                                                }
                                                content={content}
                                                size={size}
                                                setSize={setSize}
                                                current={current}
                                                setCurrent={setCurrent}
                                                contentList={contentList}
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
                                                        saveContentInlayout()
                                                    }>
                                                    Save
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
                            <SelectedContentTag
                                tag={item.name}
                                index={index}
                            />
                        );
                    })}
            </span>
        </>
    );
}

function SelectedContentTag({ tag, index }) {
    return (
        <div
            className="badge text-bg-primary"
            key={index}>
            {tag}
        </div>
    );
}

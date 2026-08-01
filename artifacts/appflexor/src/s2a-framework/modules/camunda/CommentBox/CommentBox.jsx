import axios from "axios";
import { Interweave } from "interweave";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
// import { useSelector } from "react-redux";
import { API_URL, AUTH_URL } from "../../../Config";
import TextEditor from "../../../components/TextEditor/RichTextEditor";
import { formatDateTimeForUserView, getTimeAgo } from "../../../utils/utils";
import { BPM_API_URL } from "../CamundaConfig";
// import ProcessesContext from "../ProcessesContext";
import { UploadFile } from "./UploadFile/UploadFile";
import { get } from "jquery";
import "../inbox-style.css";

function CommentBox({ task, getProfileImage, getDisplayName }) {
    const processKey = task.process_def_key;
    const processInstanceId = task.instance_id;

    const [businessKey, setBusinessKey] = useState("");

    const [comment, setComment] = useState({});
    const [comments, setComments] = useState([]);
    const [commentMode, setCommentMode] = useState("list");

    const [history, setHistory] = useState([]);

    const [trackHistory, setTrackHistory] = useState([]);

    const [attachment, setAttachment] = useState({});
    const [attachments, setAttachments] = useState([]);
    const [attachmentMode, setAttachmentMode] = useState("list");

    const [tabs, setTabs] = useState({
        comments: true,
        attachments: false,
        history: false,
        trackHistory: false,
    });

    useEffect(() => {
        if (task?.id) {
            setTabs({
                comments: true,
                attachments: false,
                history: false,
                trackHistory: false,
            });
            setCommentMode("list");
            setComments([]);
            setAttachment([]);
            setHistory([]);
            setBusinessKey(task.business_key);
        }
    }, [task.id]);

    useEffect(() => {
        setComment(prevState => ({
            ...prevState,
            business_key: businessKey,
            process_key: processKey,
        }));

        setAttachment(prevState => ({
            ...prevState,
            business_key: businessKey,
            process_key: processKey,
        }));

        if (tabs.comments) {
        }

        if (tabs.attachments) {
        }
        getComments();
        getAttachments();
        getHistory();
        // getTrackHistory();
    }, [businessKey, task.assignee]);

    function convertDBDateToFromNow(dateInString) {
        // Takes date in UTC and convert accordingto timezone and returns time fromNow
        let date = new Date(dateInString);
        let dateWithTimeZone = new Date(
            date.getTime() + date.getTimezoneOffset() * 60 * 1000,
        );
        let offset = date.getTimezoneOffset() / 60;
        let hours = date.getHours();
        dateWithTimeZone.setHours(hours - offset);
        return moment(dateWithTimeZone).fromNow();
    }

    function convertDBDateToUserView(dateInString) {
        // Takes date in UTC and convert accordingto timezone and returns time in User View Format
        let date = new Date(dateInString);
        let dateWithTimeZone = new Date(
            date.getTime() + date.getTimezoneOffset() * 60 * 1000,
        );
        let offset = date.getTimezoneOffset() / 60;
        let hours = date.getHours();
        dateWithTimeZone.setHours(hours - offset);
        return formatDateTimeForUserView(dateWithTimeZone);
    }

    function handleComment(event) {
        const { id, value } = event.target;
        setComment(prevState => ({
            ...prevState,
            [id]: value,
        }));
    }

    function addComment() {
        let _comment = {
            id: "new",
            business_key: businessKey,
            process_key: processKey,
        };
        setComment(_comment);
        setCommentMode("form");
    }

    function addAttachment() {
        let _attachment = {
            id: "new",
            business_key: businessKey,
            process_key: processKey,
        };
        setAttachment(_attachment);
        setAttachmentMode("form");
    }

    function handleTabsChange(name) {
        // let name = event.currentTarget.name;
        let keys = Object.keys(tabs);
        let obj = {};
        console.log("setting tab ", name);
        keys.forEach(key => {
            if (name == key) obj[key] = true;
            else obj[key] = false;
        });

        setTabs(obj);
    }
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function saveComment(data) {
        let fieldsData = data;

        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "process_comments";
        entityForm.entity = "process_comments";
        entityForm.action = "update";
        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
            fieldsData.id = "new";
        }

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    if (fieldsData.id === "" || fieldsData.id === "new") {
                        fieldsData.id = response.data.C_NEW_RECORD_ID;
                    }
                    getComments();
                } else {
                    console.log(response.data.C_MESSAGE);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getHistory() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: processInstanceId,
                    dataKey: "history",
                    serviceKey: "cam.instance.history",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.data.C_STATUS == "SUCCESS" &&
                    response.data.C_DATA.history.length > 0
                ) {
                    let _history = response.data.C_DATA.history;
                    setHistory(_history);
                } else {
                    setHistory([]);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // function getTrackHistory() {
    //     if (!businessKey || businessKey === "" || businessKey === "new") {
    //         return;
    //     }

    //     var dataRequest = {
    //         dataKeys: [
    //             {
    //                 serviceParams: "",
    //                 dataKey: "trackHistory",
    //                 serviceKey: "cam.user.task.history",
    //                 mode: "formData",
    //             },
    //         ],
    //     };
    //     axios
    //         .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
    //         .then(response => {
    //             if (
    //                 response.data.C_STATUS == "SUCCESS" &&
    //                 response.data.C_DATA.trackHistory.length > 0
    //             ) {
    //                 let _trackHistory = response.data.C_DATA.trackHistory;
    //                 setTrackHistory(_trackHistory);
    //             } else {
    //                 setTrackHistory([]);
    //             }
    //         })
    //         .catch(error => {
    //             console.error(error);
    //         });
    // }

    function getComments() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: businessKey + "," + processKey,
                    dataKey: "comments",
                    serviceKey: "cam.process.comments",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.data.C_STATUS == "SUCCESS" &&
                    response.data.C_DATA.comments.length > 0
                ) {
                    let _comments = response.data.C_DATA.comments;
                    setComments(_comments);
                    setCommentMode("list");
                    setAttachmentMode("list");
                } else {
                    setComments([]);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getAttachments() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: businessKey + "," + processKey,
                    dataKey: "attachments",
                    serviceKey: "cam.process.attachment",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.data.C_STATUS == "SUCCESS" &&
                    response.data.C_DATA.attachments.length > 0
                ) {
                    let _attachments = response.data.C_DATA.attachments;
                    setAttachments(_attachments);
                    setAttachmentMode("list");
                } else {
                    setAttachments([]);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // ── Helpers ──────────────────────────────────────
    function getFileIcon(filename = "") {
        const ext = (filename.split(".").pop() || "").toLowerCase();
        if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return { cls: "img-type", icon: "fa-regular fa-image" };
        if (["doc","docx"].includes(ext)) return { cls: "doc-type", icon: "fa-regular fa-file-word" };
        if (["xls","xlsx","csv"].includes(ext)) return { cls: "doc-type", icon: "fa-regular fa-file-excel" };
        return { cls: "", icon: "fa-regular fa-file-pdf" };
    }

    function getHistoryDotClass(h) {
        if (h.task_type === "startEvent") return "created";
        if (h.completed_time && h.completed_time !== "") return "completed";
        if (h.assigned_time && h.assigned_time !== "") return "assigned";
        return "assigned";
    }

    function formatHistoryAction(h) {
        if (h.task_type === "startEvent" && h.created_time)
            return "Process started";
        if (h.completed_time && h.completed_time !== "")
            return `${h.task_name || "Task"} completed`;
        if (h.assigned_time && h.assigned_time !== "")
            return h.assignee
                ? `Assigned to ${getDisplayName(h.assignee)}`
                : `${h.task_name || "Task"} unassigned`;
        if (h.created_time && h.created_time !== "")
            return `${h.task_name || "Task"} created`;
        return h.task_name || "Activity";
    }

    function formatHistoryBy(h) {
        const who = h.assignee ? `by ${getDisplayName(h.assignee)}` : "by System";
        const when = h.completed_time
            ? convertDBDateToUserView(h.completed_time)
            : h.assigned_time
            ? convertDBDateToUserView(h.assigned_time)
            : h.created_time
            ? convertDBDateToUserView(h.created_time)
            : "";
        return { who, when };
    }

    const [quickComment, setQuickComment] = useState("");
    const [showHistoryAll, setShowHistoryAll] = useState(false);
    const visibleHistory = showHistoryAll ? history : history.slice(0, 5);

    function handleQuickComment() {
        if (!quickComment.trim()) return;
        const _comment = {
            id: "new",
            business_key: businessKey,
            process_key: processKey,
            comment: quickComment,
        };
        saveComment(_comment);
        setQuickComment("");
    }

    return (
        <div className="cb-panel">
            <div className="cb-scroll-area">

                {/* ── COMMENTS ──────────────────────────────── */}
                <div className="cb-section">
                    <div className="cb-section-header">
                        <span className="cb-section-title">
                            <i className="fa-regular fa-comments"></i>
                            Comments
                            {comments.length > 0 && (
                                <span className="cb-section-badge">{comments.length}</span>
                            )}
                        </span>
                        {/* <button className="cb-add-btn" onClick={() => addComment()}>
                            <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i>
                            Add Comment
                        </button> */}
                    </div>

                    {/* Rich editor form */}
                    {commentMode === "form" && (
                        <div className="cb-comment-form">
                            <div className="cb-form-actions">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setCommentMode("list")}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => saveComment(comment)}>
                                    Save
                                </button>
                            </div>
                            <TextEditor
                                id="comment"
                                value={comment.comment || ""}
                                onChange={handleComment}
                                mode="BASIC"
                            />
                        </div>
                    )}

                    {/* Comment list */}
                    {comments.length === 0 && commentMode !== "form" ? (
                        <div className="cb-empty">
                            <i className="fa-regular fa-comment-dots"></i>
                            No comments yet
                        </div>
                    ) : (
                        <div className="cb-comment-list">
                            {comments.map((c, i) => (
                                <div className="cb-comment-item" key={i}>
                                    <img
                                        className="cb-comment-avatar"
                                        src={getProfileImage(c.createdby)}
                                        alt={getDisplayName(c.createdby)}
                                        onError={e => { e.target.src = "/theme/images/default-user-profile-img.png"; e.target.onerror = null; }}
                                    />
                                    <div className="cb-comment-body">
                                        <div className="cb-comment-header-row">
                                            <div>
                                                <div className="cb-commenter-name">{getDisplayName(c.createdby)}</div>
                                            </div>
                                            <span className="cb-comment-time" title={convertDBDateToUserView(c.datecreated)}>
                                                {convertDBDateToFromNow(c.datecreated)}
                                            </span>
                                        </div>
                                        <div className="cb-comment-text">
                                            <Interweave content={c.comment} />
                                        </div>                                        
                                        {/* <div className="cb-comment-actions-row">
                                            <button className="cb-reply-link">Reply</button>
                                        </div> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick comment input */}
                    {commentMode === "list" && (
                        <div className="cb-quick-input-row">
                            <input
                                className="cb-quick-input"
                                placeholder="Write a comment…"
                                value={quickComment}
                                onChange={e => setQuickComment(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuickComment(); } }}
                            />
                            <button
                                className="cb-send-btn"
                                onClick={handleQuickComment}
                                title="Send comment"
                                aria-label="Send comment">
                                <i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }}></i>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── ATTACHMENTS ───────────────────────────── */}
                <div className="cb-section">
                    <div className="cb-section-header">
                        <span className="cb-section-title">
                            <i className="fa-solid fa-paperclip"></i>
                            Attachments
                            {attachments.length > 0 && (
                                <span className="cb-section-badge">{attachments.length}</span>
                            )}
                        </span>
                        <button
                            className="cb-action-btn"
                            onClick={() => addAttachment()}>
                            <i className="fa-solid fa-upload" style={{ fontSize: 11 }}></i>
                            Upload
                        </button>
                    </div>

                    {/* Upload form */}
                    {attachmentMode === "form" && (
                        <div className="cb-comment-form">
                            <div className="cb-form-actions">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setAttachmentMode("list")}>
                                    Cancel
                                </button>
                            </div>
                            <UploadFile
                                item={attachment}
                                entity={"process_attachments"}
                                record_id={businessKey}
                                field_id="files"
                                getData={getAttachments}
                            />
                        </div>
                    )}

                    {attachments.length === 0 && attachmentMode !== "form" ? (
                        <div className="cb-empty">
                            <i className="fa-regular fa-folder-open"></i>
                            No attachments
                        </div>
                    ) : (
                        <div className="cb-attachment-list">
                            {attachments.map((att, i) => {
                                const { cls, icon } = getFileIcon(att.files || "");
                                return (
                                    <div className="cb-attachment-item" key={i}>
                                        <div className={`cb-file-icon ${cls}`}>
                                            <i className={icon}></i>
                                        </div>
                                        <div className="cb-file-info">
                                            <div className="cb-file-name">{att.files}</div>
                                            <div className="cb-file-meta">
                                                Uploaded {convertDBDateToFromNow(att.datecreated)}
                                                {att.createdby ? ` · ${getDisplayName(att.createdby)}` : ""}
                                            </div>
                                        </div>
                                        <div className="cb-file-actions">
                                            <a
                                                className="cb-icon-btn"
                                                href={`/file/service/process_attachments/${att.id}/${att.files}`}
                                                title="Download"
                                                aria-label="Download">
                                                <i className="fa-solid fa-download" style={{ fontSize: 12 }}></i>
                                            </a>
                                            <button className="cb-icon-btn" title="More options" aria-label="More options">
                                                <i className="fa-solid fa-ellipsis-vertical" style={{ fontSize: 12 }}></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── TASK HISTORY ──────────────────────────── */}
                <div className="cb-section">
                    <div className="cb-section-header">
                        <span className="cb-section-title">
                            <i className="fa-regular fa-clock"></i>
                            Task History
                            {history.length > 0 && (
                                <span className="cb-section-badge">{history.length}</span>
                            )}
                        </span>
                        {history.length > 5 && (
                            <button className="cb-view-all" onClick={() => setShowHistoryAll(v => !v)}>
                                {showHistoryAll ? "Show Less" : "View All"}
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="cb-empty">
                            <i className="fa-regular fa-calendar-xmark"></i>
                            No history yet
                        </div>
                    ) : (
                        <div className="cb-history-list">
                            {visibleHistory.map((h, i) => {
                                const dotCls = getHistoryDotClass(h);
                                const { who, when } = formatHistoryBy(h);
                                return (
                                    <div className="cb-history-item" key={i}>
                                        <div className={`cb-history-dot ${dotCls}`}></div>
                                        <div className="cb-history-content">
                                            <div className="cb-history-action">{formatHistoryAction(h)}</div>
                                            <div className="cb-history-by">{who}</div>
                                        </div>
                                        <div className="cb-history-date">{when}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// function HistoryViewer({ task, tabs }) {
//     return <div>History Viewer is under development</div>;
// }

function HistoryViewer({
    taskHistory,
    tabs,
    convertDBDateToUserView,
    getProfileImage,
    getDisplayName,
}) {
    function formatHistory(task) {
        let status = "In Progress";
        if (task.completed_time && task.completed_time !== "") {
            status = `${task.assignee} has completed ${
                task.task_name
            } on ${convertDBDateToUserView(task.completed_time)}.`;
        } else if (task.assigned_time && task.assigned_time !== "" && task?.assignee) {
            status = `${task.task_name} task assigned to ${task.assignee} on ${convertDBDateToUserView(task.assigned_time)}.`;
        } else if (task.assigned_time && task.assigned_time !== "" && !task?.assignee) {
            status = `${task.task_name} task is unassigned.`;
        }else if (task.task_type == "startEvent" && task.created_time !== "") {
            status = `Process started by ${task.assignee} on ${convertDBDateToUserView(task.created_time)}.`;
        } else if (task.created_time && task.created_time !== "") {
            status = `Task ${
                task.task_name
            } created on ${convertDBDateToUserView(task.created_time)}.`;
        }
        return status;
    }

    return (
        <div className="comment-list mt-2">
            {taskHistory &&
                taskHistory.length !== undefined &&
                taskHistory.map((history, index) => {
                    return (
                        <ol className="comment-list">
                            <li
                                className="comment-item"
                                key={index}
                                // title={JSON.stringify(
                                //     comment
                                // )}
                            >
                                <div className="col-sm-12 p-3 task-meta d-flex">
                                    <span className="avatar me-2">
                                        <img
                                            className="image-styling-navbar dropdown"
                                            src={getProfileImage(
                                                history.assignee,
                                            )}
                                            alt="image"
                                            title={getDisplayName(
                                                history.assignee,
                                            )}></img>
                                    </span>
                                    <span>{formatHistory(history)}</span>
                                    {/* {JSON.stringify(history)} */}
                                </div>
                            </li>
                        </ol>
                    );
                })}
        </div>
    );
}

function TrackHistoryViewer({ trackHistory, tabs, convertDBDateToUserView }) {
    function formatHistory(task) {
        let status = "";
        if (task.created_time && task.created_time !== "") {
            if (task.event == "start")
                status = `${
                    task.task_name
                } started on ${convertDBDateToUserView(task.created_time)} by ${task.assignee}.`;
        } else if (task.event == "end") {
            status = `${
                task.task_name
            } started on ${convertDBDateToUserView(task.created_time)}`;
        }
        return status;
    }

    return (
        <div className="history-list mt-2">
            {trackHistory &&
                trackHistory.length !== undefined &&
                trackHistory.map((history, index) => {
                    return (
                        <div className="row">
                            <div className="col-sm-12 history-item">
                                {formatHistory(history)}
                                {/* {JSON.stringify(history)} */}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}

function HistoryViewerOld({ task, tabs }) {
    const [taskHistory, setTaskHistory] = useState([]);

    useEffect(() => {
        if (tabs.history) {
            if (!isEmpty(task)) {
                getUserHistory(task);
            }
        }
    }, [task]);

    function showDateBadge(el, index) {
        let show = false;
        let currentStamp = "";
        let prevStamp = "";

        if (index === 0) {
            show = true;
        } else if (index > 0) {
            try {
                currentStamp = el.timestamp.split("T")[0];
                prevStamp = taskHistory
                    ? taskHistory[index - 1].timestamp.split("T")[0]
                    : "0";

                if (currentStamp !== prevStamp) {
                    show = true;
                }
            } catch (error) {
                console.error(error);
            }
        }

        return show;
    }

    function formatDateBadge(date) {
        let newDate;

        try {
            newDate = moment(date, moment.ISO_8601).format("DD \n MMM \n YYYY");
        } catch (error) {
            console.log(
                "Unable to format date time for formatDateBadge : " + error,
            );
        }

        return newDate;
    }

    function formatToTime(date) {
        let newDate;

        try {
            newDate = moment(date, moment.ISO_8601).format("HH:mm");
        } catch (error) {
            console.log(
                "Unable to format date time for formatDateBadge : " + error,
            );
        }

        return newDate;
    }

    function styleCamelCasing(property = "") {
        let styledProperty = property;

        styledProperty = styledProperty.replace(/([A-Z])/g, " $1");
        styledProperty =
            styledProperty.charAt(0).toUpperCase() + styledProperty.slice(1);

        return styledProperty;
    }

    function formatNewValue(value = "", property) {
        let newValue = "";

        if (property === "followUpDate" || property === "dueDate") {
            if (value) {
                var date = new Date(parseInt(value));

                try {
                    newValue = moment(date, moment.ISO_8601).format(
                        "DD MMM, YYYY hh:mm A",
                    );
                } catch (error) {
                    console.log(
                        "Unable to format date time for formatNewValue : " +
                            error,
                    );
                }
            }
        }

        return newValue;
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    // api calls

    function getUserHistory(task) {
        const req1 = {
            method: "GET",
            path: `/history/user-operation?taskId=${task.id}&sortBy=timestamp&sortOrder=desc`,
            data: {},
        };
        const dataKeys = [];
        dataKeys.push({ key: "task", request: req1 });
        const dataRequest = { dataKeys: dataKeys };

        axios
            .post(BPM_API_URL + "?service.key=bpm.multiKey.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    const userOperations = response.data.task.data;
                    setTaskHistory(userOperations);
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    return (
        <>
            {taskHistory &&
                taskHistory.length !== undefined &&
                taskHistory.map((el, index) => {
                    return (
                        <div className="row">
                            <div className="col-sm-3">
                                {showDateBadge(el, index) && (
                                    <div className="date-badge">
                                        {formatDateBadge(el.timestamp)}
                                    </div>
                                )}
                            </div>
                            <div className="col-sm-9 margin-all">
                                <div className="row history-divider">
                                    <div className="col-sm-2 bottom-line-time">
                                        <div className="history-time">
                                            {formatToTime(el.timestamp)}
                                        </div>
                                        <div className="history-user-id">
                                            {el.userId}
                                        </div>
                                    </div>
                                    <div className="col-sm-10 bottom-line-action">
                                        <div className="row">
                                            <div className="col-sm-12">
                                                <div className="history-operation">
                                                    {styleCamelCasing(
                                                        el.operationType,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-12 history-date-value-left ">
                                                <div className="history-property">
                                                    {styleCamelCasing(
                                                        el.property,
                                                    )}{" "}
                                                </div>
                                            </div>
                                            <div className="col-sm-12 history-date-value-right ">
                                                <div className="history-new-value">
                                                    {formatNewValue(
                                                        el.newValue,
                                                        el.property,
                                                    )}
                                                </div>
                                                <div className="history-old-value">
                                                    {formatNewValue(
                                                        el.orgValue,
                                                        el.property,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
        </>
    );
}

export { CommentBox };

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

    return (
        <React.Fragment>
            {/* <div className="col-sm-12 process-task-title">
                <span className="col-sm-6 text-nowrap">Communication Log</span>
            </div> */}
            {/* {JSON.stringify(tabs)  } */}
            <div
                id="comment-box"
                className="comment-box col-sm-12 mb-2">
                <ul
                    className="nav nav-tabs"
                    id="commentbox-nav-tab"
                    role="tablist">
                    <li
                        className={`task-tab nav-link ${tabs.comments ? "active" : ""}`}
                        name="comments"
                        data-bs-toggle="tab"
                        data-bs-target="#comments"
                        onClick={event => handleTabsChange("comments")}
                        role="presentation">
                        <span
                            className="fa fa-comments"
                            aria-hidden="true"></span>
                        {comments.length > 0 && (
                            <span className="badge text-bg-secondary mx-1">
                                {comments.length}
                            </span>
                        )}
                    </li>
                    <li
                        className={`task-tab nav-link ${tabs.attachments ? "active" : ""}`}
                        name="attachments"
                        data-bs-toggle="tab"
                        data-bs-target="#attachments"
                        onClick={event => handleTabsChange("attachments")}
                        role="presentation">
                        <i
                            className="fa fa-paperclip"
                            aria-hidden="true"></i>
                        {attachments.length > 0 && (
                            <span className="badge text-bg-secondary mx-1">
                                {attachments.length}
                            </span>
                        )}
                    </li>
                    <li
                        className={`task-tab nav-link ${tabs.history ? "active" : ""}`}
                        name="history"
                        data-bs-toggle="tab"
                        data-bs-target="#task-history"
                        onClick={event => handleTabsChange("history")}
                        role="presentation">
                        <i
                            className="fa fa-history"
                            aria-hidden="true"></i>
                        {history.length > 0 && (
                            <span className="badge text-bg-secondary mx-1">
                                {history.length}
                            </span>
                        )}
                    </li>
                    {/* <li
                        className="nav-item"
                        role="presentation">
                        <button
                            className="nav-link"
                            name="trackHistory"
                            data-bs-toggle="tab"
                            data-bs-target="#trackHistory"
                            type="button"
                            onClick={event => handleTabsChange(event)}>
                            <i
                                className="fa fa-check-circle"
                                aria-hidden="true"></i>{trackHistory.length > 0 && (
                                <span className="badge text-bg-secondary mx-1">
                                    {trackHistory.length}
                                </span>
                            )}
                        </button>
                    </li> */}
                </ul>
                <div className="">
                    {tabs.comments && (
                        <div
                            className="tab-pane fade show active"
                            id="comments">
                            <div className="process-task-title d-flex">
                                <span className="mt-2">Process Comments </span>
                                <div className="d-flex justify-content-end">
                                    <button
                                        className="btn button-theme btn-sm mx-2"
                                        onClick={() => addComment()}>
                                        <span
                                            className="fa fa-comments"
                                            aria-hidden="true"></span>{" "}
                                        Add
                                    </button>
                                </div>
                            </div>
                            {commentMode === "list" && (
                                <div className="col-sm-12">
                                    <div className="mt-1 comment-content">
                                        {comments &&
                                            comments.length > 0 &&
                                            comments.map((comment, index) => {
                                                return (
                                                    <ol className="comment-list">
                                                        <li
                                                            className="comment-item"
                                                            key={index}
                                                            // title={JSON.stringify(
                                                            //     comment
                                                            // )}
                                                        >
                                                            <div className="col-sm-12">
                                                                <div className="comment-details">
                                                                    <Interweave
                                                                        content={
                                                                            comment.comment
                                                                        }></Interweave>
                                                                </div>

                                                                <div className="task-comment-stamp">
                                                                    <span className="avatar">
                                                                        <img
                                                                            className="image-styling-navbar dropdown"
                                                                            src={getProfileImage(
                                                                                comment.createdby,
                                                                            )}
                                                                            alt="image"
                                                                            title={getDisplayName(
                                                                                comment.createdby,
                                                                            )}></img>
                                                                    </span>
                                                                    <span
                                                                        className="mt-3"
                                                                        title={convertDBDateToUserView(
                                                                            comment.datecreated,
                                                                        )}>
                                                                        {
                                                                            "Commented "
                                                                        }
                                                                        {convertDBDateToFromNow(
                                                                            comment.datecreated,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    </ol>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                            {commentMode === "form" && (
                                <form>
                                    <div className="my-2 d-flex justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-sm button-theme"
                                            onClick={() =>
                                                saveComment(comment)
                                            }>
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm button-theme mx-2"
                                            onClick={() =>
                                                setCommentMode("list")
                                            }>
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="row">
                                        <div className="form-outline mb-2">
                                            <TextEditor
                                                id="comment"
                                                value={comment.comment || ""}
                                                // height="220px"
                                                onChange={handleComment}
                                                mode="BASIC"
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                    {tabs.attachments && (
                        <div
                            className="tab-pane fade show active"
                            id="attachments">
                            <div className="process-task-title d-flex">
                                <span className="mt-2">
                                    Process Attachments{" "}
                                </span>
                                <div className="d-flex justify-content-end">
                                    <button
                                        className="btn button-theme btn-sm mx-2"
                                        onClick={() => addAttachment()}>
                                        <i
                                            className="fa fa-paperclip"
                                            aria-hidden="true"></i>{" "}
                                        Add
                                    </button>
                                </div>
                            </div>
                            {attachmentMode === "list" && (
                                <div className="col-sm-12">
                                    <div className="attachment-content mt-1">
                                        {attachments &&
                                            attachments.length > 0 &&
                                            attachments.map(
                                                (attachment, index) => {
                                                    return (
                                                        <ol className="comment-list">
                                                            {
                                                                <li
                                                                    className="attachment-item"
                                                                    key={index}>
                                                                    <div className="col-sm-12 attachment-details">
                                                                        <div className="col-sm-12 mb-2">
                                                                            <a
                                                                                href={`/file/service/process_attachments/${attachment.id}/${attachment.files}`}>
                                                                                {
                                                                                    attachment.files
                                                                                }
                                                                            </a>
                                                                        </div>
                                                                        <div className="col-sm-12 task-comment-stamp">
                                                                            <span className="avatar">
                                                                                <img
                                                                                    className="image-styling-navbar dropdown"
                                                                                    src={getProfileImage(
                                                                                        attachment.createdby,
                                                                                    )}
                                                                                    alt="image"
                                                                                    title={getDisplayName(
                                                                                        attachment.createdby,
                                                                                    )}></img>
                                                                            </span>
                                                                            <span
                                                                                className="mt-3"
                                                                                title={convertDBDateToUserView(
                                                                                    attachment.datecreated,
                                                                                )}>
                                                                                {
                                                                                    "Uploaded "
                                                                                }
                                                                                {convertDBDateToFromNow(
                                                                                    attachment.datecreated,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            }
                                                        </ol>
                                                    );
                                                },
                                            )}
                                    </div>
                                </div>
                            )}
                            {attachmentMode === "form" && (
                                <form>
                                    <div className="my-2 d-flex justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-sm button-theme mx-2"
                                            onClick={() =>
                                                setAttachmentMode("list")
                                            }>
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="row">
                                        <UploadFile
                                            item={attachment}
                                            entity={"process_attachments"}
                                            record_id={businessKey}
                                            field_id="files"
                                            getData={getAttachments}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                    {tabs?.history && (
                        <div
                            className="tab-pane"
                            id="task-history">
                            <div className="process-task-title">
                                Process History
                            </div>
                            <HistoryViewer
                                taskHistory={history}
                                tabs={tabs}
                                convertDBDateToUserView={
                                    convertDBDateToUserView
                                }
                                getProfileImage={getProfileImage}
                                getDisplayName={getDisplayName}
                            />
                        </div>
                    )}
                    {tabs.trackHistory && (
                        <div
                            className="tab-pane container"
                            id="trackHistory">
                            <TrackHistoryViewer
                                trackHistory={trackHistory}
                                tabs={tabs}
                                convertDBDateToUserView={
                                    convertDBDateToUserView
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
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

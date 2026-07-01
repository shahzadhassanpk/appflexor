import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Modal, Spinner } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import { API_URL, BPM_API_URL } from "../../../../../../Config";
import DropBoxPropsEditor from "../../props-editor/DropBoxPropsEditor";
import { eventBus } from "../../../../../../eventBus";
import { useContext } from "react";
import { AppContext } from "../../../../../../../AppContext";
import {
    evaluateExpression,
    evaluateExpressionDefault,
} from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

export default function DropBox(props) {
    const [files, setFiles] = useState([]);
    const [componentData, setComponentData] = useState({});
    const [form, setForm] = useState({ name: "" });
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const dropRef = useRef();
    const [show, setShow] = useState(false);
    const appContext = useContext(AppContext);
    const tenantId = appContext.tenantSubscription.tenant_id;

    const authKey = localStorage.getItem("AUTH_KEY");
    const WEB_SOCKET_URL = `wss://${window.location.hostname}/consume?auth_key=${authKey}`;

    const topics = [{ topic: "drop-box" }];
    const subscription = { topics, groupId: "drop-box" };

    const expressionProps = useGlobalData();

    // Reconnect settings
    const RECONNECT_DELAY = 5000; // 5 seconds
    let reconnectAttempts = 0;

    // function subscribeEvents() {
    //     try {
    //         const socket = new WebSocket(WEB_SOCKET_URL);

    //         socket.onopen = () => {
    //             console.log("✅ Connected to WebSocket server");
    //             reconnectAttempts = 0;

    //             // Send subscription after short delay
    //             setTimeout(() => {
    //                 socket.send(
    //                     JSON.stringify({ action: "subscribe", subscription }),
    //                 );
    //                 console.log("✅ Subscribed for topics:", topics);
    //             }, 600);
    //         };

    //         socket.onmessage = event => {
    //             try {
    //                 const _data = JSON.parse(event.data);
    //                 const payload = JSON.parse(_data.value);
    //                 console.log("📨 Processing topic:", _data.topic);
    //                 console.log("📨 Message:", _data);
    //             } catch (err) {
    //                 console.error(
    //                     "❌ Failed to process incoming message:",
    //                     err.message,
    //                 );
    //             }
    //         };

    //         socket.onerror = event => {
    //             subscribeEvents();
    //             console.error("❌ WebSocket error:", event);
    //         };

    //         socket.onclose = () => {
    //             console.log("🔌 WebSocket closed — reconnecting...");
    //             setTimeout(
    //                 subscribeEvents,
    //                 RECONNECT_DELAY * Math.min(++reconnectAttempts, 6),
    //             );
    //         };
    //     } catch (err) {
    //         console.error("❌ Connection setup failed:", err.message);
    //         setTimeout(
    //             subscribeEvents,
    //             RECONNECT_DELAY * Math.min(++reconnectAttempts, 6),
    //         );
    //     }
    // }
    // useEffect(() => {
    //     subscribeEvents();
    // }, []);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.formData, props.component.data]);

    useEffect(() => {
        if (componentData && !isEmpty(componentData)) {
            let str = componentData.value;
            let _obj = tryParseJSONObject(str, { id: "", name: "" });
            setForm(_obj);
            // ✅ set max file size from componentData if available
            const maxSize =
                componentData.max_file_size ||
                _obj.max_file_size ||
                componentData?.data?.max_file_size ||
                0;
            setComponentData(prev => ({ ...prev, max_file_size: maxSize }));
        }
    }, [componentData.value]);

    function isEmpty(obj) {
        for (var prop in obj) if (obj.hasOwnProperty(prop)) return false;
        return true;
    }

    // helper: convert File to base64
    const toBase64 = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });

    async function handleFiles(selectedFiles) {
        const fileArray = Array.from(selectedFiles);
        const maxMB = componentData?.max_file_size
            ? Number(componentData.max_file_size)
            : 0;

        const validFiles = [];
        const rejectedFiles = [];

        for (const f of fileArray) {
            const sizeMB = f.size / (1024 * 1024);
            if (maxMB > 0 && sizeMB > maxMB) {
                rejectedFiles.push(`${f.name} (${sizeMB.toFixed(2)} MB)`);
                continue;
            }
            const base64 = await toBase64(f);
            validFiles.push({
                id: Date.now() + Math.random(),
                file: f,
                name: f.name,
                size: f.size,
                type: f.type,
                content: base64,
            });
        }

        if (rejectedFiles.length > 0) {
            alert(
                `❌ The following files exceed the max size limit (${maxMB} MB):\n` +
                    rejectedFiles.join("\n"),
            );
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    }

    // const handleFiles = (selectedFiles) => {
    //     const newFiles = Array.from(selectedFiles).map((file) => ({
    //         id: Date.now() + Math.random(),
    //         file,
    //         name: file.name,
    //         size: file.size,
    //         type: file.type,
    //         url: URL.createObjectURL(file),
    //     }));
    //     setFiles((prev) => [...prev, ...newFiles]);
    // };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
        dropRef.current.classList.remove("border-primary");
    };

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current.classList.add("border-primary");
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current.classList.remove("border-primary");
    };

    const handleFileInput = e => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = id => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id);
            prev.forEach(f => {
                if (f.id === id) URL.revokeObjectURL(f.url);
            });
            return updated;
        });
    };
    // api calls bpm-service
    function startProcessInstance(process_key, businessKey, taskVariables) {
        let path = "";

        if (tenantId === "") {
            path = `/process-definition/key/${process_key}/start`;
        } else {
            path = `/process-definition/key/${process_key}/tenant-id/${tenantId}/start`;
        }
        let variables = taskVariables ? { ...taskVariables } : {};
        variables["requestor"] = {
            value: appContext?.profile?.username,
            type: "string",
        };

        const dataRequest = {
            path,
            method: "POST",
            data: {
                // businessKey: "test",
                businessKey: businessKey,
                variables: variables,
            },
        };
        return new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                    } else {
                        resolve("FAILED");
                    }
                })
                .catch(err => {
                    reject(err);
                    console.error(err);
                });
        });
    }
    // 🚀 Upload function
    const uploadDocuments = async () => {
        if (files.length === 0) {
            alert("Please select files first.");
            return;
        }

        try {
            setUploading(true); // show loader
            setUploadResult(null);
            await saveData(files, form);
            setFiles([]); // clear after upload
            setMessage("Files uploaded successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading files. Please try again.");
        } finally {
            setUploading(false); // hide loader
        }
    };
    async function saveData(fileArray, form) {
        if (!form || !form.entity || form.entity === "") {
            alert("Please select a valid form in the properties.");
            return;
        }

        const url = `${API_URL}?service.key=update.formData`;
        const data = {};

        const meta = Object.fromEntries(            
            form.meta.map(m => [m.db_column, (m?.isExpression === "YES" ? evaluateExpressionDefault(
                                        { expression: m.default_value },
                                        data,
                                        props.dataKeys,
                                        ...expressionProps,
                                    ):m.default_value)]),
        );
        const db_column = form.db_column || "attachments";
        const toBase64 = file =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = reject;
            });

        // 🔹 Prepare all upload promises
        const uploadPromises = fileArray.map(async f => {
            const base64 = await toBase64(f.file);
            const fileData = [
                {
                    fileName: f.name,
                    content: base64, // already base64
                },
            ];

            const record = {
                formId: form.entity,
                entity: form.entity,
                action: "update",
                id: "new",
                formData: {
                    id: "new",
                    ...meta,
                    [db_column]: f.name,
                },
                fileData: fileData,
            };

            try {
                // 🚀 Send each file request in parallel
                const response = await axios.post(url, { data: [record] });
                eventBus.emit("update", form.entity);
                if (response.status !== 200) throw new Error("Upload failed");

                // ✅ Trigger process (if configured)
                if (
                    form.run_process &&
                    form.process_def_key &&
                    form.process_def_key !== ""
                ) {
                    const processPromises = response.data.C_DATA.map(
                        async d => {
                            const businessKey = d.formData.id;
                            const formVariables = {};
                            formVariables[form.db_column] = {
                                type: "String",
                                value: d.formData[form.db_column],
                            };
                            await startProcessInstance(
                                form.process_def_key,
                                businessKey,
                                formVariables,
                            );
                            // eventBus.emit("update", form.entity);
                        },
                    );
                    await Promise.all(processPromises);
                }
                eventBus.emit("update", form.entity);
                return { file: f.name, status: "success" };
            } catch (err) {
                console.error(`❌ Upload failed for ${f.name}:`, err);
                return { file: f.name, status: "error", error: err.message };
            }
        });

        // 🧩 Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        eventBus.emit("update", form.entity);
        // 🔔 Optional summary
        const failed = results.filter(r => r.status === "error");
        if (failed.length > 0) {
            alert(
                `Some uploads failed:\n${failed.map(f => f.file).join("\n")}`,
            );
        }

        return results;
    }

    return (
        <ErrorBoundary>
            {/* 🔄 Fullscreen Loader Overlay */}
            {uploading && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
                    style={{ zIndex: 2000 }}>
                    <div className="text-center text-white">
                        <Spinner
                            animation="border"
                            role="status"
                        />
                        <div className="mt-2">
                            Uploading files, please wait...
                        </div>
                    </div>
                </div>
            )}

            {/* Design / Readonly Mode */}
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.design ||
                    props.mode === props.modeType.readonly) && (
                    <div
                        onClick={() => setShow(true)}
                        style={{ minHeight: "100px" }}
                        className="align-items-center justify-content-center d-flex flex-column cursor-pointer">
                        <span className="text-muted cursor-pointer d-flex align-items-center justify-content-center">
                            <span className="fa-solid fa-calendar icon-space"></span>
                            DropBox{" "}
                            <span className="text-danger ps-2">{componentData?.title || form.name}</span>                            
                        </span>
                        <span className="text-muted cursor-pointer">{componentData?.tag_line}</span>
                    </div>
                )}

            {/* Preview / Render Mode */}
            {(props.mode === props.modeType.preview ||
                props.mode === props.modeType.render) && (
                <div className="container drop-box mt-3">
                    <div className="row">
                        <div className="col-sm-12">
                            {files.length > 0 && (
                                <div className="m-3 text-center">
                                    <button
                                        className="btn btn-primary"
                                        onClick={uploadDocuments}
                                        disabled={uploading}>
                                        {uploading
                                            ? "Uploading..."
                                            : "Upload Documents"}
                                    </button>
                                </div>
                            )}
                            <div
                                ref={dropRef}
                                className="file-container border border-2 border-dashed text-center rounded bg-light"
                                style={{ cursor: "pointer" }}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() =>
                                    document.getElementById("fileInput").click()
                                }>
                                <input
                                    id="fileInput"
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={handleFileInput}
                                />
                                <p className="text-muted mb-0">
                                    Drag & drop {componentData?.title || form.name} here, or{" "}
                                    <span className="text-primary">
                                        click to upload
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Uploaded Files Display */}
                        <div className="col-sm-12 d-flex align-items-center justify-content-center">
                            {files.length > 0 ? (
                                <div className="mt-2">
                                    <h6>Selected Files</h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        {files.map(f => (
                                            <div
                                                key={f.id}
                                                className="position-relative border rounded p-2 text-center bg-white shadow-sm"
                                                style={{ width: 120 }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1 p-0 px-1"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        removeFile(f.id);
                                                    }}
                                                    title="Remove">
                                                    ×
                                                </button>

                                                {f.type.startsWith("image/") ? (
                                                    <img
                                                        src={f.content}
                                                        alt={f.name}
                                                        className="img-fluid rounded mb-2"
                                                        style={{
                                                            maxHeight: 80,
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-secondary mb-2"
                                                        style={{
                                                            maxWidth: 80,
                                                            textOverflow:
                                                                "ellipsis",
                                                            overflow: "hidden",
                                                            whiteSpace:
                                                                "nowrap",
                                                            margin: "0 auto",
                                                            fontSize: "2rem",
                                                        }}>
                                                        📄
                                                    </div>
                                                )}

                                                <div
                                                    style={{
                                                        color: "gray",
                                                        fontSize: "0.8rem",
                                                        wordBreak: "break-all",
                                                    }}>
                                                    {f.name}
                                                </div>
                                                {/* <a
                                                    href={f.url}
                                                    download={f.name}
                                                    className="small text-decoration-none text-primary">
                                                    Download
                                                </a> */}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted mt-4">
                                    <em>{message}</em>
                                </div>
                            )}
                        </div>
                    </div>

                    {uploadResult && (
                        <div className="alert alert-success mt-3">
                            <strong>Server Response:</strong>{" "}
                            {JSON.stringify(uploadResult)}
                        </div>
                    )}
                </div>
            )}

            {/* Properties Modal */}
            <Modal
                show={show}
                onHide={() => setShow(false)}
                keyboard={true}
                animation={true}
                size="lg">
                <Modal.Header>
                    <Modal.Title>Edit Dashboard</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DropBoxPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { Modal, Spinner } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import { API_URL, BPM_API_URL } from "../../../../../../Config";
import DropBoxPropsEditor from "../../props-editor/DropBoxPropsEditor";
import { eventBus } from "../../../../../../eventBus";
import { AppContext } from "../../../../../../../AppContext";

export default function DropBox(props) {
  const [files, setFiles] = useState([]);
  const [componentData, setComponentData] = useState({});
  const [form, setForm] = useState({ name: "" });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [show, setShow] = useState(false);
  const dropRef = useRef();
  const appContext = useContext(AppContext);
  const tenantId = appContext.tenantSubscription?.tenant_id || "";

  useEffect(() => {
    if (props.component?.data) setComponentData(props.component.data);
  }, [props.formData, props.component?.data]);

  useEffect(() => {
    if (componentData && componentData.value) {
      let str = componentData.value;
      let _obj = tryParseJSONObject(str, { id: "", name: "" });
      setForm(_obj);
    }
  }, [componentData.value]);

  const handleFiles = e => {
    const selectedFiles = Array.from(e.target.files || e.dataTransfer.files);
    if (selectedFiles.length > 0) setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = index => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async () => {
    if (files.length === 0) return alert("Please select files first.");

    setUploading(true);
    const formData = new FormData();

    files.forEach(file => {
      formData.append("files", file);
    });

    formData.append("formId", form.entity);
    formData.append("entity", form.entity);
    formData.append("action", "update");
    formData.append("id", "new");

    try {
      const response = await axios.post(`${API_URL}?service.key=upload.attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setMessage("✅ Files uploaded successfully!");
        setFiles([]);
        eventBus.emit("update", form.entity);
      } else {
        alert("❌ Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ErrorBoundary>
      {uploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 2000 }}>
          <div className="text-center text-white">
            <Spinner animation="border" role="status" />
            <div className="mt-2">Uploading files, please wait...</div>
          </div>
        </div>
      )}

      {props.mode === props.modeType.design || props.mode === props.modeType.readonly ? (
        <div
          onClick={() => setShow(true)}
          style={{ minHeight: "100px" }}
          className="d-flex align-items-center justify-content-center"
        >
          <span className="text-muted cursor-pointer">
            <span className="fa-solid fa-upload icon-space"></span>
            DropBox <span className="text-danger">{form.name}</span>
          </span>
        </div>
      ) : (
        <div className="container mt-3">
          <div className="text-center border p-4 rounded bg-light" ref={dropRef}>
            <input type="file" multiple hidden id="fileInput" onChange={handleFiles} />
            <p className="text-muted mb-0">
              Drag & drop files or <span className="text-primary" onClick={() => document.getElementById("fileInput").click()}>browse</span>
            </p>
          </div>

          {files.length > 0 && (
            <div className="text-center mt-3">
              <button className="btn btn-primary" onClick={uploadDocuments} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Documents"}
              </button>
              <div className="mt-3">
                {files.map((file, index) => (
                  <div key={index} className="d-flex justify-content-between border rounded p-2 mb-2 bg-white">
                    <span>{file.name}</span>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeFile(index)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && <div className="alert alert-success mt-3 text-center">{message}</div>}
        </div>
      )}

      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit DropBox</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DropBoxPropsEditor setShow={setShow} />
        </Modal.Body>
      </Modal>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css"; // ensure bootstrap CSS is imported
import FileUploader from "../components/FileUploader";

export const EmailForm = ({ appContext}) => {
  const [emails, setEmails] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null); // track id
  const [isSending, setIsSending] = useState(false);

  const API_URL = "/app/service";
  const AUTH_KEY = appContext.authKey ? appContext.authKey : localStorage.getItem("AUTH_KEY");
  const tenantId = appContext?.tenantSubscription?.tenant_id || "";
  // const filesToSend = [selectedFile]; 
  // Add new state for reply attachments
  const [replyFiles, setReplyFiles] = useState([]);
  
  
  
  
  
  useEffect(() => {
    getEmails();
  }, []);
  
  useEffect(() => {
    setSelectedEmailId(emails[selectedEmailIndex]?.id || null); // save email id
  }, [selectedEmailIndex]);
  
  const handleReplyChange = (value) => {
    if (selectedEmailIndex === null) return;
    const updated = [...emails];
    updated[selectedEmailIndex].reply = value;
    setEmails(updated);
  };
  
  const sendEmailWithAttachments = async (email) => {
    try {
      const formData = new FormData();
      
      // Add regular fields
      formData.append("from", email.from);
      formData.append("to", email.to);
      formData.append("subject", email.subject);
      formData.append("reply", email.reply);
      formData.append("id", email.id);
      formData.append("datasource", tenantId);
      
      replyFiles.forEach((file, index) => {
        formData.append(`attachment_${index}`, file, file.name);
      });
      // Post to N8N webhook
      const response = await axios.post(
        "https://n8n.step2agility.com/webhook-test/reply-email",
        formData,
      );
      
      if (response.status === 200) {
        // Optionally show a success message or update UI
        setSelectedEmailIndex(null);
        
        getEmails(); // Refresh email list after sending reply
        alert("Reply sent successfully!");
      }
    } catch (err) {
      console.error("Error sending email with attachments:", err);
    }
  };
  
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    // Merge with previously selected files
    setReplyFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };
  
  
  
const handleSendReply = async () => {
  if (selectedEmailIndex === null) return;

  const email = emails[selectedEmailIndex];

  // Don't send if reply is empty
  if (!email.reply || email.reply.trim() === "") return;

  try {
    setIsSending(true); // show loader

    await sendEmailWithAttachments(email);

  } finally {
    setIsSending(false); // hide loader
  }
};

  
  function getEmailHistory(id) {
    const dataRequest = {
      dataKeys: [
        {
          serviceParams: id,
          dataKey: "emailHistory",
          serviceKey: "sys.email.history",
          mode: "formData",
        },
      ],
    };
    const headers = {
      AUTH_KEY,
      "Content-Type": "application/json",
    };
    
    axios
    .post(API_URL + "?service.key=masterKey.tenantData", dataRequest, { headers })
    .then((response) => {
      if (response.status === 200 && response.data.C_STATUS === "SUCCESS") {
        const data = response.data.C_DATA;
        setEmailHistory(data.emailHistory || []);
      } else {
        setEmailHistory([]);
      }
    })
    .catch(() => setEmailHistory([]));
  }
  
  
  function getEmails() {
    const dataRequest = {
      dataKeys: [
        {
          serviceParams: "",
          dataKey: "emails",
          serviceKey: "sys.tenant.emails",
          mode: "formData",
        },
      ],
    };
    
    const headers = {
      AUTH_KEY,
      "Content-Type": "application/json",
    };
    
    axios
    .post(API_URL + "?service.key=masterKey.tenantData", dataRequest, { headers })
    .then((response) => {
      if (response.status === 200 && response.data.C_STATUS === "SUCCESS") {
        const data = response.data.C_DATA;
        setEmails(data.emails || []);
      } else {
        setEmails([]);
      }
    })
    .catch(() => setEmails([]));
  }
  
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString(); // e.g., Feb 2, 2026 10:15 AM
  };
  
  function showForm(index) {
    setSelectedEmailIndex(index);
    getEmailHistory(emails[index].id); // Pass email id to
  }
  
  return (
    <div className="container mt-4">
    <h2 className="mb-3">Emails</h2>
    
    <ul className="list-group">
    {emails.map((email, index) => (
      <li
      key={index}
      className="list-group-item d-flex justify-content-between align-items-center"
      >
      <div>
      <strong>{email.from}</strong> - {email.subject}
      </div>
      <Button variant="primary" size="sm" onClick={() => showForm(index)}>
      View
      </Button>
      </li>
    ))}
    </ul>
    
    {/* Modal for viewing email */}
    {selectedEmailIndex !== null && (
      <Modal
      show={selectedEmailIndex !== null}
      onHide={() => setSelectedEmailIndex(null)}
      size="lg"
      centered
      >
      <Modal.Header closeButton>
      <Modal.Title>Email Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      {(() => {
        const email = emails[selectedEmailIndex];
        return (
          <div>
          {/* <code>{JSON.stringify(email)}</code> */}          
          
          <p><strong>From:</strong> {email.from}</p>
          <p><strong>To:</strong> {email.to}</p>
          <p><strong>Date:</strong> {formatDateTime(email.date)}</p>
          <p><strong>Subject:</strong> {email.subject}</p>
          {/* Attachments Section */}
          <label className="mt-1 fw-bold">
          Message Attachments:
          <span className="text-danger"></span>
          </label>
          <FileUploader
          disabled={true}
          AUTH_KEY={AUTH_KEY}
          item={email}
          entity="email"
          record_id={email.id}
          field_id="attachments"
          getData={() => getEmails()} // Pass `selectedItem` to `editItem` here
          extensionsAllowed={[
            "png",
            "jpg",
            "jpeg",
            "svg",
          ]}
          multiple={false}
          serviceKey="update.formData"
          />
          <p><strong>Message:</strong> <div
          className="border p-2 mb-3 email-body"
          dangerouslySetInnerHTML={{ __html: email.texthtml }}
          /></p>
          
          <p><strong>Reply:</strong>
          <Editor
          tinymceScriptSrc="/resources/tinymce_6.4.2/tinymce.min.js"
          value={email.reply || ""}
          onEditorChange={handleReplyChange}
          init={{
            height: 150,
            menubar: false,
            plugins: [
              "lists", "link", "image", "charmap",
              "anchor", "searchreplace", "visualblocks",
              "media", "table", "preview", "help", "wordcount"
            ],
            toolbar:
            "undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | link image | preview",
            content_css: "/resources/bootstrap-5.2.3/css/bootstrap.min.css",
            content_style: `body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }`
          }}
          />
          </p>
          <label className="mt-1 fw-bold">Reply Attachments:</label>
          <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="form-control"
          />
<div className="mt-2 text-end">
  <Button 
    variant="primary" 
    onClick={handleSendReply} 
    disabled={isSending || !emails[selectedEmailIndex]?.reply?.trim()}
  >
    {isSending ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Sending...
      </>
    ) : (
      "Reply"
    )}
  </Button>
</div>

          <hr />
          <h5>Conversation History
          </h5>
          
          {emailHistory.length === 0 ? (
            <p>No history found.</p>
          ) : (
            emailHistory.map((h, i) => (
              <div key={i} className="border p-2 mb-2 rounded">
              <p><b>Date:</b> {formatDateTime(h.date)}</p>
              <div dangerouslySetInnerHTML={{ __html: h.reply }} />
              {/* Attachments Section */}
              <label className="mt-1 fw-bold">
              Attachments:
              <span className="text-danger"></span>
              </label>
              <FileUploader
              disabled={true}
              AUTH_KEY={AUTH_KEY}
              item={h}
              entity="email"
              record_id={h.id}
              field_id="attachments"
              getData={() => getEmails()} // Pass `selectedItem` to `editItem` here
              extensionsAllowed={[
                "png",
                "jpg",
                "jpeg",
                "svg",
              ]}
              multiple={false}
              serviceKey="update.formData"
              />
              </div>
            ))
          )}
          
          </div>
        );
      })()}
      </Modal.Body>
      <Modal.Footer>
      {/* <Button variant="secondary" onClick={() => setSelectedEmailIndex(null)}>
        Close
        </Button> */}
        
        </Modal.Footer>
        </Modal>
      )}
      </div>
    );
  };
  
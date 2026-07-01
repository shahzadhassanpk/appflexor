import React, { useRef, useState } from "react";

const FileUploader = ({ onSendMessage }) => {
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setUploadStatus("❌ File size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1];
      let msg = {
        fileName: file.name,
        fileType: file.type,
        data: base64String,
        fileSize: file.size,
      };
      onSendMessage(msg, "media");
      setUploadStatus("✅ File uploaded: " + file.name);
    };

    reader.readAsDataURL(file);
  };

  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-uploader">
      
      <i
        class="fa-solid fa-file-arrow-up me-2 add-pointer"
        onClick={handleIconClick}
        title="Send file"
      >
        
      </i>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* {uploadStatus && (
        <p className="mt-1 text-sm text-gray-600">{uploadStatus}</p>
      )} */}
    </div>
  );
};

export default FileUploader;

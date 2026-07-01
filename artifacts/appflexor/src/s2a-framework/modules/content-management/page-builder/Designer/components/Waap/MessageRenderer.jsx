import { useState, useEffect } from "react";
import ChatScroller from "./ChatScroller"; // Import the ChatScroller component
import "./index.css";
import { formatDateTimeForUserView } from "./utils/utils";


function MessageRenderer({ messages }) {
  const mediaBaseUrl = "/file/service/waap_lead_msg"; // Base URL for media files
  const iconMap = {
    pdf: <i className="bi bi-file-earmark-pdf text-danger fs-3" />,
    doc: <i className="bi bi-file-earmark-word text-primary fs-3" />,
    docx: <i className="bi bi-file-earmark-word text-primary fs-3" />,
    xls: <i className="bi bi-file-earmark-excel text-success fs-3" />,
    xlsx: <i className="bi bi-file-earmark-excel text-success fs-3" />,
    txt: <i className="bi bi-file-earmark-text text-secondary fs-3" />,
    ppt: <i className="bi bi-file-earmark-slides text-warning fs-3" />,
    pptx: <i className="bi bi-file-earmark-slides text-warning fs-3" />,
    zip: <i className="bi bi-file-earmark-zip text-muted fs-3" />,
    default: <i className="bi bi-file-earmark fs-3 text-dark" />,
  };
  
  const getFileIcon = (ext) => {
    return iconMap[ext] || iconMap.default;
  };

  return (
    <ChatScroller
      messages={messages}
      renderMessage={(msg, idx) => {
        let messageContent;

        if (msg.message_type === "media") {
          switch (msg.media_type) {
            case "image":
              {
                const mediaSrc = `${mediaBaseUrl}/${msg.id}/${msg.media_filename}`;
                messageContent = mediaSrc ? (
                  <img
                    src={mediaSrc}
                    alt="Image"
                    className="w-100 rounded-3"
                    style={{
                      maxHeight: "300px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div>Downloading image...</div>
                );
              }
              break;

            case "audio":
              {
                const mediaSrc = `${mediaBaseUrl}/${msg.id}/${msg.media_filename}`;

                messageContent = mediaSrc ? (
                  <audio
                    controls
                    style={{ maxHeight: "300px", maxWidth: "100%" }}
                  >
                    <source src={mediaSrc} type={msg.media_mimetype} />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div>Downloading audio...</div>
                );
              }
              break;

            case "video":
              {
                const mediaSrc = `${mediaBaseUrl}/${msg.id}/${msg.media_filename}`;
                messageContent = mediaSrc ? (
                  <video
                    controls
                    style={{ maxHeight: "300px", maxWidth: "100%" }}
                  >
                    <source src={mediaSrc} type={msg.media_mimetype} />
                    Your browser does not support the video element.
                  </video>
                ) : (
                  <div>Downloading video...</div>
                );
              }
              break;

            case "ptt":
              {
                const mediaSrc = `${mediaBaseUrl}/${msg.id}/${msg.media_filename}`;

                messageContent = mediaSrc ? (
                  <audio
                    controls
                    className="w-100 rounded-3"
                    style={{
                      maxHeight: "300px",
                      objectFit: "cover",
                      minWidth: "200px",
                    }}
                  >
                    <source src={mediaSrc} type={msg.media_mimetype} />
                    Your browser does not support the video element.
                  </audio>
                ) : (
                  <div>Downloading video...</div>
                );
              }
              break;

            case "document":
              {
                const mediaSrc = `${mediaBaseUrl}/${msg.id}/${msg.media_filename}`;
                const fileExt = msg.media_filename
                  ?.split(".")
                  .pop()
                  ?.toLowerCase();
                // Render preview or fallback
                // if (fileExt === "pdf") {
                //   messageContent = (
                //     <iframe
                //       src={mediaSrc}
                //       title="PDF Preview"
                //       className="w-full h-64 border rounded"
                //     ></iframe>
                //   );
                // } else if (fileExt === "txt") {
                //   messageContent = (
                //     <iframe
                //       src={mediaSrc}
                //       title="Text Preview"
                //       className="w-full h-48 border rounded bg-white p-2 font-mono text-sm"
                //     ></iframe>
                //   );
                // } else {
                //   messageContent = (
                //     <a
                //       href={mediaSrc}
                //       download
                //       className="flex items-center space-x-2"
                //     >
                //       <img
                //         src={iconSrc}
                //         alt="file-icon"
                //         className="w-10 h-10"
                //       />
                //       <span className="text-sm text-blue-600 underline">
                //         {msg.media_filename}
                //       </span>
                //     </a>
                //   );
                // }
                messageContent = mediaSrc ? (
                  <div className="d-flex align-items-center">
                    {getFileIcon(fileExt)}

                  <a href={mediaSrc} download>
                    <button className="btn btn-primary">
                      {msg.media_filename}
                    </button>
                  </a>
                  </div>
                ) : (
                  <div>Downloading document...</div>
                );
              }
              break;

            default:
              messageContent = (
                <div>Unsupported media type {msg.media_type}</div>
              );
              break;
          }
        }

        return (
          <div key={idx} className={`chat-message`}>
            <div
              className={`${
                msg.type === "S" ? "sent-message" : "received-message"
              }`}
            >
              <div className="message-content">
                {msg.message}{" "}
                {msg.message_type && (
                  <span className="message-extra-content">
                    {messageContent}{" "}
                  </span>
                )}
              </div>
              <div className="timestamp mt-2">
                <span>{formatDateTimeForUserView(msg.datecreated)}</span>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}

export default MessageRenderer;

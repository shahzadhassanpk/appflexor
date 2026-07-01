import React, { useState, useRef, useEffect  } from "react";

const VoiceMessageSender = ({ onSendMessage }) => {
  const [recording, setRecording] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted.");
    } catch (error) {
      console.error("❌ Microphone access denied:", error.name, error.message);
      alert(
        "Microphone access is required. Please allow it in your browser settings."
      );
    }
  };

  // Example: Call when component mounts
  useEffect(() => {
    requestMicrophoneAccess();
  }, []);

  const startRecording = async () => {
    setUploadStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          const msg = {
            fileName: `voice_${Date.now()}.webm`,
            fileType: "audio/webm",
            data: base64Audio,
            fileSize: audioBlob.size,
          };
          onSendMessage(msg, "media");
          setUploadStatus("✅ Voice message sent");
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      setUploadStatus("❌ Unable to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="voice-sender">
      <i
        onClick={recording ? stopRecording : startRecording}
        className={`attache-file material-icons me-2 rounded ${
          recording ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {recording ? "Stop Recording" : "Record Voice"}
      </i>
      {uploadStatus && (
        <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>
      )}
    </div>
  );
};

export default VoiceMessageSender;

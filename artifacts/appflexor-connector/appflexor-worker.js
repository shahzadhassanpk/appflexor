import WebSocket from "ws";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load from .env if present; Replit secrets take precedence

// 🔐 Authentication setup
const cred = {
  username: process.env.LOGIN,
  password: process.env.PASSWORD,
};
console.log("🔐 Credentials loaded for user:", JSON.stringify({ username: cred.username }));

const AUTH_URL = process.env.AUTH_URL;
const BPM_URL  = process.env.BPM_URL;

if (!AUTH_URL) throw new Error("AUTH_URL is not set");
if (!BPM_URL)  throw new Error("BPM_URL is not set");
if (!process.env.WS_URL) throw new Error("WS_URL is not set");

// 🔔 WebSocket topics to subscribe
const topics       = JSON.parse(process.env.TOPICS || '[{"topic":"n8n-worker"}]');
const subscription = { topics, groupId: process.env.GROUP_ID || "camunda" };

async function getAuthToken() {
  try {
    const response = await axios.post(AUTH_URL, cred, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ Auth token received");
    const token = response.data.C_DATA?.AUTH_KEY;
    if (!token) throw new Error("No AUTH_KEY received from API");
    return token;
  } catch (err) {
    console.error("❌ Failed to get auth token:", err.response?.data || err.message);
    process.exit(1);
  }
}

async function completeTask(authKey, payload) {
  try {
    console.log("🔄 Completing task", payload.taskId);
    const path     = `/external-task/${payload.taskId}/complete`;
    const workerId = payload.workerId || "default-worker";
    await axios.post(BPM_URL, { method: "POST", path, data: { workerId } }, {
      headers: { AUTH_KEY: authKey },
    });
    console.log("✅ Task completed:", payload.taskId);
  } catch (err) {
    console.error("❌ Failed to complete task:", err.message);
  }
}

async function connectWebSocket() {
  const authKey = await getAuthToken();

  const socket = new WebSocket(process.env.WS_URL, {
    headers: { AUTH_KEY: authKey },
  });

  socket.on("open", () => {
    console.log("✅ Connected to WebSocket server");
    setTimeout(() => {
      socket.send(JSON.stringify({ action: "subscribe", subscription }));
      console.log("✅ Subscription sent for topics:", JSON.stringify(topics));
    }, 600);
  });

  socket.on("message", (data) => {
    try {
      const _data   = JSON.parse(data.toString());
      const payload = JSON.parse(_data.value);
      const topic   = _data.topic;
      console.log("📨 Processing topic:", topic);
      completeTask(authKey, payload);
    } catch (err) {
      console.error("❌ Failed to handle message:", err.message);
    }
  });

  socket.on("error", (err) => console.error("🔌 WebSocket error:", err.message));

  socket.on("close", () => {
    console.log("🔌 WebSocket closed — reconnecting in 5s…");
    setTimeout(connectWebSocket, 5000);
  });
}

connectWebSocket();

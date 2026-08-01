import WebSocket from "ws";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load variables from .env

// 🔐 Authentication setup
const cred = {
  username: process.env.LOGIN,
  password: process.env.PASSWORD,
};
console.log("🔐 Credentials loaded for user:", JSON.stringify(cred));
const AUTH_URL = process.env.AUTH_URL;
const BPM_URL = process.env.BPM_URL;

// 🔔 WebSocket topics to subscribe
const topics = JSON.parse(process.env.TOPICS || '[{"topic":"n8n-worker"}]');
const subscription = { topics, groupId: process.env.GROUP_ID || "camunda" };

async function getAuthToken() {
  try {
    const response = await axios.post(AUTH_URL, cred, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ Auth token received", response.data);
    const token = response.data.C_DATA.AUTH_KEY;
    if (!token) throw new Error("No auth_key received from API");
    return token;
  } catch (err) {
    console.error("❌ Failed to get auth token:", err.response?.data || err.message);
    process.exit(1);
  }
}

async function completeTask(authKey, payload, variables = {}) {
  try {
    console.log("🔄 Completing task", payload);
    const path = `/external-task/${payload.taskId}/complete`;
    const workerId = payload.workerId || "default-worker";
    await axios.post(BPM_URL, { method: "POST", path, data: { workerId } }, {
      headers: { AUTH_KEY: authKey },
    });
    console.log("✅ Task completed");
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
      console.log("✅ Subscription request sent for topics:", topics);
    }, 600);
  });

  socket.on("message", (data) => {
    const _data = JSON.parse(data.toString());
    const payload = JSON.parse(_data.value);
    const topic = _data.topic;
    console.log("📨 processing topic:", topic);
    completeTask(authKey, payload);
  });

  socket.on("error", console.error);
  socket.on("close", () => console.log("🔌 WebSocket closed"));
}

connectWebSocket();
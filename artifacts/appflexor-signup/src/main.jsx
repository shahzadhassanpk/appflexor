import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
// Import Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);

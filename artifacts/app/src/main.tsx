import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import S2aApp from "./s2a-framework/S2aApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename="/app">
    <S2aApp />
  </BrowserRouter>
);

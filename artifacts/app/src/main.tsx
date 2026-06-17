import { createRoot } from "react-dom/client";
<<<<<<< HEAD
// import App from "./App";
import S2aApp from "./s2a-framework/S2aApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(<S2aApp />);
=======
import { BrowserRouter } from "react-router-dom";
import S2aApp from "./s2a-framework/S2aApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename="/app">
    <S2aApp />
  </BrowserRouter>
);
>>>>>>> a9f11ccabec603523e899507567e9dd5c08d8ba1

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import S2aApp from "./s2a-framework/S2aApp";
import "./index.css";

import "react-phone-input-2/lib/bootstrap.css";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import "react-toastify/dist/ReactToastify.css";
import { ErrorBoundary } from "./s2a-framework/utils/ErrorBoundry";
import setupLocatorUI from "@locator/runtime";

if (import.meta.env.DEV) {
    setupLocatorUI();
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <ErrorBoundary>
            <S2aApp />
        </ErrorBoundary>
    </BrowserRouter>,
);

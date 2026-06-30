import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import setupLocatorUI from "@locator/runtime";
import S2aApp from "./s2a-framework/S2aApp";
import "./index.css";

import "react-phone-input-2/lib/bootstrap.css";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import "react-toastify/dist/ReactToastify.css";
import { ErrorBoundary } from "./s2a-framework/utils/ErrorBoundry";

if (process.env.NODE_ENV === "development") {
    setupLocatorUI();
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter basename='/app'>
        <ErrorBoundary>
            <S2aApp />
        </ErrorBoundary>
    </BrowserRouter>,
);

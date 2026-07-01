import React, { useState, useEffect, useContext } from "react";

// import { ApiConsole } from "./ApiConsole";
import EmailProfiles from "../EmailProfiles";
import EmailTemplates from "../EmailTemplates";
import ReportTemplates from "./ReportTemplates";
import { AppContext } from "../../AppContext";

function RestConsole() {
    const appContext = useContext(AppContext);

    const [tabs, setTabs] = useState({
        apiConsole: "true",
        reportTemplate: "false",
    });
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    function handleTabsChange(event) {
        let name = event.target.name;
        let keys = Object.keys(tabs);
        let obj = {};

        keys.forEach(key => {
            if (name == key) obj[key] = "true";
            else obj[key] = "false";
        });
        // console.log(obj);
        setTabs(obj);
    }

    return (
        <div
            id="AppSettings"
            className="container-fluid">
            <nav className="pt-3 mx-1">
                <div
                    className="nav nav-tabs"
                    id="nav-tab"
                    role="tablist">
                    {/* <button
              className="nav-link active"
              id="api-tab"
              name="apiConsole"
              data-bs-toggle="tab"
              data-bs-target="#api"
              type="button"
              role="tab"
              aria-controls="api"
              aria-selected="false"
              onClick={(event) => handleTabsChange(event)}
            >
              Api Console
            </button> */}
                    <button
                        className="nav-link"
                        id="nav-email-profile-tab"
                        name="emailProfile"
                        data-bs-toggle="tab"
                        data-bs-target="#nav-email-profile"
                        type="button"
                        role="tab"
                        aria-controls="nav-email-profile"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Email Profiles
                    </button>
                    <button
                        className="nav-link"
                        id="nav-email-templates-tab"
                        name="emailTemplate"
                        data-bs-toggle="tab"
                        data-bs-target="#nav-email-templates"
                        type="button"
                        role="tab"
                        aria-controls="nav-email-templates"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Email Templates
                    </button>
                    <button
                        className="nav-link "
                        id="nav-report-templates-tab"
                        name="reportTemplate"
                        data-bs-toggle="tab"
                        data-bs-target="#nav-report-templates"
                        type="button"
                        role="tab"
                        aria-controls="nav-report-templates"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Report Templates
                    </button>
                </div>
            </nav>
            <div
                className="tab-content"
                id="nav-tabContent">
                {/* <div
            className="tab-pane fade show active"
            id="api"
            role="tabpanel"
            aria-labelledby="api-tab"
          >
            <ApiConsole
              isAuthorized={appContext.isAuthorized}
              activeTab={tabs}
            />
          </div> */}
                <div
                    className="tab-pane fade show active"
                    id="nav-email-profile"
                    role="tabpanel"
                    aria-labelledby="nav-email-profile-tab"
                    tabIndex="0">
                    <EmailProfiles
                        isAuthorized={appContext.isAuthorized}
                        activeTab={tabs}
                    />
                </div>
                <div
                    className="tab-pane fade"
                    id="nav-email-templates"
                    role="tabpanel"
                    aria-labelledby="nav-email-templates-tab"
                    tabIndex="0">
                    <EmailTemplates
                        isAuthorized={appContext.isAuthorized}
                        activeTab={tabs}
                    />
                </div>
                <div
                    className="tab-pane fade "
                    id="nav-report-templates"
                    role="tabpanel"
                    aria-labelledby="nav-report-templates-tab"
                    tabIndex="0">
                    <ReportTemplates
                        isAuthorized={appContext.isAuthorized}
                        activeTab={tabs}
                    />
                </div>
            </div>
        </div>
    );
}

export { RestConsole };

import React, { useState, useEffect, useContext } from "react";
import { Instance } from "./Instance";
import { ObjectStore } from "./ObjectStore";
import { MultiTenantRestConsole } from "./MultiTenantRestConsole";
import { AppContext } from "../../AppContext";

function SaasConsole() {
    const appContext = useContext(AppContext);
    const [tabs, setTabs] = useState({
        instance: "true",
        objectStore: "false",
        multiTenantRestConsole: "false",
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    function handleTabsChange(event) {
        let name = event.target.name;
        let keys = Object.keys(tabs);
        let obj = {};

        keys.forEach((key) => {
            if (name == key) obj[key] = "true";
            else obj[key] = "false";
        });
        console.log(obj);
        setTabs(obj);
    }

    return (
        <React.Fragment>
            <div id="CmsSetup" className="container-fluid">
                <ul
                    className="pt-3 mx-1 nav nav-tabs"
                    id="myTab"
                    role="tablist"
                >
                    <li className="nav-item" role="presentation">
                        <button
                            className="nav-link active"
                            id="instance-tab"
                            name="instance"
                            data-bs-toggle="tab"
                            data-bs-target="#instance"
                            type="button"
                            role="tab"
                            aria-controls="instance"
                            aria-selected="false"
                            onClick={(event) => handleTabsChange(event)}
                        >
                            Instance
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button
                            className="nav-link"
                            id="objectStore-tab"
                            name="objectStore"
                            data-bs-toggle="tab"
                            data-bs-target="#objectStore"
                            type="button"
                            role="tab"
                            aria-controls="objectStore"
                            aria-selected="false"
                            onClick={(event) => handleTabsChange(event)}
                        >
                            ObjectStore
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button
                            className="nav-link"
                            id="multiRestConsole-tab"
                            name="multiTenantRestConsole"
                            data-bs-toggle="tab"
                            data-bs-target="#multiRestConsole"
                            type="button"
                            role="tab"
                            aria-controls="multiRestConsole"
                            aria-selected="false"
                            onClick={(event) => handleTabsChange(event)}
                        >
                            Multi-Tenant RestConsole
                        </button>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div
                        className="tab-pane fade show active"
                        id="instance"
                        role="tabpanel"
                        aria-labelledby="instance-tab"
                    >
                        <Instance
                            isAuthorized={appContext.isAuthorized}
                            activeTab={tabs}
                        />
                    </div>
                    <div
                        className="tab-pane fade"
                        id="objectStore"
                        role="tabpanel"
                        aria-labelledby="objectStore-tab"
                    >
                        <ObjectStore
                            isAuthorized={appContext.isAuthorized}
                            activeTab={tabs}
                        />
                    </div>
                    <div
                        className="tab-pane fade"
                        id="multiRestConsole"
                        role="tabpanel"
                        aria-labelledby="multiRestConsole-tab"
                    >
                        <MultiTenantRestConsole
                            isAuthorized={appContext.isAuthorized}
                            activeTab={tabs}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export { SaasConsole };

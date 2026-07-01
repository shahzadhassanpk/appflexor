import React, { createElement, useEffect, useState } from "react";
import Analytics from "../../../../../data-analysis/analytics/analytics/Analytics";
import DataListViewer from "../../../datalist-viewer/viewer/DataListViewer";
import PostViewer from "../../../../../content-management/page-builder/PostViewer/PostViewer";

function TabsViewer(params) {
    const [tabsArray, setTabsArray] = useState([]);
    const [avtiveComponnet, setActiveComponent] = useState(null);
    useEffect(() => {
        let obj = params.props.component.props[0];
        let opt = tryParseJSONObject(obj.options, []);
        opt.forEach((o, i) =>
            i === 0 ? (o.isActive = true) : (o.isActive = false),
        );

        setTabsArray(opt);
    }, [params.props]);

    function handleTabsChange(event) {
        let id = event.target.id;

        let arr = [];
        tabsArray.forEach(tab => {
            if (tab.id === id) {
                tab.isActive = true;

                arr.push(tab);

                // let component = componentList[tab.value];
                // console.log(component);
                // setActiveComponent(component);
            } else {
                tab.isActive = false;
                arr.push(tab);
            }
        });
        setTabsArray(arr);
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    return (
        <>
            <ul className="nav nav-tabs">
                {tabsArray.map(tab => {
                    return (
                        <li
                            key={tab.id}
                            className="nav-item"
                            role="presentation">
                            <button
                                className={`nav-link ${
                                    tab.isActive ? "active" : null
                                }`}
                                id={`${tab.id}`}
                                data-bs-toggle="tab"
                                data-bs-target={`${tab.id}`}
                                onClick={event => handleTabsChange(event)}>
                                {tab.label}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="tab-content">
                {tabsArray.map(tab => {
                    return (
                        <div
                            key={tab.id}
                            className={`tab-pane fade ${
                                tab.isActive ? " show active " : null
                            } `}
                            id={`${tab.id}`}>
                            {tab.isActive && CreateComponent(tab.value, params)}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

const componentList = {
    datalist: DataListViewer,
    analytics: Analytics,
    post: PostViewer,
};

function CreateComponent(key, params) {
    const modeType = {
        design: "DESIGN_MODE",
        preview: "PREVIEW_MODE",
        readonly: "READONLY_MODE",
        render: "RENDER_MODE",
    };

    const mode = params.mode ? params.mode : modeType.render;

    const component = componentList[key];

    // return createElement(component, { mode, modeType });

    // if (key) {
    //     return;
    // }

    if (typeof componentList[key] !== "undefined") {
        return React.createElement(component, {
            mode,
            modeType,
        });
    }
    return React.createElement(
        () => (
            <div
                // style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="">
                        The Component for{" "}
                        <span className="text-danger">{key}</span> has not been
                        created yet.
                    </p>
                </div>
            </div>
        ),
        { key },
    );
}

export { TabsViewer, componentList };

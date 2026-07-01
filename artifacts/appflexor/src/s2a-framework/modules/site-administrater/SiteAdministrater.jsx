import axios from "axios";
import React, { lazy, Suspense, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { getAuthorizedTabs } from "../../utils/utils";
import Loading from "../../components/Loading/loading";
const Authorization = lazy(() =>
    import("../content-management/Authorization/Authorization"),
);
const DraggableSites = lazy(() =>
    import("../content-management/DndWrapper/DndWrapper"),
);
const Styles = lazy(() => import("../content-management/Styles/styles"));
const Pages = lazy(() =>
    import("../content-management/page-builder/Pages/Pages"),
);

const TABS = [
    {
        name: "Sites",
        code: "SITES",
        active: "false",
    },
    {
        name: "Pages",
        code: "PAGES",
        active: "false",
    },

    {
        name: "Styles",
        code: "CUSTOM_STYLES",
        active: "false",
    },
    {
        name: "Authorization",
        code: "AUTHORIZATION",
        active: "false",
    },
];

const componentRegistry = {
    SITES: DraggableSites,
    PAGES: Pages,
    CUSTOM_STYLES: Styles,
    AUTHORIZATION: Authorization,
};

const SiteAdministration = () => {
    const [channels, setChannels] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState("SITES");

    const appContext = useContext(AppContext);
    const { channel, featuresSubscription } = appContext;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const authorizedTabs = getAuthorizedTabs(TABS, featuresSubscription);

        if (authorizedTabs.length > 0) {
            const initialTab = authorizedTabs[0];
            const withActiveInitialTab = authorizedTabs.map((tab, i) => {
                if (i === 0) {
                    return { ...tab, active: "true" };
                } else return tab;
            });

            setActiveTab(initialTab.code);
            setTabs(withActiveInitialTab);
        }
    }, [featuresSubscription, TABS]);

    useEffect(() => {
        if (channel?.subscription) {
            getData();
        }
    }, [channel?.subscription]);

    function getData(callback) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.subscription,
                    dataKey: "appChannel",
                    serviceKey: "sys.site.administration",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.appChannel) {
                            setChannels(response.data.C_DATA.appChannel);
                        } else {
                            setChannels([]);
                        }
                    }
                    if (callback) {
                        callback();
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function handleTabsChange(code) {
        let activetab = "";
        let updatedTabs = tabs.map(tab => {
            if (tab.code === code) {
                activetab = tab.code;
                return { ...tab, active: "true" };
            } else return { ...tab, active: "false" };
        });

        setActiveTab(activetab);
        setTabs(updatedTabs);
    }

    return (
        channels &&
        channels.length > 0 && (
            <ErrorBoundary>
                <div
                    id="site-administration"
                    className="site-administration container-fluid static-module-bg">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="module-title">
                                <span>Site Management {}</span>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="container">
                            <ul className="nav nav-tabs">
                                {tabs.length > 0 &&
                                    tabs.map((tab, index) => {
                                        return (
                                            <li
                                                className="nav-item"
                                                key={index}>
                                                <button
                                                    className={`nav-link ${
                                                        tab.active === "true"
                                                            ? "active"
                                                            : ""
                                                    } `}
                                                    data-bs-toggle="tab"
                                                    data-bs-target={`#${tab.code}`}
                                                    type="button"
                                                    onClick={event =>
                                                        handleTabsChange(
                                                            tab.code,
                                                        )
                                                    }>
                                                    {tab.name}
                                                </button>
                                            </li>
                                        );
                                    })}
                            </ul>
                            <div className="tab-content">
                                {
                                    // tabs.length > 0 ? (
                                    //     tabs.map((tab, index) => {
                                    //         return (
                                    //             <CreateComponent
                                    //                 key={index}
                                    //                 component={tab}
                                    //                 componentList={
                                    //                     componentRegistry
                                    //                 }
                                    //                 channel={channel}
                                    //                 channels={channels}
                                    //                 activeTab={activeTab}
                                    //             />
                                    //         );
                                    //     })
                                    // ) : (
                                    activeTab ? (
                                        <Suspense
                                            fallback={
                                                <Loading
                                                    message={`Loading ${activeTab}`}
                                                />
                                            }>
                                            <CreateComponent
                                                key={activeTab}
                                                component={tabs?.find(
                                                    tab =>
                                                        tab.code === activeTab,
                                                )}
                                                componentList={
                                                    componentRegistry
                                                }
                                                channel={channel}
                                                channels={channels}
                                                activeTab={activeTab}
                                            />
                                        </Suspense>
                                    ) : (
                                        <NotAuthorized />
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        )
    );
};

function CreateComponent({
    component,
    componentList,
    channel,
    channels,
    activeTab,
}) {
    if (typeof componentList[component.code] !== "undefined") {
        return (
            <div
                className={`tab-pane fade ${
                    component.code === activeTab ? "active show" : ""
                } `}
                id={component.code}>
                {React.createElement(componentList[component.code], {
                    key: component.code,
                    activeTab,
                    channel,
                    channels,
                })}
            </div>
        );
    }

    return <NotAuthorized />;
}

function NotAuthorized({ waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? (
        <div
            style={{ minHeight: "50vh" }}
            className="d-flex align-items-center justify-content-center">
            <div className="text-center">
                <p className="">
                    You are not <span className="text-danger">authorized</span>{" "}
                    to access this feature.
                </p>
            </div>
        </div>
    ) : null;
}

export default SiteAdministration;

import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 } from "uuid";
import { AppContext as SiteContext } from "../../../../../AppContext";
import { checkIfComponentIsAuthorized, makeid } from "../../../../utils/utils";
import { SIDEBAR_ITEMS, componentList } from "./ComponentRegistry";
import { RENDER_MODE } from "./Designer";

const RenderPreview = ({
    layout = [],
    components = {},
    images = {},
    htmlCollection,
    mode = "RENDER_MODE",
    modeType = {},
    pageId,
    cssClasses = "",
}) => {
    return (
        <div className={`container-fluid s2a-custom-page ${cssClasses}`}>
            {layout.map((row, index) => {
                let _enableTabView = row.enableTabView;
                let _renderMode = row.renderMode;
                if (
                    _enableTabView &&
                    _enableTabView !== "" &&
                    _enableTabView === "YES"
                ) {
                    return (
                        <RenderTabs
                            key={row.id}
                            renderMode={_renderMode}
                            rowData={row}
                            components={components}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            modeType={modeType}
                            pageId={pageId}
                        />
                    );
                } else {
                    return (
                        <div
                            className={` ${row.classes ? row.classes : ""} row`}
                            key={row.id}>
                            <Row
                                key={row.id}
                                rowData={row}
                                components={components}
                                images={images}
                                htmlCollection={htmlCollection}
                                mode={mode}
                                modeType={modeType}
                                pageId={pageId}></Row>
                        </div>
                    );
                }
            })}
        </div>
    );
};

function RenderTabs({
    rowData,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    pageId,
    renderMode = RENDER_MODE.firstTime,
}) {
    const [tabs, setTabs] = useState({});
    const [activeTab, setActiveTab] = useState({});

    // `active` is only used to control rendering of active tab's component and not for bootstratp tab content visiblity.
    // Tabs are all in control of bootstratp.js

    useEffect(() => {
        if (!rowData?.children?.length) return;
        const urlParams = new URLSearchParams(window.location.search);
        const tabCodeParam = urlParams.get("tab_code")?.trim();

        const newTabs = {};

        rowData.children.forEach((child, index) => {
            const childCode = child.code?.trim();
            const isActive = tabCodeParam
                ? childCode === tabCodeParam
                : index === 0; // fallback to first tab

            newTabs[child.id] = {
                title: child.title,
                code: child.code,
                active: isActive,
                renderCount: isActive ? 1 : 0,
            };

            if (isActive) {
                setActiveTab(child);
            }
        });

        setTabs(newTabs);
    }, [rowData]);

    function handleTabChange(thisTab) {
        let newTabs = {};

        for (const tabId in tabs) {
            if (Object.hasOwnProperty.call(tabs, tabId)) {
                const element = tabs[tabId];

                if (thisTab.id === tabId) {
                    newTabs[tabId] = {
                        title: element.title,
                        active: true,
                        renderCount: 1,
                    };
                } else {
                    newTabs[tabId] = {
                        title: element.title,
                        active: false,
                        renderCount: element.renderCount,
                    };
                }
            }
        }

        setTabs(newTabs);
    }

    return (
        <React.Fragment>
            <ul
                className={` ${
                    rowData.classes ? rowData.classes : ""
                } nav nav-tabs pt-2`}
                key={rowData.id}>
                {rowData.children.map((tab, index) => {
                    return (
                        <li className={`nav-item`}>
                            {/* {JSON.stringify(tab)} */}
                            <button
                                className={`nav-link ${
                                    tab.id===activeTab.id ? "active" : null
                                }`}
                                data-bs-toggle="tab"
                                data-bs-target={`#${tab.id}`}
                                type="button"
                                role="tab"
                                onClick={() => handleTabChange(tab)}>
                                {tab.title ? tab.title : `Tab ${index + 1}`}{" "}
                                {tab?.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
            <div className="tab-content">
                {rowData.children.map((tab, index) => {
                    return (
                        <div
                            className={`tab-pane fade ${
                                tab.id===activeTab.id ? "show active" : ""
                            }`}
                            id={`${tab.id}`}>
                            <Tab
                                pageId={pageId}
                                key={tab.id}
                                tabData={tab}
                                renderMode={renderMode}
                                activeTabData={tabs[tab.id]}
                                components={components}
                                images={images}
                                mode={mode}
                                htmlCollection={htmlCollection}
                                modeType={modeType}></Tab>
                        </div>
                    );
                })}
            </div>
        </React.Fragment>
    );
}

function Tab({
    tabData,
    activeTabData = {},
    components,
    images,
    renderMode,
    mode,
    htmlCollection,
    modeType,
    pageId,
}) {
    return (
        <React.Fragment>
            {tabData.children.map(component => {
                return (
                    <React.Fragment key={component.id + pageId}>
                        {renderMode === RENDER_MODE.allTime &&
                            activeTabData.active === true && (
                                <Component
                                    key={component.id}
                                    componentData={component}
                                    components={components}
                                    images={images}
                                    htmlCollection={htmlCollection}
                                    mode={mode}
                                    modeType={modeType}
                                    tabData={tabData}
                                />
                            )}
                        {renderMode === RENDER_MODE.firstTime &&
                            activeTabData.renderCount === 1 && (
                                <Component
                                    key={component.id}
                                    componentData={component}
                                    components={components}
                                    images={images}
                                    htmlCollection={htmlCollection}
                                    mode={mode}
                                    modeType={modeType}
                                    tabData={tabData}
                                />
                            )}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function Row({
    rowData,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    pageId,
}) {
    return (
        <React.Fragment>
            {rowData.children.map((column, index) => {
                return (
                    <React.Fragment key={column.id}>
                        <Column
                            key={column.id}
                            columnData={column}
                            components={components}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            modeType={modeType}
                            pageId={pageId}></Column>
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function Column({
    columnData,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    pageId,
}) {
    return (
        <React.Fragment>
            {columnData.children.map((component, index) => {
                return (
                    <React.Fragment key={component.id + pageId}>
                        <div
                            className={`col-wrapper module-col ${columnData?.classes} ${columnData?.classNames}`}>
                            <Component
                                // key={component.id}
                                componentData={component}
                                components={components}
                                images={images}
                                htmlCollection={htmlCollection}
                                mode={mode}
                                modeType={modeType}
                                pageId={pageId}
                            />
                        </div>
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function Component({
    componentData,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    pageId,
}) {
    const [component, setComponent] = useState(undefined);

    useEffect(() => {
        const _component = components[componentData.id];
        for (let item of SIDEBAR_ITEMS) {
            if (item.component.type === _component.type) {
                var regComponent = item;
            }
        }
        _component.code = regComponent.code;
        setComponent(_component);
    }, [componentData]);

    // useEffect(() => {
    //     console.log(`Latest state of component`);
    //     console.log(component);
    // }, [component]);

    // console.log({ componentData });

    return (
        <React.Fragment>
            {/* <code>{JSON.stringify(component)}</code> */}

            {typeof componentList !== "undefined" &&
                typeof component !== "undefined" && (
                    <>
                        <CreateComponent
                            component={component}
                            componentList={componentList}
                            images={images}
                            mode={mode}
                            htmlCollection={htmlCollection}
                            modeType={modeType}
                        />
                    </>
                )}
        </React.Fragment>
    );
}

function CreateComponent(props) {
    const { component, componentList, images, mode, htmlCollection, modeType } =
        props;
    const siteContext = useContext(SiteContext);
    const componentExists =
        typeof componentList[component.type] !== "undefined";

    if (componentExists) {
        const componentNeedsAuthorization = component["code"] !== undefined; // code exists === subscription check needed
        let componentIsAuthorized = true;

        if (componentNeedsAuthorization) {
            const { featuresSubscription } = siteContext;
            componentIsAuthorized = checkIfComponentIsAuthorized(
                component["code"],
                featuresSubscription,
            );
        }

        if (componentIsAuthorized) {
            return React.createElement(componentList[component.type], {
                key: component.id,
                component,
                images,
                htmlCollection,
                mode: mode,
                modeType: modeType,
            });
        }

        return React.createElement(
            () => (
                <div
                    style={{ minHeight: "10vh" }}
                    className="d-flex align-items-center justify-content-center">
                    <div className="text-center">
                        <p className="">
                            Subscription is expired{" "}
                            <span className="text-danger">
                                {component.type}
                            </span>{" "}
                            Component will not render.
                        </p>
                    </div>
                </div>
            ),
            { key: component.id },
        );
    }

    return React.createElement(
        () => (
            <div
                // style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="">
                        The Component for{" "}
                        <span className="text-danger">{component.type}</span>{" "}
                        has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id },
    );
}

export default RenderPreview;

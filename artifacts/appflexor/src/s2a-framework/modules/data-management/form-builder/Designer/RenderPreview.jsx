import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { evaluateExpression } from "../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import { componentList } from "./ComponentRegistry";

const RenderPreview = ({
    layout,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    pageId,
    formData = {},
    dataKeys = {},
    handleInputFields,
}) => {
    const appContext = useContext(AppContext);

    const isVisible = expression =>
        evaluateExpression(
            { expression },
            formData,
            appContext?.channel,
            appContext?.userGroups,
            appContext?.profile,
            appContext?.isAuthorized,
            appContext?.tenantSubscription,
            appContext,
        );

    function renderRow(row) {
        return (
            <Row
                key={row.id}
                rowData={row}
                components={components}
                images={images}
                htmlCollection={htmlCollection}
                mode={mode}
                modeType={modeType}
                formData={formData}
                handleInputFields={handleInputFields}
                isVisible={isVisible}></Row>
        );
    }

    return (
        <div className="container-fluid s2a-page-layout">
            {layout.map((row, index) => {
                let _enableTabView = row.enableTabView;
                let _renderMode = row.renderMode;
                if (!isVisible(row.visibilityExpression)) return null;
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
                            formData={formData}
                            dataKeys={dataKeys}
                            handleInputFields={handleInputFields}
                            isVisible={isVisible}
                        />
                    );
                } else {
                    return (
                        <div
                            className={` ${row.classes ? row.classes : ""} row`}
                            key={row.id}>
                            {row.title && <span className="row-title">{row.title}</span>}
                            <Row
                                key={row.id}
                                rowData={row}
                                components={components}
                                images={images}
                                htmlCollection={htmlCollection}
                                mode={mode}
                                modeType={modeType}
                                formData={formData}
                                dataKeys={dataKeys}
                                handleInputFields={handleInputFields}
                                isVisible={isVisible}
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
    formData,
    dataKeys,
    handleInputFields,
    isVisible,
    renderMode = "ALL_TIME_ACTIVE",
}) {
    const [tabs, setTabs] = useState({});

    // `active` is only used to control rendering of active tab's component and not for bootstratp tab content visiblity.
    // Tabs are all in control of bootstratp.js

    useEffect(() => {
        let _tabs = { ...tabs };
        rowData.children.map((child, index) => {
            _tabs[child.id] = {
                title: child.title,
                active: index === 0 ? true : false,
                renderCount: index === 0 ? 1 : 0,
            };
        });
        setTabs(_tabs);
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

    const visibleTabs = rowData.children.filter(tab =>
        isVisible(tab.visibilityExpression),
    );

    return (
        <React.Fragment>
            <ul
                className={` ${
                    rowData.classes ? rowData.classes : ""
                } nav nav-tabs pt-2`}
                key={rowData.id}>
                {visibleTabs.map((tab, index) => {
                    return (
                        <li className={`nav-item`}>
                            <button
                                className={`nav-link ${
                                    index === 0 ? "active" : null
                                }`}
                                data-bs-toggle="tab"
                                data-bs-target={`#${tab.id}`}
                                type="button"
                                role="tab"
                                onClick={() => handleTabChange(tab)}>
                                {tab.title ? tab.title : `Tab ${index + 1}`}
                            </button>
                        </li>
                    );
                })}
            </ul>
            <div className="tab-content">
                {visibleTabs.map((tab, index) => {
                    return (
                        <div
                            className={`tab-pane fade ${
                                index === 0 ? "show active" : ""
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
                                modeType={modeType}
                                formData={formData}
                                dataKeys={dataKeys}
                                handleInputFields={handleInputFields}></Tab>
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
    formData,
    dataKeys,
    handleInputFields,
}) {
    return (
        <React.Fragment>
            {tabData.children.map(component => {
                return (
                    <React.Fragment key={component.id + pageId}>
                        <Component
                            key={component.id}
                            componentData={component}
                            components={components}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            modeType={modeType}
                            formData={formData}
                            dataKeys={dataKeys}
                            handleInputFields={handleInputFields}
                        />
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
    formData,
    dataKeys,
    handleInputFields,
    isVisible,
}) {
    function renderColumn(column) {
        if (!isVisible(column.visibilityExpression)) return null;
        return (
            <React.Fragment>
                <div className={`${column.classes} col-style p-0`}>
                    {
                       column?.title && <span className="column-title">{column?.title}</span>
                    }
                    <Column
                        key={column.id}
                        columnData={column}
                        components={components}
                        htmlCollection={htmlCollection}
                        images={images}
                        mode={mode}
                        modeType={modeType}
                        formData={formData}
                        dataKeys={dataKeys}
                        handleInputFields={handleInputFields}></Column>
                </div>
            </React.Fragment>
        );
    }
    return (
        <React.Fragment>
            {rowData.children.map((column, index) => {
                return (
                    <React.Fragment key={column.id}>
                        {renderColumn(column)}
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
    formData,
    dataKeys,
    handleInputFields,
}) {
    const renderComponent = component => {
        return (
            <React.Fragment>                
                <div className="col-wrapper">
                    <Component
                        key={component.id}
                        componentData={component}
                        components={components}
                        images={images}
                        htmlCollection={htmlCollection}
                        mode={mode}
                        modeType={modeType}
                        formData={formData}
                        dataKeys={dataKeys}
                        handleInputFields={handleInputFields}
                    />
                </div>
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            {columnData.children.map(component => {
                return (
                    <React.Fragment key={component.id}>
                        {renderComponent(component)}
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
    formData,
    dataKeys,
    handleInputFields,
}) {
    const [component, setComponent] = useState(null);

    useEffect(() => {
        setComponent(components[componentData.id]);
    }, [componentData]);

    // useEffect(() => {
    //     console.log(`Latest state of component`);
    //     console.log(component);
    // }, [component]);

    // console.log({ componentData });

    return (
        <React.Fragment>
            {/* <code>{JSON.stringify(component)}</code> */}
            {/* {JSON.stringify(context)} */}
            {component &&
                CreateComponent(
                    component,
                    componentList,
                    images,
                    htmlCollection,
                    mode,
                    modeType,
                    formData,
                    dataKeys,
                    handleInputFields,
                )}
        </React.Fragment>
    );
}

function CreateComponent(
    component,
    componentList,
    images,
    htmlCollection,
    mode,
    modeType,
    formData,
    dataKeys,
    handleInputFields,
) {
    if (typeof componentList[component.type] !== "undefined") {
        return React.createElement(componentList[component.type], {
            key: component.id,
            component,
            images,
            htmlCollection,
            mode: mode,
            modeType: modeType,
            formData,
            dataKeys,
            handleInputFields,
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

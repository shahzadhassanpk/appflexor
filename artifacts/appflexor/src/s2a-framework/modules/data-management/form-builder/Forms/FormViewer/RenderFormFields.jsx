import React, { useContext, useEffect, useRef, useState } from "react";
import { makeid } from "../../../../../utils/utils";
import { componentList } from "../../Designer/ComponentRegistry";
import { modeType } from "./constants";
import { AppContext } from "../../../../../../AppContext";
import Messsage from "../../../../../components/Subscription Message/Messsage";
import { evaluateExpression } from "../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";

/* componentlist help to create component against its maping */
function RenderFormFields({
    multipageDesign,
    uniqueFormId,
    formId,
    layout,
    components,
    images,
    htmlCollection,
    mode,
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn = "",
    fkValue = "",
    showTitle = false,
}) {
    const renderTabs = () => {
        let position = "TOP";
        let firstTab = 0;
        let pageCount = multipageDesign.length;

        if (!formDetails.tabsPosition || formDetails.tabsPosition === "TOP") {
            position = "TOP";
        } else {
            position = "LEFT";
        }

        // If same form is used multiple times on a same page.
        // This will help HTML DOM to target correct element by ID for events like Tabs, Tooltip etc.
        const multiFormId = makeid(8);

        return (
            <>
                <div className="row">
                    {multipageDesign.map((form, i) => {
                        if (
                            form?.isMaster &&
                            (form?.isMaster == true || form?.isMaster == "true")
                        )
                            return (
                                <div className="master-page">
                                    {form.design.layout.map(row => {
                                        return (
                                            <div
                                                className="row"
                                                key={row.id}>
                                                <Row
                                                    key={row.id}
                                                    rowData={row}
                                                    components={
                                                        form.design.components
                                                    }
                                                    images={form.design.images}
                                                    htmlCollection={
                                                        form.design
                                                            .htmlCollection
                                                    }
                                                    mode={mode}
                                                    handleInputFields={
                                                        handleInputFields
                                                    }
                                                    setDataKeys={setDataKeys}
                                                    dataKeys={dataKeys}
                                                    formData={formData}
                                                    isFormSaved={isFormSaved}
                                                    formDetails={formDetails}
                                                    fileNameMapping={
                                                        fileNameMapping
                                                    }
                                                    fkColumn={fkColumn}
                                                    fkValue={fkValue}></Row>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                    })}
                </div>
                {position === "TOP" ? (
                    <>
                        <div className="row mt-4">
                            <ul className="nav nav-tabs">
                                {multipageDesign.map((form, i) => {
                                    if (
                                        (form?.isMaster ||
                                            form?.isMaster == "true") &&
                                        i == 0 &&
                                        firstTab < pageCount
                                    ) {
                                        firstTab = i + 1;
                                    }

                                    if (
                                        !form?.isMaster ||
                                        form?.isMaster == "false"
                                    )
                                        return (
                                            <li
                                                className="nav-item"
                                                role="presentation">
                                                <button
                                                    className={`nav-link ${
                                                        i == firstTab
                                                            ? "active"
                                                            : ""
                                                    } `}
                                                    data-bs-toggle="tab"
                                                    data-bs-target={`#${multiFormId}-${form.id}`}
                                                    type="button"

                                                    // onClick={event =>
                                                    //     handleTabsChange(event)
                                                    // }
                                                >
                                                    <span
                                                        className={`${
                                                            form.icon
                                                        } ${
                                                            form.icon
                                                                ? "me-1"
                                                                : ""
                                                        }`}></span>{" "}
                                                    {form.title}
                                                </button>
                                            </li>
                                        );
                                })}
                            </ul>
                        </div>
                        <div className="row">
                            <div className="tab-content">
                                {multipageDesign.map((form, i) => {
                                    if (
                                        !form?.isMaster ||
                                        form?.isMaster == "false"
                                    )
                                        return (
                                            <div
                                                id={`${multiFormId}-${form.id}`}
                                                className={`tab-pane fade ${
                                                    i == firstTab
                                                        ? "show active"
                                                        : ""
                                                } `}>
                                                {form.design.layout.map(row => {
                                                    return (
                                                        <div
                                                            className="row"
                                                            key={row.id}>
                                                            <Row
                                                                key={row.id}
                                                                rowData={row}
                                                                components={
                                                                    form.design
                                                                        .components
                                                                }
                                                                images={
                                                                    form.design
                                                                        .images
                                                                }
                                                                htmlCollection={
                                                                    form.design
                                                                        .htmlCollection
                                                                }
                                                                mode={mode}
                                                                handleInputFields={
                                                                    handleInputFields
                                                                }
                                                                setDataKeys={
                                                                    setDataKeys
                                                                }
                                                                dataKeys={
                                                                    dataKeys
                                                                }
                                                                formData={
                                                                    formData
                                                                }
                                                                isFormSaved={
                                                                    isFormSaved
                                                                }
                                                                formDetails={
                                                                    formDetails
                                                                }
                                                                fileNameMapping={
                                                                    fileNameMapping
                                                                }
                                                                fkColumn={
                                                                    fkColumn
                                                                }
                                                                fkValue={
                                                                    fkValue
                                                                }></Row>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="s2a-form-menu-container row">
                        <div className="col-sm-3 s2a-border">
                            <ul className="s2a-form-menu nav flex-column">
                                {multipageDesign.map((form, i) => {
                                    if (
                                        !form?.isMaster ||
                                        form?.isMaster == "false"
                                    )
                                        return (
                                            <li
                                                // className="nav-item"
                                                role="presentation">
                                                <div
                                                    className={`s2a-form-menu-item nav-link ${
                                                        i == firstTab
                                                            ? "active"
                                                            : ""
                                                    } `}
                                                    data-bs-toggle="tab"
                                                    data-bs-target={`#${form.id}`}
                                                    type="button"

                                                    // onClick={event =>
                                                    //     handleTabsChange(event)
                                                    // }
                                                >
                                                    {" "}
                                                    <div className="d-flex">
                                                        <span
                                                            className={`${
                                                                form.icon
                                                            } ${
                                                                form.icon
                                                                    ? "me-1"
                                                                    : ""
                                                            }`}></span>{" "}
                                                        {form.title}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                })}
                            </ul>
                        </div>
                        <div className="col-sm-9">
                            <div
                                // style={{ width: "100%" }}
                                className="s2a-form-content-container tab-content">
                                {multipageDesign.map((form, i) => {
                                    if (
                                        !form?.isMaster ||
                                        form?.isMaster == "false"
                                    )
                                        return (
                                            <>
                                                <div
                                                    id={`${form.id}`}
                                                    className={`tab-pane fade ${
                                                        i == firstTab
                                                            ? "show active"
                                                            : ""
                                                    } `}>
                                                    <div className="col-sm-12 s2a-form-title">
                                                        {form.title}
                                                    </div>
                                                    <div className="container">
                                                        {form.design.layout.map(
                                                            row => {
                                                                return (
                                                                    <div
                                                                        className="row"
                                                                        key={
                                                                            row.id
                                                                        }>
                                                                        <Row
                                                                            key={
                                                                                row.id
                                                                            }
                                                                            rowData={
                                                                                row
                                                                            }
                                                                            components={
                                                                                form
                                                                                    .design
                                                                                    .components
                                                                            }
                                                                            images={
                                                                                form
                                                                                    .design
                                                                                    .images
                                                                            }
                                                                            htmlCollection={
                                                                                form
                                                                                    .design
                                                                                    .htmlCollection
                                                                            }
                                                                            mode={
                                                                                mode
                                                                            }
                                                                            handleInputFields={
                                                                                handleInputFields
                                                                            }
                                                                            setDataKeys={
                                                                                setDataKeys
                                                                            }
                                                                            dataKeys={
                                                                                dataKeys
                                                                            }
                                                                            formData={
                                                                                formData
                                                                            }
                                                                            isFormSaved={
                                                                                isFormSaved
                                                                            }
                                                                            formDetails={
                                                                                formDetails
                                                                            }
                                                                            fileNameMapping={
                                                                                fileNameMapping
                                                                            }
                                                                            fkColumn={
                                                                                fkColumn
                                                                            }
                                                                            fkValue={
                                                                                fkValue
                                                                            }></Row>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            {formDetails.enableMultipage === "YES" ? (
                <>{renderTabs()}</>
            ) : (
                <>
                    {layout.map((row, index) => {
                        let _enableTabView = row.enableTabView;
                        let _renderMode = row.renderMode || "ALL_TIME_ACTIVE";
                        if (
                            _enableTabView &&
                            _enableTabView !== "" &&
                            _enableTabView === "YES"
                        ) {
                            return (
                                <RenderTabs
                                    key={row.id}
                                    uniqueFormId={uniqueFormId}
                                    renderMode={_renderMode}
                                    rowData={row}
                                    components={components}
                                    images={images}
                                    htmlCollection={htmlCollection}
                                    mode={mode}
                                    modeType={modeType}
                                    formId={formId}
                                    handleInputFields={handleInputFields}
                                    setDataKeys={setDataKeys}
                                    dataKeys={dataKeys}
                                    formData={formData}
                                    isFormSaved={isFormSaved}
                                    formDetails={formDetails}
                                    fileNameMapping={fileNameMapping}
                                    fkColumn={fkColumn}
                                    fkValue={fkValue}
                                />
                            );
                        } else {
                            return (
                                <div
                                    className={` ${
                                        row.classes ? row.classes : ""
                                    } row`}
                                    key={row.id}>
                                    <Row
                                        key={row.id}
                                        rowData={row}
                                        components={components}
                                        images={images}
                                        htmlCollection={htmlCollection}
                                        mode={mode}
                                        handleInputFields={handleInputFields}
                                        setDataKeys={setDataKeys}
                                        dataKeys={dataKeys}
                                        formData={formData}
                                        isFormSaved={isFormSaved}
                                        formDetails={formDetails}
                                        fileNameMapping={fileNameMapping}
                                        fkColumn={fkColumn}
                                        fkValue={fkValue}
                                    />
                                </div>
                            );
                        }
                    })}
                </>
            )}
        </>
    );
}

function RenderTabs({
    renderMode = "ALL_TIME_ACTIVE",
    rowData,
    uniqueFormId,
    components,
    images,
    htmlCollection,
    mode,
    modeType,
    formId,
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn,
    fkValue,
}) {
    const [tabs, setTabs] = useState({});
    const [firstVisibleTab, setFirstVisibleTab] = useState(null);
    const tabRefs = useRef({});
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

    // Detect first visible tab after render
    useEffect(() => {
        const visibleTabs = rowData.children.filter(tab => {
            const data = { ...formData };
            return evaluateExpression(
                { expression: tab.visibilityExpression },
                data,
            );
        });

        if (visibleTabs.length > 0) {
            const firstTab = visibleTabs[0];
            setFirstVisibleTab(firstTab.id);
        }
    }, [rowData.children, formData]);

    // Trigger click automatically on first visible tab
    useEffect(() => {
        if (firstVisibleTab && tabRefs.current[firstVisibleTab]) {
            tabRefs.current[firstVisibleTab].click();
        }
    }, [firstVisibleTab]);

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
                    const visibleExp = tab.visibilityExpression;
                    const data = { ...formData };
                    const _visible = evaluateExpression(
                        { expression: visibleExp },
                        data,
                    );
                    if (!_visible) return null;
                    return (
                        <>
                            {_visible && (
                                <li className={`nav-item`}>
                                    <button
                                        ref={el =>
                                            (tabRefs.current[tab.id] = el)
                                        }
                                        className={`nav-link ${
                                            index === 0 ? "active" : null
                                        }`}
                                        data-bs-toggle="tab"
                                        data-bs-target={`#${tab.id}${uniqueFormId}`}
                                        type="button"
                                        role="tab"
                                        onClick={() => handleTabChange(tab)}>
                                        {tab.title
                                            ? tab.title
                                            : `Tab ${index + 1}`}
                                    </button>
                                    {/* {visibleExp} */}
                                    {/* {JSON.stringify(tab)} */}
                                </li>
                            )}
                        </>
                    );
                })}
            </ul>
            <div className="tab-content">
                {rowData.children.map((tab, index) => {
                    let visibleExp = tab.visibilityExpression;
                    let data = { ...formData };
                    let _visible = evaluateExpression(
                        { expression: visibleExp },
                        data,
                    );
                    if (!_visible) return null;
                    return (
                        <div
                            className={`tab-pane fade ${
                                index === 0 ? "show active" : ""
                            }`}
                            id={`${tab.id}${uniqueFormId}`}>
                            {_visible && (
                                <Tab
                                    key={tab.id}
                                    tabData={tab}
                                    renderMode={renderMode}
                                    activeTabData={tabs[tab.id]}
                                    components={components}
                                    images={images}
                                    mode={mode}
                                    htmlCollection={htmlCollection}
                                    modeType={modeType}
                                    formId={formId}
                                    rowData={tab}
                                    handleInputFields={handleInputFields}
                                    setDataKeys={setDataKeys}
                                    dataKeys={dataKeys}
                                    formData={formData}
                                    isFormSaved={isFormSaved}
                                    formDetails={formDetails}
                                    fileNameMapping={fileNameMapping}
                                    fkColumn={fkColumn}
                                    fkValue={fkValue}
                                />
                            )}
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
    handleInputFields,
    mode,
    formData,
    htmlCollection,
    modeType,
    formId,
}) {
    return (
        <React.Fragment>
            {tabData.children.map(component => {
                return (
                    <React.Fragment key={component.id + formId}>
                        <Component
                            key={component.id}
                            componentData={component}
                            components={components}
                            handleInputFields={handleInputFields}
                            formData={formData}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            modeType={modeType}
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
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn,
    fkValue,
}) {
    const [visible, setVisible] = useState(true);
    let data = { ...formData };

    useEffect(() => {
        let visibleExp = rowData.visibilityExpression;
        if (visibleExp && visibleExp !== "") {
            let _visible = evaluateExpression({ expression: visibleExp }, data);
            setVisible(_visible);
        }
    }, [rowData, data]);

    function renderColumn(column) {
        let visibleExp = column.visibilityExpression;
        let _visible = true;
        if (visibleExp && visibleExp !== "") {
            let _visible = evaluateExpression({ expression: visibleExp }, data);
        }
        return (
            <React.Fragment>
                {/* {JSON.stringify(_visible)} */}
                {_visible && (
                    //SHA
                    <div className={`${column.classes} col-style p-0`}>
                        <Column
                            key={column.id}
                            columnData={column}
                            components={components}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            handleInputFields={handleInputFields}
                            setDataKeys={setDataKeys}
                            dataKeys={dataKeys}
                            formData={formData}
                            isFormSaved={isFormSaved}
                            formDetails={formDetails}
                            fileNameMapping={fileNameMapping}
                            fkColumn={fkColumn}
                            fkValue={fkValue}></Column>
                    </div>
                )}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {visible &&
                rowData.children.map((column, index) => {
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
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn,
    fkValue,
}) {
    const [visible, setVisible] = useState(true);
    let data = { ...formData };

    useEffect(() => {
        let visibleExp = columnData.visibilityExpression;
        if (visibleExp && visibleExp !== "") {
            setVisible(evaluateExpression({ expression: visibleExp }, data));
        }
    }, [columnData, data]);

    const renderComponent = component => {
        return (
            <React.Fragment>
                {/* <code>{JSON.stringify(components[component.id].data.code)}</code> */}
                {visible && (
                    <div
                        className={`col-wrapper ${
                            columnData.classNames ? columnData.classNames : ""
                        }`}>
                        <Component
                            key={component.id}
                            componentData={component}
                            components={components}
                            images={images}
                            htmlCollection={htmlCollection}
                            mode={mode}
                            handleInputFields={handleInputFields}
                            setDataKeys={setDataKeys}
                            dataKeys={dataKeys}
                            formData={formData}
                            isFormSaved={isFormSaved}
                            formDetails={formDetails}
                            fileNameMapping={fileNameMapping}
                            fkColumn={fkColumn}
                            fkValue={fkValue}
                        />
                    </div>
                )}
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
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn,
    fkValue,
}) {
    const [component, setComponent] = useState(null);

    useEffect(() => {
        setComponent(components[componentData.id]);
    }, [componentData]);
    return (
        <React.Fragment>
            {/* <code>{JSON.stringify(formDetails)}</code> */}
            {component &&
                CreateComponent(
                    component,
                    componentList,
                    images,
                    htmlCollection,
                    mode,
                    handleInputFields,
                    setDataKeys,
                    dataKeys,
                    formData,
                    isFormSaved,
                    formDetails,
                    fileNameMapping,
                    fkColumn,
                    fkValue,
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
    handleInputFields,
    setDataKeys,
    dataKeys,
    formData,
    isFormSaved,
    formDetails,
    fileNameMapping,
    fkColumn,
    fkValue,
) {
    if (typeof componentList[component.type] !== "undefined") {
        return React.createElement(componentList[component.type], {
            key: component.id,
            component,
            images,
            htmlCollection,
            mode: mode,
            modeType: modeType,
            handleInputFields,
            setDataKeys,
            dataKeys,
            formData,
            isFormSaved,
            formDetails,
            fileNameMapping,
            fkColumn,
            fkValue,
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
export default RenderFormFields;

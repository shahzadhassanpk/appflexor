import React, { useState } from "react";
import SiteDetails from "./SiteDetail";
import SiteFooterLogin from "./SiteFooterLogin";
import SiteSSO from "./SiteSSO";
import SiteIntegrations from "./SiteIntegrations";
export default function SiteTabs({
    domain,
    selectedItem,
    setSelectedItem,
    encodedFilesCollection,
    setEncodedFilesCollection,
    handleSaveData,
    handleInputField,
    handleEditor,
    entityList,
    contentList,
    getData,
    editItem,
    capitalizeFirstLetter,
    colorPalette,
    saveIsDisabled,
    clearFields,
    handleColorPalette,
    showModal,
    styles,
    guestUserList,
    selectedGuestUser,
    setSelectedGuestUser,
}) {
    const [tabs, setTabs] = useState({
        site: "true",
        integrations: "false",
        sso: "true",
    });

    function handleTabsChange(event) {
        let name = event.target.name;
        let keys = Object.keys(tabs);
        let obj = {};

        keys.forEach(key => {
            if (name == key) obj[key] = "true";
            else obj[key] = "false";
        });
        setTabs(obj);
    }

    return (
        <div
            id="SiteTab"
            className="content-management container-fluid static-module-bg p-0">
            <ul
                className="nav nav-tabs"
                id="myTab"
                role="tablist">
                <li
                    className="nav-item"
                    role="presentation">
                    <button
                        className="nav-link active "
                        id="menu-tab"
                        name="menu"
                        data-bs-toggle="tab"
                        data-bs-target="#site"
                        type="button"
                        role="tab"
                        aria-controls="menu"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Site Layout
                    </button>
                </li>
                {/* <li
                    className="nav-item"
                    role="presentation">
                    <button
                        className="nav-link"
                        id="menu-tab"
                        name="menu"
                        data-bs-toggle="tab"
                        data-bs-target="#integrations"
                        type="button"
                        role="tab"
                        aria-controls="menu"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Integrations
                    </button>
                </li> */}
                {/* <li
                    className="nav-item"
                    role="presentation">
                    <button
                        className="nav-link "
                        id="menu-tab"
                        name="menu"
                        data-bs-toggle="tab"
                        data-bs-target="#footerLogin"
                        type="button"
                        role="tab"
                        aria-controls="footerLogin"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Login and Footer
                    </button>
                </li> */}
            </ul>
            <div
                className="tab-content"
                id="myTabContent">
                <div
                    className="tab-pane fade show active"
                    id="site"
                    role="tabpanel"
                    aria-labelledby="site-tab">
                    <SiteDetails
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        encodedFilesCollection={encodedFilesCollection}
                        setEncodedFilesCollection={setEncodedFilesCollection}
                        domain={domain}
                        handleSaveData={handleSaveData}
                        handleInputField={handleInputField}
                        handleEditor={handleEditor}
                        entityList={entityList}
                        contentList={contentList}
                        getData={getData}
                        editItem={editItem}
                        capitalizeFirstLetter={capitalizeFirstLetter}
                        colorPalette={colorPalette}
                        saveIsDisabled={saveIsDisabled}
                        clearFields={clearFields}
                        handleColorPalette={handleColorPalette}
                        tabs={tabs}
                        showModal={showModal}
                        styles={styles}
                        guestUserList={guestUserList}
                        selectedGuestUser={selectedGuestUser}
                        setSelectedGuestUser={setSelectedGuestUser}
                    />
                </div>

                <div
                    className="tab-pane fade show"
                    id="footerLogin"
                    role="tabpanel"
                    aria-labelledby="sso-tab">
                    <SiteFooterLogin
                        // selectedItem={selectedItem}
                        // saveIsDisabled={saveIsDisabled}
                        // clearFields={clearFields}
                        // handleSaveData={handleSaveData}
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        encodedFilesCollection={encodedFilesCollection}
                        setEncodedFilesCollection={setEncodedFilesCollection}
                        domain={domain}
                        handleSaveData={handleSaveData}
                        handleInputField={handleInputField}
                        handleEditor={handleEditor}
                        entityList={entityList}
                        getData={getData}
                        capitalizeFirstLetter={capitalizeFirstLetter}
                        colorPalette={colorPalette}
                        saveIsDisabled={saveIsDisabled}
                        clearFields={clearFields}
                        handleColorPalette={handleColorPalette}
                        tabs={tabs}
                        showModal={showModal}
                        styles={styles}
                        guestUserList={guestUserList}
                        selectedGuestUser={selectedGuestUser}
                        setSelectedGuestUser={setSelectedGuestUser}
                    />
                </div>
                <div
                    className="tab-pane fade show"
                    id="integrations"
                    role="tabpanel"
                    aria-labelledby="integrations-tab">
                    <SiteIntegrations
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        encodedFilesCollection={encodedFilesCollection}
                        setEncodedFilesCollection={setEncodedFilesCollection}
                        domain={domain}
                        handleSaveData={handleSaveData}
                        handleInputField={handleInputField}
                        handleEditor={handleEditor}
                        entityList={entityList}
                        contentList={contentList}
                        getData={getData}
                        editItem={editItem}
                        capitalizeFirstLetter={capitalizeFirstLetter}
                        colorPalette={colorPalette}
                        saveIsDisabled={saveIsDisabled}
                        clearFields={clearFields}
                        handleColorPalette={handleColorPalette}
                        tabs={tabs}
                        showModal={showModal}
                        styles={styles}
                        guestUserList={guestUserList}
                        selectedGuestUser={selectedGuestUser}
                        setSelectedGuestUser={setSelectedGuestUser}
                    />
                </div>
            </div>
        </div>
    );
}

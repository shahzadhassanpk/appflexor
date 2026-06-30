import React, { useState } from "react";
import { OrganizationDetails } from "./OrganizationDetails";
import { OrganizationUsers } from "./OrganizationUsers";
import { AssociatedSites } from "./AssociatedSites";

function Organization({
    selectedItem,
    setSelectedEntity,
    clearFields,
    handleInputChange,
    handleSaveEntity,
    handleDeleteEntity,
    saveIsDisabled,
    cancelIsDisabled,
    invalidEmail,
    handleAddNewAction,
    userList,
    existingUsers,
    getData,
}) {
    const [tabs, setTabs] = useState({
        organizationDetails: "true",
        associatedSites: "false",
        organizationUsers: "false",
    });

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
            id="Organization"
            className="mb-2 container-fluid form-background s2a-organization">
            <nav className="">
                <div
                    className="nav nav-tabs"
                    id="nav-tab"
                    role="tablist">
                    <button
                        className="nav-link active mb-1"
                        id="organizationDetails-tab"
                        name="organizationDetails"
                        data-bs-toggle="tab"
                        data-bs-target="#organizationDetails"
                        type="button"
                        role="tab"
                        aria-controls="organizationDetails"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}>
                        Organization Details
                    </button>
                    <button
                        className="nav-link mb-1"
                        id="associatedSites-tab"
                        name="associatedSites"
                        data-bs-toggle="tab"
                        data-bs-target="#associatedSites"
                        type="button"
                        role="tab"
                        aria-controls="associatedSites"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}
                        disabled={selectedItem.id === "new"}>
                        Associated Sites
                    </button>
                    <button
                        className="nav-link mb-1"
                        id="organizationUsers-tab"
                        name="organizationUsers"
                        data-bs-toggle="tab"
                        data-bs-target="#organizationUsers"
                        type="button"
                        role="tab"
                        aria-controls="organizationUsers"
                        aria-selected="false"
                        onClick={event => handleTabsChange(event)}
                        disabled={selectedItem.id === "new"}>
                        Associated Users
                    </button>
                </div>
            </nav>
            <div
                className="tab-content"
                id="nav-tabContent">
                <div
                    className="tab-pane fade show active"
                    id="organizationDetails"
                    role="tabpanel"
                    aria-labelledby="organizationDetails-tab"
                    tabIndex="0">
                    <OrganizationDetails
                        selectedItem={selectedItem}
                        setSelectedEntity={setSelectedEntity}
                        clearFields={clearFields}
                        handleInputChange={handleInputChange}
                        handleSaveEntity={handleSaveEntity}
                        handleDeleteEntity={handleDeleteEntity}
                        saveIsDisabled={saveIsDisabled}
                        cancelIsDisabled={cancelIsDisabled}
                        invalidEmail={invalidEmail}
                        handleAddNewAction={handleAddNewAction}
                        activeTab={tabs}
                        getData={getData}
                    />
                </div>
                <div
                    className="tab-pane fade"
                    id="associatedSites"
                    role="tabpanel"
                    aria-labelledby="associatedSites-tab"
                    tabIndex="0">
                    <AssociatedSites
                        selectedId={selectedItem.id}
                        userList={userList}
                        existingUsers={existingUsers}
                        activeTab={tabs}
                    />
                </div>
                <div
                    className="tab-pane fade"
                    id="organizationUsers"
                    role="tabpanel"
                    aria-labelledby="organizationUsers-tab"
                    tabIndex="0">
                    <OrganizationUsers
                        selectedId={selectedItem.id}
                        userList={userList}
                        existingUsers={existingUsers}
                        activeTab={tabs}
                        getUsers = {getData}
                    />
                </div>
            </div>
        </div>
    );
}

export { Organization };

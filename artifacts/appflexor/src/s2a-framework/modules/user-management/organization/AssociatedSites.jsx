import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { MultiSelect } from "react-multi-select-component";
import { API_URL } from "../../../Config";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { AppContext } from "../../../../AppContext";

function AssociatedSites({ selectedId, activeTab }) {
    const appContext = useContext(AppContext);
    const channel = appContext.channel;

    const [selectedSites, setSelectedSites] = useState([]);
    const [isChanged, setIsChanged] = useState(false);
    const [associatedSites, setAssociatedSites] = useState([]);
    const [associatedList, setAssociatedList] = useState([]); // Store the full associated list for id lookup
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);

    useEffect(() => {
        setSaveIsDisabled(!isChanged);
    }, [selectedSites, isChanged]);

    useEffect(() => {
        if (selectedId && activeTab.associatedSites === "true") {
            getData();
        }
    }, [selectedId, activeTab.associatedSites]);

    function handleSiteChange(selectedObjects) {
        setSelectedSites(selectedObjects);
        setIsChanged(true);
    }

    function getData() {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.subscription,
                    dataKey: "appSites",
                    serviceKey: "sys.site.administration",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let _sites = response.data.C_DATA.appSites;
                    const sites = [];
                    _sites.forEach(item => {
                        if (                            
                            !item.organization_id || item.organization_id === selectedId
                        ) {
                            let _item = {
                                label: item.brand_title,
                                value: item.id,
                                organization_id: item.organization_id,
                            };
                            sites.push(_item);
                        }
                        
                    });

                    setAssociatedSites(sites);
                    getAssociatedSiteData(sites); // Pass the sites for mapping
                } else {
                    setAssociatedSites([]);
                }
                setIsChanged(false);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    }

    function getAssociatedSiteData(availableSites) {
        setAssociatedList(availableSites);
        const preselectedSites = availableSites.filter(
            site => site.organization_id === selectedId,
        );

        setSelectedSites(preselectedSites); // Set the preselected sites
    }

    function getAssociatedSiteDataOld(availableSites) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedId,
                    dataKey: "associatedList",
                    serviceKey: "sys.associated.sites",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    const list = response.data.C_DATA.associatedList.map(
                        item => ({
                            id: item.id,
                            label: item.brand_title,
                            value: item.site_id,
                            organization_id: item.organization_id,
                        }),
                    );
                    setAssociatedList(list);
                    const preselectedSites = availableSites.filter(
                        site => site.organization_id === selectedId,
                    );

                    setSelectedSites(preselectedSites); // Set the preselected sites
                } else {
                    setSelectedSites([]);
                }
            })
            .catch(error => {
                console.error("Error fetching associated sites:", error);
            });
    }

    function saveAssociatedSites() {
        const sitesToDelete = associatedList.filter(
            assoc =>
                !selectedSites.some(
                    site => site.organization_id === assoc.organization_id,
                ),
        );

        const request = {
            data: selectedSites.map(site => {
                const existingSite = associatedList.find(
                    assoc => assoc.value === site.value,
                );

                return {
                    formId: "associated_site",
                    entity: "associated_site",
                    action: "update",
                    formData: {
                        id: "new",
                        site_id: site.value,
                        organization_id: selectedId,
                    },
                    id: "new",
                };
            }),
        };
        const deleteRequests = [{
            formId: "associated_site",
            entity: "associated_site",
            action: "fk_delete",
            id: selectedId,
            fk_id: selectedId,
            fk_name: "organization_id",
        }];
        const combinedRequest = {
            data: [...deleteRequests, ...request.data],
        };

        axios
            .post(API_URL + "?service.key=update.formData", combinedRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    toastEmitter("Associated sites saved successfully", true);
                    getData();
                } else {
                    console.error("Unable to save associated sites.");
                }
            })
            .catch(error => {
                console.error("Error saving associated sites:", error);
            });
    }

    return (
        <div
            id="organization-users"
            className="col-sm-12">
            <div className="row mt-2">
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">
                            Available Sites&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <MultiSelect
                            options={associatedSites}
                            value={selectedSites}
                            onChange={handleSiteChange}
                            labelledBy="Select"
                        />
                    </div>
                </div>
                {selectedId !== "" && selectedId !== "new" && (
                    <div className="col-sm-12 mt-2">
                        <div className="form-group">
                            <label className="mb-1 fw-bold">
                                Associated Sites
                            </label>
                            <div className="d-flex s2a-border p-2 org-user-badge">
                                <Badge selectedSites={selectedSites} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="row mt-2">
                <div className="col-sm-12">
                    <button
                        type="button"
                        className="btn button-theme btn-sm pull-left me-2"
                        onClick={saveAssociatedSites}
                        disabled={saveIsDisabled}
                    >
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function Badge({ selectedSites }) {
    return (
        <span>
            {selectedSites &&
                selectedSites.length > 0 &&
                selectedSites.map(item => {
                    return (
                        <span
                            className="badge rounded-pill text-bg-light me-2"
                            key={item.id}>
                            {item.label}
                        </span>
                    );
                })}
        </span>
    );
}

export { AssociatedSites };

import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import ModalComponent from "../../../components/Modal/Modal";
import SearchItem from "../../../components/Searching/SearchItem";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import Listing from "../Listing/Listing";
import { SiteContext } from "../Wrapper/SiteContext";
import { getSelectedItem } from "../../../components/CrudApiCall";
import { insertItem, updateItem } from "../../../utils/utils";
import LinkForm from "./LinkForm";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";

export const featureType = [
    { label: "Internal link", value: "INTERNAL_LINK", active: true },
    { label: "External Link", value: "EXTERNAL_LINK", active: true },
    { label: "Hyper Link", value: "HYPER_LINK", active: true },
    { label: "Popup Iframe", value: "POPUP_IFRAME", active: true },
    // { label: "Popup link", value: "POPUP_LINK", active: false },
    { label: "Iframe", value: "IFRAME", active: true },
    { label: "Page", value: "PAGE", active: true },
];

function Link({ selectedModuleId, selectedChannelId, isAuthorized }) {
    let initialState = {
        id: "",
        name: "",
        channel_id: "",
        module: "",
        type: "",
        feature_key: "",
        target_id: "",
        icon: "",
        position: "",
        slug: "",
    };
    const [features, setFeatures] = useState([]);
    const [pages, setPages] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [currentSlug, setCurrentSlug] = useState({});
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedLinkId, setSelectedLinkId] = useState("");
    const inputReference = useRef(null);
    const siteContext = useContext(SiteContext);
    const [contextModuleId, setContextModuleId] = useState("");
    const [delModal, setDelModal] = useState({
        show: false,
        item: {},
    });
    const linkModalRef = useRef(null);
    const handleShow = () => linkModalRef?.current?.show();
    const handleClose = () => linkModalRef?.current?.close();

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem.name &&
            selectedItem.type &&
            selectedItem.name.length > 0 &&
            selectedItem.type.length > 0 &&
            (selectedItem.feature_key || selectedItem.target_id)
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    useEffect(() => {
        if (selectedChannelId && selectedModuleId) {
            setSelectedItem(prev => ({
                ...prev,
                channel_id: selectedChannelId,
                module: selectedModuleId,
            }));
        }
    }, [selectedChannelId, selectedModuleId]);

    useEffect(() => {
        if (siteContext && siteContext.selectedModuleId) {
            setContextModuleId(siteContext.selectedModuleId);
        }
    }, [siteContext]);

    useEffect(() => {
        if (contextModuleId) {
            getSelectedData(contextModuleId);
        }
    }, [contextModuleId]);

    useEffect(() => {
        if (selectedItem?.type === "PAGE") {
            getPages();
        }
    }, [selectedItem?.type]);

    useKeyboardShortcut(
        ["Control", "/"],
        shortcutKeys => {
            inputReference.current.focus();
        },
        {
            overrideSystem: false,
            ignoreInputFields: false,
            repeatOnHold: false,
        },
    );

    async function editItem(item) {
        handleShow();
        let link = { ...item };
        const res = await getSelectedItem({
            id: item.id,
            serviceKey: "sys.selected.link",
        });
        link = res.data.C_DATA[item.id][0];
        setSelectedItem(link);
        setCurrentSlug(link.slug);
    }

    function addNewItem() {
        setSelectedItem(prev => ({
            ...prev,
            id: "",
            name: "",
            type: "",
            feature_key: "",
            target_id: "",
            icon: "",
            position: "",
            slug: "",
        }));
        setCurrentSlug("");
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        setSelectedItem(prev => ({
            ...prev,
            id: "",
            name: "",
            type: "",
            feature_key: "",
            target_id: "",
            icon: "",
            position: "",
            slug: "",
        }));
    }

    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;
        if (name === "type") {
            setSelectedItem(prev => ({
                ...prev,
                [name]: value,
                feature_key: "",
            }));
            if (value === "PAGE") {
                getSelectedData(contextModuleId, true);
            }
        } else if (name === "slug") {
            let slug = value.trim();
            slug = slug.toLowerCase();
            slug = slug.replaceAll(/ +/gi, "-");
            setSelectedItem(prev => ({
                ...prev,
                [name]: slug,
            }));
        } else {
            setSelectedItem(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    }

    function refetch() {
        getPages();
    }

    function checkIsSlugUnique(slug) {
        let isValid = true;

        return isValid;
    }

    async function saveData(callback) {
        let _selectedItem = { ...selectedItem };
        let slug = _selectedItem["slug"];
        let isSlugValid = true;

        // if (!slug) {
        //     _selectedItem["slug"] = "";
        //     isSlugValid = true;
        // } else {
        //     slug = slug.trim();
        //     slug = slug.toLowerCase();
        //     slug = slug.replaceAll(/[^A-Z0-9]+/gi, "-");

        //     if (slug === currentSlug) {
        //         isSlugValid = true;
        //     } else {
        //         const dataRequest = {
        //             dataKeys: [
        //                 {
        //                     serviceParams: `${selectedChannelId},${slug}`,
        //                     dataKey: "slug",
        //                     serviceKey: "check.slug.exists",
        //                     mode: "formData",
        //                 },
        //             ],
        //         };

        //         try {
        //             const slugResponse = await axios.post(
        //                 API_URL + "?service.key=masterKey.tenantData",
        //                 dataRequest,
        //             );
        //             if (slugResponse.data.C_STATUS === "SUCCESS") {
        //                 if (slugResponse.data.C_DATA.slug.length === 0) {
        //                     isSlugValid = true;
        //                 }
        //             }
        //         } catch (error) {
        //             console.log(error);
        //         }
        //     }
        // }

        if (!isSlugValid) {
            toastEmitter(`Page slug ${slug}, already exists`, true, "warning");
        } else {
            _selectedItem["slug"] = slug;

            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "app_link"; //"formid"
            entityForm.entity = "app_link"; //Db- "table name"
            entityForm.action = "update";

            if (
                !selectedItem.id ||
                selectedItem.id == "" ||
                selectedItem.id == "new"
            ) {
                entityForm.id = "new";
                selectedItem.id = "new";
                _selectedItem.position = filteredItems.length;
            } else {
                entityForm.id = selectedItem.id;
            }

            entityForm.formData = _selectedItem;
            request.data.push(entityForm);

            try {
                axios.post(url, request).then(function (response) {
                    if (
                        response.status === 200 &&
                        response.data.C_STATUS === "SUCCESS"
                    ) {
                        const data = response.data.C_DATA[0].formData;
                        if (
                            selectedItem.id === "new" ||
                            selectedItem.id === ""
                        ) {
                            setSelectedItem(prev => ({
                                ...prev,
                                id: data.id,
                            }));
                            insertItem(setFeatures, data);
                            insertItem(setFilteredItems, data);
                        } else {
                            updateItem(setFeatures, data);
                            updateItem(setFilteredItems, data);
                        }
                        const status =
                            selectedItem.id == "new" || selectedItem.id == ""
                                ? "Saved"
                                : "Updated";
                        toastEmitter(`Link ${status} Successfully`, true);
                        handleClose();
                    }
                });
            } catch (e) {
                console.log("Save error:" + e);
            }
        }
    }

    function deleteData(item, condition) {
        if (condition === undefined) {
            setDelModal(prev => ({
                ...prev,
                show: true,
                item: item,
            }));
        }
        if (condition === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_link";
            entityForm.entity = "app_link";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        let _item = [...filteredItems];
                        let updatedItems = _item.filter(
                            ele => ele.id !== item.id,
                        );
                        updatedItems = updatePosition(updatedItems);
                        handleMultiUpdateLinks(updatedItems);

                        setSelectedItem({ ...initialState });
                        setDelModal(prev => ({
                            ...prev,
                            show: false,
                            item: {},
                        }));
                        toastEmitter(`Link Deleted Successfully`, true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
    }

    function handleMultiUpdateLinks(Items) {
        let request = {};
        request.data = [];
        Items.forEach(item => {
            let Link = {
                formId: "app_link",
                action: "update",
                formData: item,
                id: item.id,
                entity: "app_link",
            };
            request.data.push(Link);
        });

        let url = API_URL + "?service.key=update.formData";

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    getSelectedData(contextModuleId);
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function updatePosition(items) {
        let updateArr = [];
        items.forEach((item, index) => {
            item.position = index;
            updateArr.push(item);
        });
        return updateArr;
    }

    function getSelectedData(id, fetchPages) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "appModuleFeatures",
                    serviceKey: "sys.app.link",
                    mode: "formData",
                },
            ],
        };
        // if (id && fetchPages) {
        //     dataRequest.dataKeys.shift();
        // }

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS" && !fetchPages) {
                        if (response.data.C_DATA.appModuleFeatures) {
                            let sort =
                                response.data.C_DATA.appModuleFeatures.sort(
                                    (a, b) => a - b,
                                );
                            setFeatures(sort);
                            setFilteredItems(sort);
                        } else {
                            setFeatures([]);
                            setFilteredItems([]);
                        }
                    }
                }
            })
            .catch(error => {
                // console.error(error);
            });
    }

    function getPages() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedChannelId,
                    dataKey: "pages",
                    serviceKey: "sys.pages.links",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.pages) {
                        setPages(response.data.C_DATA.pages);
                    } else {
                        setPages([]);
                    }
                }
            })
            .catch(error => {
                // console.error(error);
            });
    }

    return (
        <React.Fragment>
            <ModalComponent
                state={delModal}
                setState={setDelModal}
                message={`Are you sure to delete ${delModal.item.name}?`}
                header="Confirm"
                operation={deleteData}
            />
            <ChildrenModal
                ref={linkModalRef}
                header={`${siteContext.moduleItem.name} > Link`}>
                <LinkForm
                    clearFeature={clearFields}
                    selectedModuleFeature={selectedItem}
                    saveFeature={saveData}
                    saveIsDisabled={saveIsDisabled}
                    inputFeature={handleInputField}
                    pages={pages}
                    filteredModulesForFeature={filteredItems}
                    featureType={featureType}
                    handleClose={handleClose}
                    refetch={refetch}
                />
            </ChildrenModal>
            <div className="">
                <LinkHeader
                    addNewItem={addNewItem}
                    totalLinks={filteredItems?.length}
                />
                <SearchItem
                    keysToSearch={["name", "type"]}
                    placeholder="Search..."
                    items={filteredItems}
                    _items={features}
                    setItems={setFilteredItems}
                />
                <Listing
                    items={filteredItems?.filter(
                        item => item.channel_id === selectedChannelId,
                    )}
                    setItems={setFilteredItems}
                    editItem={editItem}
                    deleteData={deleteData}
                    setSelectedItemId={setSelectedLinkId}
                    selectedItemId={selectedLinkId}
                    mode="link"
                    canDrag={true}
                />
            </div>
        </React.Fragment>
    );
}

function LinkHeader({ addNewItem, totalLinks }) {
    return (
        <div className="listing-header">
            <div className="col">
                <label className="sites-label">Links {`(${totalLinks})`}</label>
            </div>
            <div className="">
                <div
                    className="pointer"
                    onClick={addNewItem}
                    data-bs-toggle="modal"
                    data-bs-target="#feature"
                    title="Add Link">
                    <i className="fa-solid fa-plus"></i>
                </div>
            </div>
        </div>
    );
}

export { Link };

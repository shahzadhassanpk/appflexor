/*
Change History:
1.  Save or Updte Site in tenant db with same id.
*/

import axios from "axios";
import Color from "color";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../AppContext";

import { API_URL } from "../../../Config";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import { getSelectedItem } from "../../../components/CrudApiCall";
import {
    ExportForm,
    exportData,
} from "../../../components/ExportForm/ExportFunctions";
import ModalComponent from "../../../components/Modal/Modal";
import SearchItem from "../../../components/Searching/SearchItem";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { COLOR_PALETTE } from "../../../theme/tailwind/Layout/ColorPalette";
import {
    deleteItem,
    filterArrayByTerms,
    insertItem,
    updateItem,
} from "../../../utils/utils";
import CsvModal from "../../data-management/datalist-builder/custom-action-modal/CsvModal";
import {
    tryParseJSONObject,
    tryToParse,
} from "../../data-management/form-builder/Forms/FormViewer/utils";
import Listing from "../Listing/Listing";
import SiteForm from "./SiteForm";

export const SITE_PREFRENCE_INIT = {
    id: "",
    entity_id: "",
    content_id: "",
    product_list: [],
    domain: "",
    brand_logo: "",
    brand_text: "",
    brand_title: "",
    keep_me_login: "NO",
    allow_signup: "NO",
    footer_html: "",
    sso_login: [],
    guest_login: "NO",
    site_preference: {
        menu_position: "header",
        color_palette: COLOR_PALETTE[0].id,
        primary: COLOR_PALETTE[0].primary,
        secondary: COLOR_PALETTE[0].secondary,
        shadow: COLOR_PALETTE[0].shadow,
        font: COLOR_PALETTE[0].font,
    },
};

const noGuestUserFound = [
    {
        label: "No guest user found",
        value: "NO_GUEST_USER_FOUND",
    },
];
const noGuestUserSelected = [
    {
        label: "No guest user selected",
        value: "NO_GUEST_USER_SELECTED",
    },
];
// const domain = ".step2agility.com";

function Site({ selectedChannelFromChild, activeTab, isAuthorized }) {
    const appContext = useContext(AppContext);
    const channel = appContext.channel;
    const subscription_id = appContext.channel.subscription;
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(SITE_PREFRENCE_INIT);
    const [entityList, setEntityList] = useState([]);
    const [contentList, setContentList] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState(
        selectedChannelFromChild,
    );
    const [tenantSite, setTenantSite] = useState("");
    const [colorPalette] = useState(COLOR_PALETTE);
    const [encodedFilesCollection, setEncodedFilesCollection] = useState([]);
    const [styles, setStyles] = useState([]);
    const [guestUserList, setGuestUserList] = useState(noGuestUserFound);
    const [selectedGuestUser, setSelectedGuestUser] =
        useState(noGuestUserSelected);

    const [delModal, setDelModal] = useState({
        show: false,
        item: {},
    });

    const [csvModal, setCsvModal] = useState(false);
    const searchInput = useRef(null);

    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const clone = x => JSON.parse(JSON.stringify(x));
    const keysToSearch = ["brand_title", "domain"];
    const siteModalRef = useRef(null);
    const handleShow = () => siteModalRef?.current?.show();
    const handleClose = () => siteModalRef?.current?.close();

    useEffect(() => {
        const stored = localStorage.getItem("selectedChannelId");
        if (!stored) {
            // Reload or no stored value → reset to channel.id
            setSelectedChannelId(channel.id);
            localStorage.setItem("selectedChannelId", channel.id);
        } else {
            // Use stored value if available
            localStorage.setItem("selectedChannelId", stored);

            setSelectedChannelId(stored);
        }
    }, [channel]);

    useEffect(() => {
        if (selectedChannelId) {
            localStorage.setItem("selectedChannelId", selectedChannelId);
        }
    }, [selectedChannelId]);

    useEffect(() => {
        let disabled = true;
        if (
            selectedItem.brand_title.length > 0 &&
            selectedItem.domain.length > 0
        ) {
            disabled = false;
        } else {
            disabled = true;
        }

        // if (!disabled && selectedItem.guest_login === "YES") {
        //     if (
        //         selectedGuestUser.value !== "" &&
        //         selectedGuestUser.value !== "NO_GUEST_USER_FOUND" &&
        //         selectedGuestUser.value !== "NO_GUEST_USER_SELECTED"
        //     ) {
        //         disabled = false;
        //     } else {
        //         disabled = true;
        //     }
        // }

        setSaveIsDisabled(disabled);
    }, [selectedItem, selectedGuestUser]);

    useEffect(() => {
        if (selectedItem?.id !== "") {
            getData();
        }
    }, [selectedItem?.id]);

    useEffect(() => {
        if (channel && channel.subscription && activeTab === "SITES") {
            getChannels();
        }
    }, [channel]);

    useEffect(() => {
        if (selectedChannelId !== undefined && selectedChannelId) {
            selectedChannelFromChild(selectedChannelId);
        }
    }, [selectedChannelId]);

    async function editItem(item) {
        try {
            handleShow();
            let channel = { ...item };
            const res = await getSelectedItem({
                id: item.id,
                url: API_URL + "?service.key=master.data",
                serviceKey: "sys.selected.site",
            });
            channel = res.data.C_DATA[item.id][0];

            if (!channel.sso_login) {
                channel.sso_login = {
                    ...SITE_PREFRENCE_INIT.sso_login,
                };
            } else if (typeof channel.sso_login === "string") {
                channel.sso_login = tryToParse(channel.sso_login);
            }

            if (!channel.site_preference) {
                channel.site_preference = {
                    ...SITE_PREFRENCE_INIT.site_preference,
                };
            } else if (typeof channel.site_preference === "string") {
                channel.site_preference = tryToParse(channel.site_preference);
            }

            const site_preference = channel.site_preference;
            const filteredItem = COLOR_PALETTE.find(
                color => color.id === site_preference.color_palette,
            );

            for (let key in site_preference) {
                if (site_preference[key] === "") {
                    channel.site_preference[key] = filteredItem[key];
                }
            }

            if (!channel.guest_login) {
                channel.guest_login = "NO";
            }

            if (channel.guest_login === "YES") {
                setSelectedGuestUser({
                    label: channel.username,
                    value: channel.username,
                });
            } else {
                setSelectedGuestUser(noGuestUserSelected[0]);
            }

            if (!channel.allow_signup) {
                channel.allow_signup = "NO";
            }

            if (!channel.menu_position) {
                channel.menu_position = "header";
            }
            setSelectedItem(channel);
        } catch (error) {
            console.log(error);
        }
    }

    function addNewItem() {
        handleClose();
        setSelectedItem(SITE_PREFRENCE_INIT);
        setSaveIsDisabled(true);
        setSelectedGuestUser(noGuestUserSelected);
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event, id) {
        let name = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.name;
            let isChecked = event.target.checked;

            let currentState = clone(selectedItem);

            if (isChecked) {
                // for exixsting sites the `sso_login` is undefined
                if (currentState.sso_login) {
                    currentState.sso_login.indexOf(value === -1) &&
                        currentState.sso_login.push(value);
                } else {
                    currentState.sso_login = [];
                    currentState.sso_login.push(value);
                }
            } else {
                currentState.sso_login = currentState.sso_login.filter(
                    i => i !== value,
                );
            }

            setSelectedItem(currentState);
        } else if (name === "menu_position") {
            value = event.target.value;
            // "FIXED" is default sidebar state,
            // If user changes "menu_position" when state is "HOVER" this will resets it's state from "HOVER" to "FIXED"
            localStorage.setItem("SIDE_NAVBAR_STATE", "FIXED");

            setSelectedItem({
                ...selectedItem,
                site_preference: {
                    ...selectedItem.site_preference,
                    [name]: value,
                },
            });
        } else {
            value = event.target.value;

            setSelectedItem(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    }

    function handleMultiDeleteLinkAndMenu(Links, Menus) {
        // ;
        let request = {};
        request.data = [];
        Links &&
            Links.forEach(item => {
                let Link = {
                    formId: "app_link",
                    action: "delete",
                    id: item.id,
                    entity: "app_link",
                };
                request.data.push(Link);
            });

        Menus &&
            Menus.forEach(item => {
                let Menu = {
                    formId: "app_menu",
                    action: "delete",
                    id: item.id,
                    entity: "app_menu",
                };
                request.data.push(Menu);
            });

        let url = API_URL + "?service.key=update.site";

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    selectedChannelFromChild("", "delete");
                    // getSelectedChannelMenu(channelIdOnly);
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function parseSsoLogin(items = []) {
        let arr = [];

        if (items && items.length !== 0) {
            arr = items.map(item => {
                if (item.sso_login) {
                    item.sso_login = tryParseJSONObject(item.sso_login, []);
                } else item.sso_login = [];
                return item;
            });
        }
        return arr;
    }

    function handleColorPalette(selection) {
        setSelectedItem({
            ...selectedItem,
            site_preference: {
                ...selectedItem.site_preference,
                color_palette: selection.id,
                label: selection.label,
                primary: selection.primary,
                secondary: selection.secondary,
                shadow: selection.shadow,
                font: selection.font,
            },
        });
    }

    function handleEditor(e) {
        const { id, value } = e.target;

        setSelectedItem(prevState => ({
            ...prevState,
            [id]: value,
        }));
    }

    function selectedChannel(channelId) {
        setSelectedChannelId(channelId);
    }

    function importSites() {
        handleShowCsv();
    }

    function handleSaveData(callback) {
        var url = API_URL + "?service.key=update.site";
        var request = {};
        request.data = [];
        var entityForm = {};

        let fieldsData = { ...selectedItem };
        if (
            selectedItem.guest_login === "YES" &&
            selectedGuestUser.value !== "NO_GUEST_USER_FOUND"
        ) {
            fieldsData.username = selectedGuestUser.value;
        }

        entityForm.formId = "app_site"; //"formid"
        entityForm.entity = "app_site"; //Db- "table name"
        entityForm.action = "update";

        if (!fieldsData.id || fieldsData.id == "" || fieldsData.id == "new") {
            entityForm.id = "new";
            fieldsData.id = "new";

            fieldsData.subscription = channel.subscription;
        } else {
            entityForm.id = fieldsData.id;
        }
        // fieldsData.domain = fieldsData.domain.concat(domain);
        entityForm.formData = fieldsData;
        entityForm.fileData = [...encodedFilesCollection];

        delete entityForm.formData.brand_logo;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    const data = response.data.C_DATA[0].formData;
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        setSelectedItem(prev => ({
                            ...prev,
                            id: data.id,
                        }));
                        insertItem(setItems, data);
                        insertItem(setFilteredItems, data);
                    } else {
                        setSelectedItem(prev => ({
                            ...prev,
                            id: data.id,
                        }));
                        updateItem(setItems, data);
                        updateItem(setFilteredItems, data);
                        toastEmitter("Site updated Successfully", true);
                    }

                    if (callback) {
                        // getChannels();
                        clearFields();
                        handleClose();
                    }
                    handleSaveTenantSite();
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
    }

    function handleSaveTenantSite() {
        var url = API_URL + "?service.key=update.formData";
        var request = {
            datasource: "",
            saveOrUpdate: "Yes",
        };
        request.data = [];
        var entityForm = {};

        let fieldsData = { ...tenantSite };
        fieldsData.id = selectedItem.id;
        fieldsData.channel_id = selectedItem.id;
        // fieldsData.entity_id = selectedItem.entity_id;
        fieldsData.domain = selectedItem.domain;
        fieldsData.brand_text = selectedItem.brand_text;
        fieldsData.brand_title = selectedItem.brand_title;
        fieldsData.brand_logo = selectedItem.brand_logo;
        fieldsData.subscription = selectedItem.subscription;
        fieldsData.site_preference = selectedItem.site_preference;

        entityForm.formId = "app_site"; //"formid"
        entityForm.entity = "app_site"; //Db- "table name"
        entityForm.action = "update";
        entityForm.id = selectedItem.id;

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    // const data = response.data.C_DATA[0].formData;
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
    }

    function deleteData(item, condition) {
        if (condition === undefined) {
            setDelModal(prev => ({
                show: true,
                item: item,
            }));
        }
        if (condition === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_site";
            entityForm.entity = "app_site";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.site", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getMenuAndLink(item.id);
                        deleteItem(setItems, item);
                        deleteItem(setFilteredItems, item);
                        // getChannels();
                        setDelModal(prev => ({
                            show: false,
                            item: {},
                        }));
                        toastEmitter("Site Deleted Successfully");
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
    }
    function getChannels(callback) {
        let _channel = {};

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
        const channelData = localStorage.getItem("channel-data");

        if (!channelData) {
            dataRequest.dataKeys.push({
                serviceParams: channel.subscription,
                dataKey: "channel",
                serviceKey: "sys.domain.site",
                mode: "formData",
            });
        }

        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    if (response.data.C_DATA.appChannel) {
                        let items = response.data.C_DATA.appChannel;
                        let parsedItems = parseSsoLogin(items);

                        if (searchInput.current.value) {
                            const result = filterArrayByTerms(
                                parsedItems,
                                searchInput.current.value.toLowerCase(),
                                keysToSearch,
                            );
                            setItems(result);
                            setFilteredItems(parsedItems);
                        } else {
                            setItems(parsedItems);
                            setFilteredItems(parsedItems);
                        }
                    } else {
                        setItems([]);
                    }
                    if (!channelData) {
                        _channel = response.data.C_DATA.channel[0];
                        setThemeColor(_channel);
                    } else {
                        _channel = channelData;
                        setThemeColor(_channel);
                    }
                    if (callback) callback();
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getData(callback) {
        let _channel = {};
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "entityList",
                    serviceKey: "sys.entity.list",
                    mode: "formData",
                },
                // {
                //     serviceParams: selectedItem?.id,
                //     dataKey: "contentList",
                //     serviceKey: "sys.public.link",
                //     mode: "formData",
                // },
                {
                    serviceParams: selectedItem?.id,
                    dataKey: "styleList",
                    serviceKey: "sys.styles",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "userList",
                    serviceKey: "list.guest.user",
                    mode: "formData",
                },
                {
                    serviceParams: selectedItem?.id,
                    dataKey: "tenantSite",
                    serviceKey: "sys.tenant.site",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    // getChannels();
                    if (response.data.C_DATA.entityList) {
                        setEntityList(response.data.C_DATA.entityList);
                    } else {
                        setEntityList([]);
                    }
                    // if (response.data.C_DATA.contentList) {
                    //     setContentList(response.data.C_DATA.contentList);
                    // } else {
                    //     setContentList([]);
                    // }
                    if (response.data.C_DATA.tenantSite.length > 0) {
                        setTenantSite(response.data.C_DATA.tenantSite[0]);
                    } else {
                        setTenantSite({ id: "new" });
                    }
                    if (response.data.C_DATA.userList) {
                        let list = response.data.C_DATA.userList;
                        let userList = list.map(item => ({
                            label: item.username,
                            value: item.username,
                        }));
                        setGuestUserList(userList);
                    } else {
                        setGuestUserList(noGuestUserFound);
                        setSelectedGuestUser(noGuestUserFound[0]);
                    }
                    if (response.data.C_DATA.styleList) {
                        setStyles(response.data.C_DATA.styleList);
                    } else {
                        setStyles([]);
                    }
                    if (callback) callback();
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function capitalizeFirstLetter(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function getMenuAndLink(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "Links",
                    serviceKey: "sys.channel.link",
                    mode: "formData",
                },
                {
                    serviceParams: id,
                    dataKey: "AppModules",
                    serviceKey: "sys.app.menu",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.Links) {
                            let _Links = response.data.C_DATA.Links;
                            let _Modules = response.data.C_DATA.AppModules;
                            // setLinks(_Links);
                            handleMultiDeleteLinkAndMenu(_Links, _Modules);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
    return (
        <div className="s2a-site">
            <ChildrenModal
                ref={siteModalRef}
                size="xl"
                header="Edit Site">
                <SiteForm
                    setShowSiteModal={handleClose}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    encodedFilesCollection={encodedFilesCollection}
                    setEncodedFilesCollection={setEncodedFilesCollection}
                    handleSaveData={handleSaveData}
                    handleInputField={handleInputField}
                    handleEditor={handleEditor}
                    entityList={entityList}
                    contentList={contentList}
                    getData={() => {}}
                    editItem={editItem}
                    capitalizeFirstLetter={capitalizeFirstLetter}
                    colorPalette={colorPalette}
                    saveIsDisabled={saveIsDisabled}
                    clearFields={clearFields}
                    handleColorPalette={handleColorPalette}
                    styles={styles}
                    guestUserList={guestUserList}
                    selectedGuestUser={selectedGuestUser}
                    setSelectedGuestUser={setSelectedGuestUser}
                />
            </ChildrenModal>
            <ModalComponent
                state={delModal}
                setState={setDelModal}
                message={`Are you sure to delete ${delModal.item.brand_title}?`}
                header="Confirm"
                operation={deleteData}
            />
            <CsvModal
                csvModal={csvModal}
                selectedSite={selectedChannelId}
                handleClose={handleCloseCsv}
                getData={getData}
                tableName="app_site"
                title={"Site Builder Import"}
            />
            <div className="">
                <SiteHeader
                    addNewItem={addNewItem}
                    importSites={importSites}
                    items={items}
                    setItems={setItems}
                    filteredItems={filteredItems}
                />
                <SearchItem
                    keysToSearch={keysToSearch}
                    placeholder="Search..."
                    items={items}
                    _items={filteredItems}
                    setItems={setItems}
                    searchInput={searchInput}
                />
                <Listing
                    items={items}
                    // domain={domain}
                    setItems={setItems}
                    editItem={editItem}
                    setShowSiteModal={handleClose}
                    deleteData={deleteData}
                    setSelectedItemId={selectedChannel}
                    selectedItemId={selectedChannelId}
                    mode="site"
                    canDrag={false}
                />
            </div>
        </div>
    );
}

function SiteHeader({
    addNewItem,
    importSites,
    items,
    setItems,
    filteredItems,
}) {
    const modalRef = useRef(null);
    function nameExport(title) {
        jsonExport(items, setItems, title);
        modalRef.current.close();
    }
    const exportSites = () => {
        const _items = structuredClone(items);
        exportData(modalRef, _items, setItems);
    };
    return (
        <div className="">
            <ChildrenModal
                ref={modalRef}
                header="Export Sites">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <div className="col">
                <div className="listing-header">
                    Sites ({items.length}/{filteredItems?.length})
                </div>
            </div>
        </div>
    );
}

function setThemeColor(channel) {
    const root = document.querySelector(":root");

    let colorToSet = {
        primary: "",
        secondary: "",
        shadow: "",
        font: "",
        header: "",
        tab: "",
        border: "",
        navigation: "",
        background: "",
    };
    channel.site_preference = tryToParse(channel.site_preference);
    const customColors = channel.site_preference;

    COLOR_PALETTE.forEach(color => {
        if (color.id === channel.site_preference.color_palette) {
            colorToSet.primary = customColors.primary
                ? customColors.primary.toLocaleUpperCase()
                : color.primary.toLocaleUpperCase();
            colorToSet.secondary = customColors.secondary
                ? customColors.secondary.toLocaleUpperCase()
                : color.secondary.toLocaleUpperCase();
            colorToSet.shadow = customColors.shadow
                ? customColors.shadow.toLocaleUpperCase()
                : color.shadow.toLocaleUpperCase();
            colorToSet.font = customColors.font
                ? customColors.font.toLocaleUpperCase()
                : color.font.toLocaleUpperCase();
            colorToSet.header = customColors.header
                ? customColors.header.toLocaleUpperCase()
                : color.header.toLocaleUpperCase();
            colorToSet.tab = customColors.tab
                ? customColors.tab.toLocaleUpperCase()
                : color.tab.toLocaleUpperCase();
            colorToSet.header = customColors.header
                ? customColors.header.toLocaleUpperCase()
                : color.header.toLocaleUpperCase();
            colorToSet.navigation = customColors.navigation
                ? customColors.navigation.toLocaleUpperCase()
                : color.navigation.toLocaleUpperCase();
        } else if (!channel.site_preference.color_palette) {
            let theme = COLOR_PALETTE.find(item => item.id === "1");
            colorToSet.primary = theme.primary.toLocaleUpperCase();
            colorToSet.secondary = theme.secondary.toLocaleUpperCase();
            colorToSet.shadow = theme.shadow.toLocaleUpperCase();
            colorToSet.font = theme.font.toLocaleUpperCase();
        }
    });

    try {
        const primaryColor = Color(colorToSet.primary.trim());
        let navigationColor = Color(colorToSet.navigation.trim());
        let headerColor = Color(colorToSet.header.trim());
        let tabColor = Color(colorToSet.tab.trim());
        let fontColor = Color(colorToSet.font.trim());
        let borderColor = Color(colorToSet?.shadow?.trim());
        if(colorToSet?.border?.trim()){
            borderColor = Color(colorToSet?.border?.trim());
        }
        let shadowColor = Color(colorToSet.shadow.trim());

        let linkActiveColor = "";

        colorToSet.primary &&
            root.style.setProperty("--primary-color", primaryColor);
        colorToSet.secondary &&
            root.style.setProperty("--secondary-color", colorToSet.secondary);
        colorToSet.background &&
            root.style.setProperty("--background-color", navigationColor);

        root.style.setProperty("--navigation-color", navigationColor);
        root.style.setProperty("--header-color", headerColor);
        root.style.setProperty("--tab-color", tabColor);
        root.style.setProperty("--shadow-color", shadowColor);
        root.style.setProperty("--font-color", fontColor);
        root.style.setProperty("--border-color", borderColor);
        root.style.setProperty("--link-active-color", linkActiveColor);
        root.style.setProperty("--bpmn-line-stroke", fontColor);
        root.style.setProperty("--bpmn-background", primaryColor);
    } catch (error) {
        console.log("Error occured setting colors variables.");
        console.error(error);
    }
}

export { COLOR_PALETTE, Site, setThemeColor };

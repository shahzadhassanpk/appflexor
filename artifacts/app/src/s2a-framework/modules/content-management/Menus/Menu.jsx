import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import { API_URL } from "../../../Config";
import Listing from "../Listing/Listing";
import { SiteContext } from "../Wrapper/SiteContext";
import ModalComponent from "../../../components/Modal/Modal";
import { getData } from "../../../components/CrudApiCall";
import { AppContext } from "../../../../AppContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { tryToParse } from "../../data-management/form-builder/Forms/FormViewer/utils";
import { JsonToCsv, insertItem, updateItem } from "../../../utils/utils";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import getChannels from "../../../components/ChannelFetching";
import { v4 as uuid4 } from "uuid";
import SearchItem from "../../../components/Searching/SearchItem";
import { getSelectedItem } from "../../../components/CrudApiCall";
import MenuForm from "./MenuForm";
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";

function Menu({ selectedChannelId, selectedModuleFromChild }) {
    let initialState = {
        id: "",
        channel_id: "",
        name: "",
        type: "",
        location: "",
        position: "",
    };
    const [filteredItems, setFilteredItems] = useState([]);
    const [menus, setMenus] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [channelIdOnly, setChannelIdOnly] = useState("");
    const [exportMenu, setExportMenu] = useState({
        name: "",
        export: [],
        modules: "",
    });
    const [delModal, setDelModal] = useState({
        show: false,
        item: {},
    });
    const inputReference = useRef(null);
    const [moduleList] = useState([
        {
            label: "Drop Down",
            value: "DROPDOWN",
            location: "BACKOFFICE,FRONTOFFICE,PUBLIC",
        },
        { label: "Link", value: "LINK", location: "FRONTOFFICE,PUBLIC" },
        { label: "Hidden", value: "HIDDEN", location: "FRONTOFFICE,PUBLIC" },
    ]);
    const siteContext = useContext(SiteContext);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const exportModal = useRef(null);
    const listings = {
        links: { list: [], serviceKey: "sys.app.builder.links" },
        datalists: { list: [], serviceKey: "sys.app.builder.export.datalists" },
        forms: { list: [], serviceKey: "sys.app.builder.export.forms" },
        pages: { list: [], serviceKey: "sys.app.builder.export.pages" },
        menus: { list: [], serviceKey: "sys.menu.list" },
    };
    const menuModalRef = useRef(null);
    const handleShow = () => menuModalRef?.current?.show();
    const handleClose = () => menuModalRef?.current?.close();

    useEffect(() => {
        if (siteContext && siteContext.selectedChannelId) {
            setChannelIdOnly(siteContext.selectedChannelId);
        }
    }, [siteContext]);

    useEffect(() => {
        if (channelIdOnly) {
            getSelectedChannelMenu(channelIdOnly);
        }
    }, [channelIdOnly]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.name.length > 0 &&
            selectedItem?.type.length > 0 &&
            selectedItem?.location.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    useEffect(() => {
        if (siteContext && siteContext.selectedModuleId === "") {
            setSelectedModuleId("");
        }
    }, [siteContext]);

    useEffect(() => {
        if (selectedChannelId) {
            setChannelId();
        }
    }, [selectedChannelId]);

    function setChannelId() {
        setSelectedItem(prev => ({
            ...prev,
            channel_id: selectedChannelId,
        }));
    }

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

    useEffect(() => {
        if (selectedModuleId !== undefined && selectedModuleId) {
            let selectedModuleItem = getObjectById(
                filteredItems,
                "id",
                selectedModuleId,
            );

            selectedModuleFromChild(selectedModuleId, selectedModuleItem);
        }
    }, [selectedModuleId, filteredItems]);

    function getObjectById(arr, idField, idValue) {
        let result;
        arr.forEach(obj => {
            if (obj[idField] === idValue) {
                result = obj;
            }
        });
        return result;
    }

    function getSelectedChannelMenu(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "appModule",
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
                        if (response.data.C_DATA.appModule) {
                            let _modules = response.data.C_DATA.appModule;
                            let sort = _modules.sort((a, b) => a - b);
                            // setModules(_modules);

                            setFilteredItems(sort);
                            setMenus(sort);
                        } else {
                            // setModules([]);
                            setFilteredItems([]);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getLinks(id, updatedItems) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "Links",
                    serviceKey: "sys.app.link",
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

                            handleMultiUpdateMenus(updatedItems, _Links);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function editItem(item) {
        let menu = { ...item };
        const res = await getSelectedItem({
            id: item.id,
            serviceKey: "sys.selected.menu",
        });
        menu = res.data.C_DATA[item.id][0];
        setSelectedItem(item);
        handleShow();
    }

    function addNewItem() {
        setSelectedItem(prev => ({
            ...prev,
            id: "",
            name: "",
            type: "",
            location: "",
            position: "",
            icon: "",
        }));
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function saveData(callback) {
        let _selectedItem = { ...selectedItem };

        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "app_menu"; //"formid"
        entityForm.entity = "app_menu"; //Db- "table name"
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
        delete _selectedItem.selected;

        entityForm.formData = _selectedItem;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    const data = response.data.C_DATA[0].formData;
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        setSelectedItem({ ...selectedItem, id: data.id });
                        insertItem(setMenus, data);
                        insertItem(setFilteredItems, data);
                    } else {
                        updateItem(setMenus, data);
                        updateItem(setFilteredItems, data);
                    }
                    const status =
                        selectedItem.id == "new" || selectedItem.id == ""
                            ? "Saved"
                            : "Updated";
                    toastEmitter(`Menu ${status} Successfully`, true);
                    handleClose();
                    getSelectedChannelMenu(selectedChannelId);
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
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
            entityForm.formId = "app_menu";
            entityForm.entity = "app_menu";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        setSelectedItem(prev => ({
                            ...prev,
                            id: "",
                            name: "",
                            type: "",
                            location: "",
                            position: "",
                            icon: "",
                        }));
                        let _item = [...filteredItems];
                        let updatedItems = _item.filter(
                            ele => ele.id !== item.id,
                        );
                        updatedItems = updatePosition(updatedItems);
                        getLinks(item.id, updatedItems);

                        setDelModal(prev => ({
                            ...prev,
                            show: false,
                            item: {},
                        }));
                        toastEmitter(`Menu Deleted Successfully`, true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
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

    function handleMultiUpdateMenus(Items, Links) {
        let request = {};
        request.data = [];

        Items.forEach(item => {
            let Link = {
                formId: "app_menu",
                action: "update",
                formData: item,
                id: item.id,
                entity: "app_menu",
            };
            request.data.push(Link);
        });

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

        let url = API_URL + "?service.key=update.formData";

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    getSelectedChannelMenu(channelIdOnly);
                    selectedModuleFromChild("");
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
    }

    function handleSelectedItems(item, items, checked) {
        const result = [];
        const _items = structuredClone(items);
        _items.forEach(_item => {
            if (_item.id === item.id) {
                _item.selected = checked;
                result.push(_item);
            } else {
                result.push(_item);
            }
        });
        setFilteredItems(result);
    }

    async function exportMenus() {
        if (menusValid()) {
            await getListings();
            const _selectedMenus = [];
            const selectedMenus = filteredItems.filter(menu => menu.selected);
            const selectedMenuLinks = getSelectedMenuLinks();
            const selectedPages = getSelectedLinksPages(selectedMenuLinks);
            const { selectedFormsIds, selectedDatalistsIds } =
                getSelectedPagesDatalistsAndFormIds(selectedPages);
            const selectedForms = getSelectedItemsById(
                selectedFormsIds,
                listings.forms.list,
            );
            const menus = getSelectedItemsById(
                selectedMenus.map(item => item.id),
                listings.menus.list,
            );

            selectedMenus.forEach(menu => {
                delete menu.selected;
                _selectedMenus.push(menu);
            });

            const selectedDatalists = getSelectedItemsById(
                selectedDatalistsIds,
                listings.datalists.list,
            );
            const exportData = [
                {
                    menus: menus,
                    links: selectedMenuLinks,
                    pages: selectedPages,
                    forms: selectedForms,
                    datalists: selectedDatalists,
                },
            ];
            exportModal.current.show();
            let name = "";
            for (let menu of _selectedMenus) {
                name += `${menu?.name}_`;
            }

            setExportMenu(pre => ({
                ...pre,
                export: exportData,
                name: name + "_menu",
                modules: "menus;links;pages;forms;datalists",
            }));
            // }
        } else {
            toastEmitter("Select atleast one menu", true, "warning");
        }
    }

    const menusValid = () => {
        let flag = false;
        for (let item of filteredItems) {
            if (item.selected) {
                flag = true;
                break;
            }
        }
        return flag;
    };

    const getListings = async () => {
        const keys = [],
            url = API_URL + "?service.key=masterKey.tenantData",
            datasource = "",
            tenant_id = tenantId;
        for (let key in listings) {
            let obj = {
                params: "",
                dataKey: key,
                serviceKey: listings[key].serviceKey,
                mode: "formData",
            };
            keys.push(obj);
        }
        const {
            data: { C_DATA },
        } = await getData({
            keys,
            url,
            datasource,
            tenant_id,
        });

        for (let key in listings) {
            listings[key].list = C_DATA[key];
        }
    };

    const getSelectedMenuLinks = () => {
        const linksMapping = {};
        const resultLinks = [];

        //collect links of same menu in a array key value pairs
        listings.links.list.forEach(link => {
            if (linksMapping[link.module]) {
                linksMapping[link.module].push(link);
            } else {
                linksMapping[link.module] = [];
                linksMapping[link.module].push(link);
            }
        });

        // return array of match menu id
        filteredItems.forEach(menu => {
            if (menu.selected && linksMapping[menu.id]) {
                resultLinks.push(...linksMapping[menu.id]);
            }
        });

        return resultLinks;
    };

    const getSelectedLinksPages = links => {
        const linksMapping = {};
        const resultLinks = [];

        //collect links of same menu in a array key value pairs
        links.forEach(page => {
            if (linksMapping[page.feature_key]) {
                linksMapping[page.feature_key].push(page);
            } else {
                linksMapping[page.feature_key] = [];
                linksMapping[page.feature_key].push(page);
            }
        });

        // return array of match menu id
        listings.pages.list.forEach(page => {
            if (linksMapping[page.id]) {
                resultLinks.push(page);
            }
        });

        return resultLinks;
    };

    const getSelectedPagesDatalistsAndFormIds = pages => {
        const selectedFormsIds = [];
        const selectedDatalistsIds = [];
        pages.forEach(page => {
            const design = tryToParse(page.design);
            if (design && design.components) {
                for (let componentId in design.components) {
                    if (
                        design.components[componentId] &&
                        design.components[componentId].type === "datalist"
                    ) {
                        selectedDatalistsIds.push(
                            design.components[componentId]?.data?.id,
                        );
                    } else if (
                        design.components[componentId] &&
                        design.components[componentId].type === "form"
                    ) {
                        selectedFormsIds.push(
                            design.components[componentId]?.data?.formId,
                        );
                    }
                }
            }
        });
        return { selectedFormsIds, selectedDatalistsIds };
    };

    const getSelectedItemsById = (ids, items) => {
        const idsMapping = {};
        for (let id of ids) {
            idsMapping[id] = id;
        }
        return items.filter(item => idsMapping[item.id]);
    };

    return (
        <React.Fragment>
            <ChildrenModal
                header={"Export Menus"}
                ref={exportModal}>
                <ExportForm
                    exportModal={exportModal}
                    setExportMenu={setExportMenu}
                    exportMenu={exportMenu}
                />
            </ChildrenModal>
            <ModalComponent
                state={delModal}
                setState={setDelModal}
                message={`Are you sure to delete ${delModal.item.name}?`}
                header="Confirm"
                operation={deleteData}
            />
            <ChildrenModal
                ref={menuModalRef}
                header="Menu">
                <MenuForm
                    handleInputField={handleInputField}
                    saveData={saveData}
                    selectedItem={selectedItem}
                    clearModule={clearFields}
                    moduleList={moduleList}
                    saveIsDisabled={saveIsDisabled}
                    closeModal={handleClose}
                />
            </ChildrenModal>
            <div className="">
                <MenuHeader
                    addNewItem={addNewItem}
                    exportMenus={exportMenus}
                    getSelectedChannelMenu={getSelectedChannelMenu}
                    selectedChannelId={selectedChannelId}
                    totalMenus={filteredItems?.length}
                />
                <SearchItem
                    keysToSearch={["name", "location", "type", "access"]}
                    placeholder="Search..."
                    items={filteredItems}
                    _items={menus}
                    setItems={setFilteredItems}
                />
                <Listing
                    items={filteredItems?.filter(
                        item => item.channel_id === selectedChannelId,
                    )}
                    setItems={setFilteredItems}
                    editItem={editItem}
                    deleteData={deleteData}
                    setSelectedItemId={setSelectedModuleId}
                    selectedItemId={selectedModuleId}
                    mode="menu"
                    canDrag={true}
                    handleSelectedItems={handleSelectedItems}
                />
            </div>
        </React.Fragment>
    );
}

function MenuHeader(props) {
    const { addNewItem, exportMenus, getSelectedChannelMenu, totalMenus } =
        props;
    const appContext = useContext(AppContext);
    const { channel } = appContext;
    const modalRef = useRef(null);
    const [channels, setChannels] = useState([]);

    const openModal = () => {
        getChannels(channel.subscription, setChannels);
        modalRef.current.show();
    };

    return (
        <div className="listing-header">
            <ChildrenModal
                header="Import Menus"
                ref={modalRef}>
                <ImportForm
                    getSelectedChannelMenu={getSelectedChannelMenu}
                    channels={channels}
                    channel={props.selectedChannelId}
                    modalRef={modalRef}></ImportForm>
            </ChildrenModal>
            <div className="">
                <label className="sites-label">Menus {`(${totalMenus})`}</label>
            </div>
            <div className="d-flex">
                <div
                    title="Import"
                    className="pe-2 pointer"
                    onClick={() => openModal()}>
                    <i className="fa-solid fa-file-import"></i>
                </div>
                <div
                    title="Export"
                    className="pointer"
                    onClick={() => exportMenus()}>
                    <i className="fa-solid fa-file-export pe-1"></i>
                </div>
                <div
                    className="pointer"
                    title="Add Menu"
                    onClick={addNewItem}>
                    <i className="fa-solid fa-plus"></i>
                </div>
            </div>
        </div>
    );
}

const ImportForm = props => {
    const { channels, modalRef, getSelectedChannelMenu } = props;
    const [selectedChannelId, setSelectedChannelId] = useState(props.channel);
    const [jsonFile, setJsonFile] = useState(undefined);

    const handleImport = e => {
        const { files } = e.target;
        const fileReader = new FileReader();

        fileReader.onload = fileEvent => {
            const jsonFile = tryToParse(fileEvent.target.result);
            setJsonFile(jsonFile[0]);
        };
        fileReader.readAsText(files[0]);
    };

    const makeRequest = async () => {
        const request = {
            datasource: "",
            saveOrUpdate: "Yes",
        };
        request.data = [];
        const tableMapping = {
            menus: "app_menu",
            links: "app_link",
            pages: "pages",
            datalist: "app_datalist",
            forms: "app_form",
        };
        for (let key in jsonFile) {
            if (tableMapping[key]) {
                for (let item of jsonFile[key]) {
                    let formData = changeSite(
                        selectedChannelId,
                        item,
                        key,
                        jsonFile,
                    );
                    let obj = {
                        formId: tableMapping[key],
                        entity: tableMapping[key],
                        action: "update",
                        formData: formData,
                        id: formData.id,
                    };
                    request.data.push(obj);
                }
            }
        }
        if (request && JSON.stringify(request.data) !== "[]") {
            await axios.post(API_URL + "?service.key=update.formData", request);
            getSelectedChannelMenu(selectedChannelId);
            modalRef.current.close();
        }
    };

    const changeSite = (siteId, item, column, jsonFile) => {
        const entitys = {
            menus: "channel_id",
            links: "channel_id",
            pages: "channel",
        };

        // update with existing ids
        if (siteId === item[entitys[column]]) {
            item[entitys[column]] = siteId;
        } else {
            // create new ids of menus and update in links
            // generate new ids of links
            // generate new pages ids or update in links feature key

            if (column === "menus") {
                const oldMenuId = item.id;
                const newMenuId = uuid4();

                updateModuleIdInLinks(oldMenuId, newMenuId, jsonFile);
                item["id"] = newMenuId;
                item["channel_id"] = siteId;
            } else if (column === "links") {
                item.id = uuid4();
                item["channel_id"] = siteId;
            } else if (column === "pages") {
                const oldPageId = item.id;
                const newPageId = uuid4();

                updatePageIdInLinks(oldPageId, newPageId, jsonFile);
                item["id"] = newPageId;
                item["channel"] = siteId;
            }
        }

        return item;
    };

    const updateModuleIdInLinks = (oldId, newId, jsonFile) => {
        for (let link of jsonFile["links"]) {
            if (link.module === oldId) {
                link.module = newId;
            }
        }
    };
    const updatePageIdInLinks = (oldId, newId, jsonFile) => {
        for (let link of jsonFile["links"]) {
            if (link.feature_key === oldId) {
                link.feature_key = newId;
            }
        }
    };

    return (
        <>
            <div className="mb-2">
                <label
                    htmlFor="site"
                    className="mb-1">
                    Sites <span className="text-danger">*</span>
                </label>
                <select
                    className="form-select"
                    value={selectedChannelId}
                    onChange={e => setSelectedChannelId(e.target.value)}>
                    <option value="">Select Site</option>
                    {channels.map((channel, index) => (
                        <option
                            key={index}
                            value={channel.id}>
                            {channel.brand_title}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-2">
                <label
                    htmlFor="file"
                    className="mb-1">
                    Select Json File <span className="text-danger">*</span>{" "}
                    <i
                        title={selectedChannelId ? "" : "Select channel first"}
                        className="ps-1 fa-regular fa-circle-question"></i>
                </label>
                <input
                    type="file"
                    className="form-control"
                    id="importFile"
                    disabled={selectedChannelId ? false : true}
                    onChange={e => handleImport(e)}
                />
            </div>
            <div className="float-end">
                <button
                    onClick={makeRequest}
                    disabled={jsonFile ? false : true}
                    className="btn btn-sm button-theme">
                    Ok
                </button>
            </div>
        </>
    );
};

function ExportForm(props) {
    const { exportMenu, setExportMenu, exportModal } = props;

    const exportData = () => {
        let data = structuredClone(exportMenu.export);
        for (let menu in data[0]) {
            if (!exportMenu.modules?.includes(menu)) {
                delete data[0][menu];
            }
        }
        JsonToCsv(data, formatFileName(exportMenu?.name));

        exportModal.current.close();
    };

    const formatFileName = name => {
        let formattedName = name.trim().toLowerCase().replace(/\s+/g, "_"); // Replace all spaces with '_'

        // Replace all consecutive underscores (two or more) with a single '_'
        formattedName = formattedName.replace(/_+/g, "_");

        return formattedName;
    };

    return (
        <>
            <div className="">
                <label
                    htmlFor="ExportName"
                    className="mb-2">
                    Export Name
                </label>
                <input
                    id="ExportName"
                    className="form-control"
                    placeholder="Export Name"
                    value={formatFileName(exportMenu?.name)}
                    onChange={e =>
                        setExportMenu(pre => ({
                            ...pre,
                            name: e.target.value,
                        }))
                    }
                />
            </div>
            <div>
                <label
                    htmlFor=""
                    className="my-2">
                    Select Items
                </label>
                {/* {exportMenu?.modules} */}
                {/* <pre>
                    <code>{JSON.stringify(exportMenu, null, 2)}</code>
                </pre> */}

                <DynamicCheckBoxs
                    items={[
                        {
                            code: "menus",
                            label: "Menu",
                        },
                        {
                            code: "links",
                            label: "Link",
                        },
                        {
                            code: "pages",
                            label: "Page",
                        },
                        {
                            code: "forms",
                            label: "Form",
                        },
                        {
                            code: "datalists",
                            label: "Datalist",
                        },
                    ]}
                    classes={{
                        main: "d-flex gap-2",
                    }}
                    handleChange={modules =>
                        setExportMenu(pre => ({
                            ...pre,
                            modules,
                        }))
                    }
                    selectedItem={exportMenu?.modules}
                />
            </div>
            <button
                disabled={exportMenu?.name.length > 0 ? false : true}
                className="btn btn-sm button-theme float-end mt-2"
                onClick={exportData}>
                Ok
            </button>
        </>
    );
}

export { Menu };

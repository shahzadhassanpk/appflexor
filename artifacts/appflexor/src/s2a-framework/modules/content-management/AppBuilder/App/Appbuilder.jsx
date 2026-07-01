import React, { useContext, useEffect } from "react";
import { useRef } from "react";
import AppModal from "../AppModal";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import AppForm from "./AppForm";
import Listing from "./Listing";
import { useState } from "react";
import AppBuilderContext from "./AppBuilderContext";
import { getData, handleDelete } from "./helpers";
import { API_URL } from "../../../../Config";
import AppModule from "../AppModule/AppModule";
import { AppContext } from "../../../../../AppContext";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import { JsonToCsv, formatDate } from "../../../../utils/utils";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import axios from "axios";

export default function Appbuilder(props) {
    const { activeTab } = props;
    const [items, setItems] = useState([]);
    let initialState = {
        item: {},
        update: false,
    };
    const [show, setShow] = useState({
        item: {},
        show: false,
    });
    const [selectedListing, setSelectedListing] = useState({});
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [selectedId, setSelectedId] = useState("");
    const [selectedChannelId, setSelectedChannelId] = useState("");
    const [showModuleConfig, setShowModuleConfig] = useState(false);
    const [breadCrumbs, setBreadCrumbs] = useState([]);
    const [moduleList, setModuleList] = useState([]);
    const [sites, setSites] = useState([]);
    const [missingExportNames, setMissingExportNames] = useState({});
    const [listings, setListings] = useState([]);
    const consistencyRef = useRef(null);

    const modalRef = useRef(null);
    const appModuleRef = useRef(null);
    const importModal = useRef(null);

    const appContext = useContext(AppContext);
    const tenant_id = appContext?.tenantSubscription?.tenant_id;
    const channel = appContext.channel;

    const openModal = () => {
        modalRef.current.openModal();
    };

    const closeModal = () => {
        modalRef.current.closeModal();
    };

    const handleEdit = item => {
        modalRef.current.handleEdit(item);
    };

    const hanldeUpdateModule = () => {
        appModuleRef.current.updateModuleObject();
    };

    useEffect(() => {
        if (activeTab === "true") {
            fetchApps("FIRST-RENDER");
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedId) {
            setShowModuleConfig(false);
            const _crumbs = items.filter(item => item.id === selectedId);
            setBreadCrumbs(_crumbs);
        }
    }, [selectedId]);

    async function fetchApps(condition) {
        let keys = [
            {
                dataKey: "apps",
                serviceKey: "sys.app.builder",
            },
        ];
        const data = {
            url: API_URL + `?service.key=masterKey.tenantData`,
            tenant_id: tenant_id,
            datasource: "",
            keys,
        };
        const response = await getData(data);
        if (condition === "FIRST-RENDER") {
            getChannels();
        }
        setItems(response.data.C_DATA.apps);
    }

    function getChannels(callback) {
        let _channel = {};
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.subscription,
                    dataKey: "appChannel",
                    serviceKey: "sys.site",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data === "") {
                        getChannels();
                    }
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.appChannel) {
                            let items = response.data.C_DATA.appChannel;
                            setSites(items);
                        } else {
                            setItems([]);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    const switchMode = () => {
        //switch mode
        setShowModuleConfig(false);
        //update bread crumb
        const _breadCrumbs = [...breadCrumbs];
        _breadCrumbs.pop();
        setBreadCrumbs(_breadCrumbs);
        //update data  in db
    };

    const deleteItem = async (item, condition) => {
        if (condition) {
            setBreadCrumbs([]);

            let arr = [];
            arr.push(item.id);
            const obj = {
                url: API_URL + `?service.key=update.formData`,
                entity: "app_builder",
                datasource: "",
                arr,
            };
            const res = await handleDelete(obj);
            if (res.status === 200) {
                toastEmitter("App deleted successfully", true);
                item.id === selectedId && setSelectedId("");
                fetchModule(item.id);
            }
            fetchApps();
            setShow({
                ...show,
                item: {},
                show: false,
            });
        } else {
            setShow({
                ...show,
                item,
                show: true,
            });
        }
    };

    const fetchModule = async id => {
        let keys = [
            {
                params: id,
                dataKey: "modules",
                serviceKey: "sys.app.builder.modules",
            },
        ];

        const data = {
            url: API_URL + `?service.key=masterKey.tenantData`,
            tenant_id: tenant_id,
            datasource: "",
            keys,
        };
        const response = await getData(data);
        deleteMany(id, response?.data?.C_DATA?.modules);
    };

    const deleteMany = async (appId, _arr) => {
        let arr = [];
        _arr?.forEach(item => {
            if (item.app_id === appId) {
                arr.push(item.id);
            }
        });
        const obj = {
            url: API_URL + `?service.key=update.formData`,
            entity: "app_builder_module",
            datasource: "",
            arr,
        };
        await handleDelete(obj);
        fetchModules();
    };

    function handleExport() {
        const Db_Listings = [
            {
                dataKey: "authlist",
                serviceKey: "sys.app.builder.export.authorizations",
            },
            {
                dataKey: "menulist",
                serviceKey: "sys.app.builder.export.menus",
            },

            {
                dataKey: "linklist",
                serviceKey: "sys.app.builder.links",
            },
            {
                dataKey: "pagelist",
                serviceKey: "sys.app.builder.export.pages",
            },
            {
                dataKey: "datalist",
                serviceKey: "sys.app.builder.export.datalists",
            },
            {
                dataKey: "formlist",
                serviceKey: "sys.app.builder.export.forms",
            },
        ];
        if (selectedId) {
            getAllListing(Db_Listings);
        } else {
            toastEmitter("Select App First Than Export");
        }
    }

    function consistencyCheck(db_listings) {
        let db_listings_datakey = {};
        let flag = false;
        let moduleWithRequiredIds = {};
        let menusLinksLength = {};

        db_listings.forEach(item => {
            db_listings_datakey[item.dataKey] = item;
        });
        const links = db_listings_datakey["linklist"].list;

        let _moduleList = structuredClone(moduleList);

        if (_moduleList && moduleList.length > 0) {
            const missingModule = [];
            _moduleList.forEach(module => {
                const user_selected_menu_ids = tryToParse(module["menulist"]);
                const user_selected_links_ids = tryToParse(module["linklist"]);

                if (
                    user_selected_menu_ids &&
                    user_selected_menu_ids.length > 0
                ) {
                    const arr_of_links = changeIdToObj(
                        user_selected_links_ids,
                        links,
                        "id",
                    );

                    if (
                        user_selected_menu_ids &&
                        user_selected_menu_ids.length > 0
                    ) {
                        //find links of selected menus
                        const menuLinks = filterMatchingValues(
                            user_selected_menu_ids,
                            links,
                            "module",
                        );

                        //user selected links
                        //  arr_of_links
                        const { missing_links } = compareMenuLinksWithUserLinks(
                            menuLinks,
                            arr_of_links,
                            menusLinksLength,
                        );
                        moduleWithRequiredIds[module["id"]] = missing_links;
                    }
                } else {
                    missingModule.push(module.title);
                }
            });

            if (missingModule.length > 0) {
                toastEmitter(
                    "These Module Must Have Atleat 1 menu: " +
                        missingModule.join(" "),
                    true,
                    "error",
                );
            } else {
                let modules_with_links = {};
                _moduleList.forEach(module => {
                    modules_with_links[module.id] = tryToParse(module.linklist);
                });

                for (let appModule in moduleWithRequiredIds) {
                    let outLoop = false;
                    for (let menuId in moduleWithRequiredIds[appModule]) {
                        const selectedMenuLinks = links.filter(
                            link => link.module === menuId,
                        );
                        if (
                            moduleWithRequiredIds[appModule][menuId].length ===
                            selectedMenuLinks.length
                        ) {
                            outLoop = true;
                            flag = false;
                            break;
                        } else {
                            flag = true;
                        }
                    }
                    if (outLoop) {
                        break;
                    }
                }

                setMissingExportNames(moduleWithRequiredIds);
            }
        } else {
            toastEmitter("Create Module First", true, "error");
        }

        flag ? "" : consistencyRef.current.show();
        return flag;
    }

    function compareMenuLinksWithUserLinks(m_links, u_links, menusLinksLength) {
        const menus_links_pairs = {};
        const menus_users_links_pairs = {};
        const missing_links = {};

        m_links.forEach(m_link => {
            if (menus_links_pairs[m_link.module]) {
                menus_links_pairs[m_link.module].push(m_link);
            } else {
                menus_links_pairs[m_link.module] = [];
                menus_links_pairs[m_link.module].push(m_link);
            }
        });

        u_links.forEach(u_link => {
            if (menus_users_links_pairs[u_link.module]) {
                menus_users_links_pairs[u_link.module].push(u_link);
            } else {
                menus_users_links_pairs[u_link.module] = [];
                menus_users_links_pairs[u_link.module].push(u_link);
            }
        });
        for (let key in menus_links_pairs) {
            if (menus_users_links_pairs[key] === undefined) {
                missing_links[key] = menus_links_pairs[key];
                menusLinksLength[key] += missing_links[key].length;
            } else {
                missing_links[key] = requiredIdsCompareWithUserSelection(
                    menus_links_pairs[key],
                    menus_users_links_pairs[key],
                );
            }
        }

        return { missing_links };
    }

    function filterMatchingValues(arrOfIds, arrOfObjs, filterColumn) {
        const filter_obj_with_ids = {};
        const result = [];
        arrOfObjs.forEach(obj => {
            if (filter_obj_with_ids[obj[filterColumn]]) {
                filter_obj_with_ids[obj[filterColumn]].push(obj);
            } else {
                filter_obj_with_ids[obj[filterColumn]] = [];
                filter_obj_with_ids[obj[filterColumn]].push(obj);
            }
        });
        arrOfIds.forEach(id => {
            if (typeof filter_obj_with_ids[id] === "object") {
                result.push(...filter_obj_with_ids[id]);
            }
        });
        return result;
    }

    function changeIdToObj(arr1 = [], arr2 = [], objKey) {
        const objOfObjs = {};
        const result = [];

        arr1 = tryToParse(arr1);
        arr2 = arr2 ? arr2 : [];

        arr2.forEach(obj => {
            let key = obj[objKey];
            objOfObjs[key] = obj;
        });
        arr1.forEach(id => {
            if (objOfObjs[id]) {
                result.push(objOfObjs[id]);
            }
        });
        return result;
    }

    function requiredIdsCompareWithUserSelection(arr1 = [], arr2 = []) {
        let _arr1 =
            typeof arr1 === "string" && arr1 !== "" ? JSON.parse(arr1) : arr1;
        let _arr2 =
            typeof arr2 === "string" && arr2 !== "" ? JSON.parse(arr2) : arr2;
        let result = [];
        if (_arr2) {
            result = _arr1.filter(item => !_arr2.includes(item));
        } else {
            result = _arr1;
        }
        return result;
    }

    async function getAllListing(Db_Listings) {
        let parseTypes = [];
        Db_Listings.forEach(item => {
            parseTypes.push(item.dataKey);
        });

        let obj = {
            keys: [],
            url: "",
            datasource: "",
            tenant_id: tenant_id,
        };
        obj.url = API_URL + "?service.key=masterKey.tenantData";
        for (let i = 0; i < Db_Listings.length; i++) {
            let _obj = {
                serviceParams: "",
                dataKey: Db_Listings[i].dataKey,
                serviceKey: Db_Listings[i].serviceKey,
                mode: "formData",
            };
            obj.keys.push(_obj);
        }
        const res = await getData(obj);
        if (res.data.C_DATA) {
            let index = 0;
            for (let key of parseTypes) {
                Db_Listings[index]["list"] = res.data.C_DATA[key];
                index++;
            }
        }
        setListings(Db_Listings);
        if (consistencyCheck(Db_Listings)) {
            exportFormat(Db_Listings, parseTypes);
        }
    }

    function exportFormat(Db_Listings, parseTypes) {
        const _moduleList = structuredClone(moduleList);

        let modules = [];
        function recusive(_moduleList) {
            let length = _moduleList.length - 1;
            if (length > -1) {
                const module = parseData(
                    _moduleList.pop(),
                    Db_Listings,
                    parseTypes,
                );
                modules.push(module);
            } else {
                return;
            }
            recusive(_moduleList);
        }
        recusive(_moduleList);
        const _selectedItem = items.find(item => item.id === selectedId);
        const _selectedApp = structuredClone(_selectedItem);
        _selectedApp.modules = modules;
        JsonToCsv([_selectedApp], _selectedApp.title + formatDate());
    }

    const parseData = (obj, Db_Listings, parseTypes) => {
        for (let key of parseTypes) {
            obj[key] = tryToParse(obj[key]);
            if (obj[key] && obj[key].length > 0) {
                obj[key] = replaceIdsWithModule(
                    obj[key],
                    key,
                    Db_Listings,
                    parseTypes,
                );
            }
        }
        return obj;
    };

    const replaceIdsWithModule = (ids, key, Db_Listings) => {
        const _arr = [];
        let parseTypes = {};
        Db_Listings.forEach((item, index) => {
            parseTypes[item.dataKey] = index;
        });

        let selectedList = Db_Listings[parseTypes[key]];
        ids.forEach((id, index) => {
            let items = findIdInListing(id, selectedList.list, "id");
            _arr.push(...items);
        });
        return _arr;
    };

    const findIdInListing = (id, arr, fieldName) => {
        let _arr = [];
        arr.forEach(item => {
            if (item[fieldName] === id) {
                _arr.push(item);
            }
        });
        return _arr;
    };

    const tryToParse = item => {
        try {
            if (typeof item === "string" && item !== "") {
                return JSON.parse(item);
            } else {
                if (item === "") {
                    item = [];
                }
                return item;
            }
        } catch (error) {
            console.log(error);
        }
    };

    function handleImport() {
        importModal.current.show();
    }

    return (
        <ErrorBoundary>
            <AppBuilderContext.Provider
                value={{
                    items,
                    setItems,
                    selectedItem,
                    setSelectedItem,
                    closeModal,
                    handleEdit,
                    fetchApps,
                    selectedId,
                    setSelectedId,
                    showModuleConfig,
                    setShowModuleConfig,
                    breadCrumbs,
                    setBreadCrumbs,
                    tenant_id,
                    selectedListing,
                    setSelectedListing,
                    hanldeUpdateModule,
                    switchMode,
                    appModuleRef,
                    deleteItem,
                    show,
                    setShow,
                    moduleList,
                    setModuleList,
                    setMissingExportNames,
                    selectedChannelId,
                }}>
                <div className="app-builder">
                    <>
                        <ChildrenModal
                            header="Import App"
                            ref={importModal}>
                            <ImportForm
                                importModal={importModal}
                                fetchApps={fetchApps}
                                sites={sites}
                            />
                        </ChildrenModal>
                        <ChildrenModal
                            size="lg"
                            header="Required Items"
                            ref={consistencyRef}>
                            {
                                <MissingItems
                                    items={missingExportNames}
                                    modules={moduleList}
                                    listings={listings}
                                />
                            }
                        </ChildrenModal>
                        {breadCrumbs && breadCrumbs.length > 0 ? (
                            <BreadCrumb breadCrumbs={breadCrumbs} />
                        ) : (
                            <div>App</div>
                        )}
                        <AppModal
                            header="App Builder"
                            ref={modalRef}>
                            <AppForm />
                        </AppModal>
                        <div className="row">
                            <div className="col-sm-3 ps-2 pe-2">
                                <label className="app-header">Sites</label>
                                <div className="site-listing">
                                    <Listing
                                        items={sites}
                                        property="brand_title"
                                        selectedId={selectedChannelId}
                                        setSelectedId={setSelectedChannelId}
                                        selectedClassName="active-site"
                                    />
                                </div>
                            </div>
                            {selectedChannelId && (
                                <div className="col-sm-3 ps-2 pe-2">
                                    <label className="app-header d-flex justify-content-between">
                                        Apps
                                        <div>
                                            <span
                                                title="Export App"
                                                onClick={handleExport}
                                                className="cursor-pointer fa-solid fa-file-export px-1"></span>
                                            <span
                                                title="Import app"
                                                onClick={handleImport}
                                                className="cursor-pointer fa-solid fa-file-import px-1"></span>
                                            <span
                                                title="Add new App"
                                                className="fa fa-plus px-2 cursor-pointer"
                                                onClick={openModal}></span>
                                        </div>
                                    </label>
                                    <div className="app-body">
                                        <Listing
                                            items={items.filter(
                                                item =>
                                                    item.site_id ===
                                                    selectedChannelId,
                                            )}
                                            property="title"
                                            handleEdit={handleEdit}
                                            selectedId={selectedId}
                                            setSelectedId={setSelectedId}
                                            show={show}
                                            setShow={setShow}
                                            deleteItem={deleteItem}
                                            showButton={true}
                                            selectedClassName="active-app"
                                        />
                                    </div>
                                </div>
                            )}
                            {selectedId && (
                                <div className="col-sm-6">
                                    <AppModule ref={appModuleRef} />
                                </div>
                            )}
                        </div>
                    </>
                </div>
            </AppBuilderContext.Provider>
        </ErrorBoundary>
    );
}

function ImportForm(props) {
    const { importModal, fetchApps, sites } = props;
    const [appRequest, setAppRequest] = useState({});
    const [selectedSite, setSelectedSite] = useState("");

    const handleSave = async () => {
        const res = await axios.post(
            API_URL + "?service.key=update.formData",
            appRequest,
        );
        fetchApps();
        setAppRequest({});
        importModal.current.close();
    };
    const onFileSelect = e => {
        const { files } = e.target;
        const fileReader = new FileReader();
        fileReader.onload = e => {
            const result = e.currentTarget.result;
            const _data = JSON.parse(result);
            handleImport(_data);
        };
        fileReader.readAsText(files[0]);
        console.log(files);
    };
    const handleImport = data => {
        if (data) {
            let moduleNames = [
                "authlist",
                "datalist",
                "formlist",
                "linklist",
                "menulist",
                "pagelist",
            ];
            const arrOfModules = appJsonWithIds(data, moduleNames);
            console.log(arrOfModules);
            const modulesJsonReq = importRequset(data, moduleNames);
            arrOfModules.forEach(module => {
                let _obj = {
                    formId: "app_builder_module",
                    entity: "app_builder_module",
                    action: "update",
                    formData: module,
                    id: module.id,
                };
                modulesJsonReq.data.push(_obj);
            });
            let selectedApp = structuredClone(data[0]);
            const notReqCol = [
                "datalist",
                "formlist",
                "pagelist",
                "linklist",
                "authlist",
                "menulist",
                "app_id",
                "module_img",
                "item",
                "modules",
            ];
            for (let key in selectedApp) {
                if (notReqCol.includes(key)) {
                    delete selectedApp[key];
                }
            }
            let appReq = {
                formId: "app_builder",
                entity: "app_builder",
                action: "update",
                formData: selectedApp,
                id: selectedApp.id,
            };
            modulesJsonReq.data.push(appReq);
            setAppRequest(modulesJsonReq);
        }
    };
    const appJsonWithIds = (data, moduleNames) => {
        let apps = structuredClone(data);
        let _modules = [];

        apps.forEach(app => {
            let modules = app.modules;
            modules.forEach(module => {
                let _module = {};
                moduleNames.forEach(name => {
                    if (module[name]) {
                        _module[name] = arrOfObjToIds(module[name]);
                    }
                });
                _module = { ...module, ..._module };
                _modules.push(_module);
            });
        });
        return _modules;
    };
    const arrOfObjToIds = arr => {
        let _arr = [];
        arr.forEach(item => {
            if (item && item.id) {
                _arr.push(item.id);
            }
        });
        return _arr;
    };
    const importRequset = (apps, moduleNames) => {
        const _apps = structuredClone(apps);
        let request = {
            datasource: "",
            saveOrUpdate: "Yes",
        };
        let tableName = {
            authlist: "authorization",
            datalist: "app_datalist",
            formlist: "app_formlist",
            linklist: "app_link",
            menulist: "app_menu",
            pagelist: "pages",
        };
        request.data = [];
        _apps.forEach(app => {
            app.modules.forEach(mod => {
                moduleNames.forEach(name => {
                    mod[name].forEach(obj => {
                        let _obj = {
                            formId: tableName[name],
                            entity: tableName[name],
                            action: "update",
                            formData: obj,
                            id: obj.id,
                        };
                        request.data.push(_obj);
                    });
                });
            });
        });
        return request;
    };

    const handleSiteChange = e => {
        const { value } = e.target;
        setSelectedSite(value);
    };

    return (
        <div>
            <div className="mb-2">
                <label className="mb-1 fw-bold">Select Site</label>
                <select
                    className="form-select"
                    onChange={handleSiteChange}
                    value={selectedSite}>
                    <option value="">Default Option</option>
                    {sites.map((site, index) => (
                        <option
                            key={index}
                            value={site.id}>
                            {site.brand_title}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-2">
                <label className="mb-1 fw-bold">Select App</label>
                <input
                    type="file"
                    className="form-control"
                    onChange={onFileSelect}
                    disabled={selectedSite === "" ? true : false}
                />
            </div>
            <div className="float-end">
                <button
                    disabled={selectedSite === "" ? true : false}
                    className="btn btn-sm button-theme"
                    onClick={handleSave}>
                    Ok
                </button>
            </div>
        </div>
    );
}

function BreadCrumb() {
    const appBuilderContext = useContext(AppBuilderContext);
    const { breadCrumbs, showModuleConfig, switchMode } = appBuilderContext;

    if (breadCrumbs && breadCrumbs.length > 0)
        return (
            <div className="">
                <nav
                    className="d-flex justify-content-between align-items-center "
                    aria-label="breadcrumb">
                    <ol className="breadcrumb m-0 mt-1 mb-1">
                        <li className="breadcrumb-item">App</li>
                        {breadCrumbs?.map(bread => (
                            <li className="breadcrumb-item">
                                <span>{bread.title}</span>
                            </li>
                        ))}
                    </ol>
                    {showModuleConfig && (
                        <span
                            className="back cursor-pointer"
                            onClick={() => switchMode()}
                            title="Go Back">
                            <i className="fa-solid fa-arrow-left mt-1 fs-5"></i>
                        </span>
                    )}
                </nav>
            </div>
        );
}

function MissingItems(props) {
    const { items, modules, listings } = props;
    const menus = listings.find(item => item.dataKey === "menulist");

    function searchNameById(items, id) {
        for (let item of items) {
            if (item.id == id) {
                return item.name;
            }
        }
    }

    function TableHeader(tableName) {
        const headers = Object.keys(items[tableName]);
        return headers.map(header => {
            return <th>{searchNameById(menus.list, header)}</th>;
        });
    }
    function TableBody(tableName) {
        const arrOfItems = Object.values(items[tableName]);
        return arrOfItems.map(items => {
            return (
                <td>
                    {items.map(item => (
                        <span className="badge text-bg-secondary pe-2">
                            {item?.name}
                        </span>
                    ))}
                </td>
            );
        });
    }
    return Object.keys(items).map(tableName => (
        <>
            <label>{searchNameById(modules, tableName)}</label>

            <table className="table text-light">
                <thead>
                    <tr>{TableHeader(tableName)}</tr>
                </thead>
                <tbody>
                    <tr>{TableBody(tableName)}</tr>
                </tbody>
            </table>
        </>
    ));
}

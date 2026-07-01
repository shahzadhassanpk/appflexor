import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
// import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import { useContext } from "react";
import { MultiSelect } from "react-multi-select-component";
import { AppContext } from "../../../../AppContext";
import { API_URL, IMAGE_BASE } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    deleteItem,
    filterArrayByTerms,
    formatDateForUserView,
    insertItem,
    updateDeleteConfig,
    updateItem,
    validArray,
} from "../../../utils/utils";
import Scroll from "../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../components/SearchAndBtns/SearchAndBtns";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import useMobileView from "../../../components/custom-hooks/useMobileView";

function Authorization(props) {
    // const [selectedChannelId, setSelectedChannelId] = useState(
    //     props?.channel?.id,
    // );
    const [selectedChannelId, setSelectedChannelId] = useState(() => {
        return (
            localStorage.getItem("selectedChannelId") ||
            props?.channel?.id ||
            ""
        );
    });

    let initialState = {
        id: "",
        channel_id: "",
        title: "",
        module: "",
        module_feature: "",
        group: "",
    };
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [modules, setModules] = useState([]);
    const [filteredModules, setFilteredModules] = useState([]);
    const [moduleFeatures, setModuleFeatures] = useState([]);
    const [filteredModuleFeatures, setFilteredModuleFeatures] = useState([]);
    const [selectedModuleFeatures, setSelectedModuleFeatures] = useState([]);
    const inputReference = useRef(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [selectedOrgs, setSelectedOrgs] = useState([]);
    const [siteSearch, setSiteSearch] = useState("");

    const siteRef = useRef(null);

    const channels = props?.channels;
    const [filteredChannels, setFilteredChannels] = useState(channels);
    const [selectedAuth, setSelectedAuth] = useState({});

    const appContext = useContext(AppContext);
    const channel = appContext?.channel;
    let fields = checkArray(items) && Object.keys(items[0]);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });
    const activeTab = props.activeTab;
    const listingRef = useRef(null);
    const formRef = useRef(null);

    const isMobileView = useMobileView();

    const handleListingScroll = () => {
        if (listingRef.current && isMobileView) {
            listingRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const handleFormScroll = () => {
        if (formRef.current && isMobileView) {
            formRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.module?.length > 0 &&
            selectedItem?.module_feature?.length > 0 &&
            selectedItem?.group?.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    useEffect(() => {
        if (activeTab === "AUTHORIZATION") {
            if (channel && channel.subscription && selectedItem.id == "") {
                getData("FIRST_RENDER", siteSearch);
            }
            if (channel && channel.subscription && selectedItem.id) {
                getData("CURRENT_ITEM", siteSearch);
            }
            if (selectedAuth?.id) {
                getAuth(selectedAuth);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedChannelId && activeTab === "AUTHORIZATION") {
            getData("CHANNEL_CHANGE", siteSearch);
        }
    }, [selectedChannelId]);

    useEffect(() => {
        if (selectedAuth?.id) {
            getAuth(selectedAuth);
        }
    }, [selectedAuth?.id]);

    async function editItem(selectedItem) {
        setSelectedAuth(selectedItem);
    }

    async function getAuth(selectedItem) {
        const response = await getSelectedItem(
            selectedItem.id,
            "sys.user.selected.authorization",
            selectedItem.module,
        );
        const { data, features: filterArr } = response;
        selectedItem = data;
        // let filterArr = await getModuleFeatures(selectedItem.module);
        // let filterArr = filterIt(selectedItem.module, moduleFeatures);
        console.log(
            "*********** getAuth > " +
                selectedItem.module +
                " filterArr >" +
                filterArr.length,
        );
        setFilteredModuleFeatures(filterArr);
        // moduleFeatures.forEach(module => {
        //     if (selectedItem.module === module.module_id) {
        //         filterArr.push(module);
        //     }
        // });

        let ids = selectedItem.module_feature;
        let idsArr = ids.split(";");
        let finalArr = [];
        idsArr.forEach(id => {
            filterArr.forEach(module => {
                if (id === module.id) {
                    finalArr.push(module);
                }
            });
        });

        let _ids = selectedItem.group;
        let _idsArr = _ids.split(";");
        let _finalArr = [];
        _idsArr.forEach(id => {
            groups.forEach(group => {
                if (id === group.id) {
                    _finalArr.push(group);
                }
            });
        });

        let _orgs = selectedItem?.orgs;
        let __orgsArr = _orgs?.split(";")??[];
        let _finalOrgsArr = [];
        __orgsArr.forEach(id => {
            orgs.forEach(org => {
                if (id === org.id) {
                    _finalOrgsArr.push(org);
                }
            });
        });

        setSelectedGroups(_finalArr);
        setSelectedOrgs(_finalOrgsArr);
        setSelectedModuleFeatures(finalArr);
        setSelectedItem(selectedItem);
    }

    function getSelectedItem(id, serviceKey, module_id) {
        const dataRequest = {};
        dataRequest.dataKeys = [
            {
                serviceParams: id,
                dataKey: "selectedItem",
                serviceKey: serviceKey,
                mode: "formData",
            },
            {
                serviceParams: module_id,
                dataKey: "moduleFeatures",
                serviceKey: "sys.get.link.by.module.id",
                mode: "formData",
            },
        ];
        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(res => {
                    const data = res.data.C_DATA.selectedItem[0];
                    const features = res.data.C_DATA.moduleFeatures;
                    const finalArr = [];
                    features.forEach(item => {
                        item.label = item.name;
                        item.value = item.id;
                        finalArr.push(item);
                    });
                    resolve({ data, features: finalArr });
                });
        });
    }

    function addNewItem() {
        // setFilteredModules(modules);
        setFilteredModuleFeatures([]);
        setSelectedModuleFeatures([]);
        setSelectedGroups([]);
        setSelectedOrgs([]);
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
        setSelectedAuth({});
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

    function handleChannelChange(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleModuleChange(event) {
        let value = event.target.value;
        let name = event.target.name;
        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));

        await getModuleFeatures(value);
        // arr = filterIt(value, arr);
        let ids = "";

        // setFilteredModuleFeatures(arr);
        setSelectedModuleFeatures([]);
        setSelectedItem(prev => ({
            ...prev,
            module_feature: ids,
        }));
    }

    function handleFeatureChange(selectedObjects) {
        setSelectedModuleFeatures(selectedObjects);

        let ids = "";
        selectedObjects.forEach(obj => {
            if (ids !== "") ids += ";";
            ids += obj.id;
        });

        setSelectedItem(prev => ({
            ...prev,
            module_feature: ids,
        }));
    }

    function checkArray(a) {
        try {
            for (let key in a) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    function handleSearch(event) {
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        result = filterArrayByTerms(items, value, fields);
        setFilteredItems(result);
    }

    function handleGroupChange(selectedObjects) {
        setSelectedGroups(selectedObjects);
        // Build clean semicolon-separated list with NO trailing semicolon
        const ids = selectedObjects
            .map(obj => obj.id)
            .filter(id => id && id.trim() !== "") // avoids empty
            .join(";");

        setSelectedItem(prev => ({
            ...prev,
            group: ids,
        }));
    }

    function handleOrgChange(selectedObjects) {
        setSelectedOrgs(selectedObjects);

        // Build clean semicolon-separated list with NO trailing semicolon
        const ids = selectedObjects
            .map(obj => obj.id)
            .filter(id => id && id.trim() !== "") // avoids empty
            .join(";");

        setSelectedItem(prev => ({
            ...prev,
            orgs: ids, // Example: "ORG1;ORG2", never "ORG1;"
        }));
    }

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "authorization"; //"formid"
        entityForm.entity = "authorization"; //Db- "table name"
        entityForm.action = "update";

        if (
            !selectedItem.id ||
            selectedItem.id == "" ||
            selectedItem.id == "new"
        ) {
            entityForm.id = "new";
            selectedItem.id = "new";
        } else {
            entityForm.id = selectedItem.id;
        }
        selectedItem.channel_id = selectedChannelId;
        entityForm.formData = selectedItem;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        // selectedItem.id = response.data.C_NEW_RECORD_ID;
                        const newItem = { ...selectedItem };
                        newItem.id = response.data.C_DATA[0].formData.id;

                        insertItem(setItems, newItem);
                        insertItem(setFilteredItems, newItem);
                        setSelectedItem(newItem);
                        toastEmitter("New Record Inserted", true);
                    } else if (
                        selectedItem.id !== "" &&
                        selectedItem.id !== "new"
                    ) {
                        const updatedItem = response.data.C_DATA[0].formData;
                        updateItem(setItems, updatedItem);
                        updateItem(setFilteredItems, updatedItem);
                        setSelectedItem(updatedItem);
                        toastEmitter("Record Updated", true);
                    }
                    // clearFields();
                    // getData("SAVE_DATA", siteSearch);
                }
            });
        } catch (e) {
            console.error("saveData error:" + e);
        }
        getData();
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "authorization";
            entityForm.entity = "authorization";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        // getData("DELETE_DATA", siteSearch);
                        updateDeleteConfig(false, {}, setDeleteConfig);

                        deleteItem(setItems, item);
                        deleteItem(setFilteredItems, item);
                        setSelectedItem(initialState);
                        toastEmitter("Authorization deleted", true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
            // console.log("you press cancel")
        }
    }

    function getModuleFeatures(id) {
        var dataRequest = {
            dataKeys: [],
        };
        dataRequest.dataKeys = [
            {
                serviceParams: id,
                dataKey: "moduleFeatures",
                serviceKey: "sys.get.link.by.module.id",
                mode: "formData",
            },
        ];

        new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.status === 200) {
                        if (response.data.C_STATUS === "SUCCESS") {
                            if (response.data.C_DATA.moduleFeatures) {
                                let mainArr =
                                    response.data.C_DATA.moduleFeatures;
                                let finalArr = [];

                                mainArr.forEach(item => {
                                    item.label = item.name;
                                    item.value = item.id;
                                    finalArr.push(item);
                                });

                                setFilteredModuleFeatures(finalArr);
                                resolve(finalArr);
                                // setFilteredModuleFeatures(finalArr);
                            }
                        }
                    }
                })
                .catch(error => {
                    // console.error(error);
                });
        });
    }
    function getData(condition, siteSearch) {
        var dataRequest = {
            dataKeys: [],
        };
        dataRequest.dataKeys = [
            {
                serviceParams: selectedChannelId,
                dataKey: "userAuthorization",
                serviceKey: "sys.user.authorization",
                mode: "formData",
            },
            {
                serviceParams: selectedChannelId,
                dataKey: "appModule",
                serviceKey: "sys.site.menu.list",
                mode: "formData",
            },
            {
                serviceParams: "",
                dataKey: "groups",
                serviceKey: "sys.console.dir.group",
                mode: "formData",
            },
            {
                serviceParams: "",
                dataKey: "orgs",
                serviceKey: "sys.console.dir.orgs",
                mode: "formData",
            },
        ];

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.userAuthorization) {
                            let data = response.data.C_DATA.userAuthorization;
                            setItems(data);

                            if (inputReference?.current?.value) {
                                let result = [];
                                result = filterArrayByTerms(
                                    data,
                                    inputReference?.current?.value,
                                    fields,
                                );
                                setFilteredItems(result);
                            } else {
                                setFilteredItems(data);
                            }

                            // if (selectedItem.id !== "") {
                            //     let _updatedItem = getObjectById(
                            //         response.data.C_DATA.userAuthorization,
                            //         selectedItem.id,
                            //     );
                            //     setSelectedItem(_updatedItem);
                            // }
                        } else {
                            setFilteredItems([]);
                            setItems([]);
                        }

                        if (response.data.C_DATA.groups) {
                            let mainArr = response.data.C_DATA.groups;
                            let finalArr = [];

                            mainArr.forEach(item => {
                                item.label = item.name;
                                item.value = item.id;
                                finalArr.push(item);
                            });

                            setGroups(finalArr);
                        }
                        if (response.data.C_DATA?.orgs) {
                            let mainArr = response.data.C_DATA.orgs;
                            let finalArr = [];

                            mainArr.forEach(item => {
                                item.label = item.name;
                                item.value = item.id;
                                finalArr.push(item);
                            });

                            setOrgs(finalArr);
                        }
                        if (response.data.C_DATA.appModule) {
                            setModules(response.data.C_DATA.appModule);
                            setFilteredModules(response.data.C_DATA.appModule);
                        }
                    }
                    if (siteSearch) {
                        let result = [];
                        result = filterArrayByTerms(
                            props.channels,
                            siteSearch,
                            fields,
                        );
                        setFilteredChannels(result);
                    } else {
                        setFilteredChannels(props.channels);
                    }
                }
            })
            .catch(error => {
                // console.error(error);
            });
    }

    const handleSiteSearch = event => {
        let textToSearch = event.target.value.toLowerCase();
        setSiteSearch(textToSearch);
        const keysToSearch = ["domain", "brand_title"];
        let result = [];

        if (textToSearch.length > 2) {
            result = filterArrayByTerms(
                props.channels,
                textToSearch,
                keysToSearch,
            );
            setFilteredChannels(result);
        } else if (textToSearch.length < 2 || textToSearch.length === 0) {
            setFilteredChannels(channels);
        } else {
            result = filterArrayByTerms(channels, textToSearch, keysToSearch);
            setFilteredChannels(result);
        }
    };

    const handleChannelChangeAuth = value => {
        setSelectedChannelId(value);
        addNewItem();
    };

    const handleRefresh = () => {
        if (channel && channel.subscription && selectedItem.id == "") {
            getData("FIRST_RENDER", siteSearch);
        }
        if (channel && channel.subscription && selectedItem.id) {
            getData("CURRENT_ITEM", siteSearch);
        }
    };

    return (
        <ErrorBoundary>
            <div className="authorization">
                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this item"}
                    operation={deleteData}
                    header={"Delete Authorization"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
                <div className="row py-2 m-0">
                    <div className="col-sm-4 listing-col s2a-border-right ps-2">
                        <div className="">
                            <div className="listing-header">
                                <div className="fw-bold">
                                    Sites ({filteredChannels?.length}/
                                    {channels?.length})
                                </div>
                            </div>
                        </div>
                        <SearchInput
                            ref={siteRef}
                            onChange={handleSiteSearch}
                            placeholder="Search Sites"
                            value={siteSearch}
                        />
                        <Scroll height="100%">
                            <ul
                                name="channel_id"
                                className="list-group list-group-flush p-1">
                                {filteredChannels &&
                                    filteredChannels.map((item, index) => (
                                        <li
                                            onClick={() => {
                                                handleChannelChangeAuth(
                                                    item.id,
                                                );
                                                handleListingScroll();
                                            }}
                                            className={`list-group-item ${
                                                selectedChannelId === item.id
                                                    ? "selected-cell"
                                                    : ""
                                            }`}
                                            key={index}>
                                            <div className="row">
                                                <span className="col-sm-12">
                                                    {item.brand_title}
                                                </span>
                                                <span className="col-sm-12">
                                                    {item.domain}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        </Scroll>
                    </div>
                    <div
                        className="col-sm-4 listing-col s2a-border-right"
                        ref={listingRef}>
                        <SearchAndBtns
                            title={
                                `Authorization List (` +
                                filteredItems.length +
                                `/` +
                                items.length +
                                `)`
                            }
                            inputRef={inputReference}
                            handleSearch={handleSearch}
                            addNewItem={addNewItem}
                            searchValue={inputReference?.current?.value}
                            refresh={handleRefresh}
                            SearchPlaceHolder="Search Authorization"
                            handleFormScroll={handleFormScroll}
                        />
                        <Scroll height="100%">
                            <ul className="list-group list-group-flush p-1">
                                {filteredItems.map(item => (
                                    <li
                                        key={item.id}
                                        className={`auth-item flex-between list-group-item ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}
                                        onClick={() => {
                                            editItem(item);
                                            handleFormScroll();
                                        }}>
                                        <div>
                                            <div className="title">
                                                {/* <img
                                                className="table-img"
                                                src={getImageUrlById(
                                                    item.channel_id,
                                                )}
                                                alt={item.brand_title}
                                            /> */}
                                                {item.title}
                                            </div>
                                            <div className="modify">
                                                <i className="fa-solid fa-calendar-days"></i>
                                                {formatDateForUserView(
                                                    item.datemodified,
                                                )}
                                                {" | "}
                                                {item.modifiedby}
                                                {/* <Badges
                                                ids={item.group}
                                                arr={groups}
                                            /> */}
                                            </div>
                                        </div>
                                        <div className="dropdown">
                                            <i
                                                className="fa-solid fa-ellipsis-vertical show-hide-button p-2"
                                                type="button"
                                                data-bs-toggle="dropdown"
                                                aria-expanded="false"></i>
                                            <ul className="dropdown-menu">
                                                <li
                                                    title="Delete"
                                                    onClick={() =>
                                                        deleteData(item)
                                                    }>
                                                    <span className="table-del-font">
                                                        <i className="mx-2  fa-regular fa-trash-can"></i>
                                                        Delete
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Scroll>
                    </div>
                    <div
                        className="form col-sm-4 listing-col"
                        ref={formRef}>
                        <AuthForm
                            selectedItem={selectedItem}
                            selectedChannelId={selectedChannelId}
                            handleChannelChange={handleChannelChange}
                            channels={channels}
                            handleModuleChange={handleModuleChange}
                            groups={groups}
                            selectedGroups={selectedGroups}
                            handleGroupChange={handleGroupChange}
                            orgs={orgs}
                            selectedOrgs={selectedOrgs}
                            handleOrgChange={handleOrgChange}
                            filteredModules={filteredModules}
                            handleInputField={handleInputField}
                            moduleFeatures={moduleFeatures}
                            saveData={saveData}
                            saveIsDisabled={saveIsDisabled}
                            clearFields={clearFields}
                            handleFeatureChange={handleFeatureChange}
                            selectedModuleFeatures={selectedModuleFeatures}
                            filteredModuleFeatures={filteredModuleFeatures}
                        />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

function AuthForm(props) {
    const {
        selectedItem,
        selectedChannelId,
        handleChannelChange,
        handleModuleChange,
        groups,
        selectedGroups,
        handleGroupChange,
        orgs,
        selectedOrgs,
        handleOrgChange,
        filteredModules,
        handleInputField,
        moduleFeatures,
        saveData,
        saveIsDisabled,
        clearFields,
        handleFeatureChange,
        selectedModuleFeatures,
        filteredModuleFeatures,
        channels,
    } = props;

    return (
        <>
            <div className="form form-background mb-2">
                <div className="row">
                    <div className="col-sm-12 mb-2">
                        <div className="listing-header">
                            <div className="fw-bold">Authorization</div>
                        </div>
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Site&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                name="channel_id"
                                className="form-select"
                                disabled="true"
                                value={selectedChannelId}
                                onChange={e => handleChannelChange(e)}>
                                <option value="">Select Site</option>
                                {channels &&
                                    channels.length > 0 &&
                                    channels.map((item, index) => (
                                        <option
                                            key={index}
                                            value={item.id}>
                                            {item.brand_title}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Title&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={selectedItem.title}
                                onChange={e => handleInputField(e)}
                            />
                        </div>
                    </div>
                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Code&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="code"
                                value={selectedItem.code}
                                onChange={e => handleInputField(e)}
                            />
                        </div>
                    </div>
                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Menu&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                name="module"
                                className="form-select"
                                value={selectedItem.module}
                                onChange={handleModuleChange}>
                                <option value="">Select Menu</option>
                                {filteredModules &&
                                    filteredModules.map((item, index) => (
                                        <option
                                            key={index}
                                            value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Menu Link(s)&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <MultiSelect
                                options={filteredModuleFeatures}
                                value={selectedModuleFeatures}
                                onChange={handleFeatureChange}
                                labelledBy="Select"
                            />
                            <div className="mt-1">
                                <Badges
                                    ids={selectedItem.module_feature}
                                    arr={filteredModuleFeatures}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                User Group(s)&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <MultiSelect
                                options={groups}
                                value={selectedGroups}
                                onChange={handleGroupChange}
                                labelledBy="Select"
                            />
                            <div className="mt-1">
                                <Badges
                                    ids={selectedItem.group}
                                    arr={groups}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-12 mb-2">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                User Org(s)&nbsp;
                            </label>
                            <MultiSelect
                                options={orgs}
                                value={selectedOrgs}
                                onChange={handleOrgChange}
                                labelledBy="Select"
                            />
                            <div className="mt-1">
                                <Badges
                                    ids={selectedItem.orgs}
                                    arr={orgs}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-end pe-0">
                {selectedItem.id === "" && (
                    <button
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={() => saveData()}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                )}
                {selectedItem.id !== "" && (
                    <button
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={() => saveData()}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Update
                    </button>
                )}
                {selectedItem.id === "" && (
                    <button
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={clearFields}>
                        <i className="fa-solid fa-ban pe-1"></i>
                        Clear
                    </button>
                )}
            </div>
        </>
    );
}

function Badges({ ids, arr }) {
    let result = [];
    let idsArr = ids?.split(";");
    idsArr?.forEach(id => {
        arr.forEach(item => {
            if (item.id === id) {
                result.push(item);
            }
        });
    });
    return (
        <>
            {result.map(item => {
                return (
                    <Badge
                        key={item.id}
                        name={item.label}
                    />
                );
            })}
        </>
    );
}

function Badge({ name }) {
    return <span className="badge rounded-pill">{name}</span>;
}

function SearchInput(props) {
    return (
        <div className="row">
            <div className="mb-2 input-group">
                <input
                    type="text"
                    className="form-control"
                    {...props}
                />
            </div>
        </div>
    );
}

export default Authorization;

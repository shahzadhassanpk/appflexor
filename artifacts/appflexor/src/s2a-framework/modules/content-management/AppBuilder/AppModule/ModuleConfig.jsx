import React, { useRef, useState } from "react";
import { getData } from "../App/helpers";
import { API_URL } from "../../../../Config";
import { useEffect } from "react";
import { useContext } from "react";
import AppBuilderContext from "../App/AppBuilderContext";
import ComponentsListing from "./ComponentListing";
import AppModal from "../AppModal";
import ModuleContext from "./ModuleContext";
import { forwardRef } from "react";

export default function ModuleConfig() {
    const appBuilderContext = useContext(AppBuilderContext);

    const { tenant_id, selectedListing, setSelectedListing } =
        appBuilderContext;

    const moduleContext = useContext(ModuleContext);
    const { updateInDb, childInput, setChildInput } = moduleContext;

    const [componentsListing, setComponentsListing] = useState([
        {
            list: [],
            name: "Menus",
            className: "menu",
            code: "menulist",
            serviceKey: "sys.app.builder.menus",
            selectedItems: [],
        },
        {
            list: [],
            name: "Links",
            className: "link",
            code: "linklist",
            serviceKey: "sys.app.builder.links",
            selectedItems: [],
        },
    ]);
    const [selectedItem, setSelectedItem] = useState({});

    const tryToParse = item => {
        if (
            item &&
            item !== "" &&
            item.includes("[") &&
            typeof item === "string"
        ) {
            return JSON.parse(item);
        } else if (item && typeof item === "object") {
            return item;
        } else {
            return [];
        }
    };

    const openModal = item => {
        // console.log(item);
        setSelectedItem(item);
        modalRef.current.openModal();
    };

    const modalRef = useRef(null);
    useEffect(() => {
        getAllComponents();
    }, []);

    const getAllComponents = async () => {
        const keys = [];
        componentsListing.forEach(item => {
            let obj = {
                serviceParams: "",
                dataKey: item.code,
                serviceKey: item.serviceKey,
                mode: "formData",
            };
            keys.push(obj);
        });

        const url = API_URL + "?service.key=masterKey.tenantData";
        const datasource = "";
        const res = await getData({ keys, url, datasource, tenant_id });
        if (res.data.C_STATUS === "SUCCESS") {
            let _componentsListing = [...componentsListing];
            for (let item of _componentsListing) {
                if (typeof res.data.C_DATA[item.code] === "object") {
                    item["list"] = res.data.C_DATA[item.code];
                } else {
                    item["list"] = [];
                }
            }
            _componentsListing = selectedOptions(_componentsListing);
            setComponentsListing(_componentsListing);
        }
        console.log(res);
    };

    const selectedOptions = componentsListing => {
        componentsListing.forEach((item, i) => {
            if (childInput[item.code.toLowerCase()]) {
                const _item = tryToParse(childInput[item.code.toLowerCase()]);
                componentsListing[i].selectedItems = _item;
            }
        });
        return componentsListing;
    };

    const selectedAllItems = (item, e) => {
        const { checked } = e.target;
        const _componentListing = [...componentsListing];
        const index = _componentListing.findIndex(
            i => i.serviceKey === item.serviceKey,
        );
        if (checked) {
            item.selectedItems = [];
            item.list.forEach(_item => {
                item.selectedItems.push(_item.id);
            });
        } else {
            item.selectedItems = [];
        }
        _componentListing[index] = item;
        setComponentsListing(_componentListing);
        setSelectedListing({
            ...selectedListing,
            [item.code]: item.selectedItems,
        });
        setChildInput(prev => ({
            ...prev,
            [selectedItem["code"]]: selectedItem["selectedItems"],
        }));
    };

    const handleSelect = (item, e) => {
        const { checked } = e.target;
        let _data = { ...selectedItem };
        let _componentsListing = [...componentsListing];
        let parentIndex = _componentsListing.findIndex(
            i => i.serviceKey === _data.serviceKey,
        );
        if (checked) {
            _data.selectedItems.push(item.id);
        } else {
            _data.selectedItems = _data.selectedItems.filter(
                i => i !== item.id,
            );
        }
        _componentsListing[parentIndex] = _data;
        setSelectedItem(_data);
        setComponentsListing(_componentsListing);
        setChildInput(prev => ({
            ...prev,
            [selectedItem["code"]]: selectedItem["selectedItems"],
        }));
    };

    return (
        <>
            <div className="module__config">
                <AppModal
                    header={selectedItem.name}
                    ref={modalRef}>
                    <SelectedItemForm
                        handleSelect={handleSelect}
                        selectedItem={selectedItem}
                        header={selectedItem.name}
                        selectedAllItems={selectedAllItems}
                        updateInDb={updateInDb}
                        childInput={childInput}
                        ref={modalRef}
                    />
                </AppModal>
                {componentsListing.map((item, index) => (
                    <>
                        <div className="col-sm-6 ps-2 pe-2">
                            {/* <div className={item.className}> */}
                            <div className="header">
                                <div>
                                    <span className="ps-2">{item.name}</span>
                                </div>
                                <span
                                    className="fa fa-plus pe-2"
                                    onClick={() => openModal(item)}></span>
                            </div>
                            <div className="body">
                                <ComponentsListing
                                    parent_index={index}
                                    item={item}
                                    setSelectedListing={setSelectedListing}
                                    selectedListing={selectedListing}
                                    componentsListing={componentsListing}
                                    setComponentsListing={setComponentsListing}
                                />
                            </div>
                        </div>
                    </>
                ))}
            </div>
        </>
    );
}

const SelectedItemForm = forwardRef(function SelectedItemForm(props, ref) {
    const {
        selectedItem,
        handleSelect,
        header,
        selectedAllItems,
        updateInDb,
        childInput,
    } = props;

    const { list, selectedItems } = selectedItem;
    const [filterList, setFilterList] = useState(list);

    const handleSearch = e => {
        const { value } = e.target;
        const _list = list.filter(item =>
            item.name.toLowerCase().includes(value.toLowerCase()),
        );
        setFilterList(value.length > 0 ? _list : list);
    };

    const handleOk = () => {
        let obj = { [selectedItem["code"]]: selectedItem["selectedItems"] };
        let saveObj = { ...childInput, ...obj };
        if (saveObj.item) delete saveObj.item;
        updateInDb(saveObj);
        if (ref.current) {
            ref.current.closeModal();
        }
    };

    return (
        <div className="modal__form">
            <span className="d-flex justify-content-between">
                <h6>
                    <label htmlFor={header}>Availabel {header}</label>
                </h6>
                <input
                    id={header}
                    type="checkbox"
                    className="form-check-input"
                    checked={list?.length === selectedItems?.length}
                    onChange={e => selectedAllItems(selectedItem, e)}
                />
            </span>
            <span>
                <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Search item by name"
                    onChange={handleSearch}
                />
            </span>
            <ul className="list-group enable-scroll scroll">
                {filterList?.map(item => (
                    <li
                        className="list-group-item"
                        key={item.id}>
                        <span className="me-2">
                            <input
                                id={item.name}
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedItems.includes(item.id)}
                                onChange={e => handleSelect(item, e)}
                            />
                        </span>
                        <label htmlFor={item.name}>{item.name}</label>
                    </li>
                ))}
            </ul>
            <div className="mt-3 float-end">
                <button
                    onClick={handleOk}
                    className="btn btn-sm button-theme">
                    Ok
                </button>
            </div>
        </div>
    );
});

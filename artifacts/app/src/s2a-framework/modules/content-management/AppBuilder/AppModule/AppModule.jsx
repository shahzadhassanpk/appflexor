import React from "react";
import { useContext } from "react";
import AppBuilderContext from "../App/AppBuilderContext";
import AppModal from "../AppModal";
import { useRef } from "react";
import ModuleForm from "./ModuleForm";
import ModuleContext from "./ModuleContext";
import { useState } from "react";
import { getData, handleSave } from "../App/helpers";
import { useEffect } from "react";
import { API_URL } from "../../../../Config";
import Listing from "./Listing";
import { useImperativeHandle, forwardRef } from "react";
import ModuleConfig from "./ModuleConfig";
import { toastEmitter } from "../../../../components/Toastify/Toastify";

const AppModule = forwardRef((props, ref) => {
    const appBuilderContext = useContext(AppBuilderContext);
    const {
        selectedId,
        tenant_id,
        showModuleConfig,
        moduleList: items,
        setModuleList: setItems,
    } = appBuilderContext;
    // const [items, setItems] = useState([]);
    const [_items, _setItems] = useState([]);
    const moduleRef = useRef(null);
    const initialState = {
        id: "",
        title: "",
        description: "",
        app_id: selectedId,
        module_img: "",
    };

    const [input, setInput] = useState(initialState);
    const [childInput, setChildInput] = useState({});

    useEffect(() => {
        if (selectedId) {
            fetchModules();
        } else {
            setItems([]);
        }
    }, [selectedId]);

    useImperativeHandle(
        ref,
        () => ({
            selectedAppModules() {
                return items;
            },
        }),
        [],
    );

    const addNewModule = () => {
        setInput(initialState);
        moduleRef.current.openModal();
    };

    const handleClose = () => {
        moduleRef.current.closeModal();
    };

    const handleEdit = item => {
        setInput(item);
        moduleRef.current.openModal();
    };

    const updateInDb = async input => {
        try {
            const entity = "app_builder_module",
                url = API_URL + "?service.key=update.formData",
                datasource = "",
                formData = { ...input };

            const res = await handleSave({ entity, url, datasource, formData });

            const saveObj = res.data.C_DATA[0].formData;
            if (saveObj) {
                let _items = [...items];
                let index = _items.findIndex(item => item.id === saveObj.id);
                _items[index] = saveObj;
                setItems(_items);
                toastEmitter("Module Config Updated Successfully", true);
            }
            // fetchModules();
        } catch (error) {
            console.log(error);
        }
    };

    async function fetchModules() {
        let keys = [
            {
                params: selectedId,
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
        setItems(response.data.C_DATA.modules);
    }

    return (
        <ModuleContext.Provider
            value={{
                items,
                setItems,
                input,
                setInput,
                handleEdit,
                handleClose,
                fetchModules,
                childInput,
                setChildInput,
                fetchModules,
                updateInDb,
            }}>
            <AppModal
                header="App Module"
                ref={moduleRef}>
                <ModuleForm />
            </AppModal>
            {showModuleConfig ? (
                <ModuleConfig />
            ) : (
                <div className="app_module">
                    <div className="app-module-header d-flex justify-content-between">
                        <span className="">Module</span>
                        {selectedId && (
                            <span
                                className="fa fa-plus px-2 cursor-pointer"
                                onClick={addNewModule}></span>
                        )}
                    </div>
                    <div>
                        <Listing />
                    </div>
                </div>
            )}
        </ModuleContext.Provider>
    );
});
export default AppModule;

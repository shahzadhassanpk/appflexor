import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";

import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import { getData as globalGetData } from "../../../../components/CrudApiCall";
import { ExportForm } from "../../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../../components/Modal/Modal";
import ReactSelect from "../../../../components/ReactSelect/ReactSelect";
import Scroll from "../../../../components/Scroll/Scroll";
import SearchAndBtns from "../../../../components/SearchAndBtns/SearchAndBtns";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import DndWrapper from "../../../../components/drag-and-drop-listing";
import { DndCard } from "../../../../components/drag-and-drop-listing/Card";
import DynamicCheckBoxs from "../../../../components/dynamic-checkbox/Checkbox";
import DynamicRadio from "../../../../components/dynamic-radio/radio";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    deleteItem,
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    insertItem,
    jsonExport,
    makeid,
    updateDeleteConfig,
    updateItem,
} from "../../../../utils/utils";
import CsvModal from "../../datalist-builder/custom-action-modal/CsvModal";
import FormContext from "../Context/FormContext";
import Designer from "../Designer";
import { modeType } from "../Designer/Designer";
import RenderPreview from "../Designer/RenderPreview";
import RenderFormFields from "./FormViewer/RenderFormFields";
import { isEmpty, tryToParse } from "./FormViewer/utils";
import { getSelectedItem } from "../../../../components/CrudApiCall";
import ErrorNotification from "../../../../components/ErrorNotification";
import useMobileView from "../../../../components/custom-hooks/useMobileView";
const INITIAL_DESIGN = {
    layout: [],
    components: {},
    images: {},
    htmlCollection: {},
};

const INITIAL_STATE = {
    id: "new",
    form_key: "",
    name: "",
    table: "",
    design: {
        layout: [],
        components: {},
        images: {},
        htmlCollection: {},
    },
    enable_multipage: "YES",
    multipage_design: [],
    fields: [],
    datasource: "",
    schema: [],
    create_sequence: "NO",
    tabs_position: "TOP",
    useprefix: "YES",
    btn_horizontal_position: "Right",
    btn_vertical_position: "Bottom",
};

const INITIAL_SELECTED_TABLE = {
    label: "Select existing table",
    value: "SELECT_TABLE",
};

function Forms(props) {
    const { activeTab } = props;
    const [formList, setFormList] = useState([]);
    const [filteredFormList, setFilteredFormList] = useState([]);

    const [selectedForm, setSelectedForm] = useState(INITIAL_STATE);
    const [selectedTable, setSelectedTable] = useState(INITIAL_SELECTED_TABLE);

    const [multipageDesign, setMultipageDesign] = useState([
        {
            id: "",
            title: "",
            icon: "",
            design: INITIAL_DESIGN,
        },
    ]);

    const [layout, setLayout] = useState([]);
    const [images, setImages] = useState({});
    const [components, setComponents] = useState({});
    const [htmlCollection, setHtmlCollection] = useState({});

    const [usePrefix, setUsePrefix] = useState(true);
    const [createSequence, setCreateSequence] = useState(false);
    const [enableMultiPage, setEnableMultiPage] = useState(false);

    const [selectedFormPage, setSelectedFormPage] = useState({
        id: "",
        title: "",
        icon: "",
        design: INITIAL_DESIGN,
    });

    const currentSelectedFormId = useRef("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [mode, setMode] = useState(modeType.render);
    const [error, setError] = useState([]);
    const [message, setMessage] = useState("");
    const [formTab, setFormTab] = useState("");
    const [csvModal, setCsvModal] = useState(false);
    const [canDesign, setCanDesign] = useState("");
    const [designMode, setDesignMode] = useState(false);
    const [searchField, setSearchField] = useState("");
    const [toggleLookup, setToggleLookup] = useState("INPUT");
    const [instanceItems, setInstanceItems] = useState([]);
    const [renderPreview, setRenderPreview] = useState(false);
    const [showDatasource, setShowDatasource] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });
    const [selectedItem, setSelectedItem] = useState({});

    const inputRef = useRef(null);

    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
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
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        if (activeTab === "FORM_BUILDER") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedFormPage.id !== "") {
            setNewLayout();
        }
    }, [selectedFormPage.id]);

    useEffect(() => {
        if (selectedItem?.id) {
            getSelectedForm(selectedItem);
        }
    }, [selectedItem?.id]);

    function setNewLayout() {
        if (selectedFormPage.id !== "") {
            console.log(multipageDesign);
            if (multipageDesign && multipageDesign.length > 0) {
                multipageDesign.map(item => {
                    if (item.id === selectedFormPage.id) {
                        setImages(item.design.images);
                        setHtmlCollection(item.design.htmlCollection);
                        setLayout(item.design.layout);
                        setComponents(item.design.components);
                    }
                });
            }
        }
    }

    function addNewItem() {
        setLayout([]);
        setMultipageDesign([
            // {
            //     id: "",
            //     title: "Form One",
            //     design: INITIAL_DESIGN,
            // },
        ]);
        setComponents({});
        setImages({});
        setHtmlCollection({});
        setError([]);
        setSelectedForm(INITIAL_STATE);
        setCanDesign("");
        setCreateSequence(false);
        setEnableMultiPage(false);
        setUsePrefix(true);
        setShowDatasource(false);
        setSelectedItem({});
    }

    function clearFields() {
        addNewItem();
    }

    function validation(form) {
        let _error = [];

        let keysToCheck = ["name", "form_key", "table"];

        keysToCheck.map(key => {
            if (form[key] === "") {
                _error.push(key);
            }
        });

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function handleUpdateData(components) {
        if (selectedForm.enable_multipage === "YES") {
            let _selectedForm = { ...selectedForm };
            let _selectedFormPage = { ...selectedFormPage };
            _selectedFormPage.design.components = { ...components };
            let _id = _selectedFormPage.id;

            _selectedForm.multipage_design.forEach(d => {
                if (d.id === _id) {
                    d.components = components;
                }
            });

            _selectedForm.design = {};

            _selectedForm.design = {
                layout: layout,
                components: components,
                images: images,
                htmlCollection: htmlCollection,
            };

            setSelectedFormPage(_selectedFormPage);

            saveData(selectedForm, components);
        } else {
            let temp = { ...selectedForm };
            temp.design = {};

            temp.design = {
                layout: layout,
                components: components,
                images: images,
                htmlCollection: htmlCollection,
            };

            setSelectedForm(temp);
            saveData(temp, components);
        }
    }

    // event handlers
    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedForm(prev => ({
            ...prev,
            [name]: value,
        }));
        if (name === "datasource") {
            if (value === "") {
                setUsePrefix(true);
            }

            if (value !== "") {
                setShowDatasource(true);
            } else {
                setShowDatasource(false);
            }
        }
    }

    function handleCheckBoxEvents(event) {
        let name = event.target.name;
        let checked = event.target.checked;
        let type = event.target.type;

        if (name == "create_sequence") {
            setCreateSequence(checked);
        } else if (name == "useprefix") {
            setUsePrefix(checked);
        } else if (name == "enable_multipage") {
            setEnableMultiPage(checked);

            if (checked) {
                let firstForm = selectedForm.multipage_design
                    ? selectedForm.multipage_design[0]
                    : INITIAL_DESIGN;

                if (firstForm && firstForm.design) {
                    setImages(firstForm.design.images);
                    setHtmlCollection(firstForm.design.htmlCollection);
                    setLayout(firstForm.design.layout);
                    setComponents(firstForm.design.components);
                    setSelectedFormPage(firstForm);
                    setSelectedIndex(0);
                    setMultipageDesign(selectedForm.multipage_design);
                } else {
                    setImages({});
                    setHtmlCollection({});
                    setLayout([]);
                    setComponents({});
                    setSelectedFormPage({
                        id: "",
                        title: "",
                        icon: "",
                        design: INITIAL_DESIGN,
                    });
                    setSelectedIndex(0);
                    setMultipageDesign([]);
                }
            } else {
                setImages(selectedForm.design.images);
                setHtmlCollection(selectedForm.design.htmlCollection);
                setLayout(selectedForm.design.layout);
                setComponents(selectedForm.design.components);
                setSelectedFormPage({
                    id: "",
                    title: "",
                    icon: "",
                    design: INITIAL_DESIGN,
                });
                setSelectedIndex(-1);
            }
        }
    }

    function getUpdatedState(id, arr) {
        let obj = {};
        let foundObj = arr.filter(el => el.id === id);

        if (foundObj.length > 0) {
            obj = foundObj[0];
        }
        return obj;
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputRef.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        setSearchField(event.target.value);
        const keysToSearch = ["name", "table", "form_key"];
        let result = [];
        result = filterArrayByTerms(formList, textToSearch, keysToSearch);
        setFilteredFormList(result);
    };

    // useEffect(() => {
    //     if (selectedForm.id) handleFormSelect(selectedForm.id);
    // }, [selectedForm.id]);

    async function handleFormSelect(form) {
        setSelectedItem(form);
    }

    async function getSelectedForm(form) {
        const res = await globalGetData({
            keys: [
                {
                    params: form.id,
                    dataKey: "form",
                    serviceKey: "sys.selected.form",
                    mode: "formData",
                },
            ],
            url: API_URL + "?service.key=masterKey.tenantData",
        });
        if (res.data.C_DATA.form) {
            form = res.data.C_DATA.form[0];
        }

        setError([]);
        setSelectedForm(form);

        if (form.enable_multipage === "YES") {
            try {
                form.multipage_design = tryToParse(form.multipage_design);
                if (form.multipage_design && form.multipage_design.length > 0) {
                    if (selectedFormPage.id === "") {
                        let firstForm = form.multipage_design
                            ? form.multipage_design[0]
                            : INITIAL_DESIGN;

                        if (firstForm.design) {
                            setImages(firstForm.design.images);
                            setHtmlCollection(firstForm.design.htmlCollection);
                            setLayout(firstForm.design.layout);
                            setComponents(firstForm.design.components);
                            setSelectedFormPage(firstForm);
                        } else {
                            //
                        }
                    } else {
                        let firstForm = form.multipage_design
                            ? form.multipage_design[0]
                            : INITIAL_DESIGN;

                        if (firstForm.design) {
                            setImages(firstForm.design.images);
                            setHtmlCollection(firstForm.design.htmlCollection);
                            setLayout(firstForm.design.layout);
                            setComponents(firstForm.design.components);
                            setSelectedFormPage(firstForm);
                        } else {
                            //
                        }
                    }
                } else {
                    //
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            form.design = tryToParse(form.design);

            setImages(form.design.images);
            setLayout(form.design.layout);
            setHtmlCollection(form.design.htmlCollection);
            setComponents(form.design.components);
        }

        setMultipageDesign(form.multipage_design);

        if (form.datasource === "" || form.datasource === undefined) {
            setShowDatasource(false);
        } else {
            setShowDatasource(true);
        }

        if (
            form.create_sequence === undefined ||
            form.create_sequence === "" ||
            form.create_sequence === "NO"
        ) {
            setCreateSequence(false);
        } else if (form.create_sequence === "YES") {
            setCreateSequence(true);
        }

        if (
            form.useprefix === undefined ||
            form.useprefix === "" ||
            form.useprefix === "YES"
        ) {
            setUsePrefix(true);
        } else if (form.useprefix === "NO") {
            setUsePrefix(false);
        }

        if (
            form.enable_multipage === undefined ||
            form.enable_multipage === "" ||
            form.enable_multipage === "NO"
        ) {
            setEnableMultiPage(false);
        } else if (form.enable_multipage === "YES") {
            setEnableMultiPage(true);
        }
    }

    function handleCanDesign() {
        if (selectedForm.id === "" || selectedForm.id === "new") {
            setCanDesign("Form needs to be saved first before designing.");
            setDesignMode(false);

            setTimeout(() => {
                setCanDesign("");
            }, 3000);
        } else {
            setCanDesign("");
            setDesignMode(true);
        }
    }

    async function duplicateSelectedForm(form) {
        const res = await getSelectedItem({
            id: form.id,
            serviceKey: "sys.form",
        });
        const selectedForm = res.data.C_DATA[form.id][0];

        selectedForm.design = tryToParse(selectedForm.design);
        selectedForm.id = "new";
        selectedForm.name = "";
        selectedForm.form_key = "";

        const _layout = [...selectedForm.design.layout];
        const _components = { ...selectedForm.design.components };
        const _images = { ...selectedForm.design.images };
        const _htmlCollection = { ...selectedForm.design.htmlCollection };
        if (selectedForm.enable_multipage === "YES") {
            selectedForm.multipage_design = tryToParse(
                selectedForm.multipage_design,
            );
            setEnableMultiPage(true);
            setMultipageDesign(selectedForm.multipage_design);
        } else {
            setLayout(_layout);
            setComponents(_components);
            setImages(_images);
            setHtmlCollection(_htmlCollection);
        }

        const _duplicatedFrom = {
            ...selectedForm,
        };

        if (
            selectedForm.datasource === "" ||
            selectedForm.datasource === undefined
        ) {
            setShowDatasource(false);
        } else {
            setShowDatasource(true);
        }

        setSelectedForm(_duplicatedFrom);

        setMessage("Form duplicated successfully!");
        setTimeout(() => {
            setMessage("");
        }, 3000);
    }

    function generateSchema(components, currentSchema = []) {
        // let updatedSchema = [...currentSchema];
        let updatedSchema = [];

        for (const property in components) {
            let currentComonent = components[property];
            let temp = {};
            temp.type = currentComonent.type;
            if (temp.type == "daterange") {
                let start_db_column = currentComonent.data.start_db_column;
                let end_db_column = currentComonent.data.end_db_column;
                if (
                    updatedSchema.filter(e => e.name === start_db_column)
                        .length === 0 &&
                    updatedSchema.filter(e => e.name === end_db_column)
                        .length === 0
                ) {
                    if (
                        start_db_column !== undefined &&
                        end_db_column !== undefined
                    ) {
                        updatedSchema.push({
                            type: "date",
                            name: start_db_column,
                        });
                        updatedSchema.push({
                            type: "date",
                            name: end_db_column,
                        });
                    }
                }
            } else {
                temp.name = currentComonent.data.db_column;
                if (
                    updatedSchema.filter(e => e.name === temp.name).length === 0
                ) {
                    if (temp.name !== undefined) {
                        updatedSchema.push(temp);
                    }
                }
            }
        }

        return updatedSchema;
    }

    const isObjectEmpty = objectName => {
        return Object.keys(objectName).length === 0;
    };

    // API calls

    function saveData(_form, _components) {
        let componentList = !isEmpty(_components) ? _components : components;
        if (!componentList) componentList = {};

        let form = { ..._form };
        // checks if value of `createSequence` is "YES" from DB and not from state
        if (form.create_sequence === undefined || form.create_sequence === "") {
            if (createSequence) {
                form.create_sequence = "YES";
            } else {
                form.create_sequence = "NO";
            }
        } else {
            form.create_sequence = createSequence ? "YES" : "NO";
        }

        if (
            form.enable_multipage === undefined ||
            form.enable_multipage === ""
        ) {
            if (enableMultiPage) {
                form.enable_multipage = enableMultiPage;
            } else {
                form.enable_multipage = "NO";
            }
        } else {
            form.enable_multipage = enableMultiPage ? "YES" : "NO";
        }

        // checks if value of `usePrefix` is "YES" from DB and not from state
        if (form.useprefix === undefined || form.useprefix === "") {
            if (usePrefix) {
                form.useprefix = "YES";
            } else {
                form.useprefix = "NO";
            }
        } else {
            form.useprefix = usePrefix ? "YES" : "NO";
        }
        form.schema = [];
        if (form.enable_multipage === "YES") {
            let mergedMultipageDesign = multipageDesign.map(item => {
                if (item.design.components) {
                    let pageSchema = generateSchema(
                        item.design.components,
                        form.schema,
                    );
                    form.schema = [...form.schema, ...pageSchema];
                }
                if (item.id === selectedFormPage.id) {
                    item.design.layout = layout;
                    item.design.components = componentList;
                    item.design.images = images;
                    item.design.htmlCollection = htmlCollection;
                    return item;
                }

                return item;
            });

            form.multipage_design = mergedMultipageDesign;
            // form.design = INITIAL_DESIGN;
            form.design = selectedForm.design;
        } else {
            if (form.design.components) {
                form.schema = generateSchema(
                    form.design.components,
                    form.schema,
                );
            }
        }
        if (toggleLookup === "LOOKUP") {
            if (selectedTable.value === INITIAL_SELECTED_TABLE.value) {
                form.table = "";
            } else {
                form.table = selectedTable.value;
            }
        } else {
        }

        if (validation(form)) {
            if (toggleLookup === "LOOKUP") {
                setToggleLookup("INPUT");
            }
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "app_form"; //"formid"
            entityForm.entity = "app_form"; //Db- "table name"
            entityForm.action = "update";

            if (!form.id || form.id == "" || form.id == "new") {
                entityForm.id = "new";
                form.id = "new";
            } else {
                entityForm.id = form.id;
            }

            delete form.selected;
            entityForm.formData = form;
            form.table = form.table.replaceAll(/[^A-Z0-9]+/gi, "_");
            form.table = form.table.toLowerCase();

            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        let formId = response.data.C_DATA[0].formData.id;
                        let formData = response.data.C_DATA[0].formData;
                        validateSchema(formId);                       

                        if (
                            (selectedForm.id === "new" ||
                                selectedForm.id === "") &&
                            formId
                        ) {
                            setSelectedForm(formData);
                            insertItem(setFormList, formData);
                            insertItem(setFilteredFormList, formData);
                        } else {
                            updateItem(setFormList, formData);
                            updateItem(setFilteredFormList, formData);
                        }

                        const status =
                            selectedForm.id == "new" ||
                            selectedForm.id == "" ||
                            selectedForm.id == undefined
                                ? "Saved"
                                : "Updated";

                        toastEmitter(
                            `${selectedForm.name} form ${status} Successfully`,
                            true,
                        );

                        // getData();
                    }
                    if (response.data.C_STATUS === "FAIL") {
                        toastEmitter(
                            `${selectedForm.name} form ${response.data.C_MESSAGE}`,
                            false,
                            "error",
                        );
                    }
                });
            } catch (e) {
                console.log(e);
            }
        } else {
            return;
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;
            // let deleteRecordChannelId = fieldsData.channel

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "app_form";
            entityForm.entity = "app_form";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        // getData();
                        deleteItem(setFormList, fieldsData);
                        deleteItem(setFilteredFormList, fieldsData);
                        updateDeleteConfig(false, {}, setDeleteConfig);
                        toastEmitter("Form Deleted Successfully", true);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "formList",
                    serviceKey: "sys.forms",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.module.instances",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.formList) {
                        let _formList = response.data.C_DATA.formList;

                        setFormList(_formList);

                        const keysToSearch = ["name", "table", "form_key"];
                        if (searchField) {
                            let result = filterArrayByTerms(
                                _formList,
                                searchField,
                                keysToSearch,
                            );
                            setFilteredFormList(result);
                        } else {
                            setFilteredFormList(_formList);
                        }
                        if (selectedForm.id && selectedForm.id !== "new") {
                            let updatedState = { ...selectedForm };

                            if (isObjectEmpty(updatedState)) {
                                setSelectedForm(INITIAL_STATE);
                                setCreateSequence(false);
                                setEnableMultiPage(false);
                                setUsePrefix(true);
                                setLayout([]);
                                setMultipageDesign([]);
                                setComponents({});
                                setImages({});
                                setHtmlCollection({});
                            } else {
                                setSelectedForm(updatedState);
                                setCreateSequence(
                                    updatedState.create_sequence === "YES"
                                        ? true
                                        : false,
                                );
                                setEnableMultiPage(
                                    updatedState.enable_multipage === "YES"
                                        ? true
                                        : false,
                                );
                                setUsePrefix(
                                    updatedState.useprefix === "YES"
                                        ? true
                                        : false,
                                );

                                if (
                                    updatedState.enable_multipage &&
                                    updatedState.enable_multipage === "YES"
                                ) {
                                    try {
                                        if (
                                            updatedState.multipage_design &&
                                            updatedState.multipage_design
                                                .length > 0
                                        ) {
                                            let filteredForm = {};
                                            if (selectedFormPage.id !== "") {
                                                let _filteredForm =
                                                    updatedState.multipage_design
                                                        ? updatedState.multipage_design.filter(
                                                              design =>
                                                                  design.id ===
                                                                  selectedFormPage.id,
                                                          )
                                                        : INITIAL_DESIGN;

                                                filteredForm =
                                                    _filteredForm.length > 0
                                                        ? _filteredForm[0]
                                                        : INITIAL_DESIGN;
                                            } else {
                                                filteredForm =
                                                    updatedState.multipage_design
                                                        ? updatedState
                                                              .multipage_design[0]
                                                        : INITIAL_DESIGN;
                                            }

                                            if (filteredForm.design) {
                                                setImages(
                                                    filteredForm.design.images,
                                                );
                                                setHtmlCollection(
                                                    filteredForm.design
                                                        .htmlCollection,
                                                );
                                                setLayout(
                                                    filteredForm.design.layout,
                                                );
                                                setComponents(
                                                    filteredForm.design
                                                        .components,
                                                );
                                                setSelectedFormPage(
                                                    filteredForm,
                                                );
                                            } else {
                                                //
                                            }
                                        } else {
                                            //
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                } else {
                                    setLayout(updatedState.design.layout);
                                    setComponents(
                                        updatedState.design.components,
                                    );
                                    setImages(updatedState.design.images);
                                    // setMultipageDesign([
                                    //     {
                                    //         design: {
                                    //             layout: [],
                                    //             components: {},
                                    //             images: {},
                                    //             htmlCollection: {},
                                    //         },
                                    //         id: "",
                                    //         title: "",
                                    //     },
                                    // ]);
                                    setHtmlCollection(
                                        updatedState.design.htmlCollection,
                                    );
                                }
                            }
                        }
                    } else {
                        console.log(
                            `Either list.all.forms does not exists or SQL query returns no result.`,
                        );
                    }
                    if (response.data.C_DATA.instance) {
                        setInstanceItems(response.data.C_DATA.instance);
                    } else {
                        setInstanceItems([]);
                        console.log(
                            `Either instance does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function validateSchema(id) {
        const url = API_URL + "?service.key=validate.schema";

        let request = {
            formId: id,
        };

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        console.log(`${selectedForm.name} form Schema validation was successfull`);
                    } else {
                        toastEmitter(`${selectedForm.name} form schema validation failed > ${response.data.C_MESSAGE}`, true, "warning");
                    }
                }
            });
        } catch (e) {
            console.log("validateSchema error:" + e);
        }
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {
            console.log(e);
            return defaultValue;
        }

        return defaultValue;
    }

    return (
        <ErrorBoundary>
            {/* <code>{JSON.stringify(layout.length, null, 2)}</code>
            <hr />
            <code>{JSON.stringify(components, null, 2)}</code> */}
            <FormContext.Provider
                value={{
                    layout,
                    components,
                    images,
                    htmlCollection,
                    selectedForm,
                    multipageDesign,
                    renderPreview,
                    setLayout,
                    setComponents,
                    setImages,
                    setHtmlCollection,
                    setSelectedForm,
                    selectedFormPage,
                    setRenderPreview,
                }}>
                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this item"}
                    operation={deleteData}
                    header={"Delete Form"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
                <CsvModal
                    csvModal={csvModal}
                    handleClose={handleCloseCsv}
                    getData={getData}
                    tableName="app_form"
                    title={"Form Builder Import"}
                />
                <div
                    id="form-builder"
                    className="form-builder">
                    {mode === modeType.design || mode === modeType.preview ? (
                        <div className="d-flex justify-content-center align-items-center form-dnd-preview">
                            <span className="text-danger">Form builder</span>
                            added successfully.
                        </div>
                    ) : null}
                    {mode === modeType.render && (
                        <div className="">
                            {!designMode ? (
                                <FormList
                                    setFilteredFormList={setFilteredFormList}
                                    addNewItem={addNewItem}
                                    searchField={searchField}
                                    handleSearch={handleSearch}
                                    inputRef={inputRef}
                                    filteredFormList={filteredFormList}
                                    handleFormSelect={handleFormSelect}
                                    duplicateSelectedForm={
                                        duplicateSelectedForm
                                    }
                                    deleteData={deleteData}
                                    error={error}
                                    selectedForm={selectedForm}
                                    setSelectedForm={setSelectedForm}
                                    message={message}
                                    canDesign={canDesign}
                                    layout={layout}
                                    components={components}
                                    images={images}
                                    handleCanDesign={handleCanDesign}
                                    handleInputField={handleInputField}
                                    handleCheckBoxEvents={handleCheckBoxEvents}
                                    createSequence={createSequence}
                                    enableMultiPage={enableMultiPage}
                                    usePrefix={usePrefix}
                                    saveData={saveData}
                                    formList={formList}
                                    setFormList={setFormList}
                                    handleShowCsv={handleShowCsv}
                                    instanceItems={instanceItems}
                                    showDatasource={showDatasource}
                                    multipageDesign={multipageDesign}
                                    setMultipageDesign={setMultipageDesign}
                                    selectedFormPage={selectedFormPage}
                                    setSelectedFormPage={setSelectedFormPage}
                                    selectedIndex={selectedIndex}
                                    setSelectedIndex={setSelectedIndex}
                                    currentSelectedFormId={
                                        currentSelectedFormId
                                    }
                                    toggleLookup={toggleLookup}
                                    setToggleLookup={setToggleLookup}
                                    selectedTable={selectedTable}
                                    setSelectedTable={setSelectedTable}
                                    setComponents={setComponents}
                                    setLayout={setLayout}
                                    setHtmlCollection={setHtmlCollection}
                                    setImages={setImages}
                                    listingRef={listingRef}
                                    formRef={formRef}
                                    handleListingScroll={handleListingScroll}
                                    handleFormScroll={handleFormScroll}
                                />
                            ) : (
                                <Designer
                                    designMode={designMode}
                                    setDesignMode={setDesignMode}
                                    updateData={handleUpdateData}
                                />
                            )}
                        </div>
                    )}
                </div>
            </FormContext.Provider>
        </ErrorBoundary>
    );
}

function FormList(props) {
    const {
        multipageDesign,
        setMultipageDesign,
        selectedForm,
        selectedFormPage,
        setSelectedFormPage,
        selectedIndex,
        setSelectedIndex,
        currentSelectedFormId,
        toggleLookup,
        setToggleLookup,
        selectedTable,
        setSelectedTable,
        searchField,
        setSelectedForm,
        setFormList,
        setFilteredFormList,
        listingRef,
        formRef,
        handleListingScroll,
        handleFormScroll,
    } = props;

    const { id } = selectedForm;

    const [formToDelete, setFormToDelete] = useState({});
    const [tables, setTables] = useState([{ ...INITIAL_SELECTED_TABLE }]);

    const [tableAlreadyExists, setTableAlreadyExists] = useState("NO");
    const modalRef = useRef(null);
    const updateTabsModalRef = useRef(null);
    const createTabsModalRef = useRef(null);
    const previewModalRef = useRef(null);
    const deleteFormModalRef = useRef(null);
    const tableLookupModalRef = useRef(null);
    const appContext = useContext(AppContext);
    const tenantSubscription = appContext.tenantSubscription;
    const tenant_id = tenantSubscription.datasource;

    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        if (currentSelectedFormId.current !== id) {
            currentSelectedFormId.current = id;
            setSelectedIndex(0);
        }

        if (id === "new") {
            setSelectedTable(INITIAL_SELECTED_TABLE);
            setToggleLookup("INPUT");
        } else {
            if (selectedForm.table !== "") {
                let _result = tables.filter(
                    table => table.value === selectedForm.table,
                );
                setSelectedTable({
                    label: selectedForm.table,
                    value: selectedForm.table,
                });

                // if (_result && _result.length > 0) {
                //     setTableAlreadyExists("YES");
                // } else {
                //     setTableAlreadyExists("NO");
                // }
            }

            setToggleLookup("INPUT");
        }
        setTableAlreadyExists("NO");
    }, [id]);

    function checkIfTableExists() {
        if (selectedForm.table !== "") {
            let _result = tables.filter(
                table => table.value === selectedForm.table,
            );
            if (_result && _result.length > 0) {
                setTableAlreadyExists("YES");
            } else {
                setTableAlreadyExists("NO");
            }
        }
    }

    function selectItemsForExport(selectedItem, check) {
        let _items = [...props.formList];
        let index = _items.findIndex(item => item.id === selectedItem.id);

        _items[index].selected = check;
        props.setFormList(_items);
    }

    function selectedRecordExport() {
        const form = props.formList.filter(form => form.selected);
        if (form && form.length >= 1) {
            nameExport(form[0].name);
        } else {
            toastEmitter("Select atleast one form", true, "warning");
        }
    }

    async function nameExport(title, bool) {
        try {
            const list = [...props.formList];
            const filteredList = [...props.filteredFormList];
            const items = filteredList.filter(item => item.selected);
            const length = items.length;

            if (length === 1) {
                const res = await getSelectedForms(props.formList);
                const data = res.data.C_DATA;
                const forms = [];

                for (let key in data) {
                    const item = data[key][0];
                    item.selected = true;
                    forms.push(item);
                }
                jsonExport(forms, () => {}, title, "_form");
                modalRef.current.close();

                for (let item of list) {
                    delete item.selected;
                }
                for (let item of filteredList) {
                    delete item.selected;
                }
                setFormList(list);
                setFilteredFormList(filteredList);
            } else {
                if (bool) {
                    const res = await getSelectedForms(props.formList);
                    const data = res.data.C_DATA;
                    const forms = [];

                    for (let key in data) {
                        const item = data[key][0];
                        item.selected = true;
                        forms.push(item);
                    }

                    jsonExport(forms, () => {}, title, "_form");

                    for (let item of list) {
                        delete item.selected;
                    }
                    for (let item of filteredList) {
                        delete item.selected;
                    }
                    setFormList(list);
                    setFilteredFormList(filteredList);
                    modalRef.current.close();
                } else {
                    modalRef.current.show();
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function getSelectedForms(items) {
        const ids = items.filter(item => item.selected).map(item => item.id);

        const request = {
            keys: [],
            url: API_URL + "?service.key=masterKey.tenantData",
            datasource: "",
            tenant_id: tenant_id,
        };

        ids.forEach(id => {
            const data = {
                params: id,
                dataKey: id,
                serviceKey: "sys.form",
                mode: "formData",
            };
            request.keys.push(data);
        });
        if (request.keys.length > 0) return globalGetData(request);
        else false;
    }

    function addNewFormPage() {
        let arr = [...multipageDesign];
        const newDesign = {
            title: selectedFormPage.title,
            id: makeid(8),
            icon: selectedFormPage.icon,
            design: {
                layout: [],
                components: {},
                images: {},
                htmlCollection: {},
            },
        };
        // let value = inputField.replaceAll(/[^A-Z0-9]+/gi, "_");
        arr.push(newDesign);

        setSelectedIndex(arr.length - 1);
        setMultipageDesign(arr);
        setSelectedFormPage(newDesign);
        createTabsModalRef.current.close();
        toastEmitter("Page Saved Successfully", true);
    }

    async function editCurrentFormPage(formPage, i) {
        setSelectedIndex(i);
        updateTabsModalRef.current.show();
        setSelectedFormPage(formPage);
    }

    function designSelectedForm(formPage, i) {
        setSelectedIndex(i);
        setSelectedFormPage(formPage);
        setTimeout(() => {
            props.handleCanDesign(formPage);
        }, 100);
    }

    function markMaster(formPage, i, isMaster) {
        let arr = multipageDesign.map((page, index) => {
            return {
                ...page,
                isMaster: index == i ? (page.isMaster ? false : true) : false,
            };
        });

        setMultipageDesign(arr);
    }

    function updateFormPage() {
        let arr = [...multipageDesign];

        arr[selectedIndex] = {
            title: selectedFormPage.title,
            id: selectedFormPage.id,
            icon: selectedFormPage.icon,
            design: selectedFormPage.design,
        };
        setMultipageDesign(arr);
        setSelectedFormPage({
            title: "",
            id: "",
            icon: "",
            design: INITIAL_DESIGN,
        });
        updateTabsModalRef.current.close();
        toastEmitter("Page Updated Successfully", true);
    }

    function handlePageDelete(formPage, index) {
        setFormToDelete({
            formPage,
            index,
        });

        deleteFormModalRef.current.show();
    }

    function removeFormPage({ formPage, index }) {
        const updatedMultiPage = multipageDesign.filter(fp => fp !== formPage);
        const newSelectedIndex = index > 0 ? index - 1 : 0;

        setSelectedIndex(newSelectedIndex);
        setMultipageDesign(updatedMultiPage);
        setFormToDelete({});

        console.log(selectedForm);
        console.log(selectedFormPage);
        // setSelectedFormPage()

        if (updatedMultiPage[newSelectedIndex]) {
            let nextDesign = updatedMultiPage[newSelectedIndex].design;

            props.setComponents(nextDesign.components);
            props.setImages(nextDesign.images);
            props.setHtmlCollection(nextDesign.htmlCollection);
            props.setLayout(nextDesign.layout);
        } else {
            props.setComponents({});
            props.setImages({});
            props.setHtmlCollection({});
            props.setLayout([]);
        }

        props.setSelectedForm(prev => {
            return {
                ...prev,
                multipage_design: updatedMultiPage,
            };
        });

        deleteFormModalRef.current.close();
        toastEmitter("Page Deleted Successfully", true);
    }

    function handleSelectionChange(obj) {
        setSelectedTable(obj);
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "tables",
                    serviceKey: "sys.get.all.tables",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA && response.data.C_DATA.tables) {
                        const list = response.data.C_DATA.tables;
                        const _list = list.map(item => {
                            let name = item.table_name;
                            let newName = name.replace("app_fd_", "");

                            return {
                                value: newName,
                                label: newName,
                            };
                        });
                        setTables([{ ...INITIAL_SELECTED_TABLE }, ..._list]);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="container-fluid px-0">
            <div className="row m-0">
                <div className="col-sm-3 listing-col s2a-border-right">
                    <SearchAndBtns
                        title={
                            `Available Forms (` +
                            props?.filteredFormList?.length +
                            ")"
                        }
                        handleImport={props.handleShowCsv}
                        handleExport={selectedRecordExport}
                        addNewItem={props.addNewItem}
                        handleSearch={props.handleSearch}
                        searchValue={searchField}
                        inputRef={props.inputRef}
                        SearchPlaceHolder="Search key, name & table"
                        handleFormScroll={handleFormScroll}
                    />
                    <Scroll height="55vh">
                        <ul className="list-group list-group-flush formlist-listing">
                            {props?.filteredFormList.map(form => {
                                return (
                                    <li
                                        key={form.id}
                                        onClick={() => handleFormScroll()}
                                        className={`form-item list-group-item d-flex justify-content-between align-items-start
                                    ${
                                        props.selectedForm &&
                                        props.selectedForm["id"] === form["id"]
                                            ? "selected-cell"
                                            : ""
                                    }
                                                `}>
                                        <input
                                            className="form-check-input me-2"
                                            type="checkbox"
                                            checked={form.selected}
                                            onChange={e =>
                                                selectItemsForExport(
                                                    form,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <div
                                            className="pointer me-auto flex-grow-1"
                                            onClick={() =>
                                                props.handleFormSelect(form)
                                            }>
                                            {form.name}
                                        </div>
                                        {/* <div
                                        className="d-block pointer form-duplicate-icon"
                                        title="Duplicate"
                                        onClick={() =>
                                            props.duplicateSelectedForm(form)
                                        }>
                                        <i className="px-1 fa-regular fa-clone"></i>
                                    </div>
                                    <div
                                        className="d-block pointer form-delete-icon"
                                        onClick={() => props.deleteData(form)}
                                        title="Delete">
                                        <i className="px-1 fa-regular fa-trash-can"></i>
                                    </div> */}

                                        <div className="form-list-btns">
                                            <span
                                                className=""
                                                title="Duplicate"
                                                onClick={() =>
                                                    props.duplicateSelectedForm(
                                                        form,
                                                    )
                                                }>
                                                <i className="px-1 fa-regular fa-clone formlist-clone"></i>
                                            </span>
                                            <span
                                                className="table-del-font"
                                                title="Delete"
                                                onClick={() =>
                                                    props.deleteData(form)
                                                }>
                                                <i className="fa-regular fa-trash-can text-danger"></i>
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Scroll>
                </div>
                <div
                    className="col-sm-5 sites-col border-end border-color"
                    ref={formRef}>
                    <div className="form-background">
                        <div className="listing-header">
                            <label className="fw-bold ">Form Details</label>
                        </div>
                        <div className="row">
                            <div className="mb-2 form-group">
                                <label className="mt-1 d-flex justify-content-between">
                                    <span className="d-inline-block fw-bold">
                                        Key&nbsp;
                                        <span className="text-danger">*</span>
                                    </span>
                                    <span
                                        className={`text-danger ${
                                            props.error.indexOf("form_key") > -1
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        Key cannot be empty.
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="form_key"
                                    value={
                                        props.selectedForm &&
                                        props.selectedForm["form_key"]
                                    }
                                    onChange={e => props.handleInputField(e)}
                                />
                            </div>
                        </div>
                        <div className="row ">
                            <div className="mb-2 form-group">
                                <label className="mt-1 d-flex justify-content-between">
                                    <span className="d-inline-block fw-bold">
                                        Name&nbsp;
                                        <span className="text-danger">*</span>
                                    </span>

                                    <span
                                        className={`text-danger ${
                                            props.error.indexOf("name") > -1
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        Name cannot be empty.
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={
                                        props.selectedForm &&
                                        props.selectedForm["name"]
                                    }
                                    onChange={e => props.handleInputField(e)}
                                />
                            </div>
                        </div>
                        <div className="row ">
                            <div className="mb-2 form-group">
                                <label className="mt-1 d-flex justify-content-between">
                                    <span className="d-inline-block fw-bold">
                                        Title&nbsp;
                                        <span className="text-danger">*</span>
                                    </span>

                                    <span
                                        className={`text-danger ${
                                            props.error.indexOf("title") > -1
                                                ? "d-inline-block"
                                                : "d-none"
                                        }`}>
                                        Title cannot be empty.
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={
                                        props.selectedForm &&
                                        props.selectedForm["title"]
                                    }
                                    onChange={e => props.handleInputField(e)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="mb-2 ">
                                <div className="form-group">
                                    <label className="mt-1 d-flex justify-content-between">
                                        <span className="d-inline-block fw-bold">
                                            Table Name&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </span>
                                        {tableAlreadyExists === "YES" ? (
                                            <span>Table already exists ✔</span>
                                        ) : (
                                            <span
                                                className={`text-danger ${
                                                    props.error.indexOf(
                                                        "table",
                                                    ) > -1
                                                        ? "d-inline-block"
                                                        : "d-none"
                                                }`}>
                                                {toggleLookup === "INPUT"
                                                    ? "Table cannot be empty."
                                                    : "Please select a table."}
                                            </span>
                                        )}
                                        {/* {toggleLookup === "INPUT" && (
                                            <>

                                            </>
                                        )} */}
                                    </label>

                                    {toggleLookup === "INPUT" && (
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="table"
                                                value={
                                                    props.selectedForm &&
                                                    props.selectedForm["table"]
                                                }
                                                onChange={e =>
                                                    props.handleInputField(e)
                                                }
                                                onBlur={() =>
                                                    checkIfTableExists()
                                                }
                                            />
                                            <span
                                                className={`input-group-text d-flex pointer `}
                                                onClick={() => {
                                                    setToggleLookup("LOOKUP");
                                                }}>
                                                <span className="fa-solid fa-search me-1"></span>{" "}
                                            </span>
                                        </div>
                                    )}

                                    {toggleLookup === "LOOKUP" && (
                                        <div>
                                            <div>
                                                <ReactSelect
                                                    options={tables}
                                                    selectedOption={
                                                        selectedTable
                                                    }
                                                    handleChange={
                                                        handleSelectionChange
                                                    }
                                                />
                                            </div>

                                            <div className="d-flex justify-content-end align-items-center mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setToggleLookup(
                                                            "INPUT",
                                                        );
                                                        // setSelectedTable(
                                                        //     prev => ({
                                                        //         label: selectedForm.table,
                                                        //         value: selectedForm.table,
                                                        //     }),
                                                        // );

                                                        // tableLookupModalRef.current.close();
                                                    }}
                                                    className="ms-2 btn button-theme btn-sm">
                                                    <span className="fa-solid fa-edit"></span>
                                                </button>
                                                {/* <button
                                                    type="button"
                                                    onClick={() => {
                                                        let event = {
                                                            target: {},
                                                        };

                                                        event.target.name =
                                                            "table";
                                                        event.target.value =
                                                            selectedTable.value;
                                                        props.handleInputField(
                                                            event,
                                                        );

                                                        tableLookupModalRef.current.close();
                                                    }}
                                                    className="ms-2 btn button-theme btn-sm">
                                                    Ok
                                                </button> */}
                                            </div>
                                        </div>
                                    )}

                                    {/* <div className="input-group mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="table"
                                            value={
                                                props.selectedForm &&
                                                props.selectedForm["table"]
                                            }
                                            onChange={e =>
                                                props.handleInputField(e)
                                            }
                                        />
                                        <span
                                            className={`input-group-text d-flex pointer ${
                                                tableAlreadyExists === "YES"
                                                    ? "table-lookup-form"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                tableLookupModalRef.current.show()
                                            }>
                                            <span className="fa-solid fa-search me-1"></span>{" "}
                                            Lookup {tableAlreadyExists}
                                        </span>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="mb-2 ">
                                <div className="form-group">
                                    <label className="mt-1 d-flex justify-content-between">
                                        <span className="d-inline-block fw-bold">
                                            Datasource&nbsp;
                                        </span>
                                    </label>
                                    <select
                                        // placeholder="Select Option"
                                        className="form-select"
                                        name="datasource"
                                        value={
                                            props.selectedForm &&
                                            props.selectedForm["datasource"]
                                        }
                                        onChange={e =>
                                            props.handleInputField(e)
                                        }>
                                        <option value="">Default</option>
                                        {props.instanceItems &&
                                            props.instanceItems !== undefined &&
                                            props.instanceItems.map(
                                                instance => {
                                                    return (
                                                        <option
                                                            key={instance.id}
                                                            value={
                                                                instance.code
                                                            }
                                                            className="option">
                                                            {instance.name}
                                                        </option>
                                                    );
                                                },
                                            )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {true && (
                            <div className="form-check">
                                <input
                                    className="form-check-input pointer"
                                    type="checkbox"
                                    name="useprefix"
                                    id="useprefix"
                                    onChange={e =>
                                        props.handleCheckBoxEvents(e)
                                    }
                                    checked={props.usePrefix}
                                />
                                <label
                                    className="form-check-label pointer"
                                    htmlFor="useprefix">
                                    Use prefix
                                </label>
                            </div>
                        )}
                        <div className="d-flex align-items-center gap-3">
                            <span>Id Generation:</span>
                            <DynamicRadio
                                items={[
                                    { code: "UUID", label: "UUID" },
                                    { code: "AUTO", label: "AUTO" },
                                ]}
                                defaultValue="UUID"
                                selectedItem={
                                    selectedForm["id_generation"]
                                }
                                classes={{
                                    main: "d-flex gap-2",
                                }}
                                handleChange={item => {
                                    setSelectedForm({
                                        ...selectedForm,
                                        id_generation: item,
                                    });
                                }}
                            />
                        </div>

                        {/* <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="create_sequence"
                                id="create_sequence"
                                onChange={e => props.handleCheckBoxEvents(e)}
                                checked={props.createSequence}
                                disabled={
                                    props.selectedForm["id"] &&
                                    props.selectedForm["id"] !== "new" &&
                                    props.selectedForm["create_sequence"] ===
                                        "YES"
                                }
                            />
                            <label
                                className="form-check-label pointer"
                                htmlFor="create_sequence">
                                Create sequence
                            </label>
                        </div> */}

                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="enable_multipage"
                                id="enable_multipage"
                                onChange={e => props.handleCheckBoxEvents(e)}
                                checked={props.enableMultiPage}
                            />
                            <label
                                className="form-check-label pointer"
                                htmlFor="enable_multipage">
                                Enable Multi Pages
                            </label>
                        </div>
                        <DynamicCheckBoxs
                            items={[
                                {
                                    code: "Close on save",
                                    label: "Close on Save ",
                                },
                            ]}
                            classes={{
                                main: "d-flex gap-2",
                            }}
                            selectedItem={selectedForm["close_on_save"]}
                            handleChange={item =>
                                setSelectedForm(prev => ({
                                    ...prev,
                                    close_on_save: item,
                                }))
                            }
                        />
                        <span className="fw-bold">Buttons Settings</span>
                        <div className="d-flex align-items-center gap-3">
                            <span>Display Buttons:</span>
                            <DynamicCheckBoxs
                                items={[
                                    { code: "Top", label: "Top" },
                                    { code: "Bottom", label: "Bottom" },
                                ]}
                                classes={{
                                    main: "d-flex gap-2",
                                }}
                                selectedItem={
                                    selectedForm["btn_vertical_position"]
                                }
                                handleChange={item =>
                                    setSelectedForm(prev => ({
                                        ...prev,
                                        btn_vertical_position: item,
                                    }))
                                }
                            />
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span>Position Buttons:</span>
                            <DynamicRadio
                                items={[
                                    { code: "Left", label: "Left" },
                                    { code: "Right", label: "Right" },
                                ]}
                                defaultValue="Right"
                                selectedItem={
                                    selectedForm["btn_horizontal_position"]
                                }
                                classes={{
                                    main: "d-flex gap-2",
                                }}
                                handleChange={item => {
                                    setSelectedForm({
                                        ...selectedForm,
                                        btn_horizontal_position: item,
                                    });
                                }}
                                disabled={!selectedForm?.btn_vertical_position}
                            />
                        </div>

                        {props.enableMultiPage && (
                            <div className="d-flex align-items-center gap-3">
                                <span>Show Pages as:</span>
                                <DynamicRadio
                                    items={[
                                        { code: "TOP", label: "Tabs" },
                                        { code: "LEFT", label: "Menu" },
                                    ]}
                                    defaultValue="TOP"
                                    selectedItem={selectedForm["tabs_position"]}
                                    classes={{
                                        main: "d-flex gap-2",
                                    }}
                                    handleChange={item => {
                                        setSelectedForm({
                                            ...selectedForm,
                                            tabs_position: item,
                                        });
                                    }}
                                />
                            </div>
                        )}

                        <div className="row">
                            <div className="col">
                                <button
                                    className="m-2 ms-0 btn button-theme btn-sm"
                                    onClick={() =>
                                        props.saveData(props.selectedForm, {})
                                    }>
                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                                {props.enableMultiPage === false && (
                                    <button
                                        className="m-2 btn button-theme btn-sm ms-0"
                                        onClick={() => {
                                            props.handleCanDesign();
                                        }}
                                        title="Form needs to be saved before designing.">
                                        <i className="fa-solid fa-pen-nib pe-1"></i>
                                        Design Form
                                    </button>
                                )}

                                <button
                                    className="m-2 btn button-theme  btn-sm ms-0"
                                    onClick={() => {
                                        previewModalRef.current.show();
                                    }}
                                    disabled={
                                        props.selectedForm?.id === "new" || ""
                                    }>
                                    <i className="fa-solid fa-eye pe-1"></i>
                                    {props.enableMultiPage
                                        ? "Preview Form"
                                        : "Preview Form"}
                                </button>
                                <button
                                    className="m-2 ms-0 btn button-theme btn-sm"
                                    onClick={() =>
                                        props.saveData(props.selectedForm, {})
                                    }>
                                    <i className="px-1 fa-solid fa-floppy-disk pe-1"></i>
                                    Revalidate Schema
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="p-2">
                                <ErrorNotification
                                    error={props.error}
                                    labels={{
                                        name: "Name",
                                        form_key: "Key",
                                        table: "Table",
                                    }}
                                />
                            </div>
                        </div>
                        <div className="row">
                            {props.canDesign !== "" && (
                                <div
                                    className="alert alert-danger mb-0 p-1"
                                    role="alert">
                                    {props.canDesign}
                                </div>
                            )}
                            {props.message !== "" && (
                                <div
                                    className="alert alert-info mb-0 p-1"
                                    role="alert">
                                    {props.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-sm-4 listing-col">
                    <div className="row">
                        <div className="col">
                            {props.enableMultiPage && (
                                <button
                                    className="btn btn-sm button-theme my-2 float-end pointer"
                                    htmlFor=""
                                    onClick={() => {
                                        setSelectedFormPage({
                                            id: "",
                                            title: "",
                                            icon: "",
                                            design: INITIAL_DESIGN,
                                        });
                                        createTabsModalRef.current.show();
                                    }}>
                                    + Add Page
                                </button>
                            )}
                        </div>
                    </div>
                    {/* <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            name="create_sequence"
                            id="create_sequence"
                            onChange={e => props.handleCheckBoxEvents(e)}
                            checked={props.createSequence}
                            disabled={
                                props.selectedForm["id"] &&
                                props.selectedForm["id"] !== "new" &&
                                props.selectedForm["create_sequence"] === "YES"
                            }
                        />
                        <label
                            className="form-check-label pointer"
                            htmlFor="create_sequence">
                            Create sequence
                        </label>
                    </div> */}
                    <DndWrapper>
                        <ol className="list-group">
                            {props.enableMultiPage &&
                                props.multipageDesign &&
                                props.multipageDesign.map((formPage, i) => {
                                    return (
                                        <div key={i}>
                                            <DndCard
                                                id={formPage.id}
                                                index={i}
                                                setItems={setMultipageDesign}>
                                                <li
                                                    onClick={() => {
                                                        setSelectedFormPage(
                                                            formPage,
                                                        );
                                                        setSelectedIndex(i);
                                                    }}
                                                    className={`list-group-item d-flex justify-content-between ${
                                                        i === selectedIndex
                                                            ? "list-group-item-active"
                                                            : ""
                                                    } `}>
                                                    <div
                                                        style={{
                                                            width: "70%",
                                                        }}
                                                        className="pointer">
                                                        {i + 1}.{" "}
                                                        <span
                                                            className={`${
                                                                formPage.icon
                                                            } ${
                                                                formPage.icon
                                                                    ? "me-1"
                                                                    : ""
                                                            }`}></span>
                                                        {formPage.title}
                                                    </div>
                                                    <div>
                                                        <span
                                                            className=""
                                                            title={
                                                                formPage.isMaster
                                                                    ? "UnSet Master Page"
                                                                    : "Set Master Page"
                                                            }
                                                            onClick={() =>
                                                                markMaster(
                                                                    formPage,
                                                                    i,
                                                                )
                                                            }>
                                                            <i
                                                                className={`pointer me-2 ${
                                                                    formPage.isMaster
                                                                        ? "fa fa-file-text text-danger"
                                                                        : "fa fa-file-text"
                                                                }`}></i>
                                                        </span>
                                                        <span
                                                            className=""
                                                            title="Design"
                                                            onClick={() =>
                                                                designSelectedForm(
                                                                    formPage,
                                                                    i,
                                                                )
                                                            }>
                                                            <i className="pe-2 fa-solid fa-pen-nib pointer"></i>
                                                        </span>
                                                        <span
                                                            className=""
                                                            title="Edit"
                                                            onClick={() =>
                                                                editCurrentFormPage(
                                                                    formPage,
                                                                    i,
                                                                )
                                                            }>
                                                            <i className="pe-2 fa-regular fa-pen-to-square pointer"></i>
                                                        </span>
                                                        <span
                                                            className=""
                                                            title="Delete"
                                                            onClick={() =>
                                                                handlePageDelete(
                                                                    formPage,
                                                                    i,
                                                                )
                                                            }>
                                                            <i className="pe-2 pointer fa-regular fa-trash-can text-danger"></i>
                                                        </span>
                                                    </div>
                                                </li>
                                            </DndCard>
                                        </div>
                                    );
                                })}
                        </ol>
                    </DndWrapper>

                    {/* <div className="form-background mb-2 enable-scroll builder-render"> */}
                    {/* <div className="field-padding"> */}
                    {/* <AddFormFields
                                selectedForm={props.selectedForm}
                                setSelectedForm={props.setSelectedForm}
                                layout={props.layout}
                                components={props.components}
                                images={props.images}
                                mode={modeType.render}
                                modeType={modeType}
                            /> */}

                    {/* <code>{JSON.stringify(components, null, 2)}</code>
                <code>{JSON.stringify(images, null, 2)}</code>
                <code>{JSON.stringify(htmlCollection, null, 2)}</code> */}

                    {/* <RenderPreview
                                layout={props.layout}
                                components={props.components}
                                images={props.images}
                                mode={modeType.readonly}
                                modeType={modeType}></RenderPreview>
                        </div>
                    </div> */}
                </div>
            </div>
            <ChildrenModal
                ref={modalRef}
                header="Export Forms">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <ChildrenModal
                ref={createTabsModalRef}
                header="Create New Page">
                <div className="form-group">
                    <label
                        htmlFor="
                    ">
                        Title&nbsp;
                        <span className="text-danger">*</span>
                    </label>

                    <input
                        type="text"
                        value={selectedFormPage.title}
                        onChange={e =>
                            setSelectedFormPage(prev => ({
                                ...prev,
                                title: e.target.value,
                            }))
                        }
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label
                        htmlFor="
                    ">
                        Icon
                    </label>

                    <input
                        type="text"
                        value={selectedFormPage.icon}
                        onChange={e =>
                            setSelectedFormPage(prev => ({
                                ...prev,
                                icon: e.target.value,
                            }))
                        }
                        className="form-control"
                    />
                </div>

                <button
                    type="button"
                    className="btn btn-sm button-theme float-end mt-2"
                    disabled={selectedFormPage?.title?.length < 1}
                    onClick={addNewFormPage}>
                    Save
                </button>
            </ChildrenModal>
            <ChildrenModal
                ref={updateTabsModalRef}
                header="Update Page Details">
                <div className="form-group">
                    <label
                        htmlFor="
                    ">
                        Title&nbsp;
                        <span className="text-danger fw-bold">*</span>
                    </label>

                    <input
                        type="text"
                        value={selectedFormPage.title}
                        onChange={e =>
                            setSelectedFormPage(prev => ({
                                ...prev,
                                title: e.target.value,
                            }))
                        }
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label
                        htmlFor="
                    ">
                        Icon
                    </label>

                    <input
                        type="text"
                        value={selectedFormPage.icon}
                        onChange={e =>
                            setSelectedFormPage(prev => ({
                                ...prev,
                                icon: e.target.value,
                            }))
                        }
                        className="form-control"
                    />
                </div>

                <button
                    type="button"
                    disabled={selectedFormPage?.title?.length < 1}
                    className="btn btn-sm button-theme float-end mt-2"
                    onClick={updateFormPage}>
                    Update
                </button>
            </ChildrenModal>
            <ChildrenModal
                ref={previewModalRef}
                size="xl"
                header={selectedForm.name}>
                <div className="s2a-form">
                    {selectedForm.enable_multipage === "YES" && (
                        <RenderFormFields
                            multipageDesign={multipageDesign}
                            mode={modeType.preview}
                            formDetails={{
                                formKey: selectedForm.form_key,
                                name: selectedForm.name,
                                table: selectedForm.table,
                                datasource: selectedForm.datasource,
                                useprefix: selectedForm.useprefix,
                                enableMultipage: selectedForm.enable_multipage,
                                tabsPosition: selectedForm.tabs_position,
                            }}
                        />
                    )}

                    {selectedForm.enable_multipage !== "YES" && (
                        <RenderPreview
                            layout={selectedForm.design.layout}
                            components={selectedForm.design.components}
                            images={selectedForm.design.images}
                            htmlCollection={selectedForm.design.htmlCollection}
                            mode={modeType.preview}
                            modeType={modeType}></RenderPreview>
                    )}
                </div>
            </ChildrenModal>
            <ChildrenModal
                centered
                ref={deleteFormModalRef}
                header="Delete Form">
                <div className="row">
                    <div className="mb-2">
                        {" "}
                        Are you sure you want to delete this form ?
                    </div>
                    <div
                        style={{ width: "100%" }}
                        className="s2a-border"></div>
                    <div className="mt-2 d-flex flex-row-reverse">
                        <button
                            type="button"
                            onClick={() => {
                                deleteFormModalRef.current.close();
                                setFormToDelete({});
                            }}
                            className="ms-2 btn button-theme btn-sm">
                            No
                        </button>
                        <button
                            type="button"
                            onClick={() => removeFormPage(formToDelete)}
                            className="ms-2 btn button-theme btn-sm">
                            Yes
                        </button>
                    </div>
                </div>
            </ChildrenModal>
            <ChildrenModal
                ref={tableLookupModalRef}
                header="Table lookup">
                <ReactSelect
                    options={tables}
                    selectedOption={selectedTable}
                    handleChange={handleSelectionChange}
                />
                <div className="d-flex justify-content-end align-items-center mt-2">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedTable(prev => ({
                                label: selectedForm.table,
                                value: selectedForm.table,
                            }));

                            tableLookupModalRef.current.close();
                        }}
                        className="ms-2 btn button-theme btn-sm">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            let event = {
                                target: {},
                            };

                            event.target.name = "table";
                            event.target.value = selectedTable.value;
                            props.handleInputField(event);

                            tableLookupModalRef.current.close();
                        }}
                        className="ms-2 btn button-theme btn-sm">
                        Ok
                    </button>
                </div>
            </ChildrenModal>
        </div>
    );
}

export default Forms;

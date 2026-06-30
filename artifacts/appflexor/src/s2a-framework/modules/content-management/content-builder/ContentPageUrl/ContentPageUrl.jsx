import React, {
    Fragment,
    useContext,
    useEffect,
    useRef,
    useState,
    lazy,
    Suspense,
} from "react";
import { css } from "@codemirror/lang-css";
import { html as htmlEditor } from "@codemirror/lang-html";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import axios from "axios";
import { default as grapesjs } from "grapesjs";
// const grapesjs = lazy(() =>
//     import("grapesjs"),
// );
import basicBlockPlugin from "grapesjs-blocks-basic";
import formPlugin from "grapesjs-plugin-forms";
import websitePlugin from "grapesjs-preset-webpage";
import "grapesjs/dist/css/grapes.min.css";
import { Interweave } from "interweave";
import beautify from "js-beautify";
import Modal from "react-bootstrap/Modal";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../../AppContext";
import { API_URL, ASSETS_DB_TABLE, IMAGE_BASE } from "../../../../Config";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import { handleSave } from "../../../../components/CrudApiCall";
import Scroll from "../../../../components/Scroll/Scroll";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
import useLogger from "../../../../components/hooks/useLogger";
import { CONTENT_STATUS, NAVBAR_STATE } from "../../../../contants";
import BrandLogoMini from "../../../../theme/tailwind/Layout/BrandLogoMini";
import { JsonToCsv, formatDateTimeForUserView } from "../../../../utils/utils";
import {
    isEmpty,
    tryToParse,
} from "../../../data-management/form-builder/Forms/FormViewer/utils";
import AssetViewer from "../../assest-manager/AssetViewer";
import ImageFolder from "../../assest-manager/AssetViewer/ImageFolder";
import RenderContentPage from "../RenderContentPage/RenderContentPage";

const tableName = ASSETS_DB_TABLE;

function ContentPageUrl({ _id }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [initialContentPage, setInitialContentPage] = useState({});
    const [currentContentPage, setCurrentContentPage] = useState({});
    const [htmlContent, setHtmlContent] = useState(undefined);
    const [cssContent, setCssContent] = useState(undefined);
    const [stagingContentHistory, setStagingContentHistory] = useState("");
    const [editorLoading, isEditorLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [confirmModal, setShowConfirmModal] = useState(false);
    const [selectedContentVersion, setSelectedContentVersion] = useState({});
    const [previewModal, setPreviewModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showAssetsManger, setShowAssetsManger] = useState(false);
    const [showAssetsViewer, setShowAssetsViewer] = useState(false);
    const [imagesList, setImagesList] = useState([]);
    const [filteredImagelList, setFilteredImageList] = useState([]);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [searchField, setSearchField] = useState("");
    const [revisionList, setRevisionList] = useState([]);
    const [selectedImage, setSelectedImage] = useState({});
    const [hoveredItemId, setHoveredItemId] = useState("");
    const [selectedRevision, setSelectedRevision] = useState({});
    const editorLoaded = useRef(false);
    const htmlModalRef = useRef(null);
    const cssModalRef = useRef(null);
    const importModalRef = useRef(null);
    const editor = useRef(null);
    const assetManagerPropsRef = useRef(null);
    const [showUploader, setShowUploader] = useState(false);
    const id = _id ? _id : useParams().id;
    const appContext = useContext(AppContext);
    const [parent, setParent] = useState({ id: "1", title: "Site Root" });
    const [tabs, setTabs] = useState({
        contentEditor: "true",
        contentRevision: "false",
    });
    useEffect(() => {
        setSelectedImage({});
    }, [parent]);
    useEffect(() => {
        if (id) {
            getContentPage(id);
        }
    }, [id]);

    useEffect(() => {
        if (id && tabs.contentRevision === "true") {
            getContentRevisions(id);
        }
    }, [id, tabs]);

    useEffect(() => {
        if (!isEmpty(initialContentPage)) {
            loadEditor(initialContentPage);
        }
    }, [initialContentPage]);

    useEffect(() => {
        const filteredByFolder = imagesList.filter(asset => {
            return asset.asset.attributes.folder_id == parent.id;
        });
        if (searchField !== "") {
            let filteredData = filterIt(searchField, filteredByFolder);
            setFilteredImageList(filteredData);
        } else {
            setFilteredImageList(filteredByFolder);
        }
    }, [searchField, imagesList, parent.id]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const getHtml = () => editor.current.getHtml();
    const getCss = () => editor.current.getCss();

    const importWebContent = () => {};
    const showImportModal = () => importModalRef.current.show();

    function loadEditor(contentPage) {
        setStagingContentHistory("");
        try {
            const grapeJsEle = document.getElementById("grape-js");
            const escapeName = name =>
                `${name}`.trim().replace(/([^a-z0-9\w-:/]+)/gi, "-");

            if (!editorLoaded.current) {
                if (grapeJsEle) {
                    editor.current = grapesjs.init({
                        canvas: {
                            styles: [
                                "/resources/bootstrap-5.2.3/css/bootstrap.min.css",
                                "/resources/fontawesome-6/css/all.css",
                                "/resources/fontawesome-6/css/fontawesome.css",
                                "https://fonts.googleapis.com/css?family=Poppins",
                                // "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
                            ],
                            // scripts: ["https://unpkg.com/grapesjs-tailwind@1.0.11/dist/grapesjs-tailwind.min.js"],
                        },
                        styles: [
                            "/resources/bootstrap-5.2.3/css/bootstrap.min.css",
                            "/resources/fontawesome-6/css/all.css",
                            "/resources/fontawesome-6/css/fontawesome.css",
                            "https://fonts.googleapis.com/css?family=Poppins",
                        ],
                        // script: ["https://unpkg.com/grapesjs-tailwind@1.0.11/dist/grapesjs-tailwind.min.js"],
                        allowScripts: 1,
                        container: "#grape-js",
                        protectedCss: "",
                        width: "100%",
                        plugins: [
                            websitePlugin,
                            basicBlockPlugin,
                            formPlugin,
                            // "grapesjs-tailwind",
                        ],
                        assetManager: {
                            custom: {
                                open(props) {
                                    handleAssetManagerOpen(props);
                                },
                                close(props) {},
                            },
                            // assets: [...imagesList],
                        },
                        storageManager: false,
                        selectorManager: { escapeName },
                    });

                    if (editor.current) {
                        editorLoaded.current = true;

                        editor.current.onReady(() => {
                            isEditorLoading(false);
                            loadLayout(editor.current, contentPage.stagging);
                        });

                        // editor.current.on(`asset:custom`, props => {
                        //     console.log(props);
                        //     const assetManager = editor.current.AssetManager;

                        //     assetManager.add([
                        //         "https://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/asteroid_blend.png",
                        //         "https://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/asteroid_blue.png",
                        //         "https://commondatastorage.googleapis.com/codeskulptor-assets/lathrop/asteroid_brown.png",
                        //         "http://codeskulptor-demos.commondatastorage.googleapis.com/pang/FDqGDmc.png",
                        //     ]);

                        //     let all = assetManager.getAll();
                        //     assetManager.render(all);
                        // });
                    }

                    // Get the span element with the title "View code"
                    var spanWithTitleViewCode = document.querySelector(
                        'span[title="View code"]',
                    );

                    // Check if the element exists
                    if (spanWithTitleViewCode) {
                        spanWithTitleViewCode.style.display = "none";
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    const loadLayout = (currentEditor, layout) => {
        try {
            // setStagingContentHistory(contentPage);

            const parsedLayout = tryToParse(layout);
            const htmlCode = parsedLayout.html;
            const cssCode = parsedLayout.css;

            setHtmlContent(htmlCode);
            setCssContent(cssCode);

            currentEditor.setComponents(htmlCode);
            currentEditor.setStyle(cssCode);
        } catch (error) {
            console.log(error, "content mangement error");
        }
    };

    const onEditorHtmlChange = value => {
        setHtmlContent(value);
    };

    const editHtml = () => {
        const formattedHTML = beautify.html(getHtml(), { indent_size: 2 });
        setHtmlContent(formattedHTML);
        htmlModalRef.current.show();
    };

    const setHtmlChangesToDesigner = () => {
        const styles = editor.current.getCss();

        editor.current.setComponents(htmlContent);
        editor.current.setStyle(styles);

        htmlModalRef.current.close();
    };

    const onEditorCssChange = value => {
        setCssContent(value);
    };

    const editCss = () => {
        const css = getCss();
        const formattedCss = beautify.css(css);
        setCssContent(formattedCss);
        cssModalRef.current.show();
    };
    const saveCssChanges = () => {
        const _editor = editor.current;
        const css = cssContent;
        _editor.setStyle(css);
        cssModalRef.current.close();
    };

    const exportWebContent = () => {
        const webContent = {
            html: getHtml(),
            css: getCss(),
        };

        const exportArr = [];
        exportArr.push(webContent);

        JsonToCsv(exportArr);
    };

    function filterIt(terms, arr) {
        if ("" === terms || terms.length < 3) return arr;
        const words = terms.match(/\w+|"[^"]+"/g);
        words.push(terms);
        return (
            arr &&
            arr.length > 0 &&
            arr.filter(a => {
                const v = Object.values(a);
                const f = JSON.stringify(v).toLowerCase();

                return words.every(val => f.includes(val));
            })
        );
    }

    const handleAssetManagerOpen = async props => {
        if (editor.current) {
            const assetManager = editor.current.AssetManager;
            const imgUrlList = await getLatestAssets(
                currentContentPage.channel,
            );
            setShowAssetsViewer(true);

            const currentAssetList = assetManager.getAll();

            if (currentAssetList.length === 0) {
                assetManager.add([...imgUrlList]);

                const withMetaData = assetManager.getAll();

                assetManager.render(withMetaData);
                props.assets = [];
                props.assets = [...withMetaData.models];
            } else {
                let removedAssetsList = [];
                let assetsToRemove = [];

                currentAssetList.models.map(asset => {
                    assetsToRemove.push(asset.getSrc());
                });

                assetsToRemove.map(assetId => {
                    const removedAsset = assetManager.remove(assetId);
                    removedAssetsList.push(removedAsset.getSrc());
                });

                const afterDeleteion = assetManager.getAll();

                if (afterDeleteion.models.length === 0) {
                    assetManager.add([...imgUrlList]);

                    const withMetaData = assetManager.getAll();

                    assetManager.render(withMetaData);
                    props.assets = [];
                    props.assets = [...withMetaData.models];
                } else {
                    console.error(
                        `Length of previous assets : ${assetsToRemove.length}, Length of removed assets : ${afterDeleteion.models.length}. `,
                    );
                    toastEmitter("Assets sync failed.", true, "error");
                }
            }

            assetManagerPropsRef.current = props;

            const listWithSrc = props.assets.map(asset => {
                return {
                    id: asset.cid,
                    src: asset.getSrc(),
                    asset: asset,
                };
            });

            setImagesList(listWithSrc);
            const filteredByFolder = listWithSrc.filter(asset => {
                return asset.asset.attributes.folder_id == parent.id;
            });
            if (searchField !== "") {
                let filteredData = filterIt(searchField, filteredByFolder);
                setFilteredImageList(filteredData);
            } else {
                setFilteredImageList(filteredByFolder);
            }
        }
    };

    function getContentPage(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "page",
                    serviceKey: "sys.content.page",
                    mode: "formData",
                },
            ],
        };
        dataRequest.datasource = "";
        let url = API_URL + "?service.key=masterKey.tenantData";

        axios
            .post(url, dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.page) {
                        let record = response.data.C_DATA.page[0];

                        if (record) {
                            setInitialContentPage(record);
                            setCurrentContentPage(record);
                            setIsLoaded(true);
                        } else {
                            useLogger("No content found.");
                        }
                    }
                } else {
                    console.log(response.data?.C_MESSAGE);
                    console.error(
                        "Unable to get data from 'list.image.assets' or 'sys.content.page'",
                    );
                }
            })
            .catch(e => {
                console.log(e);
            });
    }

    async function getContentRevisions(id) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "revisions",
                    serviceKey: "list.content.revisions",
                    mode: "formData",
                },
            ],
        };

        const response = await axios.post(
            API_URL + "?service.key=masterKey.tenantData",
            dataRequest,
        );

        if (response.data.C_STATUS === "SUCCESS") {
            setRevisionList(response.data.C_DATA.revisions);
        } else {
            setRevisionList([]);
        }
    }

    // async function getLatestAssets(channelId) {
    //     let url = API_URL + "?service.key=masterKey.tenantData";
    //     let imageArr = [];
    //     const dataRequest = {
    //         dataKeys: [
    //             {
    //                 serviceParams: channelId + "," + parent.id,
    //                 dataKey: "assets",
    //                 serviceKey: "list.image.assets",
    //                 mode: "formData",
    //             },
    //         ],
    //         datasource: "",
    //     };

    //     const response = await axios.post(url, dataRequest);

    //     if (response.data.C_STATUS === "SUCCESS") {
    //         let assets = response.data.C_DATA.assets;
    //         if (typeof assets !== "undefined" && assets.length > 0) {
    //             let arrWithSrc = assets.map(file => {
    //                 const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;

    //                 return {
    //                     type: "image",
    //                     name: file.image,
    //                     title: file.title,
    //                     src: imageUrl,
    //                     folder_id: file.folder_id,
    //                 };
    //             });
    //             imageArr = arrWithSrc;
    //         }
    //     }

    //     return Promise.resolve(imageArr);
    // }

    async function getLatestAssets(channelId) {
        let url = API_URL + "?service.key=masterKey.tenantData";
        let imageArr = [];
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: channelId,
                    dataKey: "assets",
                    serviceKey: "list.image.assets.viewer",
                    mode: "formData",
                },
            ],
            datasource: "",
        };

        const response = await axios.post(url, dataRequest);

        if (response.data.C_STATUS === "SUCCESS") {
            let assets = response.data.C_DATA.assets;
            if (typeof assets !== "undefined" && assets.length > 0) {
                let arrWithSrc = assets.map(file => {
                    // let originUrl = window.location.origin;
                    // const imageUrl = `${originUrl}${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;
                    const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;
                    return {
                        type: "image",
                        name: file.image,
                        title: file.title,
                        src: imageUrl,
                        folder_id: file.folder_id,
                    };
                });
                imageArr = arrWithSrc;
            }
        }

        return Promise.resolve(imageArr);
    }

    const saveDesign = async (status = CONTENT_STATUS.draft) => {
        if (status === CONTENT_STATUS.draft) {
            console.log(currentContentPage);

            const htmlCode = editor.current.getHtml();
            const css = getCss();
            const formattedCss = beautify.css(css);
            const cssCode = formattedCss || "";

            // Combine HTML and CSS into a JSON object
            const jsonObject = {
                html: htmlCode,
                css: cssCode,
            };
            const _selectedContent = structuredClone(initialContentPage);

            const newLayout = JSON.stringify(jsonObject);

            _selectedContent.stagging = "";
            _selectedContent.published = "";

            _selectedContent.published = currentContentPage.published;
            _selectedContent.stagging = newLayout;

            _selectedContent.status = CONTENT_STATUS.draft;

            const entity = "app_content",
                formData = _selectedContent,
                url = API_URL + "?service.key=update.formData",
                datasource = "";
            const res = await handleSave({ entity, formData, url, datasource });
            if (res.data.C_STATUS === "SUCCESS") {
                const obj = res?.data?.C_DATA[0]?.formData || {};
                setCurrentContentPage(obj);

                toastEmitter("Design saved as draft.", true, "success");
                handleClose();
            } else {
                toastEmitter("Error saving draft", true, "error");
                handleClose();
            }
        }

        if (status === CONTENT_STATUS.published) {
            const htmlCode = editor.current.getHtml();
            const css = getCss();
            const formattedCss = beautify.css(css);
            const cssCode = formattedCss || "";
            // const cssCode = cssContent || "";

            // Combine HTML and CSS into a JSON object
            const jsonObject = {
                html: htmlCode,
                css: cssCode,
            };
            const _selectedContent = structuredClone(initialContentPage);

            const newLayout = JSON.stringify(jsonObject);

            _selectedContent.stagging = "";
            _selectedContent.published = "";

            _selectedContent.stagging = newLayout;
            _selectedContent.published = newLayout;

            _selectedContent.status = CONTENT_STATUS.published;

            const entity = "app_content",
                formData = _selectedContent,
                url = API_URL + "?service.key=update.formData",
                datasource = "";

            const res = await handleSave({ entity, formData, url, datasource });

            if (res.data.C_STATUS === "SUCCESS") {
                const obj = res?.data?.C_DATA[0]?.formData || {};
                setCurrentContentPage(obj);
                updateContentVersion(obj);
                handleClose();

                let revisionRequest = {
                    data: [
                        {
                            formId: "content_revision",
                            entity: "content_revision",
                            action: "update",
                            id: "new",
                            formData: {
                                id: "new",
                                content_id: id,
                                content: newLayout,
                            },
                        },
                    ],
                };

                const revisionResponse = await axios.post(url, revisionRequest);
            } else {
                toastEmitter("Error saving design", true, "error");
                handleClose();
            }
        }

        if (status === CONTENT_STATUS.canceldraft) {
            loadLayout(editor.current, currentContentPage.published);

            const _selectedContent = structuredClone(initialContentPage);

            _selectedContent.stagging = "";
            _selectedContent.published = "";

            _selectedContent.stagging = currentContentPage.published;
            _selectedContent.published = currentContentPage.published;

            _selectedContent.status = CONTENT_STATUS.published;

            const entity = "app_content",
                formData = _selectedContent,
                url = API_URL + "?service.key=update.formData",
                datasource = "";

            const res = await handleSave({ entity, formData, url, datasource });

            if (res.data.C_STATUS === "SUCCESS") {
                const obj = res?.data?.C_DATA[0]?.formData || {};
                setCurrentContentPage(obj);
                updateContentVersion(obj);
                handleClose();
            } else {
                toastEmitter("Error saving design", true, "error");
                handleClose();
            }
        }
    };

    async function updateContentVersion(content) {
        let _formData = {
            id: "new",
            content_id: content.id,
            published_content: content.published,
        };

        const entity = "content_version",
            formData = _formData,
            url = API_URL + "?service.key=update.formData",
            datasource = "";

        console.log(_formData);

        const res = await handleSave({ entity, formData, url, datasource });

        if (res.data.C_STATUS === "SUCCESS") {
            toastEmitter(
                "Design Saved as draft and Published.",
                true,
                "success",
            );
        }
    }

    // utility
    const tryToParse = item => {
        let _item = item;
        if (typeof item === "string" && item !== "") {
            _item = JSON.parse(_item);
        } else {
            _item = {
                html: "",
                css: "",
            };
        }
        return _item;
    };

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
        <Fragment>
            {isLoaded && (
                <div className="content-designer">
                    {editorLoading ? (
                        "Loading..."
                    ) : (
                        <div className="bg-theme border-bottom border-color d-flex justify-content-between align-items-center sticky-top p-1">
                            <div>
                                <BrandLogoMini
                                    toggleMiniState={NAVBAR_STATE.CON}
                                    classes={"ms-0"}
                                    state={NAVBAR_STATE.CON}>
                                    <span className="h6">
                                        Web Page Designer
                                    </span>
                                </BrandLogoMini>
                            </div>
                            <div>
                                <span className="">
                                    {initialContentPage.name}&nbsp;
                                </span>
                                <span>
                                    [&nbsp;{currentContentPage.status}&nbsp;]{" "}
                                </span>
                            </div>
                            <div>
                                <span
                                    type="button"
                                    title="Import"
                                    className="content-actions mx-2"
                                    onClick={showImportModal}>
                                    <i className="fa-solid fa-file-import"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Export"
                                    className="content-actions mx-2"
                                    onClick={exportWebContent}>
                                    <i className="fa-solid fa-file-export"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Images"
                                    className="content-actions mx-2"
                                    onClick={() => setShowAssetsManger(true)}>
                                    <i className="fa-regular fa-images"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Edit HTML"
                                    className="content-actions mx-2"
                                    onClick={editHtml}>
                                    <i className="fa-brands fa-html5"></i>
                                </span>

                                <span
                                    type="button"
                                    title="Edit CSS"
                                    className="content-actions mx-2"
                                    onClick={editCss}>
                                    <i className="fa-brands fa-css3-alt"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Preview Live"
                                    className="content-actions mx-2"
                                    onClick={() => {
                                        setShowPreviewModal(true);
                                        //window.open("/content/"+currentContentPage.id);
                                    }}>
                                    <i className="fa-regular fa-eye"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Cancel Draft"
                                    className="content-actions mx-2"
                                    onClick={() => handleShow(true)}>
                                    <i className="fa-solid fa-ban"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Publish"
                                    className="content-actions mx-2"
                                    onClick={() =>
                                        saveDesign(CONTENT_STATUS.published)
                                    }>
                                    <i className="fa-solid fa-earth-asia"></i>
                                </span>
                                <span
                                    type="button"
                                    title="Save as draft"
                                    className="content-actions mx-2"
                                    onClick={() =>
                                        saveDesign(CONTENT_STATUS.draft)
                                    }>
                                    <i className="fa-solid fa-floppy-disk"></i>
                                </span>
                            </div>
                        </div>
                    )}

                    <nav className="">
                        <div className="nav nav-tabs">
                            <button
                                className="nav-link active mb-1"
                                name="contentEditor"
                                data-bs-toggle="tab"
                                data-bs-target="#contentEditor"
                                type="button"
                                onClick={event => handleTabsChange(event)}>
                                Editor
                            </button>
                            <button
                                className="nav-link mb-1"
                                name="contentRevision"
                                data-bs-toggle="tab"
                                data-bs-target="#contentRevision"
                                type="button"
                                onClick={event => handleTabsChange(event)}>
                                Revision
                            </button>
                        </div>
                    </nav>

                    <div className="tab-content">
                        <div
                            className="tab-pane fade show active"
                            id="contentEditor"
                            tabIndex="0">
                            <div id="grape-js"></div>
                        </div>
                        <div
                            className="tab-pane fade"
                            id="contentRevision">
                            <ul className="list-group list-group-flush">
                                {revisionList.map(revision => {
                                    return (
                                        <li
                                            key={revision.id}
                                            onMouseEnter={() =>
                                                setHoveredItemId(revision.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredItemId("")
                                            }
                                            className={`list-group-item ${
                                                selectedRevision.id ===
                                                revision.id
                                                    ? "selected-cell"
                                                    : ""
                                            }`}>
                                            <i className="fa-solid fa-calendar-days pe-1"></i>
                                            {formatDateTimeForUserView(
                                                revision.datecreated,
                                            )}
                                            {revision.id === hoveredItemId && (
                                                <span className="float-end">
                                                    <i
                                                        title="Delete revision"
                                                        className="fa-solid fa-trash text-danger pointer pe-1 "></i>
                                                    <i
                                                        title="Revert revision"
                                                        className="fa-solid fa-arrow-rotate-left text-warning pe-1 pointer"
                                                        onClick={() => {
                                                            let parsedContent =
                                                                tryToParse(
                                                                    revision.content,
                                                                );

                                                            setSelectedRevision(
                                                                {
                                                                    ...revision,
                                                                    content:
                                                                        parsedContent,
                                                                },
                                                            );
                                                            setShowConfirmModal(
                                                                true,
                                                            );
                                                        }}></i>
                                                    <i
                                                        title="Preview revision"
                                                        className="fa-solid fa-eye pe-1 pointer"
                                                        onClick={() => {
                                                            setPreviewModal(
                                                                true,
                                                            );

                                                            let parsedContent =
                                                                tryToParse(
                                                                    revision.content,
                                                                );

                                                            setSelectedRevision(
                                                                {
                                                                    ...revision,
                                                                    content:
                                                                        parsedContent,
                                                                },
                                                            );
                                                        }}></i>
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <Modal
                            className="content-preview-modal"
                            show={previewModal}
                            onHide={() => setPreviewModal(false)}
                            keyboard={true}
                            fullscreen
                            animation={true}>
                            <Modal.Header>
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                    <Modal.Title>
                                        {currentContentPage.title}&nbsp;
                                        <small className="text-body-secondary">
                                            {currentContentPage.status}
                                        </small>{" "}
                                    </Modal.Title>
                                    <i
                                        onClick={() => setPreviewModal(false)}
                                        className="fa-solid fa-close p-1 pointer"></i>
                                </div>
                            </Modal.Header>

                            <Modal.Body className="">
                                {selectedRevision.content &&
                                    selectedRevision.content.html && (
                                        <>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: selectedRevision
                                                        .content.html,
                                                }}
                                            />
                                            <style>
                                                {selectedRevision.content.css}
                                            </style>
                                        </>
                                    )}
                            </Modal.Body>
                        </Modal>
                        <Modal
                            show={confirmModal}
                            onHide={() => setShowConfirmModal(false)}
                            keyboard={false}
                            backdrop="static"
                            animation={true}>
                            <Modal.Header>
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                    <Modal.Title>Confirm</Modal.Title>
                                    <i
                                        onClick={() =>
                                            setShowConfirmModal(false)
                                        }
                                        className="fa-solid fa-close p-1 pointer"></i>
                                </div>
                            </Modal.Header>
                            <Modal.Body className="">
                                This will revert changes of current staging
                                post. Are you sure to revert?
                            </Modal.Body>
                            <Modal.Footer>
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => {
                                        loadLayout(
                                            editor.current,
                                            JSON.stringify(
                                                selectedRevision.content,
                                            ),
                                        );
                                        setShowConfirmModal(false);
                                    }}>
                                    Yes
                                </button>
                                <button
                                    className="btn btn-sm button-theme"
                                    onClick={() => setShowConfirmModal(false)}>
                                    No
                                </button>
                            </Modal.Footer>
                        </Modal>
                    </div>

                    <ChildrenModal
                        ref={htmlModalRef}
                        size="lg"
                        header="Edit HTML">
                        <Scroll height="70vh">
                            <CodeMirror
                                id="html-editor"
                                value={htmlContent}
                                height="100%"
                                theme="dark"
                                extensions={[
                                    htmlEditor(),
                                    EditorView.lineWrapping,
                                ]}
                                onChange={(value, viewUpdate) => {
                                    onEditorHtmlChange(value);
                                }}
                            />
                        </Scroll>
                        <button
                            onClick={setHtmlChangesToDesigner}
                            className="btn btn-sm button-theme mt-2 float-end">
                            Set Changes
                        </button>
                    </ChildrenModal>
                    <ChildrenModal
                        ref={cssModalRef}
                        size="lg"
                        header="Edit CSS">
                        <Scroll height="70vh">
                            <CodeMirror
                                value={cssContent}
                                height="100%"
                                theme="dark"
                                extensions={[css(), EditorView.lineWrapping]}
                                onChange={(value, viewUpdate) => {
                                    onEditorCssChange(value);
                                }}
                            />
                        </Scroll>
                        <button
                            onClick={saveCssChanges}
                            className="btn btn-sm button-theme mt-2 float-end">
                            Set Changes
                        </button>
                    </ChildrenModal>
                    <ChildrenModal
                        ref={importModalRef}
                        size="lg"
                        header="Import Web Content">
                        <ImportForm
                            setHtml={setHtmlContent}
                            setCss={setCssContent}
                            editorInstance={editor.current}
                            close={importModalRef?.current?.close}
                        />
                    </ChildrenModal>
                    <Modal
                        show={show}
                        onHide={handleClose}>
                        <Modal.Header>
                            <Modal.Title>Cancel draft</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            This will revert all changes. Are you sure you want
                            to cancel?
                        </Modal.Body>
                        <Modal.Footer>
                            <button
                                className="btn btn-sm button-theme mx-1"
                                onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-sm button-theme mx-1"
                                onClick={() =>
                                    saveDesign(CONTENT_STATUS.canceldraft)
                                }>
                                Cancel draft
                            </button>
                        </Modal.Footer>
                    </Modal>

                    <Modal
                        show={showPreviewModal}
                        onHide={() => setShowPreviewModal(false)}
                        keyboard={true}
                        fullscreen
                        animation={true}>
                        <Modal.Header>
                            <div className="w-100 d-flex justify-content-between align-items-center">
                                <Modal.Title>
                                    {currentContentPage.name}&nbsp;
                                    <small className="text-body-secondary">
                                        {currentContentPage.status}
                                    </small>{" "}
                                </Modal.Title>
                                <i
                                    onClick={() => setShowPreviewModal(false)}
                                    className="fa-solid fa-close p-1 pointer"></i>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="content-viewer">
                            <RenderContentPage
                                contentPageId={currentContentPage.id}
                                status={CONTENT_STATUS.draft}
                            />
                        </Modal.Body>
                    </Modal>

                    <Modal
                        className="s2a-modal"
                        show={showAssetsManger}
                        onHide={() => setShowAssetsManger(false)}
                        size="xl"
                        animation={true}
                        backdrop="static"
                        keyboard={false}
                        fullscreen={toggleModalWindow === "maximize"}>
                        <Modal.Header>
                            <Modal.Title>
                                <span>Images</span>
                                <div className="d-flex">
                                    <div
                                        className={`${
                                            toggleModalWindow === "maximize"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() =>
                                            setToggleModalWindow("maximize")
                                        }
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Maximize window">
                                        <i className="fa-regular fa-window-maximize modal-resize"></i>
                                    </div>
                                    <div
                                        className={`${
                                            toggleModalWindow === "restore"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() =>
                                            setToggleModalWindow("restore")
                                        }
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Restore Window">
                                        <i className="fa-regular fa-window-restore modal-resize"></i>
                                    </div>
                                    <i
                                        className="fa-solid fa-xmark modal-close"
                                        onClick={() => {
                                            setParent(parent);
                                            setShowAssetsManger(false);
                                        }}></i>
                                </div>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {showAssetsManger && (
                                <AssetViewer
                                    channel={{ id: currentContentPage.channel }}
                                    parent={{ id: "1", title: "Site Root" }}
                                    activeTab="ASSET_MANAGER"
                                />
                            )}
                        </Modal.Body>
                    </Modal>
                    {showAssetsViewer && (
                        <Modal
                            show={true}
                            className="s2a-modal"
                            onHide={() => {
                                setShowAssetsViewer(false);
                            }}
                            backdrop="static"
                            keyboard={false}
                            animation={true}
                            size="xl"
                            fullscreen={toggleModalWindow === "maximize"}>
                            <Modal.Header>
                                <Modal.Title className="modal-title">
                                    <span>Images Viewer</span>
                                    <div className="d-flex">
                                        <div
                                            className={`${
                                                toggleModalWindow === "maximize"
                                                    ? "visually-hidden"
                                                    : ""
                                            } `}
                                            onClick={() =>
                                                setToggleModalWindow("maximize")
                                            }>
                                            <i className="fa-regular fa-window-maximize modal-resize"></i>
                                        </div>
                                        <div
                                            className={`${
                                                toggleModalWindow === "restore"
                                                    ? "visually-hidden"
                                                    : ""
                                            } `}
                                            onClick={() =>
                                                setToggleModalWindow("restore")
                                            }>
                                            <i className="fa-regular fa-window-restore modal-resize"></i>
                                        </div>
                                        <i
                                            className="fa-solid fa-xmark modal-close"
                                            onClick={() => {
                                                setParent({
                                                    id: "1",
                                                    title: "Site Root",
                                                });
                                                setShowAssetsViewer(false);
                                                setSelectedImage({});
                                                assetManagerPropsRef.current.close();
                                            }}></i>
                                    </div>
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="container-fluid">
                                    <ImageFolder
                                        channel={{
                                            id: currentContentPage.channel,
                                        }}
                                        parent={
                                            parent
                                                ? parent
                                                : {
                                                      id: "1",
                                                      title: "Site Root",
                                                  }
                                        }
                                        setParent={setParent}
                                        showUploader={showUploader}
                                        setShowUploader={setShowUploader}
                                        mode="VIEW"
                                    />
                                    {/* <ActionBar
                                    totalImages={imagesList.length}
                                    filteredImages={filteredImagelList.length}
                                    searchField={searchField}
                                    setSearchField={setSearchField}
                                /> */}
                                    <div className="row">
                                        <div className="col-sm-8 s2a-border-right">
                                            <Scroll
                                                height={
                                                    toggleModalWindow ===
                                                    "maximize"
                                                        ? "80vh"
                                                        : "80vh"
                                                }>
                                                <div className="row">
                                                    {filteredImagelList.map(
                                                        item => {
                                                            // console.log(item);
                                                            return (
                                                                <div className="col-sm-4 col-md-3 col-lg-3  col-xl-2 col-xxl-2 mb-2 position-relative pointer">
                                                                    <img
                                                                        style={{
                                                                            maxHeight:
                                                                                "200px",
                                                                        }}
                                                                        src={
                                                                            item.src
                                                                        }
                                                                        className={`img-thumbnail object-fit-contain  ${
                                                                            item.id ===
                                                                            selectedImage.id
                                                                                ? "img-theme-border-active opacity-75"
                                                                                : "img-theme-border "
                                                                        } `}
                                                                        alt=""
                                                                        onClick={() => {
                                                                            assetManagerPropsRef.current.select(
                                                                                item.asset,
                                                                            );
                                                                            setSelectedImage(
                                                                                {
                                                                                    id: item.id,
                                                                                    attr: item
                                                                                        .asset
                                                                                        .attributes,
                                                                                },
                                                                            );
                                                                        }}
                                                                        onDoubleClick={() => {
                                                                            assetManagerPropsRef.current.select(
                                                                                item.asset,
                                                                                true,
                                                                            );
                                                                            setShowAssetsViewer(
                                                                                false,
                                                                            );
                                                                            setSelectedImage(
                                                                                {},
                                                                            );
                                                                            assetManagerPropsRef.current.close();
                                                                        }}
                                                                    />

                                                                    <div className="d-flex">
                                                                        <div
                                                                            className="opacity-75 text-ellipsis"
                                                                            style={{
                                                                                width: "120px",
                                                                            }}>
                                                                            {
                                                                                item
                                                                                    ?.asset
                                                                                    ?.attributes
                                                                                    ?.title
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </Scroll>
                                        </div>
                                        <div className="col-sm-4">
                                            {selectedImage?.id ? (
                                                <RenderImage
                                                    file={selectedImage}
                                                    tableName={tableName}
                                                />
                                            ) : (
                                                "Select image to see details."
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Modal.Body>
                        </Modal>
                    )}
                </div>
            )}
        </Fragment>
    );
}

function ImportForm(props) {
    const { setHtml, setCss, close, editorInstance } = props;
    const [layout, setLayout] = useState({
        html: "",
        css: "",
    });
    const [disable, setDisable] = useState(false);
    const loadWebContent = e => {
        try {
            const { files } = e.target;
            const fileReader = new FileReader();

            fileReader.onload = e => {
                const { result } = e.target;
                const parseWebContent = tryToParse(result);
                const { html, css } = parseWebContent[0];
                if (!html && !css) {
                    toastEmitter("Not a valid web content", true, "warning");
                    setDisable(true);
                    return;
                }
                setLayout({ ...layout, html, css });
            };
            fileReader.readAsText(files[0]);
        } catch (error) {
            console.log(error);
        }
    };

    const setWebContent = () => {
        const { html, css } = layout;
        if (html || css) {
            setHtml(html);
            setCss(css);

            editorInstance.setComponents(html);
            editorInstance.setStyle(css);
        }
        close();
    };

    return (
        <>
            <input
                className="form-control"
                type="file"
                onChange={loadWebContent}
            />
            <button
                className="btn btn-sm button-theme mt-2 float-end"
                disabled={disable}
                title={disable ? "Please select a valid web content file" : ""}
                onClick={setWebContent}>
                Ok
            </button>
        </>
    );
}

function ActionBar(props) {
    return (
        <div className="flex-between mb-2">
            <div className="w-100 d-flex align-items-center justify-content-start">
                <div className="w-25 input-group">
                    <input
                        type="text"
                        className="form-control"
                        value={props.searchField}
                        onChange={e => props.setSearchField(e.target.value)}
                        placeholder="Search images..."
                    />
                    <span className="input-group-text">
                        <div
                            title="Search"
                            className="fa-solid fa-magnifying-glass fs-5"></div>
                    </span>
                </div>
                <div>
                    &nbsp; {props.filteredImages} of {props.totalImages}
                </div>
            </div>
        </div>
    );
}

function RenderImage({ file = {} }) {
    const [details, setDetails] = useState({});
    const [isLoading, setIsloading] = useState(true);

    const isLoaded = useRef(false);

    useEffect(() => {
        if (!isEmpty(file)) {
            const img = new Image();
            setIsloading(true);

            img.onload = function () {
                let dimensions = this.width + " by " + this.height + " pixels";
                setDetails(prev => ({ ...file.attr, dimensions: dimensions }));

                // prevents rerender caused by useState and img.onload event
                isLoaded.current = true;
                setIsloading(false);
            };

            img.src = file.attr.src;
        } else {
            setDetails({});
        }
    }, [file.id]);

    return (
        <div className="container-fluid">
            {isLoading ? (
                <span>Loading {details.name} details...</span>
            ) : (
                <>
                    <div className="row">
                        <div className="col">
                            <img
                                className="img-thumbnail img-theme-border h-75 mb-1"
                                src={details.src}
                                alt={details.name}
                            />
                        </div>
                    </div>
                    <dl className="row">
                        <dt className="col-sm-3">Image</dt>
                        <dd className="col-sm-9">{details.name}</dd>

                        <dt className="col-sm-3">Title</dt>
                        <dd className="col-sm-9">{details.title}</dd>

                        <dt
                            className="col-sm-3 text-truncate"
                            title="Dimensions">
                            Dimensions
                        </dt>
                        <dd className="col-sm-9">{details.dimensions}</dd>

                        <dt className="col-sm-3 ">File URL</dt>
                        <dd className="col-sm-9">{details.src}</dd>
                    </dl>
                </>
            )}
        </div>
    );
}

export default ContentPageUrl;

import { lazy } from "react";
// import ReactPivottable from "../../../../components/ReactPivottable/PivotTable/ReactPivottable";
const ReactPivottable = lazy(() =>
    import("../../../../components/ReactPivottable/PivotTable/ReactPivottable"),
);
import { makeid } from "../../../../utils/utils";
import Processes from "../../../camunda/Processes";
const ContentViewer = lazy(() =>
    import("../../../content-management/page-builder/ContentViewer/ContentViewer"),
);
// import ContentViewer from "../../../content-management/page-builder/ContentViewer/ContentViewer";
const PostViewer = lazy(() =>
    import("../../../content-management/page-builder/PostViewer/PostViewer"),
);
// import PostViewer from "../../../content-management/page-builder/PostViewer/PostViewer";
const Analytics = lazy(() =>
    import("../../../data-analysis/analytics/analytics/Analytics"),
);

// import PostViewer from "../../../content-management/page-builder/PostViewer/PostViewer";
const DropBox = lazy(() =>
    import("../Designer/components/DropBox/DropBox"),
);
// import Analytics from "../../../data-analysis/analytics/analytics/Analytics";
import CustomActionsPropEditer from "../../../data-management/form-builder/Designer/components/CustomActions/CustomActionsPropEditer";
import ProcessStartForm from "../../../process-configuration/process-viewer/ProcessStartForm";
import ProcessViewer from "../../../process-configuration/process-viewer/ProcessViewer";
const DataListViewer = lazy(() =>
    import("../datalist-viewer/viewer/DataListViewer"),
);
// import DataListViewer from "../datalist-viewer/viewer/DataListViewer";
const ChartForm = lazy(() =>
    import("./components/Chart/ChartForm"),
);
// import ChartForm from "./components/Chart/ChartForm";
import Form from "./components/Form";
import HTML from "./components/HTML";
import Iframe from "./components/Iframe";
import Media from "./components/Media";
import Report from "./components/Report";

const Wiki = lazy(() =>
    import("./components/Wiki/Wiki"),
);
// import Wiki from "./components/Wiki/Wiki";
const DmsRepository = lazy(() =>
    import("./components/DmsRepository"),
);
// import DmsRepository from "./components/DmsRepository";
// const Waap = lazy(() =>
//     import("./components/Waap/Chat"),
// );
const ChatApp = lazy(() =>
    import("./components/Chat"),
);
// import ChatApp from "./components/Chat";
import {Waap} from "./components/Waap/Chat";
// import Tabs from "./components/Tabs";
// import RichText from "./components/RichText";
// import ImageView from "./components/ImageView";

export const componentList = {
    dropbox: DropBox,
    processStartForm: ProcessStartForm,
    pivottable: ReactPivottable,
    analytics: Analytics,
    processes: ProcessViewer,
    datalist: DataListViewer,
    dms: DmsRepository,
    wiki: Wiki,
    taskList: Processes,
    iframe: Iframe,
    media: Media,
    report: Report,
    chart: ChartForm,
    post: PostViewer,
    content: ContentViewer,
    HTML: HTML,
    form: Form,
    action: CustomActionsPropEditer,
    chat: ChatApp,
    waap: Waap,
    // tabs: Tabs,
    // richtext: RichText,
    // imageview: ImageView,
};

export const SIDEBAR_ITEM = "sidebaritem";
export const ROW = "row";
export const COLUMN = "DB Column";
export const COMPONENT = "component";
export const COMPONENTS_STORED_IN_LAYOUT = ["HTML"]; // Saved in layout

export const SIDEBAR_ITEMS = [
    // Form
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "true",
        code: "FORM_BUILDER", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "dropbox",
            title: "DropBox",
            icon: "fa-solid fa-diagram-predecessor",
            data: {
                formId: "",
            },
            props: [],
        },
    },
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "true",
        code: "WAAP", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "waap",
            title: "Waap",
            icon: "fa-solid fa-diagram-predecessor",
            data: {
                formId: "",
            },
            props: [],
        },
    },
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "Chat", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "chat",
            title: "Chat",
            icon: "fa-solid fa-diagram-predecessor",
            data: {
                formId: "",
            },
            props: [],
        },
    },
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "FORM_BUILDER", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "form",
            title: "Form",
            icon: "fa-solid fa-diagram-predecessor",
            data: {
                formId: "",
            },
            props: [],
        },
    },
    // DMS
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "true",
        code: "DMS", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "dms",
            title: "Dms Repository",
            icon: "fa-solid fa-diagram-predecessor",
            data: {
                repositoryId: "",
                repositoryTitle: "",
                name: "",
            },
            props: [],
        },
    },
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "WIKI", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "wiki",
            title: "Wiki",
            icon: "fa fa-book",
            data: {
                repositoryId: "",
                repositoryTitle: "",
                name: "",
            },
            props: [],
        },
    },
    // Process List
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "TASK_INBOX", // for SUBSCRIPTION_CHECK

        component: {
            type: "processes",
            title: "Process List",
            icon: "fa-solid fa-database ",
            data: {
                category: "",
                title: "",
                actionLabel: "",
                showTitle: "",
                showProcess: "",
                showCategory: "",
                showForm: "",
                formSubmission: "",
                formActionLabel: "",
            },
            props: [],
        },
    },
    // Process Start Form
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "TASK_INBOX", // for SUBSCRIPTION_CHECK

        component: {
            type: "processStartForm",
            title: "Process Start Form",
            icon: "fa-solid fa-database ",
            data: {
                category: "",
                title: "",
                actionLabel: "",
                showTitle: "",
                showProcess: "",
                showCategory: "",
                showForm: "",
                formSubmission: "",
                formActionLabel: "",
            },
            props: [],
        },
    },
    // taskList
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "TASK_INBOX", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "taskList",
            title: "Task List",
            icon: "fa-solid fa-inbox",
            data: {},
            props: [],
        },
    },
    // report
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "JASPER_REPORT", // for SUBSCRIPTION_CHECK

        component: {
            type: "report",
            title: "Report",
            icon: "fa-solid fa-print",
            data: {
                reportId: "",
            },
            props: [],
        },
    },

    // pivottable
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "PIVOT_TABLE", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "pivottable",
            title: "Pivot Table",
            icon: "fa-solid fa-magnifying-glass-chart",
            data: {},
            props: [],
        },
    },
    // HTML
    {
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "WEB_CONTENT",
        component: {
            type: "HTML",
            title: "HTML",
            icon: "fa-solid fa-font",
            data: {
                html_id: "",
            },
            props: [],
        },
    },
    // datalist
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "DATALIST_BUILDER", // for SUBSCRIPTION_CHECK

        component: {
            type: "datalist",
            title: "Data List",
            icon: "fa-solid fa-cube",
            data: {},
            props: [],
        },
    },
    // analytics
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "ANALYTIC_TABLE", // for SUBSCRIPTION_CHECK
        component: {
            type: "analytics",
            title: "Analytics",
            icon: "fa-solid fa-chart-column",
            data: {},
            props: [],
        },
    },
    // content
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "WEB_CONTENT", // for SUBSCRIPTION_CHECK
        component: {
            type: "content",
            title: "Web Page",
            icon: "fa-solid fa-pen",
            data: {
                id: "new",
            },
            props: [
                {
                    id: "id",
                    label: "Web Page",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: true,
                },
            ],
        },
    },
    // post
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        code: "WEB_POSTS", // for SUBSCRIPTION_CHECK

        path: "",
        component: {
            type: "post",
            title: "Post",
            icon: "fa-solid fa-calendar",
            data: {
                id: "new",
            },
            props: [
                {
                    id: "id",
                    label: "Post",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: true,
                },
            ],
        },
    },
    // Dasboard
    // {
    //     id: `${makeid(8)}`,
    //     type: SIDEBAR_ITEM,
    //     path: "",
    //     component: {
    //         type: "dashboard",
    //         title: "Dashboard",
    //         icon: "fa-solid fa-calendar",
    //         data: {
    //             id: "new",
    //         },
    //         props: [
    //             {
    //                 id: "id",
    //                 label: "Dashboard",
    //                 type: "text", // text, date, options,
    //                 value: "",
    //                 options: [], // optional
    //                 hidden: true,
    //             },
    //         ],
    //     },
    // },
    // iframe
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "WEB_CONTENT",
        component: {
            type: "iframe",
            title: "Iframe",
            icon: "fa-solid fa-crop-simple",
            data: {
                url: "",
                width: "",
                height: "",
            },
            props: [
                {
                    id: "url",
                    label: "URL",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
                {
                    id: "width",
                    label: "Width",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
                {
                    id: "height",
                    label: "Height",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
            ],
        },
    },
    // media
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "false",
        path: "",
        code: "WEB_CONTENT",
        component: {
            type: "media",
            title: "Video Link",
            icon: "fa-solid fa-video",
            data: {
                url: "",
                width: "",
                height: "",
            },
            props: [
                {
                    id: "url",
                    label: "URL",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
                {
                    id: "width",
                    label: "Width",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
                {
                    id: "height",
                    label: "Height",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
            ],
        },
    },
    //test table
    // {
    //     id: `${makeid(8)}`,
    //     type: SIDEBAR_ITEM,
    //     path: "",
    //     component: {
    //         type: "testtable",
    //         title: "Test table",
    //         icon: "fa-regular fa-square",
    //         data: {
    //             url: "",
    //         },
    //         props: [
    //             {
    //                 id: "test",
    //                 label: "test",
    //                 type: "text", // text, date, options,
    //                 value: "",
    //                 options: [], // optional
    //                 hidden: false,
    //             },
    //         ],
    //     },
    // },
    //Chart table
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "true",
        code: "WEB_CHARTS", // for SUBSCRIPTION_CHECK
        path: "",
        component: {
            type: "chart",
            title: "Chart",
            icon: "fa-solid fa-chart-pie",
            data: {
                title: "",
                serviceKey: "",
                serviceParams: "",
                query: "",
                chartType: "",
                height: "",
                keyColumn: "",
                dataSourceName: "",
                dataSourceType: "",
            },
            props: [
                {
                    id: "test",
                    label: "test",
                    type: "text", // text, date, options,
                    value: "",
                    options: [], // optional
                    hidden: false,
                },
            ],
        },
    },
    //custom-action
    {
        id: `${makeid(8)}`,
        type: SIDEBAR_ITEM,
        require_auth: "true",
        code: "ACTION", // for SUBSCRIPTION_CHECK
        page: true,
        path: "",
        component: {
            type: "action",
            page: true,
            title: "Custom Action",
            icon: "fa fa-gear",
            data: {
                page: true,
            },
            props: ["page"],
        },
    },
];

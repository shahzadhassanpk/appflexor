import { lazy } from "react";
// import DndListing from "../../../../components/drag-and-drop-listing";
import JsonViewer from "../../../content-management/page-builder/Designer/components/json-viewer";
import FormCarousel from "./components/Carousel";
import Checkbox from "./components/Checkbox";
import CheckList from "./components/Checklist";
import DataList from "./components/DataList";
import Date from "./components/Date";
import DateRange from "./components/DateRange";
import DateTime from "./components/DateTime";
import FileUploader from "./components/FileUploader";
import HTML from "./components/HTML";
import HiddenField from "./components/HiddenField";
import ImageUploader from "./components/ImageUploader";
import ImageView from "./components/ImageView";
import Number from "./components/Number";
import Radio from "./components/Radio";
const RichTextEditor = lazy(() =>
    import("./components/RichTextEditor"),
);
// import RichTextEditor from "./components/RichTextEditor";
import Select from "./components/Select";
import MultiSelect from "./components/MultiSelect";
import Signature from "./components/Signature";
import TagWrapper from "./components/TagList/TagWrapper";
import TextArea from "./components/TextArea";
import TextField from "./components/TextField";
import PasswordField from "./components/PasswordField";
import Time from "./components/Time";
import BpmnViewerComponent from "./components/bpm-diagram-viewer/viewer";
import VideoComponent from "./components/video/Video";
import Audio from "./components/audio/Audio";
const CustomActionsPropEditer = lazy(() =>
    import("./components/CustomActions/CustomActionsPropEditer"),
);
// import CustomActionsPropEditer from "./components/CustomActions/CustomActionsPropEditer";
import AutoIncrement from "./components/Auto Increment/AutoIncrement";

export const SIDEBAR_ITEM = "sidebaritem"; // draggable
export const ROW = "row"; // dropable
export const COLUMN = "DB Column"; // dropable
export const COMPONENT = "component"; // draggable
export const COMPONENTS_STORED_IN_LAYOUT = ["imageview", "HTML"]; // Saved in layout in Base64 format

export const componentList = {
    checkbox: Checkbox,
    checklist: CheckList,
    datalist: DataList,
    fileuploader: FileUploader,
    imageuploader: ImageUploader,
    datetime: DateTime,
    date: Date,
    daterange: DateRange,
    imageview: ImageView,
    number: Number,
    radio: Radio,
    HTML: HTML,
    richtexteditor: RichTextEditor,
    select: Select,
    multiSelect: MultiSelect,
    signature: Signature,
    taglist: TagWrapper,
    textarea: TextArea,
    textfield: TextField,
    passwordfield: PasswordField,
    autoincrement: AutoIncrement,
    hiddenfield: HiddenField,
    time: Time,
    carousel: FormCarousel,
    json: JsonViewer,
    bpmviewer: BpmnViewerComponent,
    video: VideoComponent,
    audio: Audio,
    action: CustomActionsPropEditer,
    // dndlisting: DndListing,
    // audio:audioComponent
    // subform: SubForm,
    // phoneField: PhoneField,
};

/**
 * Font Awesome Icon Classes

    "fa-regular fa-square-check"
    "fa-regular fa-square"
    "fa-solid fa-square-check"
    "fa-solid fa-list"
    "fa-regular fa-rectangle-list"
    "fa-solid fa-font"
    "fa-solid fa-check"
    "fa-solid fa-list-check"
    "fa-solid fa-cube"
    "fa-regular fa-square-minus"
    "fa-regular fa-square-full"
    "fa-solid fa-hashtag"
    "fa-solid fa-calendar-day"
    "fa-regular fa-square-caret-down"
    "fa-solid fa-calendar"
    "fa-regular fa-clock"

 */

export const SIDEBAR_ITEMS = [
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "hiddenfield",
            title: "Hidden Field",
            icon: "fa-regular fa-eye-slash",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "autoincrement",
            title: "Auto Increment",
            icon: "fa-regular fa-square-plus",
        },
    },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "textfield",
            title: "Text Field",
            icon: "fa-regular fa-square-minus",
        },
    },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "passwordfield",
            title: "Password Field",
            icon: "fa-solid fa-lock",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "textarea",
            title: "Text Area",
            icon: "fa-regular fa-square",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "number",
            title: "Number Field",
            icon: "fa-solid fa-hashtag",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "date",
            title: "Date",
            icon: "fa-solid fa-calendar",
        },
    },

    {
        type: SIDEBAR_ITEM,
        component: {
            type: "time",
            title: "Time",
            icon: "fa-regular fa-clock",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "datetime",
            title: "Datetime",
            icon: "fa-solid fa-calendar-day",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "daterange",
            title: "Date Range",
            icon: "fa-solid fa-calendar",
            data: {
                label: "",
                start_db_column: "",
                start_date_value: "",
                end_db_column: "",
                end_date_value: "",
            },
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "checkbox",
            title: "Checkbox",
            icon: "fa-solid fa-vector-square",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "select",
            title: "Select",
            icon: "fa-regular fa-square-caret-down",
            data: {
                label: "",
                db_column: "",
                serviceKey: "",
                serviceParams: "",
                mapLabel: "",
                mapValue: "",
                use_static: "",
            },
            props: [],
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "multiSelect",
            title: "Multi Select",
            icon: "fa-regular fa-square-caret-down",
            data: {
                label: "",
                db_column: "",
                serviceKey: "",
                serviceParams: "",
                mapLabel: "",
                mapValue: "",
                use_static: "",
            },
            props: [],
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "checklist",
            title: "Checklist",
            icon: "fa-solid fa-vector-square",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "radio",
            title: "Radio",
            icon: "fa-regular fa-square-minus",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "HTML",
            title: "HTML",
            icon: "fa-solid fa-font",
            data: {
                html_id: "",
            },
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "richtexteditor",
            title: "Rich Text Editor",
            icon: "fa-solid fa-font",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "imageview",
            title: "Image View",
            icon: "fa-solid fa-vector-square",
            data: {
                image_id: "",
            },
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "imageuploader",
            title: "Image Uploader",
            icon: "fa-regular fa-image",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "fileuploader",
            title: "File Uploader",
            icon: "fa-solid fa-file-arrow-up",
        },
    },
    // {
    //     type: SIDEBAR_ITEM,
    //     component: {
    //         type: "carousel",
    //         title: "Carousel",
    //         icon: "fa-solid fa-photo-film",
    //     },
    // },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "video",
            title: "Video",
            icon: "fa-solid fa-file-video",
        },
    },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "audio",
            title: "Audio",
            icon: "fa-solid fa-file-audio",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "taglist",
            title: "Tag List",
            icon: "fa-solid fa-vector-square",
            data: {
                label: "",
                db_column: "",
                category: "",
            },
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "signature",
            title: "Signature",
            icon: "fas fa-signature",
        },
    },
    {
        type: SIDEBAR_ITEM,
        component: {
            type: "datalist",
            title: "Data list",
            icon: "fa-regular fa-square-minus",
        },
    },
    // {
    //     type: SIDEBAR_ITEM, //  used by designer to identify dragable component
    //     component: {
    //         type: "dndlisting",
    //         title: "Dnd Listing",
    //         icon: "fa-regular fa-square-minus",
    //     },
    // },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "json",
            title: "Json Field",
            icon: "fa-regular fa-file-code",
        },
    },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "bpmviewer",
            title: "Bpm viewer",
            icon: "fa-solid fa-list-check",
        },
    },
    {
        type: SIDEBAR_ITEM, //  used by designer to identify dragable component
        component: {
            type: "action",
            title: "Custom Action",
            icon: "fa fa-gear",
        },
    },
];

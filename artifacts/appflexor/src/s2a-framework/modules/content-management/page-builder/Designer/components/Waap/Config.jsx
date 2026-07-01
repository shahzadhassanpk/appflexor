const secretPass = "s2a-standalone-secret";

/* standalone */
const mode = "DEV";
// const mode = "PRO";
const SOCKET_MSG_URL = "/im/service";
const AUTH_URL = "/app/service";
const SIGNUP_URL = "/app/service";
const API_URL = "/app/service";
const MONITOR_API_URL = "/monitor/app/service";
const REPORT_URL = "/app/service";
const TENANT_API_URL = "/api/service";
const BPM_API_URL = "/bpm/service";

const ES_URL = "/es/service";
const ASSETS_DB_TABLE = "assets";
const FOLDER_ASSETS_DB_TABLE = "assets_folder";

const IMAGE_BASE = "/file/service";
const FILE_URL = "/file/service";
const DATE_FORMAT_FOR_DATABASE = "YYYY-MM-DD"; // For Postgres
const TIME_FORMAT_FOR_USER_VIEW = "hh:mm a";
const DATE_FORMAT_FOR_USER_VIEW = "ddd DD, MMM YYYY"; // For WebPage
const DATE_FORMAT_FOR_DATE_PICKER_VIEW = "ddd DD, MMM YYYY"; // For Date Range Picker Display
const DATE_TIME_FORMAT_FOR_DATABASE = "YYYY-MM-DD HH:mm:ss"; // For Postgres
const DATE_TIME_FORMAT_FOR_USER_VIEW = "ddd DD, MMM YYYY hh:mm a"; // For WebPage
// For Date Time Picker Display
const DATE_TIME_FORMAT_FOR_USER_VIEW_DATE_PICKER = "E dd, MMM yyyy, HH:mm a";
// const GOOGLE_MAP_API_KEY = "AIzaSyB-snbnrO6bHyQo3DThE1Ha8dE3XRNbM1s";

export {
    API_URL,
    SOCKET_MSG_URL,
    MONITOR_API_URL,
    // GOOGLE_MAP_API_KEY,
    ASSETS_DB_TABLE,
    FOLDER_ASSETS_DB_TABLE,
    AUTH_URL,
    BPM_API_URL,
    DATE_FORMAT_FOR_DATABASE,
    DATE_FORMAT_FOR_DATE_PICKER_VIEW,
    DATE_FORMAT_FOR_USER_VIEW,
    DATE_TIME_FORMAT_FOR_DATABASE,
    DATE_TIME_FORMAT_FOR_USER_VIEW,
    DATE_TIME_FORMAT_FOR_USER_VIEW_DATE_PICKER,
    ES_URL,
    FILE_URL,
    IMAGE_BASE,
    REPORT_URL,
    SIGNUP_URL,
    TENANT_API_URL,
    TIME_FORMAT_FOR_USER_VIEW,
    mode,
    secretPass,
};

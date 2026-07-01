// locations = [ BACKOFFICE, FRONTOFFICE ]
// moduleType = [ LINK, DROPDOWN, HIDDEN ]
// channelId = {  614bbbc2-63a3-4c87-b16a-7717b36992c1 == ? }
// openAs = [ Internal Link, External Link, Iframe, Page ]

import { makeid } from "./utils/utils";

const said = makeid(16); // system admin
const suid = makeid(16); // system user

const FRONTOFFICE = "FRONTOFFICE";
const BACKOFFICE = "BACKOFFICE";
const ADMINOFFICE = "ADMINOFFICE";

const MODULE_TYPE = {
    link: "LINK",
    dropdown: "DROPDOWN",
    hidden: "HIDDEN",
};

const OPEN_AS = {
    internalLink: "INTERNAL_LINK",
    externalLink: "EXTERNAL_LINK",
};

export const staticAdminModules = [
    {
        name: "Web",
        location: ADMINOFFICE,
        id: `${suid}`,
        position: "1001",
        type: MODULE_TYPE.dropdown,
        path: "Back Office",
        icon: "fa-solid fa-globe",
    },
    {
        name: "System",
        location: ADMINOFFICE,
        id: `${said}`,
        position: "1002",
        type: MODULE_TYPE.dropdown,
        path: "Back Office",
        icon: "fa-solid fa-user-lock",
        role:"ROLE_ADMIN"
    },
];

export const staticAdminModuleFeatures = [
    {
        module: `${said}`,
        type: OPEN_AS.internalLink,
        name: "User Management",
        code: "MOD_USER_MANAGEMENT",
        feature_key: "/user-management",
        icon: "fa-solid fa-user-shield",
        role:"ROLE_ADMIN"
    },
    // {
    //     module: `${said}`,
    //     type: OPEN_AS.internalLink,
    //     name: "Access Control",
    //     feature_key: "/access-control",
    //     icon: "fa-solid fa-address-card",
    // },
    {
        module: `${said}`,
        type: OPEN_AS.internalLink,
        name: "Subscription",
        code: "MOD_SUBSCRIPTION",
        feature_key: "/payment-processor",
        icon: "fa-solid fa-address-card",
        role:"ROLE_ADMIN"
    },
    {
        module: `${said}`,
        type: OPEN_AS.internalLink,
        name: "Get Started",
        code: "MOD_GET_STARTED",
        feature_key: "/welcome",
        icon: "fa-solid fa-circle-info",
    },
    {
        module: `${suid}`,
        type: OPEN_AS.internalLink,
        name: "Site Management",
        code: "MOD_SITE_ADMINISTRATION",
        feature_key: "/site-administration",
        icon: "fa-solid fa-user-shield",
    },
    {
        module: `${suid}`,
        type: OPEN_AS.internalLink,
        name: "Content Management",
        code: "MOD_CONTENT_MANAGEMENT",
        feature_key: "/content-management",
        icon: "fa-solid fa-sitemap",
    },
    {
        module: `${suid}`,
        type: OPEN_AS.internalLink,
        name: "Data Management",
        code: "MOD_DATA_MANAGEMENT",
        feature_key: "/data-management",
        icon: "fa-solid fa-server",
    },
    {
        module: `${suid}`,
        type: OPEN_AS.internalLink,
        name: "Business Intelligence",
        code: "MOD_DATA_ANALYSIS",
        feature_key: "/data-analysis",
        icon: "fa-solid fa-chart-simple",
    },
    {
        module: `${suid}`,
        type: OPEN_AS.internalLink,
        name: "Process Automation",
        code: "MOD_WORKFLOW_MANAGMENT",
        feature_key: "/process-configuration",
        icon: "fa-solid fa-diagram-project",
    },
];

export { said, suid };

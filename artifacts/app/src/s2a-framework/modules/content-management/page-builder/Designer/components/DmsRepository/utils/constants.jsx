const STATUS = {
    DELETE: "DELETE",
    ARCHIVE: "ARCHIVE",
    CHECKED_OUT: "CHECKED_OUT",
};

const SORTING = {
    DESC: "DESCENDING",
    ASC: "ASCENDING",
};

const SORTING_TYPE = {
    NAME: "NAME",
    POPULARITY: "POPULARITY ",
    TITLE: "TITLE",
};

const INITIAL_CREATE_STATE = {
    label: "+ Add New",
    value: "CREATE",
    icon: "fa-solid fa-plus",
};

const INITIAL_SELECT_STATE = {
    label: "Select...",
    value: "SEELCT",
    icon: "fa-solid fa-plus",
};

const SELECT_OPTIONS = [
    {
        label: "Documents",
        value: "DOCUMENTS",
        icon: "fa-solid fa-file-circle-check",
    },
    {
        label: "Folders",
        value: "FOLDERS",
        icon: "fa-solid fa-square-check",
    },
    {
        label: "All",
        value: "ALL",
        icon: "fa-regular fa-circle-check",
    },
    {
        label: "Invert Selection",
        value: "INVERT",
        icon: "fa-solid fa-rotate",
    },
    {
        label: "None",
        value: "NONE",
        icon: "fa-regular fa-circle-xmark",
    },
];

const INITIAL_SELECTED_ACTIONS_STATE = {
    label: "Action...",
    value: "SELECTED_ITEMS",
    icon: "",
};

const SELECTED_ACTIONS = [
    // {
    //     label: "Copy to...",
    //     value: "COPY",
    //     isDisabled: true,
    //     icon: "fa-regular fa-copy",
    // },
    {
        label: "Move",
        value: "MOVE",
        icon: "fa-solid fa-copy",
    },
    {
        label: "Archive",
        value: "DELETE",
        icon: "fa-solid fa-trash-can",
    },
    // {
    //     label: "Restore",
    //     value: "RESTORE",
    //     icon: "fa-solid fa-trash-can",
    // },
    // {
    //     label: "Deselect All",
    //     value: "DESELECT_ALL",
    //     icon: "fa-regular fa-circle-xmark",
    // },
];

const INITIAL_SORTBY_STATE = [
    {
        label: "Name",
        value: "NAME",
    },
];

const SORTBY_OPTIONS = [
    { label: "Name", value: "NAME" },
    { label: "Popularity", value: "POPULARITY" },
    { label: "Title", value: "TITLE" },
    { label: "Description", value: "DESCRIPTION" },
    { label: "Created", value: "CREATED" },
    { label: "Creator", value: "CREATOR" },
    { label: "Modified", value: "MODIFIED" },
    { label: "Modifier", value: "MODIFIER" },
    // { label: "Size", value: "SIZE" },
    // { label: "Mimetype", value: "MIMETYPE" },
    { label: "Type", value: "TYPE" },
];

const INITIAL_OPTION_STATE = [
    {
        label: "Options",
        value: "OPTIONS",
    },
];

const OPTIONS = [
    {
        label: "Hide Folders",
        value: "HIDE_FOLDERS",
        icon: "fa-regular fa-folder",
    },
    {
        label: "Hide Breadcrumb",
        value: "HIDE_BREADCRUMB",
        icon: "fa-solid fa-backward",
    },
    {
        label: "Simple View",
        value: "SIMPLE_VIEW",
        icon: "fa-solid fa-list-ol",
    },
    {
        label: "Detailed View",
        value: "DETAILED_VIEW",
        icon: "fa-regular fa-rectangle-list",
    },
];

export {
    STATUS,
    SORTING,
    INITIAL_CREATE_STATE,
    SELECT_OPTIONS,
    INITIAL_SELECT_STATE,
    INITIAL_SELECTED_ACTIONS_STATE,
    SELECTED_ACTIONS,
    INITIAL_SORTBY_STATE,
    SORTBY_OPTIONS,
    INITIAL_OPTION_STATE,
    OPTIONS,
};

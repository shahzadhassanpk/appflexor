import moment from "moment";
import React, { useCallback } from "react";
import { ToastContainer } from "react-toastify";
const subscriptionCheckEnv = "true"; //import.meta.env.VITE_SUBSCRIPTION_CHECK;

import { v4 as uuidv4 } from "uuid";
import {
    AUTH_URL,
    DATE_FORMAT_FOR_DATABASE,
    DATE_FORMAT_FOR_USER_VIEW,
    DATE_TIME_FORMAT_FOR_DATABASE,
    DATE_TIME_FORMAT_FOR_USER_VIEW,
    TIME_FORMAT_FOR_USER_VIEW,
    secretPass,
} from "../Config";
import { toastEmitter } from "../components/Toastify/Toastify";
import { tryToParse } from "../modules/data-management/form-builder/Forms/FormViewer/utils";
import CryptoJS from "crypto-js";
import axios from "axios";
import UserProfile from "../theme/advance/Pages/UserProfile";
/*
const DATE_FORMAT_FOR_DATABASE = "YYYY-MM-DD";
const DATE_FORMAT_FOR_USER_VIEW = "ddd DD, MMM YYYY";
const DATE_FORMAT_FOR_DATE_PICKER_VIEW = "ddd DD, MMM YYYY";
const DATE_TIME_FORMAT_FOR_DATABASE = "YYYY-MM-DD HH:MM:SS";
const DATE_TIME_FORMAT_FOR_USER_VIEW = "E dd, MMM yyyy, HH:mm:ss a";
*/

let formatDateForDataBase = date => {
    let formatedDate = "";
    let currentFormatedDate = moment(new Date()).format(
        DATE_FORMAT_FOR_DATABASE,
    );

    if (date) {
        formatedDate = moment(date);

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date).format(DATE_FORMAT_FOR_DATABASE);
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }

    return formatedDate;
};

function getTimeAgo(date) {
    return convertDBDateToFromNow(date);
}

let formatDateForUserViewLocale = date => {
    let formatedDate = "";
    let currentFormatedDate = moment(new Date()).format(
        DATE_FORMAT_FOR_USER_VIEW,
    );

    if (date) {
        formatedDate = moment(date);
        let local = moment.utc(date).local();
        if (moment(formatedDate).isValid()) {
            formatedDate = local.format(DATE_FORMAT_FOR_USER_VIEW);
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }

    return formatedDate;
};
let formatDateForUserView = (date, format) => {
    let formatedDate = "";
    let currentFormatedDate = moment(new Date()).format(
        format ? format : DATE_FORMAT_FOR_USER_VIEW,
    );

    if (date) {
        formatedDate = moment(date);
        let local = moment.utc(date).local();
        if (moment(formatedDate).isValid()) {
            formatedDate = local.format(
                format ? format : DATE_FORMAT_FOR_USER_VIEW,
            );
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return "";
    }

    return formatedDate;
};
// let formatDateForUserView = date => {
//     let formatedDate = "";
//     let currentFormatedDate = moment(new Date()).format(
//         DATE_FORMAT_FOR_USER_VIEW,
//     );

//     if (date) {
//         formatedDate = moment(date);

//         if (moment(formatedDate).isValid()) {
//             formatedDate = moment(date).format(DATE_FORMAT_FOR_USER_VIEW);
//         } else {
//             formatedDate = currentFormatedDate;
//         }
//     } else {
//         return currentFormatedDate;
//     }

//     return formatedDate;
// };

let formatDateForUserViewDatalist = date => {
    try {
        let local = moment.utc(date).local();
        if (date) {
            return (date = moment(local).format(DATE_FORMAT_FOR_USER_VIEW));
        } else {
            return date;
        }
    } catch (error) {
        return "";
    }
};

let formatDateTimeForUserViewDatalist = date => {
    try {
        let local = moment.utc(date).local();
        if (local) {
            return (date = moment(local).format(
                DATE_TIME_FORMAT_FOR_USER_VIEW,
            ));
        } else {
            return date;
        }
    } catch (e) {
        return "";
    }
};

let formatDateTimeForDataBaseLocal = date => {
    let formatedDate = "";
    let withoutFormat = moment(new Date());
    let currentFormatedDate = moment(new Date()).format(
        DATE_TIME_FORMAT_FOR_DATABASE,
    );

    if (date) {
        formatedDate = moment(date).format();

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date)
                .local()
                .format(DATE_TIME_FORMAT_FOR_DATABASE);
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }

    return formatedDate;
};

let formatDateTimeForDataBase = date => {
    let formatedDate = "";
    let withoutFormat = moment(new Date());
    let currentFormatedDate = moment(new Date()).format(
        DATE_TIME_FORMAT_FOR_DATABASE,
    );

    if (date) {
        formatedDate = moment(date).format();

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date)
                .utc()
                .format(DATE_TIME_FORMAT_FOR_DATABASE);
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }

    return formatedDate;

    // let tempDate = "";
    // try {
    //     if (date) {
    //         tempDate = moment(date).format(DATE_TIME_FORMAT_FOR_DATABASE);
    //     } else {
    //         tempDate = moment().format(DATE_TIME_FORMAT_FOR_DATABASE);
    //     }
    // } catch (error) {
    //     console.log("Unable to format date time for data base : " + error);
    // }
    // return tempDate;
};
// assuming date in utc
let formatTimeForDataBase = date => {
    let formatedDate = "";
    let currentFormatedDate = moment(new Date()).format(
        TIME_FORMAT_FOR_USER_VIEW,
    );

    if (date) {
        formatedDate = moment(date, DATE_TIME_FORMAT_FOR_DATABASE);

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(formatedDate).format(
                DATE_TIME_FORMAT_FOR_DATABASE,
            );
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }

    return formatedDate;

    // let tempTime = "";
    // try {
    //     if (time) {
    //         tempTime = moment(time).format(TIME_FORMAT_FOR_USER_VIEW);
    //     } else {
    //         tempTime = moment().format(TIME_FORMAT_FOR_USER_VIEW);
    //     }
    // } catch (error) {
    //     console.log("Unable to format date for data base : " + error);
    // }
    // return tempTime;
};

let formatDateTimeForUserView = date => {
    let formatedDate = "";
    try {
        let currentFormatedDate = moment(date).format(
            DATE_TIME_FORMAT_FOR_USER_VIEW,
        );
        if (date) {
            formatedDate = moment(date);
            let local = moment.utc(date).local();
            if (moment(formatedDate).isValid()) {
                formatedDate = moment(local).format(
                    DATE_TIME_FORMAT_FOR_USER_VIEW,
                );
            } else {
                formatedDate = currentFormatedDate;
            }
        } else {
            return "";
        }
    } catch (e) {
        return "";
    }

    return formatedDate;
};

let localToUTCDateTime = date => {
    let currentUtc = moment(moment(date).toISOString());
    return currentUtc.utc();
};

let utcToLocalDateTime = date => {
    let currentUtc = moment(moment(date).toISOString());
    return currentUtc.local();
};

let formatDateTimeToISO = date => {
    let tempDate = "";
    try {
        if (date) {
            tempDate = moment(date).format("YYYY-MM-DD[T]HH:mm:ss.SSSZZ");
        } else {
            tempDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSSZZ");
        }
    } catch (error) {
        console.log("Unable to format date time to ISO : " + error);
    }
    return tempDate;
};

let formatTimeForUserViewLocale = date => {
    // New implemetation
    let formatedDate = "";
    let currentFormatedDate = moment().format(TIME_FORMAT_FOR_USER_VIEW);

    if (date) {
        formatedDate = moment(date, "HH:mm");
        let local = moment(date).utc().local();
        // let local =

        if (moment(formatedDate).isValid()) {
            formatedDate = local.format(TIME_FORMAT_FOR_USER_VIEW);
        } else {
            formatedDate = currentFormatedDate;
        }
    } else {
        return currentFormatedDate;
    }
    return formatedDate;
};

let formatTimeForUserView = date => {
    // New implemetation
    let formatedDate = "";
    let currentFormatedDate = moment().format(TIME_FORMAT_FOR_USER_VIEW);

    if (date) {
        formatedDate = moment(date, "HH:mm");
        let local = moment.utc(date).local();
        if (moment(formatedDate).isValid()) {
            formatedDate = moment(local).format(TIME_FORMAT_FOR_USER_VIEW);
        } else {
            formatedDate = currentFormatedDate;
        }
    }
    return formatedDate;
};

let isValidDate = _date => {
    return _date instanceof Date && !isNaN(_date);
};

let formatToCurrency = number => {
    // return number.toFixed(2).replace(/./g, function (c, i, a) {
    //   return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? "," + c : c;
    // });
    if (number) {
        return parseInt(number).toLocaleString();
    } else {
        return 0;
    }
};

let noFormat = (number, lastDecimalPlaces = 0) => {
    try {
        if (number && typeof number === "number") {
            return number
                .toFixed(lastDecimalPlaces)
                .replace(/./g, function (c, i, a) {
                    return i > 0 && c !== "." && (a.length - i) % 3 === 0
                        ? "," + c
                        : c;
                });
        } else {
            return number;
        }
    } catch (error) {
        console.log(error);
    }
};

function showMessage(message, messageType) {
    return (
        <div>
            {/* <button onClick={notify}>Notify!</button> */}
            <ToastContainer />
        </div>
    );
}

// params: takes an array, terms to searhc and fields to search
function filterArrayByTerms(arr = [], terms = "", keysToSearch = []) {
    if (terms.length < 1) return arr;

    // const onlyAlphabetsAndPeriod = /^[a-zA-Z\s\.\_]+$/;
    // const regexExp = new RegExp(onlyAlphabetsAndPeriod);

    // let strToValidate = terms;
    // let strIsValid = regexExp.test(strToValidate);

    let words = terms.match(/\w+|"[^"]+"/g);
    if (words) {
        words.push(terms);
        let searchResults = arr.filter(currentObj => {
            let tempObj = {};
            for (const property in currentObj) {
                if (keysToSearch.includes(property)) {
                    tempObj[property] = currentObj[property];
                }
            }
            const allValues = Object.values(tempObj);
            const f = JSON.stringify(allValues).toLowerCase();
            let hasValue = words.every(val => f.includes(val));
            return hasValue;
        });
        return searchResults;
    } else {
        return arr;
    }
}

const filterPagesByTagSelection = (
    filterPages,
    selectedTagsPara,
    setFilter,
) => {
    const filteredPageListObj = {};
    const result = [];
    const filterItems = filterPages;
    const _selectedTags = selectedTagsPara;
    if (_selectedTags && _selectedTags.length >= 1) {
        filterItems &&
            filterItems.forEach(item => {
                const parseTags = tryToParse(item.tags);
                const singlePageTags = [];

                parseTags &&
                    parseTags.length &&
                    parseTags.forEach(item => {
                        singlePageTags.push(item.id);
                    });

                if (singlePageTags && singlePageTags.length)
                    filteredPageListObj[item.id] = {
                        tags: singlePageTags,
                        item,
                    };
            });
        for (let key in filteredPageListObj) {
            let include = false;
            let postStr = filteredPageListObj[key]?.tags?.join(";");

            include = _selectedTags.every(item => postStr.includes(item.id));
            if (include) {
                result.push(filteredPageListObj[key].item);
            }
        }

        if (_selectedTags.length) {
            setFilter(result);
        } else {
            setFilter(filterItems);
        }
    } else {
        setFilter(filterPages);
        return filterPages;
    }
    return result;
};

function makeid(length) {
    var characters = "abcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;

    let randomLetter = characters.charAt(
        Math.floor(Math.random() * charactersLength),
    );
    const id = randomLetter + uuidv4();
    // const id = randomLetter + makeShortId(8);

    return id.replaceAll("-", "");
}

function makeShortId(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
    }
    return result;
}

function tryParseJSONObject(jsonString, defaultValue) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {}

    return defaultValue;
}

function omitKeys(obj, keys) {
    var dup = {};
    for (var key in obj) {
        if (keys.indexOf(key) == -1) {
            dup[key] = obj[key];
        }
    }
    return dup;
}

function parseDBDateTime(strValue) {
    if (strValue !== "") {
        let local = formatDateTimeForUserView(strValue);
        let date = moment(local, DATE_TIME_FORMAT_FOR_USER_VIEW);
        // let date = moment.utc(db);
        const year = date.year();
        const month = (date.month() + 1).toString().padStart(2, "0");
        const day = date.date().toString().padStart(2, "0");
        const hours = date.hour().toString().padStart(2, "0");
        const minutes = date.minutes().toString().padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
        return "";
    }
}

function parseDBTime(strValue) {
    if (strValue !== "") {
        let local = formatDateTimeForUserView(strValue);
        let date = moment(local, DATE_TIME_FORMAT_FOR_USER_VIEW);
        // let date = moment.utc(db);
        const year = date.year();
        const month = (date.month() + 1).toString().padStart(2, "0");
        const day = date.date().toString().padStart(2, "0");
        const hours = date.hour().toString().padStart(2, "0");
        const minutes = date.minutes().toString().padStart(2, "0");

        return `${hours}:${minutes}`;
    } else {
        return "";
    }
}

function checkJsonOrNot(value) {
    try {
        let parsed = JSON.parse(value);
        if (typeof parsed === "object") {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        return true;
    }
}

function JsonToCsv(dbData, titles) {
    if (dbData !== undefined && dbData.length > 0) {
        const filename = `${
            titles ? titles + "_" + formatDate() : "" + "_" + formatDate()
        }.json`;
        const jsonStr = JSON.stringify(dbData);

        let element = document.createElement("a");
        const encodedData = encodeURIComponent(jsonStr);
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodedData,
        );
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    } else {
        toastEmitter("Select Record For Export", true, "error");
    }
}

function jsonExport(filteredItems, setFilteredItems, name, type) {
    let List = [...filteredItems];
    let _selectedItems = [];
    let titles = "";
    let fileName = "";
    let _FilteredItems = List.filter(item => item.selected);
    _FilteredItems.forEach((item, index) => {
        delete item.selected;
        _selectedItems.push(item);
        if (item.title) {
            titles += item?.title;
        } else if (item.name) {
            titles += item?.name;
        } else if (item?.brand_title) {
            titles += item?.brand_title;
        } else if (item?.servicekey) {
            titles += item?.servicekey;
        }
    });
    if (name) {
        fileName += name;
    }
    JsonToCsv(_selectedItems, name ? fileName + type : titles + type);
    if (_FilteredItems && _FilteredItems.length < 1) {
        toastEmitter("Select Record For Export", true, "error");
    }

    setFilteredItems(List);
}

function formatDate(date) {
    var d = new Date(date || Date.now()),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    let hour = d.getHours();
    let minutes = d.getMinutes();
    let seconds = d.getSeconds();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day, hour, minutes, seconds].join("-");
}

const CSVToJSON = json => {
    if (json) {
        try {
            json = JSON.parse(json);
        } catch (error) {}

        return json;
    } else {
        toastEmitter("Wrong csv format");
    }
};

const selectTags = (
    tag,
    list = [],
    setSelectedTags,
    setPageListFilterByTag,
    pageList,
    filteredPageList,
) => {
    try {
        let _selectedTags = [];
        if (list.length) {
            const index = list.findIndex(item => item.id === tag.id);
            if (index === -1) {
                _selectedTags = [...list, tag];
                setSelectedTags(_selectedTags);
            } else {
                _selectedTags = structuredClone(list);
                _selectedTags.splice(index, 1);
                setSelectedTags(_selectedTags);
            }
        } else {
            _selectedTags = [...list, tag];
            setSelectedTags(_selectedTags);
        }

        if (_selectedTags && _selectedTags.length) {
            filterPagesByTagSelection(
                filteredPageList,
                _selectedTags,
                setPageListFilterByTag,
            );
        } else {
            filterPagesByTagSelection(
                pageList,
                _selectedTags,
                setPageListFilterByTag,
            );
        }
    } catch (error) {
        console.log(error);
    }
};

function handleSelectItem(selectedItem, check, setFilter) {
    setFilter(prev => {
        return prev.map(item => {
            if (item.id === selectedItem.id) {
                return { ...item, selected: check };
            } else {
                return item;
            }
        });
    });
}

function dbTagConversion(tags) {
    if (tags)
        try {
            return tags
                .split(";")
                .filter(item => item !== "")
                .map(tag => ({ id: tag, name: tag }));
        } catch (error) {
            console.log(error);
            return [];
        }
}

function updateDeleteConfig(show, item, setConfig) {
    setConfig(prev => ({ ...prev, show: show, item: item }));
}

function enableTooltip() {
    const { Tooltip } = typeof window !== "undefined" && window.bootstrap;
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new Tooltip(tooltipTriggerEl);
    });
}

function disposeTooltip() {
    const { Tooltip } = typeof window !== "undefined" && window.bootstrap;
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        const tooltip = Tooltip.getInstance(tooltipTriggerEl);
        if (tooltip) {
            tooltip.dispose(); // Dispose tooltips to avoid memory leaks
        }
    });
}

function numberFormat(format = "###", number = 0) {
    if (!format || !number) return;
    let userNumberLen = number.toString().length;
    let formattedString = "";

    for (let i = 0; i < format.length - userNumberLen; i++) {
        const item = format[i];
        if (item === "#") {
            formattedString += "0";
        } else {
            formattedString += item;
        }
    }

    formattedString += number.toString();

    return formattedString;
}

function getAuthorizedTabs(tabs, featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        let authorizedTabs = [];

        tabs.map(tab => {
            if (typeof tab.code !== "undefined") {
                if (featuresSubscription.includes(tab.code)) {
                    authorizedTabs.push(tab);
                }
            }
        });
        return authorizedTabs;
    } else {
        return tabs;
    }
}
// Show
function getAuthorizedFeatures(
    features,
    featuresSubscription = [],
    userGroups,
    userProfile,
) {
    const isAdmin = userGroups.includes("ADMIN");
    const userRole = userProfile.roleid;
    let filteredFeatures = [];
    let subscriptionmodule = {};
    if (isAdmin) {
        features.map(feature => {
            if (feature.code === "MOD_SUBSCRIPTION") {
                if (feature.role && feature.role !== userRole) {
                } else {
                    subscriptionmodule = { ...feature };
                }
            } else {
                if (feature.role && feature.role !== userRole) {
                } else {
                    filteredFeatures.push(feature);
                }
            }
        });
    } else {
        filteredFeatures = features.filter(
            feature => feature.code !== "MOD_SUBSCRIPTION",
        );
    }

    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        let authorizedFeatures = [];

        filteredFeatures.map(feature => {
            if (typeof feature.code !== "undefined") {
                if (featuresSubscription.includes(feature.code)) {
                    authorizedFeatures.push(feature);
                }
            }
        });

        if (isAdmin) {
            authorizedFeatures.unshift(subscriptionmodule);
        }

        return authorizedFeatures;
    } else {
        if (isAdmin) {
            filteredFeatures.unshift(subscriptionmodule);
        }
        return filteredFeatures;
    }
}

function getAuthorizedComponents(components, featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        let authorizedComponents = [];

        components.map(component => {
            if (
                typeof component.require_auth !== "undefined" &&
                component.require_auth === "true"
            ) {
                if (typeof component.code !== "undefined") {
                    if (featuresSubscription.includes(component.code)) {
                        authorizedComponents.push(component);
                    }
                }
            } else {
                authorizedComponents.push(component);
            }
        });

        return authorizedComponents;
    } else {
        return components;
    }
}

function checkIfComponentIsAuthorized(code, featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        return featuresSubscription.includes(code);
    } else {
        return true;
    }
}

function checkIfGuestLoginAllowed(featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        return featuresSubscription.includes("ALLOW_GUEST");
    } else {
        return true;
    }
}

function checIfSignupAllowed(featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        return featuresSubscription.includes("ALLOW_SIGNUP");
    } else {
        return true;
    }
}

function checIfExportInportAllowed(featuresSubscription = []) {
    if (
        typeof subscriptionCheckEnv !== "undefined" &&
        subscriptionCheckEnv === "true"
    ) {
        return featuresSubscription.includes("IMPORT_EXPORT");
    } else {
        return true;
    }
}

function isEmpty(obj) {
    try {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    } catch (error) {
        console.log(error);
    }

    return false;
}

function SubscriptionAllowViewer(code, features) {
    if (subscriptionCheckEnv) {
        return features.includes(code);
    } else {
        return true;
    }
}

function unescapeSlashes(str = "") {
    let parsedStr = "";
    try {
        parsedStr = str.replaceAll("\n", "");
    } catch (e) {
        return str;
    }
    return parsedStr;
}
const validArray = item => Array.isArray(item);

const insertItem = (setItems, selectedItem) => {
    setItems(prev => [...prev, selectedItem]);
};
const updateItem = (setItems, selectedItem) => {
    setItems(prev =>
        prev.map(item => (item.id === selectedItem.id ? selectedItem : item)),
    );
};
const deleteItem = (setItems, selectedItem, db_column = "id") => {
    setItems(prev =>
        prev.filter(item => item[db_column] !== selectedItem[db_column]),
    );
};

const encryptData = text => {
    const data = CryptoJS.AES.encrypt(
        JSON.stringify(text),
        secretPass,
    ).toString();

    return data;
};

const decryptData = text => {
    const bytes = CryptoJS.AES.decrypt(text, secretPass);
    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return data;
};

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteCookie(cname) {
    document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function loginUser(userDetails, setProfile) {
    localStorage.removeItem("SHOW_SESSION_TIMEOUT");

    axios
        .post(AUTH_URL + "?service.key=login", userDetails)
        .then(response => {
            let status = response.data.C_STATUS;

            if (status === "FAIL") {
                return;
            }

            if (status === "SUCCESS") {
                if (response.data.C_DATA.AUTH_KEY) {
                    let data = response.data.C_DATA;
                    setProfile({
                        firstname: data.firstname,
                        email: data.email,
                        username: data.username,
                        lastname: data.lastname,
                    });
                    axios.defaults.headers.common["AUTH_KEY"] = data.AUTH_KEY;
                    localStorage.setItem("AUTH_KEY", data.AUTH_KEY);
                } else {
                    console.log(
                        "Unable to get authorization key. Please try again",
                    );
                }
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function convertDBDateToFromNow(dateInString) {
    // Takes date in UTC and convert accordingto timezone and returns time fromNow
    let date = new Date(dateInString);
    let dateWithTimeZone = new Date(
        date.getTime() + date.getTimezoneOffset() * 60 * 1000,
    );
    let offset = date.getTimezoneOffset() / 60;
    let hours = date.getHours();
    dateWithTimeZone.setHours(hours - offset);
    return moment(dateWithTimeZone).fromNow();
}

export {
    deleteCookie,
    setCookie,
    getCookie,
    decryptData,
    encryptData,
    CSVToJSON,
    JsonToCsv,
    SubscriptionAllowViewer,
    checIfExportInportAllowed,
    checIfSignupAllowed,
    checkIfComponentIsAuthorized,
    checkIfGuestLoginAllowed,
    dbTagConversion,
    deleteItem,
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    filterPagesByTagSelection,
    formatDate,
    formatDateForDataBase,
    formatDateForUserView,
    formatDateForUserViewDatalist,
    formatDateTimeForDataBase,
    formatDateTimeForDataBaseLocal,
    formatDateTimeForUserView,
    formatDateTimeForUserViewDatalist,
    formatDateForUserViewLocale,
    formatDateTimeToISO,
    formatTimeForDataBase,
    formatTimeForUserView,
    formatTimeForUserViewLocale,
    formatToCurrency,
    getAuthorizedComponents,
    getAuthorizedFeatures,
    getAuthorizedTabs,
    handleSelectItem,
    insertItem,
    isEmpty,
    isValidDate,
    jsonExport,
    makeShortId,
    makeid,
    noFormat,
    omitKeys,
    selectTags,
    showMessage,
    subscriptionCheckEnv,
    tryParseJSONObject,
    unescapeSlashes,
    updateDeleteConfig,
    updateItem,
    validArray,
    loginUser,
    numberFormat,
    localToUTCDateTime,
    utcToLocalDateTime,
    parseDBDateTime,
    parseDBTime,
    convertDBDateToFromNow,
    getTimeAgo,
};

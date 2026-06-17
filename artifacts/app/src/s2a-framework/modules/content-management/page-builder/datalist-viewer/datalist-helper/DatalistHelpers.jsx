// import { c } from "plotly.js/dist/plotly-cartesian";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import { evaluateExpression } from "../datalist-filter-helpers/DatalistFilters";

function tryToParse(tags) {
    let parsedTags = [];
    try {
        if (tags.includes("[")) {
            parsedTags = JSON.parse(tags);
        } else if (tags.includes(",")) {
            parsedTags = tags.split(",");
        } else if (tags.includes(";")) {
            parsedTags = tags.split(";");
        }
    } catch (error) {
        console.log(error);
        parsedTags =
            typeof tags === "string" ? JSON.parse(JSON.stringify(tags)) : tags;
    }
    return parsedTags;
}

function checkObject(object) {
    let flag = false;
    try {
        for (let key in object) {
            if (key) {
                flag = true;
                break;
            }
        }
    } catch (error) {
        console.log(error);
    }
    return flag;
}

function checkArray(a) {
    try {
        for (let key in a) {
            if (key) {
                return true;
            }
        }
    } catch (error) {
        console.log(error);
    }
    return false;
}

const CSVToJSON = (csv, selectedItem) => {
    var quotesRegex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g;
    // const escapeChar = csv.replaceAll("\n", " ");
    let lines = csv.split("\r\n");
    let datalistFields = { id: "textfield" };
    let uncorrectFields = "Correct these db_column:";
    const keys = lines[0].split(quotesRegex);
    const _keys = [];
    try {
        var layout =
            typeof selectedItem.layout === "string"
                ? JSON.parse(selectedItem.layout)
                : selectedItem.layout;
    } catch (error) {
        console.log("Error parsing the layout", error);
    }
    if (selectedItem.type === "SQL") {
        var importObj = layout.actions.find(item => item.code === "import");
        // var selectedFields = layout.selected_fields;
    }
    // let flag = true;
    keys.forEach(key => {
        key = key
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replaceAll(" ", "_");
        _keys.push(key);
    });

    let fieldsObj = { id: "textfield" };
    try {
        let fieldsArr = layout.selected_fields;
        fieldsArr.forEach(item => {
            if (item.selected) {
                fieldsObj[item.db_column] = item.type;
            }
            datalistFields[item.db_column] = item.type;
        });
        if (selectedItem.type === "FORM") {
            _keys.forEach((item, i) => {
                if (datalistFields[item] === undefined) {
                    uncorrectFields += ` ${item} |`;
                }
            });
        } else if (
            (selectedItem.type === "SQL" &&
                importObj.allow_create_col === false) ||
            importObj.allow_create_col === undefined
        ) {
            _keys.forEach((item, i) => {
                if (datalistFields[item] === undefined) {
                    uncorrectFields += ` | ${item} |`;
                }
            });
        }
        console.log(uncorrectFields);
    } catch (error) {}

    if (uncorrectFields === "Correct these db_column:") {
        // let arrForDb = [];
        // let arrForJson = [];
        return lines.slice(1).map(line => {
            // let obj = {};
            return line.split(quotesRegex).reduce(
                (acc, cur, i) => {
                    const toAdd = {};
                    // const toAddDb = {};
                    // toAdd[keys[i]] = cur.replaceAll('"', "");
                    // let obj = checkJsonOrNot(cur);

                    if (fieldsObj[_keys[i]] === "taglist") {
                        toAdd[_keys[i]] = cur.split(";");
                        // toAdd[_keys[i]] = cur.replaceAll('"', "").split(",");
                    } else if (fieldsObj[_keys[i]] === "checklist") {
                        toAdd[_keys[i]] = cur.split(";");
                        // toAdd[_keys[i]] = cur.replaceAll('"', "").split(",");
                    } else if (fieldsObj[_keys[i]] === "richtexteditor") {
                        const richtext = cur.replaceAll("c*ma", ",");
                        const parseText = JSON.parse(richtext);
                        toAdd[_keys[i]] = parseText.img;
                    } else {
                        cur = cur.replaceAll('"', "");
                        cur = cur.replaceAll("\\r", "");
                        toAdd[_keys[i]] = cur.replaceAll("\\n", "\n");
                    }
                    // toAddDb[keys[i]] = cur.replaceAll('"', "");
                    // obj = { ...acc, ...toAddDb };
                    return { ...acc, ...toAdd };
                },
                // arrForDb.push(obj),
                {},
            );
        });
    } else {
        toastEmitter(uncorrectFields, true, "error");
    }
};

const returnParams = (item, data, appContext) => {
    try {
        if (item && data) {
            let parameter = "";
            let Length = item.hyper_parameters?.length - 1;
            item.hyper_parameters?.forEach((item, i) => {
                if (item.type && item.type == "static") {
                    parameter += `${item?.parameter_name}=${item?.column_name}${
                        i !== Length ? "&" : ""
                    }`;
                } else {
                    parameter += `${item?.parameter_name}=${
                        data[item?.column_name]
                    }${i !== Length ? "&" : ""}`;
                }
            });
            const regExp = /\(([^)]+)\)/;
            let exp = regExp.exec(parameter);
            if (exp && exp.length > 1) {
                let expVal = evaluateExpression(
                    { expression: exp[1] },
                    data,
                    appContext?.channel,
                    {},
                    appContext?.profile,
                    appContext?.isAuthorized,
                    appContext?.tenantSubscription,
                );
                if (expVal) {
                    parameter = parameter.replace(exp[0], expVal);
                }
            }
            if (item.hyper_link?.includes("?")) {
                return `&${parameter}`;
            }

            return `?${parameter}`;
        }
    } catch (error) {
        console.log(error);
    }
};

const returnPageParams = (item, appContext) => {
    try {
        if (item && appContext) {
            let parameter = "";
            let Length = item.hyper_parameters?.length - 1;
            item.hyper_parameters?.forEach((item, i) => {
                parameter += `${item?.parameter_name}=${evaluateExpression(
                    { expression: item?.column_name },
                    {},
                    appContext?.channel,
                    appContext?.userGroups,
                    appContext?.profile,
                    appContext?.isAuthorized,
                    appContext?.tenantSubscription,
                )}${i !== Length ? "+" : ""}`;
            });
            if (item.hyper_link?.includes("?")) {
                return `&${parameter}`;
            }
            return `?${parameter}`;
        }
    } catch (error) {
        console.log(error);
    }
};

function defaultActionEval(edit, data, appContext) {
    try {
        if (edit.visibility_expression) {
            let flag = evaluateExpression(
                {
                    expression: edit.visibility_expression,
                },
                data,
                appContext?.channel,
                {},
                appContext?.profile,
                appContext?.isAuthorized,
                appContext?.tenantSubscription,
            );
            return flag;
        } else {
            return true;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

export {
    tryToParse,
    checkObject,
    checkArray,
    CSVToJSON,
    returnParams,
    defaultActionEval,
    returnPageParams,
};

// 'CAM_VAR_TYPE_MAP'  camunda variables types : since we store all data types in string format
// and JS only supports few of these types we need to convert each variable type accordingly
export const CAM_VAR_TYPE_MAP = {
    checkbox: "Boolean",
    checklist: "String",
    datetime: "String",
    date: "String",
    number: "Double",
    radio: "String",
    richtext: "String",
    select: "String",
    signature: "String",
    taglist: "String",
    textarea: "String",
    textfield: "String",
    hiddenfield: "String",
    time: "String",
};

function getProcessVariablesFromDataMap(state, componentsData) {
    let foundKeys = {};

    for (const prop in componentsData) {
        if (
            componentsData[prop].data.process_variable &&
            componentsData[prop].data.process_variable !== ""
        ) {
            foundKeys[componentsData[prop].data.process_variable] =
                componentsData[prop].data.db_column;
        }
    }

    return foundKeys;
}

function getProcessVariablesFromData(state, componentsData) {
    let obj = {};
    let foundKeys = {};
    for (const prop in componentsData) {
        if (
            componentsData[prop].data.process_variable &&
            componentsData[prop].data.process_variable !== ""
        ) {
            foundKeys[componentsData[prop].data.process_variable] = {
                key: componentsData[prop].data.db_column,
                type: componentsData[prop].type,
                processVar: componentsData[prop].data.process_variable,
            };
        }
    }


    for (const prop in foundKeys) {
        let key = foundKeys[prop].key;
        let processVar = foundKeys[prop].processVar;
        let type = foundKeys[prop].type;
        let value = null;

        value = state[key];

        if (state[key]) {
            obj[processVar] = {
                value: value
            };
        }
    }

    return obj;
}

function getProcessVariablesFromData8(state, componentsData) {
    let obj = {};
    let foundKeys = {};
    for (const prop in componentsData) {
        if (
            componentsData[prop].data.process_variable &&
            componentsData[prop].data.process_variable !== ""
        ) {
            foundKeys[componentsData[prop].data.process_variable] = {
                key: componentsData[prop].data.db_column,
                type: componentsData[prop].type,
            };
        }
    }


    for (const processVar in foundKeys) {
        let dbColumn = foundKeys[processVar].key;
        let dbValue = null;

        dbValue = state[dbColumn];

        if (dbValue) {
            obj[processVar] = dbValue;
        }
    }

    return obj;
}

export {
    getProcessVariablesFromData,
    getProcessVariablesFromData8,
    getProcessVariablesFromDataMap,
};

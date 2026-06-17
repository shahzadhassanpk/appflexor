import axios from "axios";
import moment from "moment";
import {
    API_URL,
    BPM_API_URL,
    DATE_FORMAT_FOR_DATABASE,
    DATE_TIME_FORMAT_FOR_DATABASE,
    TIME_FORMAT_FOR_USER_VIEW,
} from "../../../../../Config";
import {
    evaluateExpression,
    evaluateExpressionDefault,
} from "../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";

export const compareStrings = (str1, str2, separator) => {
    // Add checks to make sure the values are strings
    if (typeof str1 !== "string" || typeof str2 !== "string") {
        return false; // If either is not a string, return false
    }

    const arr1 = str1
        .split(separator)
        .map(s => s.trim())
        .filter(s => s !== "");

    const arr2 = str2
        .split(separator)
        .map(s => s.trim())
        .filter(s => s !== "");

    return arr1.some(item => arr2.includes(item));
};

//  Single Form
export const checkValidation = (
    objToValidate,
    layout,
    components,
    requiredFields = [],
) => {
    let isValid = false;
    let message = "";

    if (isEmpty(objToValidate)) {
        isValid = true;
        message =
            "Required columns are empty. This may result to false validations.";

        return {
            isValid,
            invalidKeys: [],
            invalidLabels: [],
            message,
        };
    }

    let schemaArr = getSingleFormValidationSchema(layout, components);
    let validations = validateDataFromSchema(
        objToValidate,
        schemaArr,
        requiredFields,
    );

    if (validations.invalidKeys.length === 0) {
        isValid = true;
        message = "Validations passed successfully.";
    }

    return {
        isValid,
        invalidKeys: validations.invalidKeys,
        invalidLabels: validations.invalidLabels,
        message,
    };
};

export const checkValidationExp = (
    objToValidate,
    layout,
    components,
    expressionProps,
    requiredFields = [],
) => {
    let isValid = false;
    let message = "";

    if (isEmpty(objToValidate)) {
        isValid = true;
        message =
            "Required columns are empty. This may result to false validations.";

        return {
            isValid,
            invalidKeys: [],
            invalidLabels: [],
            message,
        };
    }

    let schemaArr = getSingleFormValidationSchemaExp(
        layout,
        components,
        objToValidate,
        expressionProps,
    );
    let validations = validateDataFromSchema(
        objToValidate,
        schemaArr,
        requiredFields,
    );

    if (validations.invalidKeys.length === 0) {
        isValid = true;
        message = "Validations passed successfully.";
    }

    return {
        isValid,
        invalidKeys: validations.invalidKeys,
        invalidLabels: validations.invalidLabels,
        message,
    };
};

function getSingleFormValidationSchema(layout, components) {
    let schemaArr = [];

    try {
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let type = foundComponent.type;
                    let key = foundComponent.data.db_column;
                    let label = foundComponent.data.label;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let required = foundComponent.data.required;
                    let obj = {};

                    switch (type) {
                        case "daterange": {
                            let startDateKey =
                                foundComponent.data.start_db_column;
                            let endDateKey = foundComponent.data.end_db_column;
                            if (startDateKey && endDateKey) {
                                let obj1 = {
                                    [startDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: startDateKey,
                                        type: foundComponent.type,
                                    },
                                };
                                let obj2 = {
                                    [endDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: endDateKey,
                                        type: foundComponent.type,
                                    },
                                };

                                schemaArr.push(obj1, obj2);
                            }

                            break;
                        }

                        default: {
                            if (key) {
                                obj = {
                                    ...obj,
                                    [key]: {
                                        required,
                                        regex,
                                        label,
                                        key: key,
                                        type: foundComponent.type,
                                        maxCharacters:
                                            foundComponent.data.max_characters,
                                        minCharacters:
                                            foundComponent.data.min_characters,
                                        maxDecimals:
                                            foundComponent.data.max_decimals,
                                        minDecimals:
                                            foundComponent.data.min_decimals,
                                        uncheckValue:
                                            foundComponent.data.uncheckValue,
                                        checkedValue:
                                            foundComponent.data.checkedValue,
                                    },
                                };
                                schemaArr.push(obj);
                            }
                            break;
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.log(error);
        return [];
    }

    return schemaArr;
}

function getSingleFormValidationSchemaExp(
    layout,
    components,
    data,
    expressionProps,
) {
    let schemaArr = [];

    try {
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let type = foundComponent.type;
                    let key = foundComponent.data.db_column;
                    let label = foundComponent.data.label;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let visibleExp = foundComponent.data.condition;
                    let isVisible = true;
                    if (visibleExp && visibleExp !== "") {
                        isVisible = !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        );
                    }
                    let required = foundComponent.data.required;
                    if (!isVisible) {
                        required = "NO";
                    }
                    let obj = {};

                    switch (type) {
                        case "daterange": {
                            let startDateKey =
                                foundComponent.data.start_db_column;
                            let endDateKey = foundComponent.data.end_db_column;
                            if (startDateKey && endDateKey) {
                                let obj1 = {
                                    [startDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: startDateKey,
                                        type: foundComponent.type,
                                    },
                                };
                                let obj2 = {
                                    [endDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: endDateKey,
                                        type: foundComponent.type,
                                    },
                                };

                                schemaArr.push(obj1, obj2);
                            }

                            break;
                        }

                        default: {
                            if (key) {
                                obj = {
                                    ...obj,
                                    [key]: {
                                        required,
                                        regex,
                                        label,
                                        key: key,
                                        type: foundComponent.type,
                                        maxCharacters:
                                            foundComponent.data.max_characters,
                                        minCharacters:
                                            foundComponent.data.min_characters,
                                        maxDecimals:
                                            foundComponent.data.max_decimals,
                                        minDecimals:
                                            foundComponent.data.min_decimals,
                                        uncheckValue:
                                            foundComponent.data.uncheckValue,
                                        checkedValue:
                                            foundComponent.data.checkedValue,
                                    },
                                };
                                schemaArr.push(obj);
                            }
                            break;
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.log(error);
        return [];
    }

    return schemaArr;
}
//  Multi Form
export const checkMultiPageValidation = (objToValidate, multipageDesign) => {
    let isValid = false;
    let invalidKeys = [];
    let invalidLabels = [];
    let message = "";
    // console.log(obj);
    if (isEmpty(objToValidate)) {
        isValid = true;
        message = "Required columns are empty.";

        return {
            isValid,
            invalidKeys,
            invalidLabels,
            message,
        };
    }

    let schemaArr = getMultiFormValidationSchema(multipageDesign);
    let validations = validateDataFromSchema(objToValidate, schemaArr);

    if (validations.invalidKeys.length === 0) {
        isValid = true;
        message = "Validations passed successfully.";
    }

    return {
        isValid,
        invalidKeys: validations.invalidKeys,
        invalidLabels: validations.invalidLabels,
        message,
    };
};

//  Multi Form New
export const checkMultiPageValidationExp = (
    objToValidate,
    multipageDesign,
    expressionProps,
) => {
    let isValid = false;
    let invalidKeys = [];
    let invalidLabels = [];
    let message = "";
    // console.log(obj);
    if (isEmpty(objToValidate)) {
        isValid = true;
        message = "Required columns are empty.";

        return {
            isValid,
            invalidKeys,
            invalidLabels,
            message,
        };
    }

    let schemaArr = getMultiFormValidationSchemaExp(
        multipageDesign,
        objToValidate,
        expressionProps,
    );
    let validations = validateDataFromSchema(objToValidate, schemaArr);

    if (validations.invalidKeys.length === 0) {
        isValid = true;
        message = "Validations passed successfully.";
    }

    return {
        isValid,
        invalidKeys: validations.invalidKeys,
        invalidLabels: validations.invalidLabels,
        message,
    };
};

function getMultiFormValidationSchemaExp(
    multipageDesign,
    data,
    expressionProps,
) {
    let schemaArr = [];

    multipageDesign.map(form => {
        form.design.layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = form.design.components[component.id];
                    let type = foundComponent.type;
                    let visibleExp = foundComponent.data.condition;
                    let isVisible = true;
                    if (visibleExp && visibleExp !== "") {
                        isVisible = !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        );
                    }
                    let key = foundComponent.data.db_column;
                    let label = foundComponent.data.label;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let required = foundComponent.data.required;
                    if (!isVisible) {
                        required = "NO";
                    }
                    let obj = {};

                    switch (type) {
                        case "daterange": {
                            let startDateKey =
                                foundComponent.data.start_db_column;
                            let endDateKey = foundComponent.data.end_db_column;
                            if (startDateKey && endDateKey) {
                                let obj1 = {
                                    [startDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: startDateKey,
                                        type: foundComponent.type,
                                    },
                                };
                                let obj2 = {
                                    [endDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: endDateKey,
                                        type: foundComponent.type,
                                    },
                                };

                                schemaArr.push(obj1, obj2);
                            }

                            break;
                        }

                        default: {
                            if (key) {
                                obj = {
                                    ...obj,
                                    [key]: {
                                        required,
                                        regex,
                                        label,
                                        key: key,
                                        type: foundComponent.type,
                                        maxCharacters:
                                            foundComponent.data.max_characters,
                                        minCharacters:
                                            foundComponent.data.min_characters,
                                        maxDecimals:
                                            foundComponent.data.max_decimals,
                                        minDecimals:
                                            foundComponent.data.min_decimals,
                                        uncheckValue:
                                            foundComponent.data.uncheckValue,
                                        checkedValue:
                                            foundComponent.data.checkedValue,
                                    },
                                };
                                schemaArr.push(obj);
                            }
                            break;
                        }
                    }
                });
            });
        });
    });

    return schemaArr;
}

function getMultiFormValidationSchema(multipageDesign) {
    let schemaArr = [];

    multipageDesign.map(form => {
        form.design.layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = form.design.components[component.id];
                    let type = foundComponent.type;
                    let key = foundComponent.data.db_column;
                    let label = foundComponent.data.label;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let required = foundComponent.data.required;
                    let obj = {};

                    switch (type) {
                        case "daterange": {
                            let startDateKey =
                                foundComponent.data.start_db_column;
                            let endDateKey = foundComponent.data.end_db_column;
                            if (startDateKey && endDateKey) {
                                let obj1 = {
                                    [startDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: startDateKey,
                                        type: foundComponent.type,
                                    },
                                };
                                let obj2 = {
                                    [endDateKey]: {
                                        required,
                                        regex,
                                        label,
                                        key: endDateKey,
                                        type: foundComponent.type,
                                    },
                                };

                                schemaArr.push(obj1, obj2);
                            }

                            break;
                        }

                        default: {
                            if (key) {
                                obj = {
                                    ...obj,
                                    [key]: {
                                        required,
                                        regex,
                                        label,
                                        key: key,
                                        type: foundComponent.type,
                                        maxCharacters:
                                            foundComponent.data.max_characters,
                                        minCharacters:
                                            foundComponent.data.min_characters,
                                        maxDecimals:
                                            foundComponent.data.max_decimals,
                                        minDecimals:
                                            foundComponent.data.min_decimals,
                                        uncheckValue:
                                            foundComponent.data.uncheckValue,
                                        checkedValue:
                                            foundComponent.data.checkedValue,
                                    },
                                };
                                schemaArr.push(obj);
                            }
                            break;
                        }
                    }
                });
            });
        });
    });

    return schemaArr;
}
// Common utils function between Single and Multi form

function validateDataFromSchema(objToValidate, schemaArr, requiredFields = []) {
    let invalidKeys = [];
    let invalidLabels = [];
    let selfValidatingComponents = ["checkbox"]; // These components never have empty value, required check will always fail for empty ("") condition

    for (let i = 0; i < schemaArr.length; i++) {
        let objFound = schemaArr[i];
        let keys = Object.keys(objFound);
        let validationSchema = objFound[keys[0]];
        let keyToValidate = validationSchema.key;
        let checkForValidation =
            validationSchema?.required == "YES" ? true : false;

        // datalist grid can omit required fields
        if (requiredFields.length > 0) {
            if (!requiredFields.includes(keyToValidate)) {
                checkForValidation = false;
            }
        }

        if (checkForValidation) {
            let stringToVaidate = objToValidate.hasOwnProperty(keyToValidate)
                ? objToValidate[keyToValidate]
                : "";
            let stringIsValid = true;
            if (validationSchema.type === "taglist") {
                let valueToCheck = stringToVaidate;
                if (valueToCheck.length == 0 || valueToCheck === "[]") {
                    stringIsValid = false;
                }
            }

            if (validationSchema.type === "number") {
                let valueToCheck = stringToVaidate.toString();
                let isValueValid = true;
                let _message = "";
                let lengthOfString = valueToCheck?.length;
                let parsedValue = parseFloat(valueToCheck);
                let minDecimals = parseFloat(validationSchema.minDecimals);
                let maxDecimals = parseFloat(validationSchema.maxDecimals);

                let minNumber = minDecimals;
                let maxNumber = maxDecimals;

                if (parsedValue >= minNumber && parsedValue <= maxNumber) {
                    isValueValid = true;
                } else {
                    isValueValid = false;
                }
                stringIsValid = isValueValid;
                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES" &&
                    validationSchema.regex !== ""
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            }
            // textfield, textarea, richtexteditor has min, max, regex validations
            if (validationSchema.type === "textfield") {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 255;
                if (!minCharacters) minCharacters = -1;
                if (
                    stringToVaidate === undefined ||
                    stringToVaidate === "undefined"
                ) {
                    stringToVaidate = "";
                }

                stringIsValid =
                    stringToVaidate.length >= minCharacters ? true : false;

                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES" &&
                    validationSchema.regex !== ""
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            } else if (
                validationSchema.type === "textarea" ||
                validationSchema.type === "richtexteditor"
            ) {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 1000000000;
                if (!minCharacters) minCharacters = -1;

                stringIsValid =
                    stringToVaidate.length >= minCharacters ? true : false;

                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            } else if (validationSchema.type === "checkbox") {
                // checkbox has 'true/false' and custom Boolean validation
                if (
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    let uncheckValue = validationSchema.uncheckValue;
                    let checkedValue = validationSchema.checkedValue;

                    if (!uncheckValue) uncheckValue = "false";
                    if (!checkedValue) checkedValue = "true";

                    stringIsValid =
                        stringToVaidate === checkedValue ? true : false;
                }
            } else if (validationSchema.type === "passwordfield") {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 255;
                if (!minCharacters) minCharacters = -1;
                
                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate?.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES" &&
                    validationSchema.regex !== ""
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            }

            if (
                stringIsValid &&
                validationSchema.required &&
                validationSchema.required === "YES"
            ) {
                if (!selfValidatingComponents.includes(validationSchema.type)) {
                    stringIsValid = stringToVaidate !== "" ? true : false;
                }
            }
            if (!stringIsValid) {
                invalidKeys.push(keyToValidate);
                invalidLabels.push(validationSchema.label);
            }
        }
    }

    return {
        invalidKeys: invalidKeys,
        invalidLabels: invalidLabels,
    };
}

function validateDataFromSchemaExp(
    objToValidate,
    schemaArr,
    requiredFields = [],
    expressionProps,
) {
    let invalidKeys = [];
    let invalidLabels = [];
    let selfValidatingComponents = ["checkbox"]; // These components never have empty value, required check will always fail for empty ("") condition

    for (let i = 0; i < schemaArr.length; i++) {
        let objFound = schemaArr[i];
        let keys = Object.keys(objFound);
        let validationSchema = objFound[keys[0]];
        let keyToValidate = validationSchema.key;
        let checkForValidation = true;

        // datalist grid can omit required fields
        if (requiredFields.length > 0) {
            if (!requiredFields.includes(keyToValidate)) {
                checkForValidation = false;
            }
        }

        if (checkForValidation) {
            let stringToVaidate = objToValidate.hasOwnProperty(keyToValidate)
                ? objToValidate[keyToValidate]
                : "";
            let stringIsValid = true;

            if (validationSchema.type === "number") {
                let valueToCheck = stringToVaidate.toString();
                let isValueValid = true;
                let _message = "";
                let lengthOfString = valueToCheck?.length;
                let parsedValue = parseFloat(valueToCheck);
                let minDecimals = parseFloat(validationSchema.minDecimals);
                let maxDecimals = parseFloat(validationSchema.maxDecimals);

                let minNumber = minDecimals;
                let maxNumber = maxDecimals;

                if (parsedValue >= minNumber && parsedValue <= maxNumber) {
                    isValueValid = true;
                } else {
                    isValueValid = false;
                }
                stringIsValid = isValueValid;
                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            }
            // textfield, textarea, richtexteditor has min, max, regex validations
            if (validationSchema.type === "textfield") {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 255;
                if (!minCharacters) minCharacters = -1;
                if (
                    stringToVaidate === undefined ||
                    stringToVaidate === "undefined"
                ) {
                    stringToVaidate = "";
                }
                stringIsValid =
                    stringToVaidate.length >= minCharacters ? true : false;

                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            } else if (
                validationSchema.type === "textarea" ||
                validationSchema.type === "richtexteditor"
            ) {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 1000000000;
                if (!minCharacters) minCharacters = -1;
                if (
                    stringToVaidate === undefined ||
                    stringToVaidate === "undefined"
                ) {
                    stringToVaidate = "";
                }
                stringIsValid =
                    stringToVaidate.length >= minCharacters ? true : false;

                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            } else if (validationSchema.type === "checkbox") {
                // checkbox has 'true/false' and custom Boolean validation
                if (
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    let uncheckValue = validationSchema.uncheckValue;
                    let checkedValue = validationSchema.checkedValue;

                    if (!uncheckValue) uncheckValue = "false";
                    if (!checkedValue) checkedValue = "true";

                    stringIsValid =
                        stringToVaidate === checkedValue ? true : false;
                }
            } else if (validationSchema.type === "passwordfield") {
                let maxCharacters = parseInt(validationSchema.maxCharacters);
                let minCharacters = parseInt(validationSchema.minCharacters);

                if (!maxCharacters) maxCharacters = 255;
                if (!minCharacters) minCharacters = -1;
                if (
                    stringToVaidate === undefined ||
                    stringToVaidate === "undefined"
                ) {
                    stringToVaidate = "";
                }
                stringIsValid =
                    stringToVaidate.length >= minCharacters ? true : false;

                if (stringIsValid) {
                    stringIsValid =
                        stringToVaidate.length <= maxCharacters ? true : false;
                }

                if (
                    stringIsValid &&
                    validationSchema.required &&
                    validationSchema.required === "YES"
                ) {
                    const regexExp = new RegExp(validationSchema.regex);

                    if (objToValidate[keyToValidate] !== undefined) {
                        stringToVaidate = objToValidate[keyToValidate];
                    }

                    stringIsValid = regexExp.test(stringToVaidate);
                }
            }

            if (
                stringIsValid &&
                validationSchema.required &&
                validationSchema.required === "YES"
            ) {
                if (!selfValidatingComponents.includes(validationSchema.type)) {
                    stringIsValid = stringToVaidate !== "" ? true : false;
                }
            }
            if (!stringIsValid) {
                invalidKeys.push(keyToValidate);
                invalidLabels.push(validationSchema.label);
            }
        }
    }

    return {
        invalidKeys: invalidKeys,
        invalidLabels: invalidLabels,
    };
}

export const getObjectSchemeForValidation = (
    layout,
    components,
    processVariables = {},
    formVars = {},
    expressionProps,
) => {
    let defalutFormData = {};

    try {
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let type = foundComponent.type;

                    // date range type add by haider
                    if (type !== "daterange") {
                        var key = foundComponent.data.db_column
                            ? foundComponent.data.db_column
                            : "";
                    } else {
                        var key = "daterange";
                    }
                    let valueExp = foundComponent.data
                        ? foundComponent.data.value
                        : "";
                    // if (key === "operator_id") {
                    //     debugger;
                    // }

                    let value = evaluateExpression(
                        { expression: valueExp },
                        type,
                        ...expressionProps,
                    );

                    if (key) {
                        switch (type) {
                            case "daterange":
                                let startDateKey =
                                    foundComponent.data.start_db_column;
                                let endDateKey =
                                    foundComponent.data.end_db_column;

                                let startDateValue =
                                    foundComponent.data.start_date_value;
                                let endDateValue =
                                    foundComponent.data.end_date_value;

                                defalutFormData = {
                                    ...defalutFormData,
                                    [startDateKey]: startDateValue,
                                    [endDateKey]: endDateValue,
                                };

                                break;
                            default:
                                defalutFormData = {
                                    ...defalutFormData,
                                    [key]: value,
                                };

                            // !TODO test this if it fixes checkbox bug
                            // if (type === "checkbox") {
                            //     defalutFormData = {
                            //         ...defalutFormData,
                            //         [key]: "",
                            //     };
                            // } else {
                            //     defalutFormData = {
                            //         ...defalutFormData,
                            //         [key]: value,
                            //     };
                            // }
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.error(error);
    }

    if (!isEmpty(processVariables)) {
        // const processkeys = Object.keys(processVariables)
        const defalutFormDatakeys = Object.keys(defalutFormData);

        defalutFormDatakeys.map(key => {
            if (processVariables[key] !== undefined) {
                defalutFormData[key] = processVariables[key].value;
            }
        });
    }

    if (!isEmpty(formVars)) {
        defalutFormData = { ...defalutFormData, ...formVars };
    }

    console.log("Defalut Data Set to Datalist Form Viewer");
    console.log({ defalutFormData });
    return defalutFormData;
};

export const getSchemeForValidationMultiPageForm = multipageDesign => {
    let defalutFormData = {};

    try {
        multipageDesign.map(form => {
            form.design.layout.map(row => {
                row.children.map(column => {
                    column.children.map(component => {
                        let foundComponent =
                            form.design.components[component.id];
                        let key = foundComponent.data.db_column
                            ? foundComponent.data.db_column
                            : "";
                        let type = foundComponent.type;
                        let defaultExp = foundComponent.data.value;
                        let value = evalDefault(defaultExp, type);

                        switch (type) {
                            case "daterange":
                                let startDateKey =
                                    foundComponent.data.start_db_column;
                                let endDateKey =
                                    foundComponent.data.end_db_column;

                                let startDateValue =
                                    foundComponent.data.start_date_value;
                                let endDateValue =
                                    foundComponent.data.end_date_value;

                                defalutFormData = {
                                    ...defalutFormData,
                                    [startDateKey]: startDateValue,
                                    [endDateKey]: endDateValue,
                                };

                                break;
                            default:
                                if (key !== "") {
                                    defalutFormData = {
                                        ...defalutFormData,
                                        [key]: value,
                                    };
                                }

                            // !TODO test this if it fixes checkbox bug
                            // if (type === "checkbox") {
                            //     defalutFormData = {
                            //         ...defalutFormData,
                            //         [key]: "",
                            //     };
                            // } else {
                            //     defalutFormData = {
                            //         ...defalutFormData,
                            //         [key]: value,
                            //     };
                            // }
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.log(error);
    }

    // if (!isEmpty(processVariables)) {
    //     // const processkeys = Object.keys(processVariables)
    //     const defalutFormDatakeys = Object.keys(defalutFormData);

    //     defalutFormDatakeys.map(key => {
    //         if (processVariables[key] !== undefined) {
    //             defalutFormData[key] = processVariables[key].value;
    //         }
    //     });
    // }

    // if (!isEmpty(formVars)) {
    //     defalutFormData = { ...defalutFormData, ...formVars };
    // }

    return defalutFormData;
};

export const getObjectSchemeForValidation8 = (
    layout,
    components,
    processVariables = {},
    formVars = {},
    expressionProps,
) => {
    let defalutFormData = {};
    let mappedProcessVars = [];
    let processVars = {};
    layout.map(row => {
        row.children.map(column => {
            column.children.map(component => {
                let foundComponent = components[component.id];
                let key = foundComponent.data.db_column
                    ? foundComponent.data.db_column
                    : "";
                let type = foundComponent.type;
                let valueExp = foundComponent.data
                    ? foundComponent.data.value
                    : "";
                let value = evalDefault(valueExp, type);

                if (foundComponent.data.process_variable) {
                    mappedProcessVars.push({
                        db_column: foundComponent.data.db_column,
                        process_variable: foundComponent.data.process_variable,
                    });
                    processVars[foundComponent.data.db_column] =
                        foundComponent.data.process_variable;
                }

                if (key) {
                    switch (type) {
                        case "daterange":
                            let startDateKey =
                                foundComponent.data.start_db_column;
                            let endDateKey = foundComponent.data.end_db_column;

                            let startDateValue =
                                foundComponent.data.start_date_value;
                            let endDateValue =
                                foundComponent.data.end_date_value;

                            defalutFormData = {
                                ...defalutFormData,
                                [startDateKey]: startDateValue,
                                [endDateKey]: endDateValue,
                            };

                            break;
                        default:
                            if (key !== "" && value !== "") {
                                defalutFormData = {
                                    ...defalutFormData,
                                    [key]: value,
                                };
                            }

                        // !TODO test this if it fixes checkbox bug
                        // if (type === "checkbox") {
                        //     defalutFormData = {
                        //         ...defalutFormData,
                        //         [key]: "",
                        //     };
                        // } else {
                        //     defalutFormData = {
                        //         ...defalutFormData,
                        //         [key]: value,
                        //     };
                        // }
                    }
                }
            });
        });
    });

    let processData = {};

    if (!isEmpty(processVariables)) {
        const processVariableskeys = Object.keys(processVariables);

        processVariableskeys.map(processVarKey => {
            mappedProcessVars.map(processVar => {
                if (processVarKey === processVar.process_variable) {
                    let dbColumn = processVar.db_column;
                    processData[dbColumn] = processVariables[processVarKey];
                }
            });
        });
    }

    if (!isEmpty(processData)) {
        defalutFormData = { ...defalutFormData, ...processData };
    }
    if (!isEmpty(formVars)) {
        defalutFormData = { ...defalutFormData, ...formVars };
    }
    let validationSchema = {
        formData: defalutFormData,
        processVar: processVars,
    };
    return validationSchema;
};

function prepareProcessData(formData, layout, components) {
    let tempObj = {};
    layout.map(row => {
        row.children.map(column => {
            column.children.map(component => {
                let foundComponent = components[component.id];

                let processRef = foundComponent.data.processRef;
                let key = foundComponent.data.db_column;

                if (processRef !== undefined && processRef.length > 0) {
                    tempObj = {
                        ...tempObj,
                        [processRef]: formData[key],
                    };
                }
            });
        });
    });
    return tempObj;
}

export function evalDefault(expression, type, expressionProps) {
    let value = null;

    if (!expression) {
        return "";
    }

    switch (type) {
        case "datetime": {
            let date = tryEval(expression, type);
            value = formatDateTimeForDataBase(date);
            break;
        }
        case "date": {
            let date = tryEval(expression, type);
            value = formatDateForDataBase(date);
            break;
        }
        case "time": {
            let date = tryEval(expression, type);
            value = formatTimeForDataBase(date);
            break;
        }
        case "imageview": {
            value = "";
            break;
        }

        case "textfield": {
            let data = evaluateExpressionDefault(
                expression,
                type,
                expressionProps,
            );
            value = data;
            break;
        }

        case "number": {
            let data = tryEval(expression, type);
            value = data;
            break;
        }

        default: {
            value = expression;
        }
    }

    return value;
}

export function tryEval(expression, type) {
    let value = "";

    if (expression) {
        try {
            value = evaluateExpression({ expression });
        } catch (error) {
            value = expression;
            console.log("Provided expression is invalid for " + type);
            console.error(error);
        }
    }
    return value;
}

export function tryParseJSONObject(jsonString, defaultValue) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {}

    return defaultValue;
}

export function isEmpty(obj) {
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

export function isArrayEmpty(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === "") return true;
    }
    return false;
}

export function omitKeys(obj, keys) {
    let unordered = {};

    for (let key in obj) {
        if (keys.indexOf(key) == -1) {
            unordered[key] = obj[key];
        }
    }

    let ordered = Object.keys(unordered)
        .sort()
        .reduce((_obj, key) => {
            _obj[key] = unordered[key];
            return _obj;
        }, {});
    return ordered;
}

export function tryToParse(item) {
    try {
        if (typeof item === "string") {
            return JSON.parse(item);
        } else {
            return item;
        }
    } catch (e) {
        console.log("************** tryToParse:" + e);
        return {};
    }
}

export function printKeys(obj) {
    let keys = Object.keys(obj);
    let str = keys.join(" - ");
    return (
        <div className="bg-light border p-2">
            <div>
                Inside Form Viewer : {keys.length} : {str}{" "}
            </div>

            <pre>
                <code>{JSON.stringify(obj, null, 2)}</code>
            </pre>
        </div>
    );
}

export function formatDateTimeForDataBase(date) {
    let formatedDate = null;

    if (date) {
        formatedDate = moment(date);

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date).format(DATE_TIME_FORMAT_FOR_DATABASE);
        } else {
            formatedDate = "";
        }
    } else {
        return "";
    }

    return formatedDate;
}

export function formatDateForDataBase(date) {
    let formatedDate = null;

    if (date) {
        formatedDate = moment(date);

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date).format(DATE_FORMAT_FOR_DATABASE);
        } else {
            formatedDate = "";
        }
    } else {
        return "";
    }

    return formatedDate;
}

export function formatTimeForDataBase(date) {
    let formatedDate = null;

    if (date) {
        formatedDate = moment(date);

        if (moment(formatedDate).isValid()) {
            formatedDate = moment(date).format(TIME_FORMAT_FOR_USER_VIEW);
        } else {
            formatedDate = "";
        }
    } else {
        return "";
    }

    return formatedDate;
}

// API calls

function deleteFile(file) {
    const config = {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    };
    try {
        axios
            .delete(
                `/file/service/${file.table}/${file.id}/${file.name}`,
                config,
            )
            .then(function (response) {});
    } catch (e) {
        console.error("Error while sending delete request:" + e);
    }
}

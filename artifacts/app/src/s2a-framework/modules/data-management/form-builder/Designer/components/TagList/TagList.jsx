import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
<<<<<<< HEAD
import ReactTags from "react-tag-autocomplete";
=======
import { ReactTags } from "react-tag-autocomplete";
>>>>>>> a9f11ccabec603523e899507567e9dd5c08d8ba1
import { API_URL } from "../../../../../../Config";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
function TagList(props) {
    const {
        suggestions = [],
        category,
        handleInputFields,
        handleOnFieldBlur,
        mode,
        modeTypes,
        formData = {},
        db_column,
        placeHolder,
        suggestionTagsId,
        getTagsByCategory,
        setData,
        disable,
    } = props;
    const reactTags = useRef(null);

    const [tags, setTags] = useState([]);

    useEffect(() => {
        if (checkObject(tags) && db_column && modeTypes.render === mode) {
            handleInputFields(db_column, tags);
        }
    }, [tags]);

    // const suggestionTagsID = useMemo(() => {
    //     if (suggestionTagsId) return suggestionTagsId;
    // }, [suggestionTagsId]);

    // const suggestionsArray = useMemo(() => {
    //     return suggestions;
    // }, [suggestions]);

    function tryToParse(tags) {
        let formatedTags = [];
        let length = tags ? tags.length : 0;
        const error = [];
        if (typeof tags === "string") {
            if (tags.includes("[") && length > 0) {
                tags = JSON.parse(tags);
            } else if (tags.includes(";")) {
                tags = tags.split(",");
            } else if (tags.includes(",")) {
                tags = tags.split(",");
            }
            if (typeof tags === "object")
                tags.forEach(tag => {
                    if (typeof tag === "string") {
                        let formatedTag = {};
                        formatedTag["id"] = tag;
                        formatedTag["name"] = tag;
                        formatedTags.push(formatedTag);
                    } else {
                        formatedTags.push(tag);
                    }
                });
            else error.push("data format issue");
        } else if (tags.includes("[")) {
            if (typeof tags === "string" && length > 0) {
                try {
                    tags = JSON.parse(tags);
                    tags.forEach(tag => {
                        if (typeof tag === "string") {
                            let formatedTag = {};
                            formatedTag["id"] = tag;
                            formatedTag["name"] = tag;
                            formatedTags.push(formatedTag);
                        } else {
                            formatedTags.push(tag);
                        }
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        } else if (typeof tags === "object") {
            formatedTags = tags;
        } else {
            formatedTags = [];
        }
        // if (formatedTags.length > 0) {
        //     formatedTags.map(tag => {
        //         checKTagsExist(tag);
        //     });
        // }
        error.length
            ? toastEmitter("Tags data format issue", true, "warning")
            : "";
        return formatedTags;
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

    function onDelete(i) {
        if (formData) {
            let tags = formData[db_column] ? formData[db_column] : [];
            let parsedTags = tryToParse(tags);
            let _tags = parsedTags;
            if (_tags) {
                const newTag = _tags.slice(0);
                newTag.splice(i, 1);
                formData[db_column] = newTag;
                setTags(newTag);
                if (handleOnFieldBlur) handleOnFieldBlur("TAGS", newTag);
            }
        } else {
            let _tags = [...tags];
            let newTag = _tags.slice(0);
            newTag.splice(i, 1);
            setTags(newTag);
        }
    }

    function onAddition(tag) {
        if (formData) {
            let id = convertSpacesToUdr(tag.name);
            tag.id = id.toUpperCase();
            tag.name = tag.name.toUpperCase();
            let tags = formData[db_column] ? formData[db_column] : [];
            let parsedTag = tryToParse(tags);
            let _tags = [...parsedTag];

            const newTag = [].concat(_tags, tag);
            setTags(newTag);
            checKTagsExist(tag);
            if (handleOnFieldBlur) handleOnFieldBlur("TAGS", newTag);
        } else {
            let id = convertSpacesToUdr(tag.name);
            tag.id = id;
            let _tags = [...tags];
            const newTag = [].concat(_tags, tag);
            setTags(newTag);
        }
        setData(tag);
    }

    function saveTagSuggestion(tags) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "tag_suggestion"; //"formid"
        entityForm.entity = "tag_suggestion"; //Db- "table name"
        entityForm.action = "update";

        entityForm.category = `${category}`;
        let object = {
            id: suggestionTagsId ? suggestionTagsId : "new",
            list: tags,
            category: category,
        };

        if (tags) {
            entityForm.id = object.id;
        } else {
            entityForm.id = "new";
            object.id = "new";
        }

        entityForm.formData = object;
        request.data.push(entityForm);

        if (suggestionTagsId) {
            try {
                axios.post(url, request).then(response => {
                    if (response.status === 200) {
                        getTagsByCategory();
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else if (object.id === "new") {
            try {
                axios.post(url, request).then(response => {
                    if (response.status === 200) {
                        getTagsByCategory();
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        }
    }

    function checKTagsExist(tag) {
        let _suggestion = suggestions;

        let index =
            _suggestion && _suggestion.findIndex(item => item.id === tag.id);
        if (index === -1) {
            _suggestion.push(tag);
            saveTagSuggestion(_suggestion);
        }
    }

    function convertSpacesToUdr(str) {
        let id = "";
        id = str.toLowerCase().trim();
        id = id.replaceAll(" ", "_");
        if (id) return id;
        else return "_";
    }

    return (
        <div
            className="s2a-taglist-form"
            onClick={() => getTagsByCategory()}>
            {disable ? (
                <div>
                    <div className="readonly-tags">
                        <ReactTags
                            ref={reactTags}
                            tags={tryToParse(
                                formData[db_column]
                                    ? formData[db_column]
                                    : tags,
                            )}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <ReactTags
                        ref={reactTags}
                        tags={tryToParse(
                            formData[db_column] ? formData[db_column] : tags,
                        )}
                        allowNew={true}
                        suggestions={suggestions ? suggestions : []}
                        onDelete={onDelete}
                        onAddition={onAddition}
                        placeholderText={
                            formData[db_column] &&
                            formData[db_column].length > 0
                                ? ""
                                : placeHolder
                        }
                        delimiters={["Enter", "Tab", ","]}
                    />
                </>
            )}
        </div>
    );
}

export default TagList;

import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { ReactTags } from "react-tag-autocomplete";
import axios from "axios";
import { API_URL } from "../../../../../../Config";
import "./style.css";
import { tryToParse } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";

export default function Tag({
    handleTags,
    selectedPostTags,
    getData,
    category,
}) {
    const [tags, setTags] = useState([]);
    const [tagSuggestionId, setTagSuggestionId] = useState("");
    const [tagSuggestion, setTagSuggestion] = useState([]);

    const reactTags = useRef(null);

    useEffect(() => {
        if (selectedPostTags && selectedPostTags.length > 0) {
            setTags(selectedPostTags);
        } else {
            setTags([]);
        }
    }, [selectedPostTags]);

    function onAddition(tag) {
        let id = convertSpacesToUdr(tag.name);
        tag.id = id;
        tag.name = id;
        const newtags = [].concat(tags, tag);
        setTags(newtags);
        handleTags(newtags);
        checKTagsExist(tag);
    }

    function saveTagSuggestion(tagsObj) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "tag_suggestion"; //"formid"
        entityForm.entity = "tag_suggestion"; //Db- "table name"
        entityForm.action = "update";

        entityForm.category = category;
        entityForm.id = tagsObj.id;
        entityForm.formData = tagsObj;

        request.data.push(entityForm);

        if (request) {
            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                    }
                    getSuggestionTag();
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        }
    }

    function checKTagsExist(userTag) {
        let tagsByUser = userTag;
        let parsedFilteredTags = [];
        let _tagSuggestionObj = [...tagSuggestion];
        if (_tagSuggestionObj && tagsByUser) {
            parsedFilteredTags = _tagSuggestionObj;

            let uniqueTags =
                parsedFilteredTags &&
                parsedFilteredTags.findIndex(item => item.id === userTag.id);
            if (uniqueTags === -1) {
                _tagSuggestionObj.push(userTag);

                let suggestionTag = {
                    id: tagSuggestionId ? tagSuggestionId : "new",
                    category: category,
                    list: parsedFilteredTags,
                };

                saveTagSuggestion(suggestionTag);
            }
        }
    }

    function onDelete(i) {
        let restTags = tags.slice(0);
        restTags.splice(i, 1);
        setTags(restTags);
        handleTags(restTags);
    }

    function convertSpacesToUdr(str) {
        let id = "";
        id = str.toLowerCase().trim();
        id = id.replaceAll(" ", "_");
        // id = id.split(" ").join("_");
        if (!id) return "_";
        return id.toUpperCase();
    }

    async function getSuggestionTag() {
        try {
            const response = await getData("tagSuggestion");
            const tagSuggestionList = response?.data?.C_DATA?.tagSuggestionList;
            if (tagSuggestionList && tagSuggestionList.length > 0) {
                const tagObject = tagSuggestionList.find(
                    item => item.category === category,
                );
                setTagSuggestionId(tagObject.id);
                const parsedTags = tryToParse(tagObject.list);
                const length = parsedTags ? parsedTags.length : 0;
                if (length > 0) {
                    setTagSuggestion(parsedTags);
                }
            } else {
                setTagSuggestion([]);
                setTagSuggestionId("");
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <ReactTags
            ref={reactTags}
            tags={tags}
            allowNew={true}
            onFocus={() => getSuggestionTag()}
            suggestions={tagSuggestion ? tagSuggestion : []}
            onDelete={tag => onDelete(tag)}
            onAddition={newTag => onAddition(newTag)}
            delimiters={["Enter", "Tab", ","]}
            placeholderText={tags && tags.length > 0 ? "" : "Add new tag"}
        />
    );
}

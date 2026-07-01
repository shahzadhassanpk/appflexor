import React from "react";

function RenderContent({ content }) {
    const parsedLayout = tryToParse(content.published);
    const htmlCode = parsedLayout.html;
    const cssCode = parsedLayout.css;

    // utility
    function tryToParse(item) {
        let _item = item;
        if (typeof item === "string" && item !== "") {
            _item = JSON.parse(_item);
        } else {
            _item = {
                html: "",
                css: "",
            };
        }
        return _item;
    }

    return (
        <div>
            <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
            <style>{cssCode}</style>
        </div>
    );
}

export default RenderContent;

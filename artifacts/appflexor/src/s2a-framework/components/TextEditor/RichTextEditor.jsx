import { Editor } from "@tinymce/tinymce-react";
import React, { useContext, useEffect, useRef, useState } from "react";
// import { TINY_MCE_API_KEY } from "../../Config";
import { html, htmlLanguage } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import { Interweave } from "interweave";
import { parse } from "uuid";
import { AppContext } from "../../../AppContext";
import { API_URL, ASSETS_DB_TABLE, IMAGE_BASE } from "../../Config";
import { isEmpty } from "../../modules/data-management/form-builder/Forms/FormViewer/utils";
import "./TextEditor.css";
import TextToSpeech from "../TextToSpeech";

const MODE = {
    richtext: "RICHTEXT",
    codeeditor: "CODE_EDITOR",
    interweave: "INTERWEAVE",
};

function TextEditor({
    id,
    name,
    value,
    onChange,
    onFocus,
    disabled = false,
    height = 300,
    styles,
    mode: themeMode,
    viewMode = "BASIC",
    componentData: componentData,
}) {
    // console.log(themeMode);

    const appContext = useContext(AppContext);
    const { channel } = appContext;

    const [content, setContent] = useState("");
    const [list, setList] = useState([]);
    const [editorIsLoaded, setEditorIsLoaded] = useState(false);
    const [mode, setMode] = useState(MODE.richtext);
    const [textMode, setTextMode] = useState(viewMode);
    useEffect(() => {
        if (componentData?.mode) {
            setTextMode(componentData?.mode);
        }
    }, [componentData?.mode]);

    useEffect(() => {
        
        document.addEventListener("focusin", e => {
            let _obj = e.target.closest(
                ".tox-tinymce, .tox-fullscreen, .tox-control-wrap, .tox-tinymce-aux, .tox-dialog-wrap, .moxman-window, .tam-assetmanager-root",
            )
            if (
                _obj!== null
            ) {
                e.stopImmediatePropagation();
            }
        });
    }, [editorIsLoaded]);

    useEffect(() => {
        if (typeof value === "string") {
            setContent(value);
        }
    }, [value]);

    const onEditorChange = (newValue, editor) => {
        setContent(newValue);

        let event = {
            target: {
                value: newValue,
            },
        };
        if (id) {
            event.target.id = id;
        }

        if (name) {
            event.target.name = name;
        }

        onChange(event);
    };


    function keepFocus() {
        document.addEventListener("focusin", e => {
            let _obj = e.target.closest(
                ".tox-tinymce, .tox-fullscreen, .tox-control-wrap, .tox-tinymce-aux, .tox-dialog-wrap, .moxman-window, .tam-assetmanager-root",
            )
            if (
                _obj!== null
            ) {
                e.stopImmediatePropagation();
            }
        });
    }
    // console.log(styles);
    // console.log(isLoaded);

    function getData(channelId) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: channelId,
                    dataKey: "assets",
                    serviceKey: "list.img.assets",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let assets = response.data.C_DATA.assets;
                    if (typeof assets !== "undefined" && assets.length > 0) {
                        for (let index = 0; index < assets.length; index++) {
                            const element = assets[index];

                            const imageUrl = `${IMAGE_BASE}/${ASSETS_DB_TABLE}/${element.id}/${element.image}`;

                            assets[index] = {
                                ...element,
                                title: element.title,
                                value: imageUrl,
                            };
                        }

                        setList(assets);
                    }
                } else {
                    console.log(response.data?.C_MESSAGE);
                    setList([]);
                    console.error(
                        "Unable to get data from 'list.image.assets'",
                    );
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {});
    }

    return (
        <>
            {/* <code>themeFlag :{componentData.mode}</code> */}
            {editorIsLoaded ? "" : <LoadingSpinner />}
            {mode === MODE.richtext && (
                <div
                    className={`${
                        editorIsLoaded ? "d-block" : "visually-hidden"
                    }`}>
                    {/* <TextToSpeech text={content} /> */}
                    <Delayed>
                        {textMode == "BASIC" && (
                            <Editor
                                tinymceScriptSrc={
                                    "/resources/tinymce_6.4.2/tinymce.min.js"
                                }
                                // initialValue={value}
                                disabled={disabled}
                                value={content}
                                onFocus={event => {
                                    if (typeof onFocus === "function") {
                                        onEditorChange(content);
                                    }
                                }}
                                onEditorChange={onEditorChange}
                                onInit={() => {
                                    setEditorIsLoaded(true);
                                    keepFocus();
                                }}
                                init={{
                                    height: height,
                                    menubar: "",
                                    setup: editor => {
                                        editor.ui.registry.addButton("source", {
                                            // text: "View Source",
                                            icon: "code-sample",
                                            onAction: function (_) {
                                                setMode(MODE.codeeditor);
                                            },
                                        });
                                    },
                                    plugins: [
                                        "fullscreen",
                                        "lists",
                                        "link",
                                        "image",
                                        "charmap",
                                        "anchor",
                                        "searchreplace",
                                        "visualblocks",
                                        "media",
                                        "table",
                                        "fullscreen",
                                        "pagebreak",
                                        "preview",
                                        "help",
                                        "wordcount",
                                    ],
                                    toolbar:
                                        "fullscreen print " +
                                        "undo redo | blocks | " +
                                        "bold italic forecolor | alignleft aligncenter " +
                                        "alignright alignjustify | bullist numlist outdent indent | " +
                                        "image | " +
                                        "removeformat pagebreak source| preview",
                                    // image_list: [...list],
                                    content_css:
                                        "/resources/bootstrap-5.2.3/css/bootstrap.min.css",
                                    content_style: `body { 
                                        margin:5px;
                                        padding:5px; 
                                        font-family:Helvetica,Arial,sans-serif; font-size:14px 
                                    }`,
                                    // content_style: "`${styles}`",
                                    // content_style: `.editable .text { color: blue;  background-color: blue;} .editable p {  color: blue;  background-color: blue;}`,
                                }}
                            />
                        )}
                        {textMode == "ADVANCE" && (
                            <Editor
                                tinymceScriptSrc={
                                    "/resources/tinymce_6.4.2/tinymce.min.js"
                                }
                                // initialValue={value}
                                disabled={disabled}
                                value={content}
                                onFocus={event => {
                                    if (typeof onFocus === "function") {
                                        onEditorChange(content);
                                    }
                                }}
                                onEditorChange={onEditorChange}
                                onInit={() => {
                                    setEditorIsLoaded(true);
                                }}
                                init={{
                                    height: height,
                                    menubar: "edit view insert format",
                                    setup: editor => {
                                        editor.ui.registry.addButton("source", {
                                            // text: "View Source",
                                            icon: "code-sample",
                                            onAction: function (_) {
                                                setMode(MODE.codeeditor);
                                            },
                                        });
                                        // editor.ui.registry.remove("newdocument"); // Remove New Document option
                                        // editor.ui.registry.remove("print"); // Remove Print option
                                    },
                                    plugins: [
                                        "fullscreen",
                                        "print",
                                        // "advlist",
                                        // "autolink",
                                        "lists",
                                        "link",
                                        "image",
                                        "charmap",
                                        "anchor",
                                        "searchreplace",
                                        "visualblocks",
                                        // "code",
                                        // "insertdatetime",
                                        "media",
                                        "table",
                                        "fullscreen",
                                        "pagebreak",
                                        // "preview",
                                        // "help",
                                        // "wordcount",
                                    ],
                                    // selector: ".editable",
                                    // inline: true,

                                    toolbar:
                                        "fullscreen print " +
                                        "undo redo | blocks | " +
                                        "bold italic forecolor | alignleft aligncenter " +
                                        "alignright alignjustify | bullist numlist outdent indent | " +
                                        "image | " +
                                        "removeformat pagebreak source| ",
                                    // image_list: [...list],
                                    content_css:
                                        "/resources/bootstrap-5.2.3/css/bootstrap.min.css",
                                    content_style: `body { 
                                        margin:5px;
                                        padding:5px; 
                                        font-family:Helvetica,Arial,sans-serif; font-size:14px 
                                    }`,
                                    // content_style: "`${styles}`",
                                    // content_style: `.editable .text { color: blue;  background-color: blue;} .editable p {  color: blue;  background-color: blue;}`,
                                }}
                            />
                        )}
                    </Delayed>
                </div>
            )}

            {mode === MODE.codeeditor && (
                <div className="s2a-border">
                    <div
                        className="d-flex justify-content-end align-items-center"
                        style={{
                            height: 40,
                        }}>
                        <div
                            className="mx-2  pointer"
                            onClick={() => setMode(MODE.richtext)}>
                            <i className="fa-regular fs-5 fa-eye"></i>
                        </div>
                        {/* <div
                            className="mx-2 pointer"
                            onClick={() => setMode(MODE.richtext)}>
                            <i className="fa-regular fs-5 fa-pen-to-square"></i>
                        </div> */}
                    </div>

                    <CodeMirror
                        value={content}
                        height="100%"
                        theme="dark"
                        extensions={[html()]}
                        onChange={(value, viewUpdate) => {
                            onEditorChange(value);
                        }}
                    />
                </div>
            )}
            {/* {mode === MODE.interweave && (
                <div className="s2a-border">
                    <div
                        className="d-flex justify-content-end align-items-center"
                        style={{
                            height: 40,
                        }}>
                        <div
                            className="mx-2  pointer"
                            onClick={() => setMode(MODE.interweave)}>
                            <i className="fa-regular fs-5 fa-eye"></i>
                        </div>
                        <div
                            className="mx-2 pointer"
                            onClick={() => setMode(MODE.richtext)}>
                            <i className="fa-regular fs-5 fa-pen-to-square"></i>
                        </div>
                    </div>
                    {content ? (
                        <div className="p-2">
                            <Interweave content={content}></Interweave>
                        </div>
                    ) : (
                        <div
                            className="d-flex justify-content-center align-items-center "
                            style={{
                                height: 50,
                            }}>
                            No Content provided.
                        </div>
                    )}
                </div>
            )} */}
        </>
    );
}

function Delayed({ children, waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : <LoadingSpinner />;
}

// function TextEditor1({ id, content, onChange }) {
//     // const [isLoaded, setIsLoaded] = useState(false);

//     const tinymce = window.tinymce;

//     useEffect(() => {
//         // console.log("the content ", props.data);
//         if (id) {

//             initEditor();
//         }
//     }, [id]);

//     useEffect(() => {
//         // initEditor();
//         tinymce.init();
//         try {
//             if (content && tinymce) {

//                 console.log("Setting content " + id);

//                 console.log(content);

//                 tinymce.setContent(content);
//             }
//         } catch (error) {
//             console.error(error);
//         }
//     }, [content]);

//     const changeHandler = value => {

//         let event = {
//             target: {
//                 value,
//                 id,
//             },
//         };
//         onChange(event);
//     };

//     function initEditor() {
//         try {
//             tinymce.init({
//                 selector: "[name$=" + id + "]",
//                 setup: function (ed) {
//                     ed.on("change", function (e) {
//                         changeHandler(ed.getContent());
//                     });
//                     ed.on("init", function () {
//                         // setIsLoaded(true);
//                         // content && this.setContent(content);
//                     });
//                 },
//             });
//         } catch (e) {
//             console.log("******************* " + e);
//         }
//     }

//     return (
//         <div>
//             <code>{JSON.stringify(content, null, 2)}</code>

//             <textarea name={id}></textarea>
//         </div>
//     );
// }

export default TextEditor;

function LoadingSpinner(params) {
    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "300px" }}>
            <div
                className="spinner-border"
                role="status">
                <span className="visually-hidden"> Loading...</span>
            </div>
        </div>
    );
}

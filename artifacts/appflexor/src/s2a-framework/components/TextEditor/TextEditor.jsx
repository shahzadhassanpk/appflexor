import React, { useEffect, useState } from "react";
import "./TextEditor.css";
import $ from "jquery";

function TextEditor(props) {
    const tinymce = window.tinymce;
    function changeHandler(content) {
        //console.log('the content ', content);
        props.onEditorChange(content);
    }

    useEffect(() => {
        try {
            if (tinymce && tinymce.activeEditor) {
                if (props.data) {
                    tinymce.activeEditor.setContent(props.data);
                } else if (props.data === "") {
                    tinymce.activeEditor.setContent(props.data);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }, [props]);

    useEffect(() => {
        if (props.id === "") {
            tinymce.activeEditor.setContent("");
        }
    }, [props]);

    useEffect(() => {
        // console.log("the content ", props.data);
        if (props.name && props.name !== "") {
            init();
        }
    }, [props.name]);

    function init() {
        try {
            tinymce.init({
                selector: "[name$=" + props.name + "]",
                plugins: "lists advlist table preview",
                toolbar:
                    "undo redo | formatselect | " +
                    "fontsizeselect bold italic backcolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat preview imageupload",
                // menubar: false,
                height: props.height,
                setup: function (ed) {
                    var inp = $(
                        '<input id="tinymce-uploader" type="file" name="pic" accept="image/*" style="display:none">',
                    );
                    $(ed.getElement()).parent().append(inp);
                    inp.on("change", function () {
                        var input = inp.get(0);
                        var file = input.files[0];
                        var fr = new FileReader();
                        fr.onload = function () {
                            var img = new Image();
                            img.src = fr.result;
                            ed.insertContent('<img src="' + img.src + '"/>');
                            inp.val("");
                        };
                        fr.readAsDataURL(file);
                    });
                    ed.addButton("imageupload", {
                        text: "IMAGE",
                        icon: false,
                        onclick: function (e) {
                            inp.trigger("click");
                        },
                    });
                    ed.on("change", function (e) {
                        // console.log('the event object ', e);
                        // console.log('the editor object ', ed);
                        // console.log('the content ', ed.getContent());
                        changeHandler(ed.getContent());
                    });
                    ed.on("init", function () {
                        // this.getDoc().body.style.fontSize = '12';
                        console.log("the init ", props.data);
                        this.getDoc().body.style.fontFamily =
                            'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';
                        // this.getDoc().body.style.fontFamily = '80%/150% Lato, Arial, Helvetica, sans-serif';

                        this.setContent(props.data);
                    });
                },
            });
        } catch (e) {
            console.log("******************* " + e);
        }
    }

    return (
        <div>
            <textarea
                name={props.name}
                value={props.data}
                onChange={changeHandler}></textarea>
        </div>
    );
}

export { TextEditor };

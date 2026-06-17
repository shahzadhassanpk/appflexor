import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";

export default function Welcome() {
    let initialState = {
        id: "new",
        published: "Loading ...",
        css_styles:""
    };
    const [post, setPost] = useState(initialState);

    useEffect(() => {
        getData();
    }, []);

    function getData() {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "welcomePost",
                    serviceKey: "sys.welcome.post",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        if (response.data.C_DATA.welcomePost.length > 0) {
                            setPost(response.data.C_DATA.welcomePost[0]);
                        }
                    }
                }else{
                    setPost({...initialState, published: "Unauthorized"});
                }
            })
            .catch(error => {
                console.error(error);
            });
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

    return (
        <div>
            <style>{unescapeSlashes(post.css_styles)}</style>
            <div className="post-viewer position-relative">                
                <div className="p-1">
                    {/* {post.published} */}
                    {post && <Interweave content={post.published} />}
                </div>
            </div>
        </div>
    );
}

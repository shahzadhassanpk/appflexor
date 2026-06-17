import { useEffect, useState } from "react";
import { IMAGE_BASE } from "../../../../../../Config";
import FileBadge from "./FileBadge";
import { status } from "./ImageUploader";

export default function RenderLayoutImage({
    data,
    formDetails,
    filesCollection,
    encodedFilesCollection,
    componentData,
    removeFile,
}) {
    let DEFAULT_STATE = {
        maxWidth: "-webkit-fill-available",
    };
    const [show, setShow] = useState(false);

    const [style, setStyle] = useState({});
    const [imageSrc, setImagSrc] = useState("");
    const file = filesCollection[0] ? filesCollection[0] : {};
    useEffect(() => {
        if (encodedFilesCollection && encodedFilesCollection.length > 0) {
            setImagSrc(encodedFilesCollection[0].contentBase64);
        } else {
            if (data && data.id && data.id !== "new") {
                let key = componentData.db_column;

                let url = `${IMAGE_BASE}/${formDetails.table}/${data.id}/${data[key]}`;
                setImagSrc(url);
            } else {
                setImagSrc("");
            }
        }
    }, [
        encodedFilesCollection,
        filesCollection,
        data,
        componentData,
        formDetails,
    ]);

    if (imageSrc) {
        return (
            <div>
                <div
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                    className="position-relative">
                    <div className="position-absolute top-0 top-0 start-0">
                        {show &&
                            filesCollection.map(file => (
                                <FileBadge
                                    key={file.name}
                                    file={file}
                                    removeFile={removeFile}
                                    componentData={componentData}
                                />
                            ))}
                    </div>
                    <img
                        style={{
                            // maxWidth: "-webkit-fill-available",
                            // maxHeight: "-webkit-fill-available",
                            maxWidth: "100%",
                        }}
                        className={`${componentData.classes}`}
                        src={`${imageSrc}`}
                        alt=""
                    />
                    {/* {componentData.show_title === "YES" && (
                        <span>{file.name}</span>
                    )} */}
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <span>
                    <center>
                        <i className="fa-regular fa-image image-font mx-1"></i>{" "}
                        Add Image
                    </center>
                </span>
            </div>
        );
    }
}

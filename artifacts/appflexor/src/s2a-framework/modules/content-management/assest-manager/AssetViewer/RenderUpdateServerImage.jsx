import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { IMAGE_BASE } from "../../../../Config";
import Scroll from "../../../../components/Scroll/Scroll";
import {
    disposeTooltip,
    enableTooltip,
    makeShortId,
} from "../../../../utils/utils";
import ImageDropZone from "./ImageDropZone";

export default function RenderUpdateServerImage({
    file,
    filesCollection = [],
    tableName,
    uploadFilesToServer,
    handleImageUpload,
    hideUploader,
}) {
    const [details, setDetails] = useState({});
    const [copied, setCopied] = useState(false);

    const isLoaded = useRef(false);

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        setDetails(file);
    }, [file]);

    let originUrl = window.location.origin;
    const imageUrl = `${originUrl}${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;

    // const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}?${
    //     file.imageHash ? file.imageHash : Date.now()
    // }`;

    const handleCopiedStatus = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isLoaded.current) {
        const img = new Image();

        img.onload = function () {
            let dimensions = this.width + " by " + this.height + " pixels";
            setDetails(prev => ({ ...prev, dimensions: dimensions }));

            // prevents rerender caused by useState and img.onload event
            isLoaded.current = true;
        };

        img.src = imageUrl;
    }

    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setDetails(prev => {
            return {
                ...prev,
                [name]: value,
            };
        });
    }

    function handleImageDetailsUpdate() {
        let updatedFileCollection = filesCollection.map(file => {
            if (file.id === details.id) {
                return { ...file, title: details.title };
            }

            return file;
        });

        uploadFilesToServer(updatedFileCollection);
        setDetails({});
    }

    function handleImageDetailsCancel() {
        setDetails({});
        hideUploader();
    }

    function trimUrl(str = "") {
        let arr = str.split("?");
        return arr[0];
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-sm-8">
                    <img
                        className={`mb-1`}
                        src={imageUrl}
                        alt={file.name}
                        style={{ maxWidth: "100%" }}
                    />
                    {/* <Scroll
                        height="60vh"
                        width="100%">
                        <img
                            className={`mb-1`}
                            src={imageUrl}
                            alt={file.name}
                        />
                    </Scroll> */}
                </div>
                <div className="col-sm-4">
                    <dl className="container-fluid">
                        <dt className="col">
                            <h5>Edit Image</h5>
                        </dt>
                        <dt className="col">Title</dt>
                        <dd className="col">
                            <input
                                type="text"
                                name="title"
                                className="form-control mb-2"
                                value={details.title}
                                onChange={handleChange}
                            />
                        </dd>
                        <dt className="col">Image</dt>
                        <dd className="col">{details.image}</dd>

                        <dt className="col">Dimensions</dt>
                        <dd className="col">{details.dimensions}</dd>

                        <dt className="col">
                            URL
                            {copied && (
                                <span className="float-end">
                                    <i className="fa-solid fa-copy"></i>
                                    Copied
                                </span>
                            )}
                        </dt>

                        <CopyToClipboard
                            text={trimUrl(imageUrl)}
                            onCopy={() => handleCopiedStatus()}>
                            <dd
                                className="col pointer text-break"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-title="Copy image URL">
                                {trimUrl(imageUrl)}
                            </dd>
                        </CopyToClipboard>
                    </dl>
                    <ImageDropZone
                        fieldId={"image"}
                        onChange={handleImageUpload}
                        muliple={false}
                    />
                    <div className="w-100 d-flex">
                        <button
                            type="button"
                            className=" button-theme  btn btn-sm  my-2 me-2"
                            onClick={() => handleImageDetailsCancel()}>
                            <i className="fa-solid fa-xmark pe-1"></i>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className=" button-theme  btn btn-sm  my-2"
                            onClick={() => handleImageDetailsUpdate()}>
                            <i className="fa-solid fa-cloud-arrow-up pe-1"></i>
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

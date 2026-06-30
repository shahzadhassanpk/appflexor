import { useEffect, useRef, useState } from "react";
import { IMAGE_BASE } from "../../../../Config";
import Scroll from "../../../../components/Scroll/Scroll";
import { makeShortId } from "../../../../utils/utils";
import ImageDropZone from "./ImageDropZone";
import { status } from "./ImageFileUploader";

export default function RenderUpdateEncodedImage({
    encodedFiles = [],
    file,
    filesCollection = [],
    tableName,
    uploadFilesToServer,
    handleImageUpload,
    hideUploader,
}) {
    const filteredFileArr = encodedFiles.filter(f => f.fileName === file.name);

    const [details, setDetails] = useState({});
    const isLoaded = useRef(false);

    // const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}?${
    //     file.imageHash ? file.imageHash : Date.now()
    // }`;

    useEffect(() => {
        setDetails(file);
        const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${
            file.name
        }`;

        const img = new Image();
        img.onload = function () {
            let dimensions = this.width + " by " + this.height + " pixels";
            setDetails(prev => ({
                ...prev,
                src: imageUrl,
                dimensions: dimensions,
            }));

            // prevents rerender caused by useState and img.onload event
            isLoaded.current = true;
        };

        img.src = imageUrl;
    }, [file]);

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

    if (filteredFileArr.length > 0) {
        const encodedFile = filteredFileArr[0];

        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-sm-8">
                        <Scroll height="60vh">
                            <img
                                className="img-thumbnail  img-theme-border mb-1"
                                src={encodedFile.contentBase64}
                                alt={file.name}
                            />
                        </Scroll>
                    </div>
                    <div className="col-sm-4">
                        <dl className="row">
                            <dt className="col-sm-4">Title</dt>
                            <dd className="col-sm-8">
                                <input
                                    type="text"
                                    name="title"
                                    className="form-control mb-2"
                                    value={details.title}
                                    onChange={handleChange}
                                />
                            </dd>
                            <dt className="col-sm-4">Image</dt>
                            <dd className="col-sm-8">{details.name}</dd>

                            <dt className="col-sm-4">Dimensions</dt>
                            <dd className="col-sm-8">{details.dimensions}</dd>

                            <dt className="col-sm-4 ">File URL</dt>
                            <dd className="col-sm-8">{trimUrl(details.src)}</dd>
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
    } else {
        return null;
    }
}

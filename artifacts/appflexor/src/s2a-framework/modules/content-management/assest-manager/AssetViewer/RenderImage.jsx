import { useRef, useState } from "react";
import { IMAGE_BASE } from "../../../../Config";
import Scroll from "../../../../components/Scroll/Scroll";

export default function RenderImage({ file, tableName }) {
    const [details, setDetails] = useState({ ...file });
    const isLoaded = useRef(false);

    const imageUrl = `${IMAGE_BASE}/${tableName}/${file.id}/${file.image}`;

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

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-sm-8">
                    <Scroll height="80vh">
                        <img
                            className="img-thumbnail img-theme-border mb-1"
                            src={imageUrl}
                            alt={file.name}
                        />
                    </Scroll>
                </div>
                <div className="col-sm-4">
                    <dl className="row">
                        <dt className="col-sm-3">Image</dt>
                        <dd className="col-sm-9">{details.image}</dd>

                        <dt className="col-sm-3">Title</dt>
                        <dd className="col-sm-9">{details.title}</dd>

                        <dt className="col-sm-3">Dimensions</dt>
                        <dd className="col-sm-9">{details.dimensions}</dd>

                        <dt className="col-sm-3 ">File URL</dt>
                        <dd className="col-sm-9">{imageUrl}</dd>

                        {/* <dt className="col-sm-3 ">Tags</dt>
                        <dd className="col-sm-9"> </dd>

                        <dt className="col-sm-3 ">Caption</dt> */}
                    </dl>
                </div>
            </div>
        </div>
    );
}

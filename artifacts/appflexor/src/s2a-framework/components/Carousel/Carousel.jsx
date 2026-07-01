import React, { useState, useEffect } from "react";
// import "./Carousel.css";
function Carousel(props) {
    const [indexs, setIndex] = useState(0);
    const [_images, setImages] = useState([]);
    useEffect(() => {
        if (props.images && props.images.length > -1) {
            setImages(props.images);
        }
    }, [props]);
    function nextImage() {
        if (indexs < props.images.length - 1) {
            setIndex(indexs + 1);
        }
    }

    function selectImage(index) {
        setIndex(index);
    }

    function prevImage() {
        if (indexs >= 1) {
            setIndex(indexs - 1);
        }
    }
    return (
        <React.Fragment>
            <div
                className="carousel slide"
                id={props.data.id}
                data-bs-interval="false"
            >
                <ul className="carousel-indicators">
                    {_images.map((value, index) => {
                        return (
                            <li
                                className={`indicators ${
                                    indexs == index ? "active" : ""
                                }`}
                                key={index}
                                onClick={() => selectImage(index)}
                            ></li>
                        );
                    })}
                </ul>
                <div className="carousel-inner">
                    <div className="item active">
                        {_images[indexs] ? (
                            <img
                                onClick={() => {
                                    if (props.callback) {
                                        props.callback(props.data);
                                    }
                                }}
                                className="carousel-image img-fluid"
                                src={props.base_path + _images[indexs]}
                                alt=""
                                // onerror="this.onerror=null;this.src='/images/default-empty-image.png';"
                            />
                        ) : (
                            <img src="/images/default-empty-image.png" />
                        )}
                    </div>
                </div>
                <a
                    className="carousel-control-prev"
                    onClick={() => {
                        prevImage();
                    }}
                >
                    <span
                        className="fa fa-chevron-left"
                        style={{ cursor: "pointer" }}
                    ></span>
                    <span className="sr-only">Previous</span>
                </a>
                <a
                    className="carousel-control-next"
                    onClick={() => {
                        nextImage();
                    }}
                >
                    <span
                        className="fa fa-chevron-right"
                        style={{ cursor: "pointer" }}
                    ></span>
                    <span className="sr-only">Next</span>
                </a>
            </div>
        </React.Fragment>
    );
}

export { Carousel };

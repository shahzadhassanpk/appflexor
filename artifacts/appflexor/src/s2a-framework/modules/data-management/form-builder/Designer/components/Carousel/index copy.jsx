import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Carousel(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            setObj({
                [key]: value,
            });
            // if (key && value && props.handleInputFields) {
            //     props.handleInputFields(key, value);
            // }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;
        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        // console.log("****************" + componentData.db_column);
        // console.log("****************" + key);
        // console.log("****************" + JSON.stringify(obj));
        // console.log("****************" + props.formData[key]);
    }, [props.formData]);

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;

        if (componentData.regex && componentData.regex.length > 0) {
            const regexExp = new RegExp(componentData.regex);
            let strToValidate = value;
            let strIsValid = regexExp.test(strToValidate);

            if (!strIsValid) {
                setMessage(`Field must match regex pattern.`);
            } else {
                setMessage("");
            }
        }

        setObj(prev => ({
            ...prev,
            [key]: value,
        }));

        props.handleInputFields(componentData.db_column, value);
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const Error = () => {
        return <div>Error occurred in Datetime field.</div>;
    };

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">Carousel</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            <div className="field-padding">
                <code>
                    <pre>{JSON.stringify(props.component.data, null, 2)}</pre>
                </code>
                {/* <RenderImage
                    componentData={componentData}
                    images={props.images}
                /> */}
                <RenderCarousel />
            </div>
        </ErrorBoundary>
    );
}

function RenderCarousel(params) {
    return (
        <div
            id="carouselExampleIndicators"
            className="carousel slide"
            data-bs-ride="true">
            <div className="carousel-indicators">
                <button
                    type="button"
                    data-bs-target="#carouselExampleIndicators"
                    data-bs-slide-to="0"
                    className="active"
                    aria-current="true"
                    aria-label="Slide 1"></button>
                <button
                    type="button"
                    data-bs-target="#carouselExampleIndicators"
                    data-bs-slide-to="1"
                    aria-label="Slide 2"></button>
                <button
                    type="button"
                    data-bs-target="#carouselExampleIndicators"
                    data-bs-slide-to="2"
                    aria-label="Slide 3"></button>
            </div>
            <div className="carousel-inner">
                <div className="carousel-item active">
                    <img
                        src="./theme/images/sample.jpg"
                        className="d-block w-100"
                        alt="..."
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="./theme/images/sample.jpg"
                        className="d-block w-100"
                        alt="..."
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="./theme/images/sample.jpg"
                        className="d-block w-100"
                        alt="..."
                    />
                </div>
            </div>
            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide="prev">
                <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide="next">
                <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    );
}

function RenderImage(data) {
    // console.log(data.componentData);

    let DEFAULT_STATE = {
        maxWidth: "-webkit-fill-available",
    };

    const [style, setStyle] = useState({});
    const [imageSrc, setImagSrc] = useState("");

    useEffect(() => {
        if (data.images) {
            let imgId = data.componentData.image_id;
            let imgSrc = data.images[imgId];

            setImagSrc(imgSrc);
        }

        let temp = {};
        if (data.componentData.height) {
            temp.height = Number(data.componentData.height);
        }

        if (data.componentData.width) {
            temp.width = Number(data.componentData.width);
        }

        setStyle(temp);
    }, [data]);

    if (data.componentData.image_id) {
        return (
            <div>
                {/* <div>
                    <code>
                        <pre>{JSON.stringify(data.componentData, null, 2)}</pre>
                    </code>
                    <code>
                        <pre>{JSON.stringify(imageSrc, null, 2)}</pre>
                    </code>
                </div> */}
                <div className="">
                    <img
                        style={{
                            // maxWidth: "-webkit-fill-available",
                            // maxHeight: "-webkit-fill-available",
                            maxWidth: "100%",
                        }}
                        src={`${imageSrc}`}
                        alt=""
                    />
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <span>
                    <center>
                        <i className="text-dark fa-regular fa-image mx-1"></i>{" "}
                        Add Image
                    </center>
                </span>
            </div>
        );
    }
}

export default Carousel;

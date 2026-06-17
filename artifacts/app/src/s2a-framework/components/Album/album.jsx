import React, { useState, useEffect } from 'react';
import './Album.css';

function Album(props) {
    const [album, setAlbums] = useState(null);
    const [index, setIndex] = useState(null);
    const [currentAlbum, setCurrentAlbum] = useState(null);
    useEffect(() => {
        setAlbums(props.album);
        setCurrentAlbum(props.album[0]);
        setIndex(0);
    }, [props.album]);
    function nextImage() {
        if (index < currentAlbum.images.length - 1) {
            setIndex(index + 1);
        }
    }

    function prevImage() {
        if (index >= 1) {
            setIndex(index - 1);
        }
    }

    function setAlbum(album) {
        setIndex(0);
        setCurrentAlbum(album);
    }
    if (!album || album == '') {
        return <p></p>;
    }
    return (
        <React.Fragment>
            <div className='' id="album">
                <div className='row pb-2 text-start'>

                    {props.hotel && (
                        <div className="col-sm-12">
                            <span><h3 className="modal-title title-heading">Hotel: {props.hotel.name} </h3> {props.hotel.address}, {props.hotel.city}</span>
                        </div>
                    )}
                    {props.tour && (
                        <div className="col-sm-12">
                            <span><h3 className="modal-title title-heading">Tour: {props.tour.name} / {props.tour.duration}</h3>
                            </span>
                        </div>
                    )}
                    {props.umrah && (
                        <div className="col-sm-12">
                            <span><h3 className="modal-title title-heading">Umrah: {props.umrah.name} </h3> {props.umrah.address}, {props.umrah.city}</span>
                        </div>
                    )}
                    {props.hajjUmrah && (
                        <div className="col-sm-12">
                            <span><h3 className="modal-title title-heading">Umrah: {props.hajjUmrah.name} </h3> {props.hajjUmrah.address}, {props.hajjUmrah.city}</span>
                        </div>
                    )}

                </div>
                <div className="divider"></div>
                <div className="row mt-3">
            <div className="col-sm-4 small-images-container order-last order-sm-first">
                <div className="row">
                    {album.map((album, index) => {
                        return (
                            album.images.length !== 0 &&
                                    <div onClick={() => { setAlbum(album); }} className="col-6 mt-1 modal-small-images" key={index}>
                                <img src={props.base_path + album.images[0]} />
                                <div className="album-overlay">
                                    <p>{album.title} ({album.images.length})</p>
                                    <p></p>
                                </div>
                            </div>
                                );
                    })}
                </div>
            </div>
            <div className="col-sm-8 big-img" id="big-image">
                <img id="imageActive" src={props.base_path + currentAlbum.images[index]} />
                <div className="gallery">
                    <i className="btn"><span className="fa fa-th-large pe-1"></span>Gallery</i>
                </div>
                <a className="carousel-control-prev" onClick={() => { prevImage() }}>
                    <span className="fa fa-chevron-left" style={{cursor:"pointer"}}></span>
                    <span className="sr-only">Previous</span>
                </a>
                <a className="carousel-control-next" onClick={() => { nextImage() }}>
                    <span className="fa fa-chevron-right" style={{cursor:"pointer"}}></span>
                    <span className="sr-only">Next</span>
                </a>
            </div>

            <div className="col-sm-8 text-center" id="gallery-images">
                <div className="row">
                    <div className="col-sm-4 modal-small-images">
                        <img src="" />
                        <div className="gallery-overlay">
                            <p className="fa fa-expand"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            </div>
        </React.Fragment>
    );
}

export { Album };
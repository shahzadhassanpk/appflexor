import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const QrShare = ({ url }) => {
    const [show, setShow] = useState(false);

    const handleOpen = () => setShow(true);
    const handleClose = () => setShow(false);

    return (
        <>
            {/* Share icon button */}
            <button
                type="button"
                className="top-navbar-icon navbar-action-button"
                title="Share page"
                aria-label="Share page with QR code"
                onClick={handleOpen}>
                <span className="bi bi-share"></span> {/* Bootstrap share icon */}
            </button>

            {/* Bootstrap modal */}
            {show && (
                <div
                    className="modal fade show"
                    style={{ display: "block" }}
                    tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Share via QR Code
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleClose}></button>
                            </div>
                            <div className="modal-body text-center">
                                <QRCodeSVG
                                    value={url}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={true}
                                />
                                <p className="mt-3">{url}</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Backdrop */}
                    <div
                        className="modal-backdrop fade show"
                        onClick={handleClose}></div>
                </div>
            )}
        </>
    );
};

export default QrShare;

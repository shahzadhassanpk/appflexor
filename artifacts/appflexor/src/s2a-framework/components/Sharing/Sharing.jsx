import React, { useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard';
// import "./Sharing.css";
function Sharing({ data, path }) {
    const [copy, setCopy] = useState(false);
    return (
        <div id="sharing" className="share-dialog mt-3">
            <div className="row">
                <div className="col-sm-6 text-center" onClick={() => window.open(`https://api.whatsapp.com/send?text=${path}`, "_blank")}>
                    <span className="fab fa-whatsapp pe-2"></span>
                    <span>Whatsapp</span>
                </div>

                <div className="col-sm-6 text-center" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${path}`, "_blank")}>
                    <span className="fab fa-facebook pe-2"></span>
                    <span>Facebook</span>
                </div>

                <div className="col-sm-6 text-center mt-2" onClick={() => window.open(`http://twitter.com/share?url=${path}`, "_blank")}>
                    <span className="fab fa-twitter pe-2"></span>
                    <span>Twitter</span>
                </div>

                <div className="col-sm-6 text-center mt-2" onClick={() => window.open(`https://mail.google.com/mail/u/0/?fs=1&tf=cm&su=${data.name}&body=${path}`, "_blank")}>
                    <span className="fab fa-google pe-2"></span>
                    <span>Gmail</span>
                </div>
                <div className="col-sm-12 p-0 mt-3">
                    <CopyToClipboard className="pen-url" text={path}
                        onCopy={() => setCopy(true)}>
                        <div>{path.href}</div>
                    </CopyToClipboard>
                    <div id="copy-link" className={`text-center ${copy ? 'text-success fw-bold' : ''}`}>{copy ? "Copied!" : "Copy Link"}</div>
                </div>
            </div>
        </div>
    )
}

export { Sharing }

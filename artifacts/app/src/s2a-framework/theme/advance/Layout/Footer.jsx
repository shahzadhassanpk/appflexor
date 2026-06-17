import { Interweave } from "interweave";
import React, { useContext } from "react";
import { AppContext } from "../../../../AppContext";

function Footer(params) {
    const appContext = useContext(AppContext);

    return (
        <div className="">
            {appContext.channel && appContext.channel.footer_html ? (
                <Interweave content={appContext.channel.footer_html} />
            ) : (
                <div className="col-md-4 mb-0 text-muted d-inline-flex">
                    <span className="">No Footer Content</span>
                </div>
            )}
            {/* <div className="footer-poweredby">
            <span>Powered By</span>
            <span><a href="https://step2agility.com" target="_blank">Step 2 Agility - IT Consulting and Services</a></span>
            </div> */}
        </div>

        // <div className="footer-content bg-white border-top">
        //     <span className="col-md-4 mb-0 text-muted d-inline-flex">
        //         &copy; 2023&nbsp;<span className="theme-sec-color">Step 2 Agility, Inc</span>
        //     </span>
        //     <a className="col-md-4 d-flex align-items-center justify-content-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none"></a>
        //     <ul className="nav col-md-4 justify-content-end">
        //         <li className="nav-item">
        //             <a href="#" className="nav-link footer-nav-link px-2 text-muted">
        //                 Home
        //             </a>
        //         </li>
        //         <li className="nav-item">
        //             <a href="#" className="nav-link footer-nav-link px-2 text-muted">
        //                 Features
        //             </a>
        //         </li>
        //         <li className="nav-item">
        //             <a href="#" className="nav-link footer-nav-link px-2 text-muted">
        //                 Pricing
        //             </a>
        //         </li>
        //         <li className="nav-item">
        //             <a href="#" className="nav-link footer-nav-link px-2 text-muted">
        //                 FAQs
        //             </a>
        //         </li>
        //         <li className="nav-item">
        //             <a href="#" className="nav-link footer-nav-link px-2 text-muted">
        //                 About
        //             </a>
        //         </li>
        //     </ul>
        // </div>
    );
}

export default Footer;

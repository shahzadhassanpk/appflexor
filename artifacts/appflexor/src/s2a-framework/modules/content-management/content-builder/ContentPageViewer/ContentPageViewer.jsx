import React, { Fragment, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../../AppContext";
import { CONTENT_STATUS } from "../../../../contants";
import RenderContentPage from "../RenderContentPage/RenderContentPage";

function ContentPageViewer() {
    let { id } = useParams();
    return (
        <Fragment>
            <RenderContentPage
                contentPageId={id}
                status={CONTENT_STATUS.published}
            />
        </Fragment>
    );
}

export default ContentPageViewer;

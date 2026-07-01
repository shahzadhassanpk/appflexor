import axios from "axios";
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { API_URL } from "../../../Config";
import { SiteMenuLinkWrapper } from "../Wrapper/SiteMenuLinkWrapper";

export default function DndWrapper(props) {
    return (
        <DndProvider backend={HTML5Backend}>
            <SiteMenuLinkWrapper {...props}/>
        </DndProvider>
    );
}

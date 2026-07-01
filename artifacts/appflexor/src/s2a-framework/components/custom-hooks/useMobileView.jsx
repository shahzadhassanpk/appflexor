import { useEffect, useState } from "react";

const useMobileView = () => {
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        // Check screen size on initial load
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 576); // You can adjust the width for mobile view
        };
        checkMobileView();
        window.addEventListener("resize", checkMobileView);
        return () => {
            window.removeEventListener("resize", checkMobileView);
        };
    }, []);

    return isMobileView;
};

export default useMobileView;

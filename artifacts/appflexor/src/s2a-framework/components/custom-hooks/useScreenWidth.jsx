import { useEffect, useState } from "react";

const useScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(
        typeof window !== "undefined" && window.innerWidth,
    );
    useEffect(() => {
        // Function to update the state with the current window width
        const updateScreenWidth = () => {
            setScreenWidth(window.innerWidth);
        };

        // Attach event listener for window resize
        window.addEventListener("resize", updateScreenWidth);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("resize", updateScreenWidth);
        };
    }, []);

    return screenWidth;
};

export default useScreenWidth;

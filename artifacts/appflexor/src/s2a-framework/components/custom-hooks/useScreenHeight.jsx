import { useEffect, useState } from "react";

const useScreenHeight = () => {
    const [screenHeight, setScreenHeight] = useState(
        typeof window !== "undefined" && window.innerHeight,
    );
    useEffect(() => {
        // Function to update the state with the current window width
        const updateScreenWidth = () => {
            setScreenHeight(window.innerHeight);
        };

        // Attach event listener for window resize
        window.addEventListener("resize", updateScreenWidth);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("resize", updateScreenWidth);
        };
    }, []);

    return screenHeight;
};

export default useScreenHeight;

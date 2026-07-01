import { useState, useEffect } from "react";

export const useDeviceInfo = () => {
  const getDeviceInfo = () => {
    const width = window.innerWidth;
    let device = "desktop";

    if (width < 768) {
      device = "mobile";
    } else if (width >= 768 && width < 1024) {
      device = "tablet";
    }

    return { width, device };
  };

  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceInfo;
};

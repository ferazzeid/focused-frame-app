import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTouch: boolean;
  userAgent: string;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTouch: false,
    userAgent: '',
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      
      // Check if device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // Check if device supports touch
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile,
        isTouch,
        userAgent,
      });
    };

    checkDevice();
    
    // Listen for orientation changes on mobile
    const handleOrientationChange = () => {
      setTimeout(checkDevice, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};
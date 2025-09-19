import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MicrophonePermissionState {
  status: 'unknown' | 'granted' | 'denied' | 'prompt';
  isSecureContext: boolean;
  browserSupport: boolean;
  error: string | null;
}

interface PermissionError {
  type: 'denied' | 'blocked' | 'no-https' | 'no-support' | 'device-error' | 'unknown';
  message: string;
  recovery?: string;
}

export const useMicrophonePermission = () => {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>({
    status: 'unknown',
    isSecureContext: window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost',
    browserSupport: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    error: null,
  });
  
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  // Check initial permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!permissionState.browserSupport) {
      setPermissionState(prev => ({
        ...prev,
        status: 'denied',
        error: 'Browser does not support microphone access',
      }));
      return;
    }

    if (!permissionState.isSecureContext) {
      setPermissionState(prev => ({
        ...prev,
        status: 'denied',
        error: 'Microphone access requires HTTPS or localhost',
      }));
      return;
    }

    try {
      // Check if Permissions API is supported
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(prev => ({
          ...prev,
          status: permission.state as 'granted' | 'denied' | 'prompt',
          error: null,
        }));

        // Listen for permission changes
        permission.onchange = () => {
          setPermissionState(prev => ({
            ...prev,
            status: permission.state as 'granted' | 'denied' | 'prompt',
          }));
        };
      }
    } catch (error) {
      console.log('Permission API not fully supported, will check on request');
    }
  }, [permissionState.browserSupport, permissionState.isSecureContext]);

  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getPermissionError = (error: any): PermissionError => {
    const browser = getBrowserInfo();
    
    if (!permissionState.isSecureContext) {
      return {
        type: 'no-https',
        message: 'Microphone access requires HTTPS connection',
        recovery: 'Please use HTTPS or localhost to access microphone features',
      };
    }

    if (!permissionState.browserSupport) {
      return {
        type: 'no-support',
        message: 'Your browser does not support microphone access',
        recovery: 'Please use a modern browser like Chrome, Firefox, Safari, or Edge',
      };
    }

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      const baseMessage = 'Microphone access was denied';
      let recovery = '';

      switch (browser) {
        case 'Chrome':
          recovery = 'Click the microphone icon in the address bar and select "Allow"';
          break;
        case 'Firefox':
          recovery = 'Click on the shield icon in the address bar and enable microphone access';
          break;
        case 'Safari':
          recovery = 'Go to Safari > Settings > Websites > Microphone and allow access for this site';
          break;
        case 'Edge':
          recovery = 'Click the microphone icon in the address bar and select "Allow"';
          break;
        default:
          recovery = 'Check your browser settings and allow microphone access for this site';
      }

      return {
        type: 'denied',
        message: baseMessage,
        recovery,
      };
    }

    if (error.name === 'NotFoundError' || error.name === 'DeviceNotFoundError') {
      return {
        type: 'device-error',
        message: 'No microphone device found',
        recovery: 'Please connect a microphone and try again',
      };
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return {
        type: 'device-error',
        message: 'Microphone is already in use by another application',
        recovery: 'Close other applications using the microphone and try again',
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'Failed to access microphone',
      recovery: 'Please check your microphone settings and try again',
    };
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isRequesting) return false;
    
    setIsRequesting(true);
    
    try {
      // First check if we already have permission
      if (permissionState.status === 'granted') {
        setIsRequesting(false);
        return true;
      }

      // Validate environment
      if (!permissionState.isSecureContext) {
        const error = getPermissionError({ name: 'NotAllowedError' });
        toast({
          title: 'Microphone Access Blocked',
          description: error.message,
          variant: 'destructive',
        });
        
        if (error.recovery) {
          setTimeout(() => {
            toast({
              title: 'How to Fix',
              description: error.recovery,
            });
          }, 2000);
        }
        
        setIsRequesting(false);
        return false;
      }

      if (!permissionState.browserSupport) {
        const error = getPermissionError({ name: 'NotSupportedError' });
        toast({
          title: 'Browser Not Supported',
          description: error.message,
          variant: 'destructive',
        });
        
        setIsRequesting(false);
        return false;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Immediately stop the stream since we only wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState(prev => ({
        ...prev,
        status: 'granted',
        error: null,
      }));
      
      setIsRequesting(false);
      return true;
      
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      const permissionError = getPermissionError(error);
      
      setPermissionState(prev => ({
        ...prev,
        status: 'denied',
        error: permissionError.message,
      }));
      
      toast({
        title: 'Microphone Access Failed',
        description: permissionError.message,
        variant: 'destructive',
      });
      
      // Show recovery instructions after a delay
      if (permissionError.recovery) {
        setTimeout(() => {
          toast({
            title: 'How to Fix',
            description: permissionError.recovery,
          });
        }, 2000);
      }
      
      setIsRequesting(false);
      return false;
    }
  }, [isRequesting, permissionState, toast]);

  const resetPermissionState = useCallback(() => {
    setPermissionState(prev => ({
      ...prev,
      status: 'unknown',
      error: null,
    }));
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return {
    permissionState,
    isRequesting,
    requestPermission,
    resetPermissionState,
    hasPermission: permissionState.status === 'granted',
    canRequestPermission: permissionState.isSecureContext && permissionState.browserSupport,
  };
};
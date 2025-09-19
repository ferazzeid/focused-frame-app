import { AlertTriangle, CheckCircle, XCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';

interface PermissionStatusProps {
  onRequestPermission?: () => void;
}

export const PermissionStatus = ({ onRequestPermission }: PermissionStatusProps) => {
  const { permissionState, requestPermission, canRequestPermission } = useMicrophonePermission();

  // Don't show anything if permission is granted or unknown
  if (permissionState.status === 'granted' || permissionState.status === 'unknown') {
    return null;
  }

  const getStatusIcon = () => {
    switch (permissionState.status) {
      case 'denied':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'prompt':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    if (!permissionState.isSecureContext) {
      return 'Microphone access requires HTTPS or localhost';
    }
    
    if (!permissionState.browserSupport) {
      return 'Your browser does not support microphone access';
    }
    
    switch (permissionState.status) {
      case 'denied':
        return 'Microphone access was denied. Voice features are disabled.';
      case 'prompt':
        return 'Microphone permission is required for voice features';
      default:
        return 'Microphone access is required for voice recording';
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      onRequestPermission?.();
    }
  };

  return (
    <Alert variant={permissionState.status === 'denied' ? 'destructive' : 'default'} className="mb-4">
      {getStatusIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">{getStatusMessage()}</span>
        {canRequestPermission && permissionState.status === 'prompt' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            className="ml-2"
          >
            Allow
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
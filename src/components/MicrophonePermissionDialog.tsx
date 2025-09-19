import { useState } from 'react';
import { AlertCircle, Mic, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';

interface MicrophonePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
}

export const MicrophonePermissionDialog = ({
  open,
  onOpenChange,
  onPermissionGranted,
}: MicrophonePermissionDialogProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { permissionState, requestPermission, resetPermissionState, canRequestPermission } = useMicrophonePermission();

  const handleRequestPermission = async () => {
    setIsRetrying(true);
    const granted = await requestPermission();
    
    if (granted) {
      onPermissionGranted?.();
      onOpenChange(false);
    }
    
    setIsRetrying(false);
  };

  const handleRetry = () => {
    resetPermissionState();
    setIsRetrying(false);
  };

  const getBrowserSpecificInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Chrome Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground-muted">
            <li>Look for the microphone icon in the address bar</li>
            <li>Click it and select "Always allow"</li>
            <li>Refresh the page if needed</li>
          </ol>
        </div>
      );
    }
    
    if (userAgent.includes('Firefox')) {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Firefox Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground-muted">
            <li>Look for the shield icon in the address bar</li>
            <li>Click it and enable microphone access</li>
            <li>Refresh the page if needed</li>
          </ol>
        </div>
      );
    }
    
    if (userAgent.includes('Safari')) {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Safari Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground-muted">
            <li>Go to Safari {'>'} Settings {'>'} Websites</li>
            <li>Select "Microphone" from the left sidebar</li>
            <li>Set this website to "Allow"</li>
          </ol>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium">Browser Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-foreground-muted">
          <li>Check for a microphone icon in your address bar</li>
          <li>Allow microphone access for this site</li>
          <li>Refresh the page if needed</li>
        </ol>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Microphone Access Required
          </DialogTitle>
          <DialogDescription>
            Voice recording features require microphone access to work properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!permissionState.isSecureContext && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Microphone access requires HTTPS or localhost. Please use a secure connection.
              </AlertDescription>
            </Alert>
          )}

          {!permissionState.browserSupport && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your browser doesn't support microphone access. Please use a modern browser.
              </AlertDescription>
            </Alert>
          )}

          {permissionState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{permissionState.error}</AlertDescription>
            </Alert>
          )}

          {permissionState.status === 'denied' && (
            <div className="space-y-3">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Microphone access was blocked. Please follow the instructions below:
                </AlertDescription>
              </Alert>
              
              {getBrowserSpecificInstructions()}
            </div>
          )}

          {canRequestPermission && permissionState.status !== 'denied' && (
            <div className="text-sm text-foreground-muted">
              Click "Allow Microphone" to grant permission for voice recording features.
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {permissionState.status === 'denied' ? (
            <Button onClick={handleRetry} disabled={isRetrying}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          ) : canRequestPermission ? (
            <Button onClick={handleRequestPermission} disabled={isRetrying}>
              <Mic className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-pulse' : ''}`} />
              Allow Microphone
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
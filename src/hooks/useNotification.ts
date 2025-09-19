import { toast } from "sonner";

export const useNotification = () => {
  const getNotificationMode = (): 'minimal' | 'reduced' | 'verbose' => {
    return (localStorage.getItem('notification_mode') as 'minimal' | 'reduced' | 'verbose') || 'minimal';
  };

  const showSuccess = (message: string, description?: string) => {
    const mode = getNotificationMode();
    
    if (mode === 'minimal') {
      // No toast, rely on visual feedback
      return;
    }
    
    if (mode === 'reduced') {
      // Skip success messages in reduced mode
      return;
    }
    
    // Verbose mode
    toast.success(message, { description });
  };

  const showError = (message: string, description?: string) => {
    const mode = getNotificationMode();
    
    if (mode === 'minimal') {
      // Still show errors in minimal mode but very brief
      toast.error(message);
      return;
    }
    
    // Show errors in both reduced and verbose
    toast.error(message, { description });
  };

  const showInfo = (message: string, description?: string) => {
    const mode = getNotificationMode();
    
    if (mode === 'minimal' || mode === 'reduced') {
      // Skip info messages
      return;
    }
    
    // Only verbose mode
    toast.info(message, { description });
  };

  const showProcessing = (message: string) => {
    const mode = getNotificationMode();
    
    if (mode === 'minimal' || mode === 'reduced') {
      // Skip processing messages, rely on visual feedback
      return;
    }
    
    // Only verbose mode
    toast.loading(message);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showProcessing,
    getNotificationMode
  };
};
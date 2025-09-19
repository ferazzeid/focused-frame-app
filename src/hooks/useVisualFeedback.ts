import { useState } from 'react';

export type FeedbackState = 'idle' | 'processing' | 'success' | 'error';

export const useVisualFeedback = () => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');

  const showSuccess = (duration = 2000) => {
    setFeedbackState('success');
    setTimeout(() => setFeedbackState('idle'), duration);
  };

  const showError = (duration = 2000) => {
    setFeedbackState('error');
    setTimeout(() => setFeedbackState('idle'), duration);
  };

  const showProcessing = () => {
    setFeedbackState('processing');
  };

  const reset = () => {
    setFeedbackState('idle');
  };

  return {
    feedbackState,
    showSuccess,
    showError,
    showProcessing,
    reset
  };
};
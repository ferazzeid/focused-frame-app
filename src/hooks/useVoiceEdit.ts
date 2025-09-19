import { useState, useRef } from 'react';
import { speechService } from '@/lib/speechService';
import { useToast } from '@/hooks/use-toast';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';

export const useVoiceEdit = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { hasPermission, requestPermission, canRequestPermission } = useMicrophonePermission();

  // Remove old permission function - now handled by useMicrophonePermission

  const startVoiceEdit = async (onTranscription: (text: string) => void) => {
    // Check permission first
    if (!canRequestPermission) {
      toast({
        title: "Microphone Not Available",
        description: "Microphone access requires HTTPS or a supported browser",
        variant: "destructive",
      });
      return;
    }

    const hasAccess = hasPermission || await requestPermission();
    if (!hasAccess) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        
        // Only process if we have audio chunks (not cancelled)
        if (audioChunksRef.current.length > 0) {
          await processVoiceEdit(audioBlob, onTranscription);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Voice Edit Started",
        description: "Speak to replace the current text...",
      });
    } catch (error) {
      console.error('Failed to start voice editing:', error);
      toast({
        title: "Voice Edit Failed",
        description: "Could not start recording. Please check your microphone.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceEdit = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelVoiceEdit = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear audio chunks to prevent processing
      audioChunksRef.current = [];
      
      toast({
        title: "Voice Edit Cancelled",
        description: "Voice editing was cancelled",
      });
    }
  };

  const processVoiceEdit = async (audioBlob: Blob, onTranscription: (text: string) => void) => {
    setIsProcessing(true);
    
    // Add timeout for voice processing
    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        console.log('Voice processing timeout');
        setIsProcessing(false);
        onTranscription(""); // Send empty to trigger cleanup
        toast({
          title: "Voice Processing Timeout",
          description: "Voice processing took too long. Please try again.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 second timeout
    
    try {
      toast({
        title: "Processing Voice",
        description: "Transcribing your speech...",
      });

      const result = await speechService.processAudio(audioBlob);
      
      // Clear timeout on success
      clearTimeout(timeoutId);
      
      // Validate transcript
      if (!result.transcript || result.transcript.trim() === "") {
        console.log('Empty transcript received');
        onTranscription(""); // Send empty to trigger cleanup
        toast({
          title: "No Speech Detected",
          description: "No speech was detected. Please try speaking again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      console.log('Voice processing successful:', result.transcript);
      // Use just the transcript, not the summary for editing
      onTranscription(result.transcript);

      // Don't show success toast here - let the parent component handle it
      setIsProcessing(false);
    } catch (error) {
      console.error('Voice edit processing failed:', error);
      
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      // Send empty transcription to trigger cleanup
      onTranscription("");
      
      toast({
        title: "Voice Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process audio. Please try again.",
        variant: "destructive",
      });
      
      setIsProcessing(false);
    }
  };

  const toggleVoiceEdit = (onTranscription: (text: string) => void) => {
    if (isRecording) {
      stopVoiceEdit();
    } else {
      startVoiceEdit(onTranscription);
    }
  };

  return {
    isRecording,
    isProcessing,
    hasPermission,
    canRequestPermission,
    startVoiceEdit,
    stopVoiceEdit,
    cancelVoiceEdit,
    toggleVoiceEdit,
  };
};
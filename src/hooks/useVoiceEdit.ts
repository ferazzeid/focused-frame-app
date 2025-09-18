import { useState, useRef } from 'react';
import { speechService } from '@/lib/speechService';
import { useToast } from '@/hooks/use-toast';

export const useVoiceEdit = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      setHasPermission(false);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice editing.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startVoiceEdit = async (onTranscription: (text: string) => void) => {
    const hasAccess = hasPermission || await requestMicrophonePermission();
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
        await processVoiceEdit(audioBlob, onTranscription);
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
    
    try {
      // Check if API key exists
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please set your OpenAI API key in Settings first.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Processing Voice",
        description: "Transcribing your speech...",
      });

      const result = await speechService.processAudio(audioBlob);
      
      // Use just the transcript, not the summary for editing
      onTranscription(result.transcript);

      toast({
        title: "Voice Edit Complete",
        description: "Text has been replaced with your speech",
      });

      setIsProcessing(false);
    } catch (error) {
      console.error('Voice edit processing failed:', error);
      
      toast({
        title: "Voice Edit Failed",
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
    startVoiceEdit,
    stopVoiceEdit,
    cancelVoiceEdit,
    toggleVoiceEdit,
  };
};
import { useState, useRef } from 'react';
import { speechService, TranscriptionResult } from '@/lib/speechService';
import { createTextItem, loadData, saveData, generateId } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface PendingRecording {
  id: string;
  audioBlob: Blob;
  timestamp: number;
}

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pendingRecordings, setPendingRecordings] = useState<PendingRecording[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Load pending recordings from localStorage on initialization
  const loadPendingRecordings = () => {
    try {
      const stored = localStorage.getItem('pending_recordings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Note: We can't restore Blob objects from localStorage, so we'll just clear them
        localStorage.removeItem('pending_recordings');
      }
    } catch (error) {
      console.error('Failed to load pending recordings:', error);
    }
  };

  const savePendingRecording = (audioBlob: Blob) => {
    const recording: PendingRecording = {
      id: generateId(),
      audioBlob,
      timestamp: Date.now(),
    };
    
    // We can't store Blob in localStorage, so we'll keep it in memory for now
    // In a real app, you'd want to use IndexedDB for this
    setPendingRecordings(prev => [...prev, recording]);
    return recording.id;
  };

  const removePendingRecording = (id: string) => {
    setPendingRecordings(prev => prev.filter(r => r.id !== id));
  };

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
        description: "Please allow microphone access to use speech recording.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = async () => {
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
        await processRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your idea now...",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check your microphone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async (audioBlob: Blob, recordingId?: string) => {
    setIsProcessing(true);
    
    try {
      // Check if API key exists
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        // Save for later retry
        const id = recordingId || savePendingRecording(audioBlob);
        toast({
          title: "API Key Missing",
          description: "Please set your OpenAI API key in Settings first. Recording saved for retry.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Processing Audio",
        description: "Transcribing and generating summary...",
      });

      const result: TranscriptionResult = await speechService.processAudio(audioBlob);
      
      // Create new item with 3-word summary as title and transcript as content
      const newItem = createTextItem(result.summary, result.transcript);
      
      // Add to free list
      const currentData = loadData();
      const updatedData = {
        ...currentData,
        freeList: [newItem, ...currentData.freeList],
      };
      saveData(updatedData);

      // Remove from pending if it was a retry
      if (recordingId) {
        removePendingRecording(recordingId);
      }

      toast({
        title: "Voice Note Created",
        description: `Added: "${result.summary}"`,
      });

      setIsProcessing(false);
    } catch (error) {
      console.error('Processing failed:', error);
      
      // Save for retry if not already saved
      if (!recordingId) {
        const id = savePendingRecording(audioBlob);
        toast({
          title: "Processing Failed",
          description: "Recording saved. You can retry from pending recordings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process audio. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsProcessing(false);
    }
  };

  const retryPendingRecording = (recording: PendingRecording) => {
    processRecording(recording.audioBlob, recording.id);
  };

  const retryAllPending = () => {
    pendingRecordings.forEach(recording => {
      retryPendingRecording(recording);
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isProcessing,
    hasPermission,
    pendingRecordings,
    startRecording,
    stopRecording,
    toggleRecording,
    retryPendingRecording,
    retryAllPending,
  };
};

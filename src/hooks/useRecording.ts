import { useState, useRef, useEffect } from 'react';
import { speechService, TranscriptionResult, MultiItemResult } from '@/lib/speechService';
import { createTextItem, loadData, saveData, generateId } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';

interface PendingRecording {
  id: string;
  audioBlob: Blob;
  timestamp: number;
}

const RECORDING_TIME_LIMIT = 60; // 60 seconds max recording time

export const useRecording = (onItemAdded?: () => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingRecordings, setPendingRecordings] = useState<PendingRecording[]>([]);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(RECORDING_TIME_LIMIT);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { hasPermission, requestPermission, canRequestPermission } = useMicrophonePermission();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTimeLeft(RECORDING_TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setRecordingTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-stop recording when time runs out
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTimeLeft(RECORDING_TIME_LIMIT);
  };
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

  // Remove old permission function - now handled by useMicrophonePermission

  const startRecording = async () => {
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
          await processRecording(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      
      toast({
        title: "Recording Started",
        description: `Speak your idea now... (${RECORDING_TIME_LIMIT}s max)`,
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
      stopTimer();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      
      // Clear audio chunks to prevent processing
      audioChunksRef.current = [];
      
      toast({
        title: "Recording Cancelled",
        description: "Voice recording was cancelled",
      });
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

      // Check if multi-item is enabled
      const multiItemEnabled = localStorage.getItem('multi_item_enabled') === 'true';
      
      if (multiItemEnabled) {
        toast({
          title: "Processing Audio",
          description: "Analyzing for multiple items...",
        });

        const multiResult: MultiItemResult = await speechService.processAudioForMultipleItems(audioBlob);
        
        // Create multiple items
        const currentData = await loadData();
        const newItems = multiResult.items.map(item => createTextItem(item.title, item.content));
        
        const updatedData = {
          ...currentData,
          freeList: [...newItems, ...currentData.freeList],
        };
        await saveData(updatedData);

        // Remove from pending if it was a retry
        if (recordingId) {
          removePendingRecording(recordingId);
        }

        toast({
          title: multiResult.items.length > 1 ? "Multiple Items Created" : "Voice Note Created",
          description: multiResult.items.length > 1 
            ? `Created ${multiResult.items.length} items from recording`
            : `Added: "${multiResult.items[0].title}"`,
        });

      } else {
        toast({
          title: "Processing Audio",
          description: "Transcribing and generating summary...",
        });

        const result: TranscriptionResult = await speechService.processAudio(audioBlob);
        
        // Create new item with 3-word summary as title and transcript as content
        const newItem = createTextItem(result.summary, result.transcript);
        
        // Add to free list
        const currentData = await loadData();
        const updatedData = {
          ...currentData,
          freeList: [newItem, ...currentData.freeList],
        };
        await saveData(updatedData);

        // Remove from pending if it was a retry
        if (recordingId) {
          removePendingRecording(recordingId);
        }

        toast({
          title: "Voice Note Created",
          description: `Added: "${result.summary}"`,
        });
      }

      // Notify parent component that a new item was added
      onItemAdded?.();

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
    canRequestPermission,
    pendingRecordings,
    recordingTimeLeft,
    startRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
    retryPendingRecording,
    retryAllPending,
  };
};

import React, { useState, useRef } from 'react';
import { MobileButton } from '@/components/ui/mobile-button';
import { Mic, MicOff, Square } from 'lucide-react';
import { speechService, TranscriptionResult } from '@/lib/speechService';
import { createTextItem } from '@/lib/storage';
import { loadData, saveData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export const Speech = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop()); // Clean up
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

  const processRecording = async (audioBlob: Blob) => {
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

      toast({
        title: "Voice Note Created",
        description: `Added: "${result.summary}"`,
      });

      // Reset state
      setIsProcessing(false);
    } catch (error) {
      console.error('Processing failed:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process audio. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const getButtonState = () => {
    if (isProcessing) {
      return {
        text: "Processing...",
        variant: "outline" as const,
        disabled: true,
        icon: <Mic className="w-6 h-6 animate-pulse" />
      };
    }
    
    if (isRecording) {
      return {
        text: "Stop Recording",
        variant: "destructive" as const,
        disabled: false,
        icon: <Square className="w-6 h-6" />
      };
    }
    
    return {
      text: "Start Recording",
      variant: "primary" as const,
      disabled: false,
      icon: <Mic className="w-6 h-6" />
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="flex flex-col items-center justify-center h-full p-lg">
      <div className="flex flex-col items-center gap-xl max-w-sm mx-auto text-center">
        <div className="space-y-md">
          <h2 className="text-xl font-medium text-foreground">Voice Notes</h2>
          <p className="text-sm text-foreground-muted font-normal">
            Record your ideas and they'll be automatically transcribed with a 3-word summary as the title.
          </p>
        </div>

        {hasPermission === false && (
          <div className="p-md bg-background-subtle border border-border-subtle rounded-lg">
            <p className="text-sm text-foreground-muted">
              Microphone access is required for voice recording. Please allow access when prompted.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-lg">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? "bg-accent-red/20 border-2 border-accent-red animate-pulse" 
              : isProcessing 
                ? "bg-accent-blue/20 border-2 border-accent-blue" 
                : "bg-background-subtle border-2 border-border"
          }`}>
            {buttonState.icon}
          </div>

          <MobileButton
            variant={buttonState.variant}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={buttonState.disabled}
            className="min-w-40 font-normal"
          >
            {buttonState.text}
          </MobileButton>
        </div>

        <div className="text-xs text-foreground-muted space-y-xs">
          <p>• Tap to start recording your voice</p>
          <p>• Tap again to stop and process</p>
          <p>• Your note will be added to your list automatically</p>
        </div>
      </div>
    </div>
  );
};
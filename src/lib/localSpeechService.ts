// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export class LocalSpeechService {
  private recognition: ISpeechRecognition | null = null;

  constructor() {
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      // Convert blob to audio URL and play it through the recognition
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      this.recognition.onresult = (event) => {
        const result = event.results[0];
        if (result.isFinal) {
          resolve(result[0].transcript);
        }
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        URL.revokeObjectURL(audioUrl);
      };

      // Start recognition
      this.recognition.start();
      
      // Play audio to trigger recognition
      audio.play().catch(reject);
    });
  }

  async processAudio(audioBlob: Blob): Promise<{ transcript: string; summary: string }> {
    const transcript = await this.transcribeAudio(audioBlob);
    const summary = this.generateQuickSummary(transcript);
    
    return {
      transcript,
      summary,
    };
  }

  private generateQuickSummary(transcript: string): string {
    // Simple local summarization - take first 3 meaningful words
    const words = transcript.trim().split(/\s+/).filter(word => 
      word.length > 2 && !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
    );
    
    return words.slice(0, 3).join(' ') || 'Voice Note';
  }
}

export const localSpeechService = new LocalSpeechService();
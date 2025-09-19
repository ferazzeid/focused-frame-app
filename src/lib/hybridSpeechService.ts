import { speechService, TranscriptionResult, MultiItemResult } from './speechService';
import { localSpeechService } from './localSpeechService';

export class HybridSpeechService {
  async processAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const useLocalSpeech = localStorage.getItem('use_local_speech') === 'true';
    const quickMode = localStorage.getItem('quick_mode') === 'true';
    
    try {
      if (useLocalSpeech && localSpeechService.isSupported()) {
        const transcript = await localSpeechService.transcribeAudio(audioBlob);
        
        if (quickMode) {
          const summary = this.generateQuickSummary(transcript);
          return { transcript, summary };
        } else {
          // Use OpenAI for summary generation only
          const summary = await speechService.generateSummary(transcript);
          return { transcript, summary };
        }
      } else {
        // Fallback to OpenAI for everything
        if (quickMode) {
          const transcript = await speechService.transcribeAudio(audioBlob);
          const summary = this.generateQuickSummary(transcript);
          return { transcript, summary };
        } else {
          return await speechService.processAudio(audioBlob);
        }
      }
    } catch (error) {
      console.error('Hybrid speech processing error:', error);
      // Always fallback to OpenAI on error
      return await speechService.processAudio(audioBlob);
    }
  }

  async processAudioForMultipleItems(audioBlob: Blob): Promise<MultiItemResult> {
    const useLocalSpeech = localStorage.getItem('use_local_speech') === 'true';
    const quickMode = localStorage.getItem('quick_mode') === 'true';
    
    try {
      if (useLocalSpeech && localSpeechService.isSupported()) {
        const transcript = await localSpeechService.transcribeAudio(audioBlob);
        
        if (quickMode) {
          // Skip AI analysis, create single item
          const summary = this.generateQuickSummary(transcript);
          return {
            items: [{ title: summary, content: transcript }],
            fallbackToSingle: true
          };
        } else {
          // Use OpenAI for multi-item analysis
          return await speechService.generateMultipleItems(transcript);
        }
      } else {
        // Fallback to OpenAI
        if (quickMode) {
          const transcript = await speechService.transcribeAudio(audioBlob);
          const summary = this.generateQuickSummary(transcript);
          return {
            items: [{ title: summary, content: transcript }],
            fallbackToSingle: true
          };
        } else {
          return await speechService.processAudioForMultipleItems(audioBlob);
        }
      }
    } catch (error) {
      console.error('Hybrid multi-item processing error:', error);
      // Always fallback to OpenAI on error
      return await speechService.processAudioForMultipleItems(audioBlob);
    }
  }

  private generateQuickSummary(transcript: string): string {
    // Simple local summarization - take first 3 meaningful words
    const words = transcript.trim().split(/\s+/).filter(word => 
      word.length > 2 && !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
    );
    
    return words.slice(0, 3).join(' ') || 'Voice Note';
  }
}

export const hybridSpeechService = new HybridSpeechService();
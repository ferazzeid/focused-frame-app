export interface TranscriptionResult {
  transcript: string;
  summary: string;
}

export interface MultiItemResult {
  items: Array<{
    title: string;
    content: string;
  }>;
  fallbackToSingle: boolean;
}

export class SpeechService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = this.getEffectiveApiKey();
  }

  private getEffectiveApiKey(): string | null {
    // Only check for personal API key
    const personalKey = localStorage.getItem('personal_openai_api_key');
    if (personalKey) {
      console.log('Using personal OpenAI API key');
      return personalKey;
    }

    return null;
  }

  private async getSharedApiKey(): Promise<string | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('manage-shared-openai-key', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching shared API key:', error);
        return null;
      }
      
      if (data?.hasKey && data?.key) {
        console.log('Using shared OpenAI API key');
        return data.key;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch shared API key:', error);
      return null;
    }
  }

  private async getApiKey(): Promise<string> {
    // Try personal key first
    const localKey = this.getEffectiveApiKey();
    if (localKey) {
      return localKey;
    }

    // Try shared key from Supabase
    const sharedKey = await this.getSharedApiKey();
    if (sharedKey) {
      return sharedKey;
    }

    throw new Error('OpenAI API key not found. Please add your personal API key in Settings, or contact your administrator for shared key access.');
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const apiKey = await this.getApiKey();
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  }

  async generateSummary(transcript: string): Promise<string> {
    const apiKey = await this.getApiKey();
    const selectedModel = localStorage.getItem('openai_model') || 'gpt-5-nano-2025-08-07';
    const summaryPrompt = localStorage.getItem('summary_prompt') || 
      'You are an expert at creating meaningful 3-word summaries that capture the essence and main action/topic of content. Focus on the core meaning, not just the first words. Examples: "Fix Trash Icon", "Track Food Weight", "Implement Summary Feature", "Discuss App Changes". Respond with exactly 3 words that best represent the main point, no punctuation, no extra text.';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: summaryPrompt
          },
          {
            role: 'user',
            content: `Summarize this text in exactly 3 words: "${transcript}"`
          }
        ],
        max_completion_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Summary generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim();
    
    // If OpenAI didn't return a proper summary, generate a quick local one
    if (!summary) {
      return this.generateQuickSummary(transcript);
    }
    
    return summary;
  }

  async generateMultipleItems(transcript: string): Promise<MultiItemResult> {
    const apiKey = await this.getApiKey();
    const selectedModel = localStorage.getItem('openai_model') || 'gpt-5-nano-2025-08-07';
    const multiItemPrompt = localStorage.getItem('multi_item_prompt') || 
      'You are an expert at analyzing voice recordings and splitting them into distinct, actionable items. \n\nSPLIT CRITERIA - Only split when the transcript contains:\n- Multiple distinct tasks or action items\n- Different meeting topics or agenda items\n- Separate ideas that can stand alone\n- List-like content with clear separators\n\nDO NOT SPLIT if:\n- Content is under 50 words\n- It\'s a single cohesive thought or story\n- Items are closely related parts of one topic\n\nFor each item, create a meaningful 3-word title (no punctuation) that captures the essence. The title should help identify the content at a glance.\n\nExamples of good splitting:\n- "Buy groceries, call mom, finish project report" → 3 items\n- "Meeting discussed budget, then reviewed marketing plans, finally addressed hiring" → 3 items\n- "Remember to schedule dentist appointment and pick up dry cleaning" → 2 items\n\nExamples of NO splitting:\n- "Just had a great conversation with Sarah about the new product ideas" → 1 item\n- "Quick reminder to myself about tomorrow\'s presentation" → 1 item\n\nRespond in JSON format: {"items": [{"title": "Three Word Title", "content": "detailed content"}], "is_single_item": false}';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: multiItemPrompt
          },
          {
            role: 'user',
            content: `Analyze this transcript for splitting: "${transcript}"`
          }
        ],
        max_completion_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Multi-item processing failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return {
          items: parsed.items,
          fallbackToSingle: parsed.is_single_item === true || parsed.items.length === 1
        };
      }
    } catch (parseError) {
      console.error('Failed to parse multi-item response:', parseError);
    }
    
    // Fallback to single item
    const summary = await this.generateSummary(transcript);
    return {
      items: [{ title: summary, content: transcript }],
      fallbackToSingle: true
    };
  }

  private generateQuickSummary(transcript: string): string {
    // Intelligent local summarization - extract key actions, objects, and topics
    const text = transcript.toLowerCase().trim();
    
    // Look for action words and key topics
    const actionWords = ['fix', 'create', 'implement', 'add', 'remove', 'update', 'change', 'track', 'make', 'build', 'test', 'check', 'discuss', 'review', 'plan', 'need', 'should', 'want'];
    const words = text.split(/\s+/).filter(word => word.length > 2);
    
    let keyWords: string[] = [];
    
    // Find action words first
    const foundAction = words.find(word => actionWords.includes(word));
    if (foundAction) {
      keyWords.push(foundAction);
    }
    
    // Look for important nouns/topics (avoid common words)
    const stopWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'what', 'when', 'where', 'who', 'how', 'why', 'need', 'want', 'think', 'know', 'mean', 'just', 'really', 'actually', 'probably', 'maybe'];
    
    const meaningfulWords = words.filter(word => 
      !stopWords.includes(word) && 
      !keyWords.includes(word) &&
      word.length > 2
    );
    
    // Add the most meaningful words
    keyWords = keyWords.concat(meaningfulWords.slice(0, 3 - keyWords.length));
    
    // If still not enough words, take first few non-stop words
    if (keyWords.length < 3) {
      const remainingWords = words.filter(word => 
        !stopWords.includes(word) && 
        !keyWords.includes(word)
      );
      keyWords = keyWords.concat(remainingWords.slice(0, 3 - keyWords.length));
    }
    
    // Fallback to first words if nothing meaningful found
    if (keyWords.length === 0) {
      const allWords = transcript.trim().split(/\s+/);
      keyWords = allWords.slice(0, 3);
    }
    
    // Capitalize and format
    const summary = keyWords.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return summary || 'Voice Note';
  }

  async processAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const transcript = await this.transcribeAudio(audioBlob);
      const summary = await this.generateSummary(transcript);
      
      return {
        transcript,
        summary,
      };
    } catch (error) {
      console.error('Speech processing error:', error);
      throw error;
    }
  }

  async processAudioForMultipleItems(audioBlob: Blob): Promise<MultiItemResult> {
    try {
      const transcript = await this.transcribeAudio(audioBlob);
      return await this.generateMultipleItems(transcript);
    } catch (error) {
      console.error('Multi-item processing error:', error);
      throw error;
    }
  }
}

export const speechService = new SpeechService();
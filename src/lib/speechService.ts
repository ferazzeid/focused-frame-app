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
    this.apiKey = localStorage.getItem('openai_api_key');
  }

  private getApiKey(): string {
    const key = localStorage.getItem('openai_api_key');
    if (!key) {
      throw new Error('OpenAI API key not found. Please set it in Settings.');
    }
    return key;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const apiKey = this.getApiKey();
    
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
    const apiKey = this.getApiKey();
    const selectedModel = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    
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
            content: 'You are a helpful assistant that creates concise 3-word summaries. Respond with exactly 3 words, no punctuation, no extra text.'
          },
          {
            role: 'user',
            content: `Summarize this text in exactly 3 words: "${transcript}"`
          }
        ],
        max_tokens: 10,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Summary generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Voice Note Summary';
  }

  async generateMultipleItems(transcript: string): Promise<MultiItemResult> {
    const apiKey = this.getApiKey();
    const selectedModel = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    const multiItemPrompt = localStorage.getItem('multi_item_prompt') || 
      'Analyze this transcript and break it down into distinct, actionable items. Each item should be a separate task, idea, or note. If the content naturally contains multiple distinct items, return them as separate entries. If it\'s really just one cohesive item, return only one. For each item, provide a 3-word title (no punctuation) and the relevant content. Respond in JSON format: {"items": [{"title": "Three Word Title", "content": "detailed content"}], "is_single_item": false}';
    
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
            content: `Transcript: "${transcript}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
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
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
      `You are an expert at creating meaningful 3-word summaries that capture the CORE ESSENCE and main concept of content. 

FOCUS ON: Main subject + Primary action + Key object/goal
AVOID: Random words, filler words, chronological order

EXAMPLES:
"we need to implement Google Play Store payment functionality" → "Payment Store Implementation"
"let's fix the trash icon issue" → "Fix Trash Icon"  
"we should track food weight feature" → "Track Food Weight"
"make sure we start the login system" → "Start Login System"
"discuss app changes for users" → "Discuss App Changes"
"add new dashboard component" → "Add Dashboard Component"

Extract the most important CONCEPT, not just first words. Respond with exactly 3 words that capture the essence, no punctuation, no extra text.`;
    
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
    const text = transcript.toLowerCase().trim();
    
    // Concept mapping for compound terms and technical phrases
    const conceptMap: { [key: string]: string } = {
      'google play store': 'Play Store',
      'app store': 'App Store',
      'payment functionality': 'Payment',
      'payment system': 'Payment',
      'payment solution': 'Payment',
      'login system': 'Login',
      'authentication': 'Auth',
      'user interface': 'UI',
      'user experience': 'UX',
      'dashboard': 'Dashboard',
      'database': 'Database',
      'api': 'API',
      'backend': 'Backend',
      'frontend': 'Frontend'
    };
    
    // Pattern-based extraction for common structures
    const patterns = [
      // "need to/should/want to implement/create/fix X" → "Implement/Create/Fix X"
      { regex: /(?:need to|should|want to|have to|going to|plan to)\s+(implement|create|fix|add|build|make|update|change)\s+(.+?)(?:\s+(?:especially|specifically|particularly))?(?:\s+(?:the|a|an))?\s*([^.]*)/i, 
        extract: (match: RegExpMatchArray) => {
          const action = match[1];
          const keyNouns = this.extractKeyNouns(match[2] + ' ' + match[3]);
          return [action, ...keyNouns.slice(0, 2)];
        }
      },
      
      // "make sure we start/do X" → "Start/Do X"  
      { regex: /make sure (?:we|i|they)\s+(start|begin|do|implement|create|fix|add)\s+(.+)/i, 
        extract: (match: RegExpMatchArray) => {
          const action = match[1];
          const keyNouns = this.extractKeyNouns(match[2]);
          return [action, ...keyNouns.slice(0, 2)];
        }
      },
        
      // "let's implement/fix/create X" → "Implement/Fix/Create X"
      { regex: /let'?s\s+(implement|fix|create|add|build|make|update|change)\s+(.+)/i, 
        extract: (match: RegExpMatchArray) => {
          const action = match[1];
          const keyNouns = this.extractKeyNouns(match[2]);
          return [action, ...keyNouns.slice(0, 2)];
        }
      },
        
      // "we also need to X" → focus on X
      { regex: /we also (?:need to|should|want to)\s+(.+)/i, 
        extract: (match: RegExpMatchArray) => this.extractActionAndObject(match[1]) }
    ];
    
    // Try pattern matching first
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const extracted = pattern.extract(match);
        if (extracted && extracted.length > 0) {
          return this.formatSummary(extracted.slice(0, 3));
        }
      }
    }
    
    // Apply concept mapping
    let processedText = text;
    for (const [phrase, concept] of Object.entries(conceptMap)) {
      if (processedText.includes(phrase)) {
        processedText = processedText.replace(new RegExp(phrase, 'g'), concept);
      }
    }
    
    // Extract action + key concepts
    const actionWords = ['fix', 'create', 'implement', 'add', 'remove', 'update', 'change', 'track', 'make', 'build', 'test', 'check', 'discuss', 'review', 'plan', 'start', 'begin', 'setup', 'configure'];
    const words = processedText.split(/\s+/).filter(word => word.length > 1);
    
    const foundAction = words.find(word => actionWords.includes(word));
    const keyNouns = this.extractKeyNouns(processedText);
    
    const result = [];
    if (foundAction) result.push(foundAction);
    result.push(...keyNouns.slice(0, 3 - result.length));
    
    // Final fallback
    if (result.length === 0) {
      const meaningfulWords = words.filter(word => 
        !this.isStopWord(word) && word.length > 2
      );
      result.push(...meaningfulWords.slice(0, 3));
    }
    
    return this.formatSummary(result.slice(0, 3)) || 'Voice Note';
  }
  
  private extractActionAndObject(text: string): string[] {
    const actionWords = ['implement', 'create', 'fix', 'add', 'build', 'make', 'update', 'start', 'setup'];
    const words = text.toLowerCase().split(/\s+/);
    
    const action = words.find(word => actionWords.includes(word)) || 'work';
    const keyNouns = this.extractKeyNouns(text);
    
    return [action, ...keyNouns.slice(0, 2)];
  }
  
  private extractKeyNouns(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    
    // Priority technical/business terms
    const priorityTerms = ['payment', 'store', 'play', 'google', 'api', 'database', 'login', 'auth', 'dashboard', 'ui', 'ux', 'app', 'system', 'feature', 'functionality', 'component', 'service', 'integration'];
    
    const meaningful = words.filter(word => 
      !this.isStopWord(word) && 
      (priorityTerms.includes(word) || word.length > 3)
    );
    
    // Prioritize technical terms, then other meaningful words
    const priority = meaningful.filter(word => priorityTerms.includes(word));
    const regular = meaningful.filter(word => !priorityTerms.includes(word));
    
    return [...priority, ...regular].slice(0, 3);
  }
  
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'what', 'when', 'where', 'who', 'how', 'why', 'need', 'want', 'think', 'know', 'mean', 'just', 'really', 'actually', 'probably', 'maybe', 'also', 'sure', 'make', 'start', 'begin', 'lets', 'well', 'now', 'then', 'here', 'there', 'way', 'get', 'going', 'especially', 'specifically', 'particularly'];
    return stopWords.includes(word);
  }
  
  private formatSummary(words: string[]): string {
    return words
      .filter(word => word && word.length > 0)
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
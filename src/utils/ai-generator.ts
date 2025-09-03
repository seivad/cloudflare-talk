import { AIGeneratedContent, AIPollOption } from '../db/queries';

interface Env {
  AI: any;
  ASSETS_BUCKET: R2Bucket;
  DB: D1Database;
}

export class AIContentGenerator {
  constructor(private env: Env) {}

  /**
   * Generate AI content based on the poll option configuration
   */
  async generateContent(
    option: AIPollOption,
    presentationId: string,
    presentationSlug: string,
    slideId: string,
    sessionCode: string
  ): Promise<AIGeneratedContent> {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = crypto.randomUUID();
    
    if (option.type === 'image') {
      return this.generateImage(option, presentationId, presentationSlug, slideId, sessionCode, date, uuid, timestamp);
    } else {
      return this.generateText(option, presentationId, presentationSlug, slideId, sessionCode, date, uuid, timestamp);
    }
  }

  /**
   * Generate an AI image using Leonardo Phoenix model
   */
  private async generateImage(
    option: AIPollOption,
    presentationId: string,
    presentationSlug: string,
    slideId: string,
    sessionCode: string,
    date: string,
    uuid: string,
    timestamp: number
  ): Promise<AIGeneratedContent> {
    try {
      // Call CloudFlare AI Leonardo Phoenix model
      const inputs = {
        prompt: option.value,
        width: 1024,
        height: 1024,
      };

      const response = await this.env.AI.run(
        "@cf/leonardo/phoenix-1.0",
        inputs
      );

      // Convert response to Uint8Array if needed
      let imageData: Uint8Array;
      if (response instanceof ArrayBuffer) {
        imageData = new Uint8Array(response);
      } else if (response instanceof Uint8Array) {
        imageData = response;
      } else if (response instanceof ReadableStream) {
        const reader = response.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        imageData = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
          imageData.set(chunk, position);
          position += chunk.length;
        }
      } else {
        throw new Error('Unexpected response format from AI model');
      }

      // Save to R2 with organized folder structure
      const fileName = `image-${timestamp}-${uuid}.jpg`;
      const r2Path = `${presentationSlug}/${date}/${fileName}`;
      
      await this.env.ASSETS_BUCKET.put(r2Path, imageData, {
        httpMetadata: {
          contentType: 'image/jpeg',
        },
        customMetadata: {
          presentationId,
          slideId,
          sessionCode,
          pollOption: option.key,
          prompt: option.value,
          timestamp: timestamp.toString(),
        }
      });

      const url = `/r2/${r2Path}`;

      return {
        type: 'image',
        url,
        optionKey: option.key,
        timestamp,
        presentationId,
        slideId,
        sessionCode,
      };
    } catch (error) {
      console.error('Error generating AI image:', error);
      throw new Error(`Failed to generate AI image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI text using LLM model
   */
  private async generateText(
    option: AIPollOption,
    presentationId: string,
    presentationSlug: string,
    slideId: string,
    sessionCode: string,
    date: string,
    uuid: string,
    timestamp: number
  ): Promise<AIGeneratedContent> {
    try {
      // Use GPT-OSS-120B model for text generation
      const model = option.model || '@cf/openai/gpt-oss-120b';
      
      // Call CloudFlare AI with the instructions/input format
      const response = await this.env.AI.run(model, {
        instructions: 'You are a helpful and concise AI assistant. Provide informative and engaging responses.',
        input: option.value,
      });

      let generatedText: string;
      if (typeof response === 'string') {
        generatedText = response;
      } else if (response.response) {
        generatedText = response.response;
      } else {
        throw new Error('Unexpected response format from AI model');
      }

      // Save to R2 as JSON file
      const fileName = `text-${timestamp}-${uuid}.json`;
      const r2Path = `${presentationSlug}/${date}/${fileName}`;
      
      const jsonContent = {
        presentationId,
        slideId,
        pollOption: option.key,
        prompt: option.value,
        model: option.model,
        response: generatedText,
        timestamp: new Date(timestamp).toISOString(),
        sessionCode,
      };

      await this.env.ASSETS_BUCKET.put(r2Path, JSON.stringify(jsonContent, null, 2), {
        httpMetadata: {
          contentType: 'application/json',
        },
        customMetadata: {
          presentationId,
          slideId,
          sessionCode,
          pollOption: option.key,
          timestamp: timestamp.toString(),
        }
      });

      const url = `/r2/${r2Path}`;

      return {
        type: 'text',
        url,
        content: generatedText,
        optionKey: option.key,
        timestamp,
        presentationId,
        slideId,
        sessionCode,
      };
    } catch (error) {
      console.error('Error generating AI text:', error);
      throw new Error(`Failed to generate AI text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream AI text generation for presenter view
   */
  async *streamText(prompt: string, model?: string): AsyncGenerator<string> {
    try {
      const selectedModel = model || '@cf/openai/gpt-oss-120b';
      
      // Call CloudFlare AI with streaming using instructions/input format
      const response = await this.env.AI.run(selectedModel, {
        instructions: 'You are a helpful and concise AI assistant. Provide informative and engaging responses.',
        input: prompt,
        stream: true,
      });

      if (response instanceof ReadableStream) {
        const reader = response.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          // Parse streaming response format (may need adjustment based on actual format)
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0].delta?.content) {
                  yield parsed.choices[0].delta.content;
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const text = typeof response === 'string' ? response : 
                     response.response || 
                     (response.choices && response.choices[0]?.message?.content) || 
                     '';
        yield text;
      }
    } catch (error) {
      console.error('Error streaming AI text:', error);
      throw error;
    }
  }
}

/**
 * Create a slugified version of presentation name for folder structure
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 50); // Limit length
}
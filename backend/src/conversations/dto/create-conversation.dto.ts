export class CreateConversationDto {
  title: string;
  summary?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  tokenCount?: number;
  model?: string;
  tags?: string;
}
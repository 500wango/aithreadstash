export class UpdateConversationDto {
  title?: string;
  summary?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  tokenCount?: number;
  status?: 'active' | 'archived' | 'deleted';
  model?: string;
  tags?: string;
}
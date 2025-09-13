// Stub service for chat-related functions
// This is a placeholder implementation

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface ImagePart {
  base64: string;
  mimeType: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
}

export interface ChatController {
  signal: AbortSignal;
}

// Stub functions
export async function generateInitialProHint(
  prompt: string,
  images: ImagePart[] | null,
  conversation: any,
  history: ChatHistory,
  onError: (error: Error) => void,
  signal: AbortSignal
): Promise<string> {
  console.log('generateInitialProHint (stub):', prompt);
  return "This is a stub response for Pro hint generation";
}

export async function sendMessageWithImages(
  prompt: string,
  images: ImagePart[],
  conversation: any,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  history: ChatHistory
): Promise<void> {
  console.log('sendMessageWithImages (stub):', prompt, images.length);
  onChunk("This is a stub response for image message");
}

export async function sendTextToGemini(
  prompt: string,
  conversation: any,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  history: ChatHistory
): Promise<void> {
  console.log('sendTextToGemini (stub):', prompt);
  onChunk("This is a stub response for text message");
}

export function isChatActive(conversationId: string): boolean {
  console.log('isChatActive (stub):', conversationId);
  return false;
}

export function renameChatSession(oldId: string, newId: string): void {
  console.log('renameChatSession (stub):', oldId, newId);
}

export function resetGeminiChat(): void {
  console.log('resetGeminiChat (stub)');
}

export async function generateInsightWithSearch(
  prompt: string,
  conversation: any,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<string> {
  console.log('generateInsightWithSearch (stub):', prompt);
  return "This is a stub insight response";
}

export async function generateInsightStream(
  prompt: string,
  conversation: any,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  console.log('generateInsightStream (stub):', prompt);
  onChunk("This is a stub insight stream");
}

export async function generateUnifiedInsights(
  prompt: string,
  conversation: any,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<any> {
  console.log('generateUnifiedInsights (stub):', prompt);
  return { insights: [] };
}


export interface ChatRagSource {
  source: string;
  score: number;
  snippet: string;
}

export interface ChatRagRequest {
  question: string;
  user_id?: string;
  top_k?: number;
}

export interface ChatRagResponse {
  answer: string;
  sources: ChatRagSource[];
  used_user_context: boolean;
}

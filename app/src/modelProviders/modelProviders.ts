import openaiChatCompletion from "./openai-ChatCompletion";
import replicateLlama2 from "./replicate-llama2";
import anthropicCompletion from "./anthropic-completion";
import openpipeChatCompletion from "./openpipe-chat";
import { type SupportedProvider, type ModelProvider } from "./types";

const modelProviders: Record<SupportedProvider, ModelProvider<any, any, any>> = {
  "openai/ChatCompletion": openaiChatCompletion,
  "replicate/llama2": replicateLlama2,
  "anthropic/completion": anthropicCompletion,
  "openpipe/Chat": openpipeChatCompletion,
};

export default modelProviders;

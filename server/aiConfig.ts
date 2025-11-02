/**
 * Centralized AI Configuration for Gemini API
 * All AI generation parameters should be imported from here
 */

// Standard generation config for analytical tasks
export const GENERATION_CONFIG = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 8192  // Commented out as per user request
};

// Creative config for research and synthesis tasks
export const CREATIVE_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 8192  // Commented out as per user request
};

// Precise config for data extraction and structured output
export const PRECISE_CONFIG = {
  temperature: 0.0,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 8192  // Commented out as per user request
};

// Fast benchmark generation config
export const BENCHMARK_CONFIG = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 1024  // Commented out as per user request
};

// Due diligence config with higher token limits
export const DUE_DILIGENCE_CONFIG = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 16384  // Commented out as per user request
};

// Hybrid research synthesis config
export const SYNTHESIS_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  // maxOutputTokens: 12288  // Commented out as per user request
};


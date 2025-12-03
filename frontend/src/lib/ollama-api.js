/**
 * Ollama API client for local AI inference
 * Free alternative to Claude API
 */

const OLLAMA_URL = "http://localhost:11434";

/**
 * Call Ollama API to generate content
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - System instructions
 * @param {string} model - Model name (default: llama3.2)
 * @returns {Promise<{content: [{text: string}]}>} - Response in Claude-compatible format
 */
export async function callOllama(
  prompt,
  systemPrompt = "",
  model = "llama3.2"
) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert Ollama response format to Claude-compatible format
    return {
      content: [
        {
          text: data.response,
        },
      ],
    };
  } catch (error) {
    console.error("Ollama API error:", error);
    throw error;
  }
}

/**
 * Check if Ollama is running and accessible
 * @returns {Promise<boolean>}
 */
export async function checkOllamaStatus() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available models in Ollama
 * @returns {Promise<string[]>}
 */
export async function listOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((m) => m.name) || [];
  } catch {
    return [];
  }
}

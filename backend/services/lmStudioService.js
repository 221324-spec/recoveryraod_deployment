/**
 * LM Studio Service — Phase 2
 *
 * Calls the LM Studio local inference server to generate AI-powered
 * therapist / recovery-coach replies.
 *
 * Endpoint : POST ${LMSTUDIO_URL}/api/v1/chat
 * Model    : mistral-7b-instruct-v0.3  (configurable via env)
 *
 * ─── IMPORTANT ───
 * This service is ONLY called for LOW / MED risk messages.
 * HIGH-risk messages are always handled by the existing crisis template
 * in responderService.js (no LLM involvement).
 */

const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234';
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || 'mistral-7b-instruct-v0.3';

// ── System prompt — stored in backend, never exposed to frontend ──
const SYSTEM_PROMPT = `You are RecoveryBot, a compassionate recovery coach. Listen, validate feelings, and guide toward healthy coping.

Rules:
- Be warm, empathetic, non-judgmental. Keep replies 3-5 sentences.
- Suggest coping skills: breathing, grounding, journaling, movement.
- End with ONE follow-up question.
- NEVER give medical advice or drug instructions. Redirect to their doctor.
- Celebrate progress. Setbacks are normal and don't erase progress.
- For cravings: validate and suggest coping — no shaming.
- Speak as a supportive friend, not a clinician.`;

/**
 * Build the input for the LM Studio /api/v1/chat call.
 *
 * LM Studio native API format:
 *   input: string | Array<{ type: 'text', content: string }>
 *   Response: { output: [{ type: 'message', content: '...' }] }
 *
 * Since the native API doesn't have explicit system/user/assistant roles,
 * we build a structured prompt that includes the system instructions,
 * conversation context, and the current user message.
 *
 * @param {Array<{sender: string, text: string}>} conversationHistory
 *   Recent ChatMessage docs (patient + bot), oldest-first.
 * @param {string} currentText  The patient's new message.
 * @param {{ emotion: string, intensity: number, risk: string }} analysis
 *   Analysis result — used to add context hints to the system prompt.
 * @returns {string} The formatted prompt string.
 */
function buildPrompt(conversationHistory, currentText, analysis) {
  let prompt = `[INST] ${SYSTEM_PROMPT}`;

  if (analysis) {
    prompt += `\n\n[Context — do NOT repeat to user] Emotion: ${analysis.emotion}, Intensity: ${(analysis.intensity * 100).toFixed(0)}%, Risk: ${analysis.risk}.`;
  }

  prompt += ' [/INST]\n';

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.sender === 'patient') {
        prompt += `[INST] ${msg.text} [/INST]\n`;
      } else {
        prompt += `${msg.text}\n`;
      }
    }
  }

  // Add current user message
  prompt += `[INST] ${currentText} [/INST]\n`;

  return prompt;
}

/**
 * Call LM Studio's local chat API and return the assistant's reply text.
 *
 * LM Studio native API: POST /api/v1/chat
 *   Request:  { model, input: string, temperature, stream }
 *   Response: { output: [{ type: 'message', content: '...' }] }
 *
 * @param {Array<{sender: string, text: string}>} conversationHistory
 * @param {string} currentText
 * @param {{ emotion: string, intensity: number, risk: string }} analysis
 * @returns {Promise<string>} The assistant reply text.
 * @throws {Error} If the request fails or returns an unexpected shape.
 */
async function generateLLMReply(conversationHistory, currentText, analysis) {
  const prompt = buildPrompt(conversationHistory, currentText, analysis);

  const body = {
    model: LMSTUDIO_MODEL,
    input: prompt,
    temperature: 0.7,
    max_tokens: 150,  // Cap output length to reduce response time on CPU
    stream: false,
  };

  const url = `${LMSTUDIO_URL}/api/v1/chat`;

  console.log(`[LMStudioService] Calling ${url} with model=${LMSTUDIO_MODEL}, prompt length=${prompt.length}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 180s timeout (LLM can be slow on CPU)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown');
      throw new Error(`LM Studio returned HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // LM Studio native response: { output: [{ type: 'message', content: '...' }] }
    const reply =
      data?.output?.[0]?.content ||
      data?.choices?.[0]?.message?.content ||
      data?.result ||
      data?.response ||
      null;

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('LM Studio returned an empty or invalid reply.');
    }

    console.log(`[LMStudioService] Got reply (${reply.trim().length} chars)`);
    return reply.trim();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('LM Studio request timed out after 180 seconds.');
    }
    throw err;
  }
}

module.exports = { generateLLMReply, SYSTEM_PROMPT };

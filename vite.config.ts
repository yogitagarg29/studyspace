import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'studybuddy-dev-api',
        configureServer(server) {
          server.middlewares.use(
            async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
              if (req.url === '/api/studybuddy-ai' && req.method === 'POST') {
                const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
                res.setHeader('Content-Type', 'application/json');

                if (!apiKey) {
                  res.statusCode = 500;
                  res.end(
                    JSON.stringify({
                      error: 'no_api_key',
                      message:
                        'StudyBuddy AI is not connected yet — GEMINI_API_KEY is missing from environment variables.',
                    }),
                  );
                  return;
                }

                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                req.on('end', async () => {
                  try {
                    const parsed = JSON.parse(body || '{}');
                    const { messages, temperature } = parsed;
                    const contents = (messages || []).map(
                      (m: { role: string; content: string }) => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                      }),
                    );
                    const temp = Math.min(Math.max(Number(temperature) || 0.7, 0.1), 1.0);

                    const systemPrompt = `You are StudyBuddy AI, a friendly academic study assistant for college students.
You help ONLY with academics: explaining concepts, study plans, exam preparation, practice questions, note-taking, and study techniques.
If the user asks about anything unrelated to studying or academics, politely redirect them back to their studies.
Explain concepts in simple English with clear examples suitable for college students.
Keep answers focused, structured, and encouraging.`;

                    // Primary model
                    const callModel = async (model: string) => {
                      return fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            contents,
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            generationConfig: { temperature: temp },
                          }),
                        },
                      );
                    };

                    let apiRes = await callModel('gemini-2.0-flash');
                    if (!apiRes.ok && (apiRes.status === 404 || apiRes.status === 503)) {
                      apiRes = await callModel('gemini-1.5-flash');
                    }

                    const data = await apiRes.json().catch(() => null);

                    if (apiRes.ok && data?.candidates?.[0]?.content?.parts) {
                      const text = data.candidates[0].content.parts
                        .map((p: { text?: string }) => p.text ?? '')
                        .join('')
                        .trim();
                      res.statusCode = 200;
                      res.end(JSON.stringify({ reply: text }));
                      return;
                    }

                    const err = data?.error;
                    const msg = (err?.message || '').toLowerCase();
                    const reason = (err?.details?.[0]?.reason || '').toUpperCase();
                    const statusStr = (err?.status || '').toUpperCase();

                    let code = 'server_error';
                    let friendly =
                      'The AI service encountered an error. Please try again in a little while.';
                    let status = apiRes.status || 500;

                    if (
                      apiRes.status === 429 ||
                      statusStr === 'RESOURCE_EXHAUSTED' ||
                      msg.includes('quota')
                    ) {
                      code = 'rate_limited';
                      friendly =
                        'StudyBuddy AI rate limit reached. Please wait a minute and try again.';
                      status = 429;
                    } else if (
                      apiRes.status === 401 ||
                      reason === 'API_KEY_INVALID' ||
                      msg.includes('api key not valid')
                    ) {
                      code = 'invalid_key';
                      friendly =
                        'The provided GEMINI_API_KEY is invalid. Please check your key in Google AI Studio.';
                      status = 401;
                    } else if (
                      apiRes.status === 403 ||
                      statusStr === 'PERMISSION_DENIED' ||
                      msg.includes('permission')
                    ) {
                      if (
                        reason === 'SERVICE_DISABLED' ||
                        msg.includes('has not been used in project') ||
                        msg.includes('disabled')
                      ) {
                        code = 'api_disabled';
                        friendly =
                          'The Generative Language API is disabled in your Google Cloud project. Enable it in Google Cloud Console or create an API key in Google AI Studio.';
                        status = 403;
                      } else if (
                        reason === 'API_KEY_SERVICE_BLOCKED' ||
                        msg.includes('blocked by api key restrictions') ||
                        msg.includes('restrictions')
                      ) {
                        code = 'key_restrictions';
                        friendly =
                          'GEMINI_API_KEY has application restrictions (e.g. HTTP referrers or IP restrictions) that block server calls. In Google Cloud Console -> Credentials, set Application Restrictions to "None".';
                        status = 403;
                      } else {
                        code = 'project_restricted';
                        friendly =
                          'Google API rejected the request with PERMISSION_DENIED. Check project restrictions in Google Cloud Console or use Google AI Studio.';
                        status = 403;
                      }
                    }

                    res.statusCode = status;
                    res.end(JSON.stringify({ error: code, message: friendly }));
                  } catch (err) {
                    console.error('[StudyBuddy Dev Server] Error:', err);
                    res.statusCode = 500;
                    res.end(
                      JSON.stringify({
                        error: 'server_error',
                        message: 'Error processing StudyBuddy request.',
                      }),
                    );
                  }
                });
                return;
              }
              next();
            },
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});

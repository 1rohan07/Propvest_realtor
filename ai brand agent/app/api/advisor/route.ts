import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages, systemPrompt, provider, apiKey, model } = await req.json();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No API key provided. Add your API key in Settings." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (provider === "claude") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model ?? "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          stream: true,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model ?? "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      });
      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    if (provider === "perplexity") {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model ?? "llama-3.1-sonar-large-128k-online",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      });
      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    if (provider === "gemini") {
      const geminiMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model ?? "gemini-2.0-flash"}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
          }),
        }
      );
      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported provider" }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "AI request failed. Check your API key." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

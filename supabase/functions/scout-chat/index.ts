import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  message: string;
  history: ChatMessage[];
  context: string;
  systemPrompt: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY not found - returning demo mode message");
      return new Response(
        JSON.stringify({
          message: "I'm currently in demo mode. To get personalized AI responses, please set up the GEMINI_API_KEY in your Supabase Edge Function settings.\n\nIn the meantime, I can still help with general financial guidance!",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          message: "I had trouble understanding your request. Please try again!",
          error: "Invalid request format",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { message, history, context, systemPrompt } = requestBody;

    // Convert chat history to Gemini format
    const geminiHistory = history.slice(-8).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Build the full prompt with system context
    const fullSystemPrompt = systemPrompt + context;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            // System instruction as first user message
            {
              role: "user",
              parts: [{ text: `System Instructions: ${fullSystemPrompt}\n\nPlease acknowledge these instructions and respond to the user's message below.` }],
            },
            {
              role: "model",
              parts: [{ text: "I understand. I'm Scout, your friendly personal financial advisor. I'll be warm, encouraging, and non-judgmental. I'll focus on small wins and actionable steps. How can I help you today?" }],
            },
            // Previous conversation history
            ...geminiHistory,
            // Current user message
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topK: 40,
            topP: 0.95,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", response.status, error);
      return new Response(
        JSON.stringify({
          message: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment!",
          error: `Gemini API returned ${response.status}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm having trouble thinking right now. Please try again!";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scout chat error:", error);

    return new Response(
      JSON.stringify({
        message: "I'm having a moment - please try again! If this keeps happening, check your connection.",
        error: error?.message || "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

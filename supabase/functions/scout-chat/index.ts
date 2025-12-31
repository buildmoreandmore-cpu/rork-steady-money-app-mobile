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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      // Return a helpful fallback if no API key
      return new Response(
        JSON.stringify({
          message: "I'm currently in demo mode. To get personalized AI responses, please set up the OpenAI API key in your Supabase Edge Function settings.\n\nIn the meantime, I can still help with general financial guidance!",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { message, history, context, systemPrompt }: RequestBody = await req.json();

    // Build messages array for OpenAI
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt + context,
      },
      ...history.slice(-8), // Keep last 8 messages for context
      {
        role: "user",
        content: message,
      },
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "I'm having trouble thinking right now. Please try again!";

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
        error: error.message,
      }),
      {
        status: 200, // Return 200 so the app can show the fallback message
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pdf_id, content } = await req.json();

    if (!pdf_id || !content) {
      return new Response(
        JSON.stringify({ error: "Missing pdf_id or content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating AI summary for PDF: ${pdf_id}`);

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an academic document analyzer. Given PDF content, provide:
1. A concise summary (2-3 sentences) of the main topics covered
2. A list of 3-5 key topics/keywords that students would search for

Respond in JSON format:
{
  "summary": "Brief summary here...",
  "topics": ["topic1", "topic2", "topic3"]
}`,
          },
          {
            role: "user",
            content: `Analyze this academic PDF content and provide a summary and key topics:\n\n${content.slice(0, 8000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI Response:", responseContent);

    // Parse the JSON response
    let summary = "";
    let topics: string[] = [];

    try {
      // Try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || "";
        topics = parsed.topics || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      summary = responseContent.slice(0, 500);
    }

    // Update the PDF with AI-generated content
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("pdfs")
      .update({
        ai_summary: summary,
        ai_topics: topics,
      })
      .eq("id", pdf_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated PDF ${pdf_id} with AI summary`);

    return new Response(
      JSON.stringify({ success: true, summary, topics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generate-summary function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateChatCompletionRequest } from "https://esm.sh/@types/openai@3.3.0";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAiConfig = new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const openai = new OpenAIApi(openAiConfig);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, targetAudience, videoStyle, toneOfVoice } = await req.json();

    const prompt = `Generate 5 viral video ideas with research data for ${topic}. Target audience: ${targetAudience}. Video style: ${videoStyle}. Tone of voice: ${toneOfVoice}.

For each idea, include:
1. A catchy title
2. Brief description
3. Research backing:
   - Relevant statistics or data
   - Current trends analysis
   - Similar successful content examples
4. Hashtag suggestions
5. Engagement prediction (based on similar content performance)

Format each idea as a JSON object with these fields:
{
  "title": "string",
  "description": "string",
  "research": {
    "statistics": "string",
    "trends": "string",
    "examples": "string"
  },
  "hashtags": "string",
  "engagementPrediction": "string"
}

Ensure each idea is backed by recent data and trends.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a social media strategist with expertise in creating viral content backed by data and research."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const ideas = JSON.parse(completion.data.choices[0].message?.content || "[]");

    return new Response(
      JSON.stringify({ ideas }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

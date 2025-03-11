
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the OpenAI API key from the environment
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OpenAI API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const { topic, audience, details, isEcommerce, optimizeForViral, brandMarketResearch } = await req.json();

    if (!topic || !audience) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: topic and audience' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the prompt for hook generation with Planzo AI
    const systemPrompt = `You are Planzo AI, a social media expert that specializes in creating viral hooks for short-form videos on platforms like TikTok, Instagram Reels, and YouTube Shorts. Your job is to create compelling hooks that stop viewers from scrolling.`;

    let userPrompt = `Generate 8 different hooks about ${topic} for ${audience}`;

    if (details && details.trim()) {
      userPrompt += `\nAdditional context: ${details}`;
    }

    // Add ecommerce-specific guidance if applicable
    if (isEcommerce) {
      userPrompt += `\n\nThis is for an ecommerce brand selling physical products. Focus on:
      - Product demonstrations
      - Before/after results
      - Social proof and testimonials
      - Limited time offers`;
      
      if (brandMarketResearch) {
        userPrompt += `\n\nSuccessful tactics for similar brands include: ${brandMarketResearch.successfulTactics.join(', ')}`;
        userPrompt += `\n\nPopular content types: ${brandMarketResearch.contentTypes.join(', ')}`;
      }
    }

    userPrompt += `\n\nEach hook should be short (1-2 sentences), attention-grabbing, and designed to make viewers stop scrolling.
    
    Create 2 hooks for each of these categories:
    1. QUESTION hooks: Hooks that pose an intriguing question to the viewer
    2. STATISTIC hooks: Hooks that lead with a surprising statistic or fact
    3. STORY hooks: Hooks that begin with a mini-story or scenario
    4. CHALLENGE hooks: Hooks that challenge a common belief or present a controversial take
    
    FORMAT YOUR RESPONSE AS A JSON ARRAY of objects with "hook" and "explanation" properties:
    [
      {
        "hook": "The actual hook text that would start the video",
        "explanation": "Why this hook works and when to use it"
      },
      // more hooks...
    ]
    
    DO NOT include any text outside of the JSON format. Your entire response should be valid JSON.`;

    // Call the OpenAI API with Planzo AI
    console.log('Calling OpenAI API for hook generation with Planzo AI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using gpt-4o for compatibility with custom instructions
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status} ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Received response from OpenAI');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the response content
    const content = data.choices[0].message.content;
    console.log('Raw response content:', content);

    // Parse hooks from the response
    let hooks = [];
    try {
      // Find JSON in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hooks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in the response');
      }
    } catch (error) {
      console.error('Error parsing hooks JSON:', error);
      
      // Manual parsing as fallback
      const hookPattern = /"hook"\s*:\s*"([^"]*)"\s*,\s*"explanation"\s*:\s*"([^"]*)"/g;
      let match;
      const manuallyExtractedHooks = [];
      
      while ((match = hookPattern.exec(content)) !== null) {
        manuallyExtractedHooks.push({
          hook: match[1],
          explanation: match[2]
        });
      }
      
      if (manuallyExtractedHooks.length > 0) {
        hooks = manuallyExtractedHooks;
      } else {
        // Create default hooks if all parsing fails
        hooks = [
          { hook: "Did you know that 80% of people who try our product become repeat customers?", explanation: "Statistic hook that grabs attention with a specific number" },
          { hook: "Have you ever wondered why some people succeed while others fail?", explanation: "Question hook that engages curiosity" },
          { hook: "I used to struggle with this every day until I discovered this simple trick", explanation: "Story hook that creates relatability" },
          { hook: "Everything you've been told about this industry is wrong. Here's why.", explanation: "Challenge hook that creates controversy" }
        ];
      }
    }

    // Return the hooks
    return new Response(
      JSON.stringify({ hooks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-hooks function:', error);
    return new Response(
      JSON.stringify({ error: `Error generating hooks: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

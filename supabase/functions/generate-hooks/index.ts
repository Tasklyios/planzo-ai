
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
    const { topic, audience, details } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: topic' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Updated system prompt to match Planzo AI's personality and expertise
    const systemPrompt = `You are Planzo AI, a specialist in creating viral-worthy content for social media. You excel at crafting hooks that stop users from scrolling on platforms like TikTok, YouTube Shorts, and Instagram Reels.

You understand audience psychology, engagement triggers, and platform-specific trends. Your hooks are designed to maximize curiosity, emotional response, and viewer retention in the critical first few seconds of a video.`;

    let userPrompt = `Generate EXACTLY 8 different hooks about ${topic}`;
    
    if (audience && audience.trim()) {
      userPrompt += ` for ${audience}`;
    }

    if (details && details.trim()) {
      userPrompt += `\nAdditional context: ${details}`;
    }

    // Specifically request exactly 2 hooks per category
    userPrompt += `\n\nCreate EXACTLY 2 hooks for each of these categories (8 hooks total):
    1. QUESTION hooks: Hooks that pose an intriguing question to the viewer
    2. STATISTIC hooks: Hooks that lead with a surprising statistic or fact
    3. STORY hooks: Hooks that begin with a mini-story or scenario
    4. CHALLENGE hooks: Hooks that challenge a common belief or present a controversial take
    
    FORMAT YOUR RESPONSE AS A JSON ARRAY of objects with "hook", "explanation", and "category" properties:
    [
      {
        "hook": "The actual hook text that would start the video",
        "explanation": "Why this hook works and when to use it",
        "category": "question"
      },
      // more hooks...
    ]
    
    The category MUST be one of: "question", "statistic", "story", or "challenge".
    Make sure to create EXACTLY 2 hooks for each category.
    DO NOT include any text outside of the JSON format. Your entire response should be valid JSON.`;

    // Call the OpenAI API
    console.log('Calling OpenAI API for hook generation...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
      const hookPattern = /"hook"\s*:\s*"([^"]*)"\s*,\s*"explanation"\s*:\s*"([^"]*)"\s*,\s*"category"\s*:\s*"([^"]*)"/g;
      let match;
      const manuallyExtractedHooks = [];
      
      while ((match = hookPattern.exec(content)) !== null) {
        manuallyExtractedHooks.push({
          hook: match[1],
          explanation: match[2],
          category: match[3]
        });
      }
      
      if (manuallyExtractedHooks.length > 0) {
        hooks = manuallyExtractedHooks;
      } else {
        // Create default hooks if all parsing fails - exactly 2 per category
        hooks = [
          { hook: "Did you know that most people get this wrong about your topic?", explanation: "Question hook that creates curiosity", category: "question" },
          { hook: "What's the one thing about this topic that even experts miss?", explanation: "Question hook that positions viewer to learn something valuable", category: "question" },
          { hook: "Studies show that 87% of people never know this about your topic.", explanation: "Statistic hook that grabs attention", category: "statistic" },
          { hook: "Only 1% of people know this game-changing tip.", explanation: "Statistic hook that creates exclusivity", category: "statistic" },
          { hook: "I tried this for 30 days straight. Here's what happened.", explanation: "Story hook that builds interest", category: "story" },
          { hook: "When I first started with this, I made every mistake possible.", explanation: "Story hook that creates relatability", category: "story" },
          { hook: "Everything you've been told about this is wrong. Here's why.", explanation: "Challenge hook that creates controversy", category: "challenge" },
          { hook: "This popular approach is actually sabotaging your results.", explanation: "Challenge hook that challenges conventional wisdom", category: "challenge" }
        ];
      }
    }

    // Ensure we have exactly 2 hooks per category
    const categorizedHooks = {
      question: [],
      statistic: [],
      story: [],
      challenge: []
    };

    // Normalize category names and distribute hooks
    hooks.forEach(hook => {
      let category = hook.category?.toLowerCase() || '';
      
      // Map similar categories to our standard ones
      if (category === 'benefit' || category === 'problem-solution' || category === 'controversial') {
        category = 'challenge';
      }
      
      if (!['question', 'statistic', 'story', 'challenge'].includes(category)) {
        // Assign a default category if none/invalid provided
        if (hook.hook.includes('?')) {
          category = 'question';
        } else if (hook.hook.match(/\d+%/) || hook.hook.match(/\d+ out of \d+/) || 
                  hook.hook.includes("studies show") || hook.hook.includes("research")) {
          category = 'statistic';
        } else if (hook.hook.includes("I ") || hook.hook.includes("when ") || 
                  hook.hook.includes("imagine") || hook.hook.includes("story")) {
          category = 'story';
        } else {
          category = 'challenge';
        }
      }
      
      // Only add if we have less than 2 hooks in this category
      if (categorizedHooks[category].length < 2) {
        categorizedHooks[category].push({
          ...hook,
          category,
          id: crypto.randomUUID()
        });
      }
    });
    
    // If any category has less than 2 hooks, add default ones
    const defaultHooks = {
      question: [
        "Did you know that most people get this wrong about your topic?",
        "What's the one thing about this topic that even experts miss?"
      ],
      statistic: [
        "Studies show that 87% of people never know this about your topic.",
        "Only 1% of people know this game-changing tip."
      ],
      story: [
        "I tried this for 30 days straight. Here's what happened.",
        "When I first started with this, I made every mistake possible."
      ],
      challenge: [
        "Everything you've been told about this is wrong. Here's why.",
        "This popular approach is actually sabotaging your results."
      ]
    };
    
    Object.keys(categorizedHooks).forEach(category => {
      while (categorizedHooks[category].length < 2) {
        const index = categorizedHooks[category].length;
        categorizedHooks[category].push({
          hook: defaultHooks[category][index],
          explanation: `Default ${category} hook ${index + 1}`,
          category,
          id: crypto.randomUUID()
        });
      }
    });
    
    // Flatten the categorized hooks back into an array
    const finalHooks = [
      ...categorizedHooks.question,
      ...categorizedHooks.statistic,
      ...categorizedHooks.story,
      ...categorizedHooks.challenge
    ];

    // Return the hooks
    return new Response(
      JSON.stringify({ hooks: finalHooks }),
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

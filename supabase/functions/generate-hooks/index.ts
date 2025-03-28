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
    const { topic, audience, details, selectedHookTypes = ["question", "statistic", "story", "challenge"] } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: topic' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate selected hook types
    const validHookTypes = selectedHookTypes.filter(type => 
      ["question", "statistic", "story", "challenge"].includes(type)
    );

    if (validHookTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one valid hook type must be selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate hooks per type (always 4 hooks total regardless of how many types are selected)
    const totalHooks = 4;
    const hooksPerType = Math.floor(totalHooks / validHookTypes.length);
    let remainingHooks = totalHooks % validHookTypes.length;
    
    const hookAllocation = validHookTypes.reduce((acc, type) => {
      acc[type] = hooksPerType;
      if (remainingHooks > 0) {
        acc[type]++;
        remainingHooks--;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log("Hook allocation:", hookAllocation);

    // Simplified system prompt to reduce token usage
    const systemPrompt = `You create viral hooks for social media. Generate engaging openers for videos on platforms like TikTok and Instagram Reels.`;

    // More concise user prompt
    let userPrompt = `Generate ${totalHooks} hooks about ${topic}`;
    
    if (audience && audience.trim()) {
      userPrompt += ` for ${audience}`;
    }

    if (details && details.trim()) {
      userPrompt += `\nContext: ${details}`;
    }

    // Create prompt with specific allocation instructions
    userPrompt += `\n\nDistribute ${totalHooks} hooks as follows:`;
    
    for (const [type, count] of Object.entries(hookAllocation)) {
      if (count > 0) {
        userPrompt += `\n- ${count} ${type.toUpperCase()} hooks`;
      }
    }
    
    userPrompt += `\n
FORMAT AS JSON:
[
  {
    "hook": "The hook text",
    "explanation": "Brief explanation",
    "category": "${validHookTypes[0]}"
  }
]
Categories must be: ${validHookTypes.map(t => `"${t}"`).join(", ")}.
Response must be valid JSON only.`;

    // Call the OpenAI API with gpt-4o-mini
    console.log('Calling OpenAI API for hook generation');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Changed to mini version
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800, // Reduced token limit
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
        // Create default hooks - matching the requested allocation
        hooks = [];
        for (const [type, count] of Object.entries(hookAllocation)) {
          for (let i = 0; i < count; i++) {
            const defaultHook = getDefaultHook(type, topic, i);
            hooks.push(defaultHook);
          }
        }
      }
    }

    // Ensure we have the exact allocation of hooks per category
    const categorizedHooks: Record<string, any[]> = {};
    validHookTypes.forEach(type => {
      categorizedHooks[type] = [];
    });

    // First, categorize existing hooks
    hooks.forEach(hook => {
      const category = hook.category?.toLowerCase() || '';
      if (validHookTypes.includes(category) && categorizedHooks[category].length < hookAllocation[category]) {
        categorizedHooks[category].push({
          ...hook,
          id: crypto.randomUUID()
        });
      }
    });

    // Fill in any missing hooks with defaults
    for (const [type, count] of Object.entries(hookAllocation)) {
      while (categorizedHooks[type].length < count) {
        const index = categorizedHooks[type].length;
        const defaultHook = getDefaultHook(type, topic, index);
        categorizedHooks[type].push({
          ...defaultHook,
          id: crypto.randomUUID()
        });
      }
    }
    
    // Flatten the categorized hooks back into an array
    const finalHooks = Object.values(categorizedHooks).flat();

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

// Helper function to get default hooks when needed
function getDefaultHook(type: string, topic: string, index: number) {
  switch (type) {
    case "question":
      return index === 0 
        ? { 
            hook: `Did you know that most people get this wrong about ${topic}?`, 
            explanation: "Question hook that creates curiosity", 
            category: "question" 
          }
        : { 
            hook: `What's the one thing about ${topic} that even experts miss?`, 
            explanation: "Question hook that positions viewer to learn something valuable", 
            category: "question" 
          };
    
    case "statistic":
      return index === 0 
        ? { 
            hook: `Studies show that 87% of people never know this about ${topic}.`, 
            explanation: "Statistic hook that grabs attention", 
            category: "statistic" 
          }
        : { 
            hook: `Only 1% of people know this game-changing tip about ${topic}.`, 
            explanation: "Statistic hook that creates exclusivity", 
            category: "statistic" 
          };
      
    case "story":
      return index === 0 
        ? { 
            hook: `I tried ${topic} for 30 days straight. Here's what happened.`, 
            explanation: "Story hook that builds interest", 
            category: "story" 
          }
        : { 
            hook: `When I first started with ${topic}, I made every mistake possible.`, 
            explanation: "Story hook that creates relatability", 
            category: "story" 
          };
      
    case "challenge":
      return index === 0 
        ? { 
            hook: `Everything you've been told about ${topic} is wrong. Here's why.`, 
            explanation: "Challenge hook that creates controversy", 
            category: "challenge" 
          }
        : { 
            hook: `This popular approach to ${topic} is actually sabotaging your results.`, 
            explanation: "Challenge hook that challenges conventional wisdom", 
            category: "challenge" 
          };
      
    default:
      return { 
        hook: `The ultimate guide to ${topic} that nobody is talking about.`, 
        explanation: "Generic hook that creates curiosity", 
        category: type 
      };
  }
}

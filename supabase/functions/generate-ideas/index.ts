
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONTENT_PATTERNS = {
  hook_templates: [
    "New research shows that {topic}...",
    "I analyzed {number} successful {platform} creators and found that...",
    "The hidden psychology behind why {topic} actually works...",
    "Here's what {number} years of data reveals about {topic}...",
    "I tested {topic} for 30 days, here's what happened...",
  ],
  structure_templates: [
    {
      type: "data_driven",
      format: [
        "Hook with data point",
        "Present problem/misconception",
        "Share research/evidence",
        "Actionable takeaway",
        "Call to action"
      ]
    },
    {
      type: "case_study",
      format: [
        "Specific result/outcome",
        "Initial situation",
        "Key turning point",
        "Implementation steps",
        "Proof/validation"
      ]
    },
    {
      type: "myth_busting",
      format: [
        "Common belief statement",
        "Why it's wrong (data)",
        "Real mechanism/truth",
        "Better approach",
        "Implementation tip"
      ]
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    if (requestData.type === 'script') {
      const { title, description, category, tags, toneOfVoice, duration, additionalNotes } = requestData;

      // Calculate optimal script length based on duration
      const wordsPerSecond = 2.5; // Average speaking rate
      const targetWordCount = Math.floor(duration * wordsPerSecond);

      const scriptPrompt = `Create a high-performing ${duration}-second script for ${platform} based on proven content strategies.

Title: ${title}
Description: ${description}
Category: ${category}
Target Word Count: ${targetWordCount}

Requirements:
1. Focus on data-driven insights and specific results
2. Use pattern interrupts every 2-3 sentences
3. Include B-roll suggestions that create scroll-stopping visuals
4. Maintain high information density with zero fluff
5. Use ${toneOfVoice} tone while staying authentic
6. Include specific numbers and percentages when relevant
7. Format visual directions with [VISUAL_GUIDE] tags

Content Structure:
- First 3 seconds must hook viewer with concrete value
- Focus on one clear insight/takeaway
- End with clear next step or call-to-action
- Keep each segment 2-3 sentences max
- Use strategic pauses for emphasis

Additional Context: ${additionalNotes}

Example Format:
Here's the research-backed script text.
[VISUAL_GUIDE]Overlay key statistic with dynamic typography[/VISUAL_GUIDE]
Next part of the script with specific data point.
[VISUAL_GUIDE]Split screen comparison showing before/after[/VISUAL_GUIDE]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert content strategist who creates high-performing scripts based on proven data from top creators.
              Focus on:
              - Opening with concrete value/results
              - Using specific numbers and data points
              - Creating pattern interrupts
              - Maintaining high information density
              - Suggesting scroll-stopping visuals
              - Writing in a natural, authentic voice
              Never use:
              - Clickbait or misleading hooks
              - Vague statements without backup
              - Overused phrases or clichés
              - Unnecessary buildup or fluff`
            },
            { role: 'user', content: scriptPrompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      console.log("OpenAI script response received");

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI');
      }

      return new Response(
        JSON.stringify({ script: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle idea generation with improved templates
    const { niche, audience, videoType, platform, customIdeas } = requestData;
    console.log("Generating ideas with params:", { niche, audience, videoType, platform, customIdeas });

    const prompt = `Generate 5 high-performing ${platform} video ideas for ${audience} in the ${niche} niche focusing on ${videoType} content.

Use these proven content frameworks:
1. Data-Driven Content: Share specific insights backed by research/testing
2. Process Deconstruction: Break down complex topics into actionable steps
3. Myth Busting: Challenge common misconceptions with evidence
4. Case Studies: Share specific results and implementation details
5. Comparative Analysis: Test different approaches and show clear results

Each idea must include:
- A hook based on concrete value/results
- Specific numbers or data points
- Clear transformation or takeaway
- Unique visual hook concept

Format as JSON:
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "category": "string",
      "tags": ["string"]
    }
  ]
}

Focus on:
- Opening with specific results/data
- Creating pattern interrupts
- High information density
- Scroll-stopping moments
- Clear value proposition

Avoid:
- Clickbait or misleading titles
- Vague or generic content
- Overused formats
- Purely entertainment content

${customIdeas ? `\nConsider these custom ideas as reference:\n${customIdeas}` : ''}`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a data-driven content strategist who creates high-performing ideas based on proven strategies from successful creators. Focus on specific results, clear value, and unique angles.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response received");

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const parsedContent = JSON.parse(data.choices[0].message.content);
    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

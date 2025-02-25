
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// High-performing hook patterns based on viral content
const HOOK_PATTERNS = [
  "Here's the one thing {topic} that nobody talks about...",
  "I made {result} in {timeframe} using this {strategy}...",
  "Watch how I {action} in less than {timeframe}...",
  "The truth about {topic} that {audience} needs to know...",
  "Here's how much {metric} as a {role}...",
  "{number} things I wish I knew before {action}...",
];

// Content structures that consistently perform well
const CONTENT_STRUCTURES = [
  {
    type: "story_reveal",
    format: [
      "Hook with unexpected result/situation",
      "Quick backstory/context",
      "Key turning point or realization",
      "Specific action taken",
      "Results and proof",
      "Call to action"
    ]
  },
  {
    type: "day_in_life",
    format: [
      "Attention-grabbing moment",
      "Time-stamped activities",
      "Behind-the-scenes reality",
      "Unexpected challenges",
      "Key learning or result"
    ]
  },
  {
    type: "contrarian_take",
    format: [
      "Challenge common belief",
      "Personal experience/proof",
      "Why conventional wisdom fails",
      "Better alternative",
      "How to implement"
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    if (requestData.type === 'script') {
      const { title, description, category, tags, toneOfVoice, duration, additionalNotes, platform } = requestData;

      const scriptPrompt = `Create a viral ${duration}-second ${platform || 'social media'} script that hooks viewers instantly and keeps them watching.

Title: ${title}
Description: ${description}
Category: ${category}

Use these proven content strategies from top creators:

Key Elements:
1. Start with an unexpected statement or result
2. Create curiosity gaps that make viewers need to know more
3. Use personal experience or specific numbers to build credibility
4. Show behind-the-scenes or "hidden" information
5. Include pattern interrupts every 3-5 seconds
6. End with clear value and next steps

Content Style:
- Natural, conversational tone (like talking to a friend)
- Fast-paced with quick cuts
- Show, don't tell (use visuals to prove points)
- Create "wait, what?" moments
- Use analogies to explain complex topics
- Break the fourth wall occasionally

Hook Examples:
"Here's the one thing you actually need to know to blow up on instagram"
"Here's how much money I spend in a day as a 15 year old in school owning a 6 figure business"
"Is it possible to launch a tech startup and make money from it on day one?"

Format your response as a complete script with [VISUAL] tags for visual directions and [TEXT] tags for on-screen text.

Additional Context: ${additionalNotes || ''}`;

      console.log("Sending script generation prompt to OpenAI");

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
              content: `You are a viral content creator who consistently gets millions of views. You create engaging, authentic content that hooks viewers instantly and delivers real value. You specialize in:
              - Story-driven hooks that create immediate curiosity
              - Pattern interrupts that keep attention
              - Personal experiences and specific results
              - Behind-the-scenes reality
              - Clear, actionable takeaways
              Never use:
              - Generic or cliché phrases
              - Corporate or formal language
              - Vague statements without proof
              - Complex explanations
              - Traditional essay structure`
            },
            { role: 'user', content: scriptPrompt }
          ],
          temperature: 0.8,
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

    // Handle idea generation
    const { niche, audience, videoType, platform, customIdeas } = requestData;
    console.log("Generating ideas with params:", { niche, audience, videoType, platform, customIdeas });

    const prompt = `Generate 5 viral ${platform} video ideas for ${audience} in the ${niche} niche.

Use these high-performing video formats as inspiration:
[
  {
    "title": "Here's how I made $10k in 24 hours with zero audience",
    "description": "A step-by-step walkthrough of launching a digital product and making the first sale within a day, focusing on specific tactics and real numbers.",
    "category": "Business",
    "tags": [
      "startup",
      "entrepreneurship",
      "business"
    ]
  },
  {
    "title": "I tracked every minute of my day for a month as a tech CEO",
    "description": "Behind-the-scenes look at real startup life, with surprising insights about productivity and work-life balance.",
    "category": "Day in Life",
    "tags": [
      "productivity",
      "startup",
      "lifestyle"
    ]
  },
  {
    "title": "3 things I wish I knew before raising $1M for my startup",
    "description": "Raw, honest take on the fundraising process with specific mistakes and learnings from personal experience.",
    "category": "Business",
    "tags": [
      "startup",
      "investing",
      "business"
    ]
  }
]

${customIdeas ? `\nAlso consider these custom ideas as inspiration:\n${customIdeas}` : ''}

Key elements each idea must include:
- Title: Use curiosity gaps, numbers, or emotional triggers
- Description: Clear value proposition and hook
- Category: Specific content type
- Tags: Relevant, trending hashtags (without # symbol)

Focus on: 
- Problem-solution format
- Relatable situations
- Behind-the-scenes reveals
- Specific results and numbers
- Personal experiences
- Day-in-life content
- Testing/comparison content

Format as JSON with exactly the same structure as the examples above.`;

    console.log("Sending idea generation prompt to OpenAI");

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
            content: 'You are a successful content creator who consistently goes viral by sharing authentic, value-driven content with specific results and personal experiences. Focus on hooks that create immediate curiosity and deliver real transformation.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
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

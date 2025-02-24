
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIRAL_VIDEO_EXAMPLES = [
  {
    title: "I Tried the Viral Productivity Hack That Made Me 10x More Efficient",
    description: "Testing the '2-minute rule' productivity technique with shocking results. From procrastination to getting everything done, here's what changed.",
    category: "Productivity",
    tags: ["productivity", "lifehack", "studytips"]
  },
  {
    title: "5 Morning Habits That Changed My Life (With Real Results)",
    description: "A morning routine experiment showing the impact of 5 science-backed habits. Including before/after energy levels and productivity metrics.",
    category: "Lifestyle",
    tags: ["morningroutine", "selfimprovement", "habits"]
  },
  {
    title: "What Happens When You Drink a Gallon of Water Daily for 30 Days",
    description: "A month-long experiment documenting the physical and mental changes from increasing water intake, with surprising transformation results.",
    category: "Health",
    tags: ["waterchallenge", "wellness", "transformation"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, audience, videoType, platform, customIdeas, type } = await req.json();

    let prompt;
    if (type === 'script') {
      prompt = `Create a viral video script for ${platform} that will captivate ${audience} interested in ${niche}. This is for a ${videoType} video.

Key elements to include:
1. Hook (first 3 seconds): Create an attention-grabbing opening
2. Problem/Promise: Clearly state what the viewer will learn/gain
3. Credibility: Why should they listen to you
4. Main Content: Deliver value in a structured way
5. Call to Action: Clear next step for viewers

Format the script with clear sections and timing markers.
Make it conversational, energetic, and include pattern interrupts to maintain attention.
Keep sentences short and punchy for social media.
Include transitions and visual cues in [brackets].

For reference, successful ${platform} videos in this niche use these techniques:
- Start with a strong hook ("You've been doing [common task] wrong...")
- Use curiosity gaps ("Wait until you see what happens at 0:45...")
- Show before/after or transformation
- Include specific numbers/stats
- Use storytelling elements

Make the script between 30-60 seconds for optimal engagement.`;

    } else {
      prompt = `Generate 5 viral video ideas for ${platform} targeting ${audience} in the ${niche} niche. These should be ${videoType} style videos.

Your response must be valid JSON matching this structure exactly:
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

Use these high-performing video formats as inspiration:
${JSON.stringify(VIRAL_VIDEO_EXAMPLES, null, 2)}

${customIdeas ? `\nAlso consider these custom ideas as inspiration:\n${customIdeas}` : ''}

Key elements each idea must include:
- Title: Use curiosity gaps, numbers, or emotional triggers
- Description: Clear value proposition and hook
- Category: Specific content type
- Tags: Relevant, trending hashtags (without # symbol)

Focus on: 
- Problem-solution format
- Relatable situations
- Data-driven insights
- Transformation stories
- Behind-the-scenes reveals
- Testing viral trends/hacks`;
    }

    console.log("Sending request to OpenAI with prompt:", prompt);

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
            content: type === 'script' 
              ? 'You are an expert viral video scriptwriter who creates engaging social media content. Focus on hooks, pattern interrupts, and clear value delivery.'
              : 'You are a viral content strategist who creates trending social media ideas. Always output valid JSON matching the example structure exactly.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    if (type === 'script') {
      // For scripts, return the raw content
      return new Response(JSON.stringify({ script: data.choices[0].message.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // For ideas, parse as JSON
      try {
        const parsedContent = JSON.parse(data.choices[0].message.content);
        return new Response(JSON.stringify(parsedContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        console.log('Raw content:', data.choices[0].message.content);
        throw new Error('Failed to parse OpenAI response as JSON');
      }
    }

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

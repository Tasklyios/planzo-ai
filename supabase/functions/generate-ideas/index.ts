import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    if (requestData.type === 'script') {
      const { title, description, category, tags, toneOfVoice, duration, additionalNotes } = requestData;
      const prompt = `Create a compelling video script based on the following parameters:

Title: ${title}
Description: ${description}
Category: ${category}
Tags: ${tags?.join(', ')}
Tone of Voice: ${toneOfVoice}
Duration: ${duration} seconds
Additional Notes: ${additionalNotes}

The script should:
1. Match the specified tone of voice (${toneOfVoice})
2. Be optimized for a ${duration}-second video
3. Include clear sections marked with timestamps
4. Address the core topic while maintaining engagement
5. Include pattern interrupts and hooks
6. Reference the contextual information from tags and category

Format the script with:
- [HOOK] section at the start
- [TIMESTAMPS] for each major section
- [VISUAL CUES] for transitions or special effects
- [CTA] at the end

Keep the pacing appropriate for the ${duration}-second duration.`

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
              content: `You are a professional video script writer who creates engaging scripts
              that perfectly match the requested tone, duration, and topic while maintaining
              viewer engagement. You always include proper timing markers and visual cues.`
            },
            { role: 'user', content: prompt }
          ],
        }),
      })

      const data = await response.json()
      return new Response(
        JSON.stringify({ error: "Script generation not implemented" }),
        { 
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle idea generation
    const { niche, audience, videoType, platform, customIdeas } = requestData;
    console.log("Generating ideas with params:", { niche, audience, videoType, platform, customIdeas });

    const prompt = `Generate 5 viral video ideas for ${platform} targeting ${audience} in the ${niche} niche. These should be ${videoType} style videos.

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
            content: 'You are a viral content strategist who creates trending social media ideas. Always output valid JSON matching the example structure exactly.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response received:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid OpenAI response:", data);
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed OpenAI response:", parsedContent);
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

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

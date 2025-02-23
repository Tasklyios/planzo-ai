
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIRAL_IDEA_EXAMPLES = [
  {
    title: "I Tested 100 Dating App Bios and This One Got the Most Matches",
    description: "A data-driven experiment testing different dating app bios, revealing the psychology behind what makes people swipe right. Including surprising statistics and real user reactions.",
    category: "Dating & Relationships",
    tags: ["datingapps", "relationships", "experiment"]
  },
  {
    title: "How I Made $10,000 in 24 Hours with This Side Hustle",
    description: "Step-by-step breakdown of a unique side hustle opportunity, showing real earnings, time investment, and actionable steps viewers can take.",
    category: "Finance",
    tags: ["sidehustle", "makemoney", "finance"]
  }
];

const SCRIPT_EXAMPLES = [
  `Hook: "I'm about to show you how I turned my phone addiction into a $5,000/month business"

Main Points:
1. Story hook: Show phone screen time of 8 hours/day
2. Problem identification: "Like many of you, I was wasting hours on social media"
3. Discovery moment: "Then I realized I could monetize my screen time"

Key Moments:
- Screenshot evidence of earnings
- Quick tutorial section
- Common mistakes to avoid
- Success stories from students

Call to Action: "Follow for part 2 where I show the exact apps I used"`,
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, audience, videoType, platform, type, title, description, tags } = await req.json();

    let prompt = '';
    if (type === 'script') {
      prompt = `Create a viral ${platform} script for a video with the following details:
Title: ${title}
Description: ${description}
Tags: ${tags?.join(', ')}

Use this format and style for the script:
${SCRIPT_EXAMPLES[0]}

Make sure to:
1. Start with a powerful hook that stops the scroll
2. Include specific, actionable information
3. Build curiosity and engagement
4. End with a strong call to action
5. Keep sentences short and punchy
6. Use casual, conversational language
7. Include emotional triggers and pattern interrupts

Format the response as a structured script with clear sections.`;
    } else {
      prompt = `Generate 5 viral ${platform} video ideas for the ${niche} niche targeting ${audience} who are interested in ${videoType}.

Here are examples of viral video formats and structures:
${JSON.stringify(VIRAL_IDEA_EXAMPLES, null, 2)}

For each idea:
1. Create a curiosity-gap title that makes viewers want to click
2. Write a compelling description that outlines the value viewers will get
3. Include relevant category and tags
4. Focus on trending topics and viral potential
5. Use these content types that work well:
   - Experiments and tests with surprising results
   - Personal experience stories with clear outcomes
   - Step-by-step tutorials with unique twists
   - Data-driven insights and discoveries
   - Myth-busting and misconception correction
   - Before/after transformations
   - "I tried X for Y days" challenges

Format each idea exactly like the examples above, maintaining the same structure.`;
    }

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
            content: `You are an expert social media content strategist specializing in creating viral ${platform} content. You understand what makes content go viral and how to structure it for maximum engagement. Write in a casual, engaging tone that resonates with ${platform} users.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse the response based on the type
    if (type === 'script') {
      return new Response(
        JSON.stringify({ script: generatedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Parse the ideas from the generated content
      const ideas = JSON.parse(generatedContent);
      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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

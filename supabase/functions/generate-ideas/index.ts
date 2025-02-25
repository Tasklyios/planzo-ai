import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
          model: 'gpt-4o',  // Changed from gpt-4o-mini to gpt-4o
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

    const prompt = `Generate 5 viral ${platform} video ideas that target ${audience} in the ${niche} niche.

Create ideas based on these proven formats:
1. "Here's how I made $10k in 24 hours with zero audience"
2. "I tested every viral ${niche} hack so you don't have to"
3. "Here's what ${audience} actually wants (based on real data)"
4. "The truth about ${niche} that nobody talks about"
5. "How I went from zero to success in ${niche} (real numbers)"

Key requirements for each idea:
- Must hook viewers in first 3 seconds
- Include specific numbers or results
- Focus on real experiences/data
- Create instant curiosity
- Provide actionable value

Format response as JSON with this structure:
{
  "ideas": [
    {
      "title": "string (attention-grabbing hook)",
      "description": "string (specific value proposition)",
      "category": "string (content type)",
      "tags": ["string"] (3-5 relevant keywords)
    }
  ]
}

${customIdeas ? `\nUse these custom ideas as additional inspiration:\n${customIdeas}` : ''}`;

    console.log("Sending idea generation prompt to OpenAI");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert content strategist who creates viral ideas based on proven formulas. You focus on:
            - Hooks that create instant curiosity
            - Specific results and numbers
            - Behind-the-scenes insights
            - Data-driven approaches
            - Personal experiences
            Never use:
            - Generic/vague statements
            - Clickbait without substance
            - Overused phrases
            - Complex jargon`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response received:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed OpenAI response:", parsedContent);

      if (!parsedContent.ideas || !Array.isArray(parsedContent.ideas)) {
        throw new Error('Invalid response format from AI');
      }

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to generate ideas. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

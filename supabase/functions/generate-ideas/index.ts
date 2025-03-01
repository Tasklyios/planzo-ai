
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import 'https://deno.land/x/xhr@0.1.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_API_HOST = 'https://api.openai.com'
const OPENAI_API_PATH = '/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4o-mini'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Edge function called: generate-ideas')
    const { niche, audience, videoType, platform, customIdeas } = await req.json()
    
    console.log('Request parameters:', { niche, audience, videoType, platform, customIdeas })
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    if (!niche || !audience || !videoType || !platform) {
      throw new Error('Missing required parameters: niche, audience, videoType, and platform are required')
    }

    let promptContent = `Generate 5 viral video ideas for ${platform} with the following criteria:
    - Niche: ${niche}
    - Target Audience: ${audience}
    - Video Type: ${videoType}
    
    For each idea, provide:
    - A catchy title (max 60 chars)
    - A brief description (2-3 sentences)
    - Category (e.g., Educational, Entertainment, Tutorial, etc.)
    - 3 relevant hashtags (without the # symbol)
    
    Format the response as JSON with this structure:
    {
      "ideas": [
        {
          "title": "string",
          "description": "string",
          "category": "string",
          "tags": ["string", "string", "string"]
        }
      ]
    }`

    // Add custom ideas if provided
    if (customIdeas && customIdeas.trim()) {
      promptContent += `\n\nIncorporate these custom idea themes if possible: ${customIdeas}`
    }

    console.log('Sending request to OpenAI')
    
    const response = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'You are a social media content strategist who helps creators make viral content. Respond only with the requested JSON format.'
          },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.7,
      }),
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('Error from OpenAI:', responseData)
      throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`)
    }

    if (!responseData.choices || !responseData.choices[0].message) {
      throw new Error('Invalid response from OpenAI')
    }

    const ideasText = responseData.choices[0].message.content
    
    console.log('Received response from OpenAI')
    
    try {
      // Parse the ideas from the response - handle different possible formats
      let ideas
      
      // Try to parse the entire response as JSON first
      try {
        ideas = JSON.parse(ideasText)
      } catch (e) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = ideasText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (jsonMatch && jsonMatch[1]) {
          ideas = JSON.parse(jsonMatch[1].trim())
        } else {
          throw new Error('Could not parse JSON from OpenAI response')
        }
      }
      
      // Return the ideas
      return new Response(
        JSON.stringify(ideas),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } catch (e) {
      console.error('Failed to parse JSON from OpenAI:', e)
      console.log('Raw response:', ideasText)
      throw new Error('Failed to parse ideas from AI response')
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

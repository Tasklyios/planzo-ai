
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import 'https://deno.land/x/xhr@0.1.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenAI API configuration
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
    const { type, title, description, category, tags, toneOfVoice, duration, additionalNotes, message, script, conversation } = await req.json()
    
    // Handle different types of generation requests
    if (type === 'ideas') {
      return await generateIdeas(title, description, category)
    } else if (type === 'script') {
      return await generateScript(title, description, category, tags, toneOfVoice, duration, additionalNotes)
    } else if (type === 'script_coach') {
      return await scriptCoach(message, script, conversation || [])
    } else {
      throw new Error('Invalid generation type')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateIdeas(title: string, description: string, category: string) {
  const systemPrompt = `You are a creative content strategist helping to generate engaging video ideas.
  Based on the title, description, and category provided, generate 5 unique and creative video ideas.
  Each idea should include:
  1. A catchy title (max 60 chars)
  2. A brief description (2-3 sentences)
  3. A list of 3-5 relevant hashtags
  4. A suggested platform (TikTok, Instagram, YouTube Short, etc.)
  
  Format the ideas as JSON, structured as an array of objects with title, description, tags, and platform.`

  const userPrompt = `Title: ${title}
  Description: ${description}
  Category: ${category}
  
  Please generate 5 creative content ideas based on this information.`

  const response = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    }),
  })

  const responseData = await response.json()
  const ideasText = responseData.choices[0].message.content
  
  try {
    // Parse the ideas from the response
    const ideas = JSON.parse(ideasText.replace(/```json|```/g, '').trim())
    
    return new Response(
      JSON.stringify({ ideas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('Failed to parse JSON from OpenAI:', e)
    console.log('Raw response:', ideasText)
    throw new Error('Failed to parse ideas from AI response')
  }
}

async function generateScript(
  title: string, 
  description: string, 
  category: string, 
  tags: string[],
  toneOfVoice: string = 'conversational',
  duration: number = 60,
  additionalNotes: string = ''
) {
  const systemPrompt = `You are a professional script writer for social media videos.
  You'll be creating a script for a video with the following details:
  - Title: ${title}
  - Description: ${description}
  - Category: ${category}
  - Tags: ${tags.join(', ')}
  - Tone of voice: ${toneOfVoice}
  - Target duration: ${duration} seconds
  - Additional notes: ${additionalNotes}
  
  Create a script that includes:
  1. A strong hook
  2. The main content, clearly organized and written in a ${toneOfVoice} tone
  3. A clear call-to-action
  
  Also include [VISUAL_GUIDE] tags around visual directions or camera instructions.
  For example: [VISUAL_GUIDE]Show product close-up[/VISUAL_GUIDE]
  
  Make sure the script is appropriately timed for a ${duration}-second video.`

  const response = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please write a script for a video about "${title}".` }
      ],
      temperature: 0.7,
    }),
  })

  const responseData = await response.json()
  const script = responseData.choices[0].message.content
  
  return new Response(
    JSON.stringify({ script }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function scriptCoach(message: string, script: string, conversation: Array<{role: string, content: string}>) {
  // Create a meaningful conversation history for the model
  const formattedConversation = conversation.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  // If it's the first message, add more context
  if (formattedConversation.length <= 1) {
    formattedConversation.unshift({
      role: 'system',
      content: `You are an AI Script Coach, an expert in video scriptwriting.
      Your job is to help the user improve their scripts by providing feedback, suggestions, and answering their questions.
      
      The current script is:
      
      ${script}
      
      When asked for improvements or edits, always explain your reasoning and provide specific suggestions.
      If the user asks for a rewrite or specific change, you can provide an updated version of the script.
      Be encouraging and helpful. Focus on making the script more engaging, clear, and effective for the target audience.`
    });
  } else {
    // For ongoing conversations, just add the system reminder but less verbose
    formattedConversation.unshift({
      role: 'system',
      content: `You are an AI Script Coach helping improve video scripts. The current script is: ${script}`
    });
  }

  // Add the latest user message
  formattedConversation.push({
    role: 'user',
    content: message
  });

  const shouldGenerateNewScript = message.toLowerCase().includes('rewrite') || 
                                  message.toLowerCase().includes('improve the script') || 
                                  message.toLowerCase().includes('edit the script') ||
                                  message.toLowerCase().includes('revise');

  try {
    const response = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: formattedConversation,
        temperature: 0.7,
      }),
    });

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }
    
    const aiResponse = responseData.choices[0].message.content;
    
    // If the user requested a rewrite, generate an updated script as well
    let updatedScript = null;
    
    if (shouldGenerateNewScript) {
      const scriptUpdateResponse = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
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
              content: `You are a professional script editor. 
              Based on the following conversation, create an improved version of the script.
              Maintain the same structure with [VISUAL_GUIDE] tags and any other special formatting.
              Only return the improved script, nothing else.` 
            },
            { role: 'user', content: `Original script: ${script}` },
            { role: 'user', content: `Improvement request: ${message}` },
            { role: 'user', content: `Feedback from coach: ${aiResponse}` }
          ],
          temperature: 0.7,
        }),
      });
      
      const scriptData = await scriptUpdateResponse.json();
      updatedScript = scriptData.choices[0].message.content;
    }
    
    return new Response(
      JSON.stringify({ response: aiResponse, updatedScript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in script coach:', error);
    throw error;
  }
}

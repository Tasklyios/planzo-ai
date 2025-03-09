
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { usernames, platform, notes, userId } = await req.json();
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid usernames provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map social platform usernames to platform type
    const formattedUsernames = usernames.map(username => {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      
      return {
        username: formattedUsername,
        platform: platform || 'unknown'
      };
    });

    console.log("Analyzing content style for usernames:", formattedUsernames);
    console.log("Platform:", platform);
    console.log("User notes:", notes);

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `
    I need to analyze content style based on these social media usernames on ${platform || "social media"}:
    ${usernames.join('\n')}
    
    Additional context from the user:
    ${notes || "No additional notes provided."}
    
    Please analyze the typical content style of creators with these usernames and provide:
    1. A concise content style description (1-2 sentences)
    2. A content personality description (1-2 sentences)
    3. 3-5 key strengths of this content style
    
    Return your analysis in JSON format with these fields:
    - contentStyle (string)
    - contentPersonality (string)
    - strengths (array of strings)
    `;

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a content style analyst specializing in social media content. You help analyze social media usernames and provide insights about their likely content style, personality, and strengths. Always return valid JSON.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let styleAnalysis;

    try {
      // Parse the content from the AI response
      const content = aiResponse.choices[0].message.content;
      
      // The AI might return the JSON directly or with markdown formatting
      if (content.includes('```json')) {
        // Extract JSON from markdown code block
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          styleAnalysis = JSON.parse(jsonMatch[1].trim());
        }
      } else if (content.startsWith('{') && content.endsWith('}')) {
        // Direct JSON response
        styleAnalysis = JSON.parse(content);
      } else {
        // Attempt to extract anything that looks like JSON
        const jsonMatch = content.match(/{[\s\S]*?}/);
        if (jsonMatch) {
          styleAnalysis = JSON.parse(jsonMatch[0]);
        }
      }

      if (!styleAnalysis) {
        throw new Error('Failed to parse style analysis from AI response');
      }

      // Ensure we have the required fields
      styleAnalysis = {
        contentStyle: styleAnalysis.contentStyle || "Engaging and informative content that connects with viewers through authenticity and clear communication.",
        contentPersonality: styleAnalysis.contentPersonality || "Friendly and approachable with a balance of authority and relatability.",
        strengths: styleAnalysis.strengths || [
          "Clear communication",
          "Engaging delivery",
          "Authentic presentation"
        ]
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Provide fallback values
      styleAnalysis = {
        contentStyle: "Engaging and informative content that connects with viewers through authenticity and clear communication.",
        contentPersonality: "Friendly and approachable with a balance of authority and relatability.",
        strengths: [
          "Clear communication",
          "Engaging delivery",
          "Authentic presentation"
        ]
      };
    }

    return new Response(
      JSON.stringify(styleAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-content-style function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during content style analysis' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

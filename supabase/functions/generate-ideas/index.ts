
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { 
      niche, 
      audience = "content creators",
      videoType = "", 
      platform = "social media",
      customIdeas = "",
      contentStyle = "", 
      contentPersonality = "",
      previousIdeas = null,
      styleProfile = null,
      accountType = "personal"
    } = await req.json();

    console.log('Generating ideas with:', { 
      niche, audience, videoType, platform, accountType,
      hasCustomIdeas: !!customIdeas,
      hasStyleProfile: !!styleProfile
    });
    
    if (!niche) {
      return new Response(
        JSON.stringify({ error: "Niche is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate accountType to ensure it's explicitly one of the allowed values
    const validAccountType = ['personal', 'ecommerce', 'business'].includes(accountType) 
      ? accountType 
      : 'personal';

    console.log('Validated account type:', validAccountType);

    // Create a simpler, more direct system prompt focused on creating high-value ideas
    const systemPrompt = `You are an expert content strategist who specializes in creating viral, high-value content ideas in the ${niche} niche.

Key requirements:
1. Create EXACTLY 5 distinct content ideas.
2. Make each idea short, snappy, and scroll-stopping.
3. Each idea must have its own clear title, format, and brief description.
4. Format consistently: Title, then Category/Format, then Description.
5. For ecommerce specifically: Focus on valuable educational content that builds authority WITHOUT directly selling products.
6. Include relevant hashtags for each idea.

${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}
${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}`;

    // Create a simple, direct user prompt
    let userPrompt = `Create 5 viral content ideas for ${validAccountType} creator in "${niche}" targeting "${audience}" on ${platform}.

${validAccountType === 'ecommerce' ? 
`For ECOMMERCE content:
- 4 of 5 ideas MUST be purely educational with ZERO product mentions
- These ideas should focus on solving problems, sharing expertise, or entertaining the audience
- Only 1 idea can subtly mention product category (not specific products)
- NO selling language or promotional content in educational ideas` : ''}

${customIdeas ? `CREATOR'S OWN IDEAS TO INSPIRE YOU: "${customIdeas}"` : ""}
${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Format requirements:
1. Each idea must start with a clear number (1. Title...)
2. Each idea must include:
   - Title: short, specific, and scroll-stopping
   - Category/Format: specific content format (e.g., Tutorial Timelapse, Behind-the-Scenes)
   - Description: brief explanation with unique angle (1-2 sentences only)
   - Hashtags: 3-5 relevant hashtags

Make each idea distinctly different. Focus on value, authenticity, and shareability.`;

    // Call OpenAI with simplified parameters for creativity
    console.log('Calling OpenAI API for idea generation...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 1.0, // Higher temperature for more creativity
        max_tokens: 1200,
        top_p: 1.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Error from OpenAI API: ${response.status} ${response.statusText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get the response data
    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return new Response(
        JSON.stringify({ error: `AI service error: ${data.error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse the response
    const rawResponse = data.choices[0].message.content;
    console.log('Raw AI response:', rawResponse);
    
    // Process and extract ideas using a more robust parsing approach
    let ideas = [];
    
    try {
      // Split the response by idea numbers (1., 2., etc.)
      const ideaBlocks = rawResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
      
      if (ideaBlocks.length >= 1) {
        ideas = ideaBlocks.map(block => {
          // For each idea block, extract the components
          const lines = block.split('\n').filter(line => line.trim().length > 0);
          
          let title = '';
          let category = '';
          let description = '';
          let tags = [];
          
          // First non-empty line is usually the title
          if (lines.length > 0) {
            title = lines[0].replace(/^["'](.+)["']$/, '$1').trim();
          }
          
          // Look for category/format
          const categoryLine = lines.find(line => 
            line.match(/category|format/i) || 
            line.match(/^[a-z\s]+:/i)
          );
          
          if (categoryLine) {
            category = categoryLine.replace(/.*?:\s*/, '').trim();
          } else if (lines.length > 1) {
            // If no explicit category, use the second line
            category = lines[1].trim();
          }
          
          // Look for description
          const descriptionLine = lines.find(line => 
            line.match(/description/i) || 
            (line.length > 30 && !line.match(/category|format|hashtag|tag/i))
          );
          
          if (descriptionLine) {
            description = descriptionLine.replace(/.*?:\s*/, '').trim();
          } else if (lines.length > 2) {
            // If no explicit description, use the third line or combine remaining lines
            description = lines.slice(2).filter(l => !l.includes('#')).join(' ').trim();
          }
          
          // Look for hashtags
          const hashtagLine = lines.find(line => line.includes('#') || line.match(/hashtag|tag/i));
          if (hashtagLine) {
            // Extract tags, either as "#tag1 #tag2" or just "tag1, tag2"
            const tagMatches = hashtagLine.match(/#[a-zA-Z0-9]+(?: #[a-zA-Z0-9]+)*/g) || 
                              hashtagLine.match(/hashtags?:?\s*([^#].*)/i);
            
            if (tagMatches) {
              if (typeof tagMatches[0] === 'string' && tagMatches[0].includes('#')) {
                // Format: #tag1 #tag2
                tags = tagMatches[0].split(/\s+/).map(tag => tag.replace('#', ''));
              } else if (tagMatches[1]) {
                // Format: Hashtags: tag1, tag2
                tags = tagMatches[1].split(/[,\s]+/).filter(t => t.trim().length > 0);
              }
            }
          }
          
          // Ensure we have at least some tags
          if (tags.length === 0) {
            tags = [niche.toLowerCase().replace(/\s+/g, ''), platform.toLowerCase().replace(/\s+/g, ''), 'content'];
          }
          
          // Clean up any lingering formatting issues
          title = title.replace(/^title:?\s*/i, '').trim();
          category = category.replace(/^(category|format):?\s*/i, '').trim();
          description = description.replace(/^description:?\s*/i, '').trim();
          
          return {
            title,
            category,
            description,
            tags
          };
        });
      }
      
      // If parsing failed or produced fewer than 5 ideas, use backup generation
      if (ideas.length < 5) {
        console.log("Generating backup ideas to ensure we have 5 total");
        
        // Generate additional ideas to reach 5 total
        const missingCount = 5 - ideas.length;
        
        // Backup ideas for different account types
        const backupIdeas = getBackupIdeas(niche, audience, validAccountType, missingCount);
        
        // Add the backup ideas to our collection
        ideas = [...ideas, ...backupIdeas];
      }
      
      // Ensure we have exactly 5 ideas with complete information
      ideas = ideas.slice(0, 5).map(idea => {
        return {
          title: idea.title || `${niche} Tips for ${audience}`,
          category: idea.category || "Quick Tips",
          description: idea.description || `Valuable insights about ${niche} specifically curated for ${audience}.`,
          tags: idea.tags && idea.tags.length ? idea.tags : [niche.toLowerCase().replace(/\s+/g, ''), 'content', 'tips']
        };
      });
      
      console.log(`Successfully generated ${ideas.length} ideas`);
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      // Generate fallback ideas rather than returning an error
      ideas = getBackupIdeas(niche, audience, validAccountType, 5);
      console.log("Using fallback ideas due to parsing error");
    }

    // Return the ideas
    return new Response(
      JSON.stringify({ ideas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to generate backup ideas based on account type
function getBackupIdeas(niche, audience, accountType, count) {
  const ideas = [];
  
  // Different idea templates based on account type
  if (accountType === 'ecommerce') {
    const ecommerceIdeas = [
      {
        title: `5 Common ${niche} Myths Debunked`,
        category: "Myth Busting",
        description: `Explode popular misconceptions about ${niche} with science-backed facts that your audience needs to know.`,
        tags: ["mythbusting", "facts", niche.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: `What Happened When I Tracked My ${niche.split(' ')[0]} Progress for 30 Days`,
        category: "Personal Experiment",
        description: `A transparent look at real results and unexpected discoveries from a month-long ${niche} experiment.`,
        tags: ["experiment", "results", "tracking"]
      },
      {
        title: `3 ${niche} Hacks That Actually Work (And 2 That Don't)`,
        category: "Tested Tips",
        description: `Save time and frustration with these verified ${niche} techniques that deliver real results.`,
        tags: ["hacks", "tested", "tips"]
      },
      {
        title: `The Unexpected History of ${niche} Nobody Talks About`,
        category: "Deep Dive",
        description: `Fascinating origin stories and evolution of ${niche} that will change how you think about it.`,
        tags: ["history", "facts", "deepdive"]
      },
      {
        title: `Behind-the-Scenes: How Top ${audience.split(' ')[0]}s Approach ${niche}`,
        category: "Expert Insights",
        description: `Exclusive peeks into the routines and strategies of leading ${audience} when it comes to ${niche}.`,
        tags: ["behindthescenes", "experts", "insights"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(ecommerceIdeas[i % ecommerceIdeas.length]);
    }
  } else {
    // Ideas for personal/business accounts
    const generalIdeas = [
      {
        title: `What Nobody Tells You About ${niche} (But Should)`,
        category: "Honest Talk",
        description: `The unfiltered truth about ${niche} that will save you time, money, and frustration.`,
        tags: ["truth", "insights", niche.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: `I Tried 5 ${niche} Techniques: Here's The Clear Winner`,
        category: "Comparison Test",
        description: `An authentic side-by-side test revealing which approach to ${niche} actually delivers results.`,
        tags: ["tested", "comparison", "results"]
      },
      {
        title: `The 60-Second ${niche} Hack That Changed Everything`,
        category: "Quick Tip",
        description: `This simple but powerful adjustment to your ${niche} routine delivers immediate improvements.`,
        tags: ["quicktip", "hack", "gamechanger"]
      },
      {
        title: `Behind-the-Scenes: The Real Process of ${niche}`,
        category: "Reality Check",
        description: `The unfiltered, messy truth about what ${niche} actually looks like day-to-day.`,
        tags: ["behindthescenes", "reality", "process"]
      },
      {
        title: `3 ${niche} Trends About to Explode in 2025`,
        category: "Trend Forecast",
        description: `Get ahead of the curve with these emerging developments in the ${niche} space that few are talking about yet.`,
        tags: ["trends", "predictions", "future"]
      }
    ];
    
    for (let i = 0; i < count; i++) {
      ideas.push(generalIdeas[i % generalIdeas.length]);
    }
  }
  
  return ideas.slice(0, count);
}

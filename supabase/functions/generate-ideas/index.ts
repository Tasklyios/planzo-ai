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

    // Create topic variations to encourage creativity
    const nicheWords = niche.toLowerCase().split(/\s+/);
    
    // Create a simpler, more direct system prompt focused on creating high-value ideas
    let systemPrompt = `You are a creative content strategist who specializes in creating highly engaging, valuable content ideas.`;

    // Tailor system prompt based on account type
    if (validAccountType === 'ecommerce') {
      systemPrompt += `
For ECOMMERCE creators:
- Create exactly 5 content ideas where 4 must be purely educational with NO product mentions
- The 4 non-product ideas should focus on solving problems and providing value
- Only 1 idea can subtly mention the product category (not specific products)
- For educational ideas, write as if you're an independent expert with no brand affiliation`;
    } else if (validAccountType === 'personal') {
      systemPrompt += `
For PERSONAL creators:
- Create diverse content formats that showcase personality
- Focus on authenticity, storytelling and unique perspectives
- Include content that establishes expertise while being relatable`;
    } else if (validAccountType === 'business') {
      systemPrompt += `
FOR BUSINESS ACCOUNTS:
- Balance professionalism with authentic connection
- Include content that establishes thought leadership
- Create ideas that demonstrate expertise through storytelling`;
    }

    // Add style profile and content preferences
    systemPrompt += `
${styleProfile ? `STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}
${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}`;

    // Create a simple, direct user prompt
    let userPrompt = `Create 5 highly creative content ideas for a ${validAccountType} creator in the "${niche}" space targeting "${audience}" on ${platform}.`;

    // Add specific guidance for ecommerce
    if (validAccountType === 'ecommerce') {
      userPrompt += `
CRITICAL for ecommerce:
- Out of 5 ideas, create 4 pure educational ideas with ZERO product mentions
- These 4 ideas should focus on: industry expertise, audience pain points, educational content, or entertainment
- For these 4 ideas, DO NOT use any language like "our product", "we sell", etc.
- Only 1 idea should subtly reference the product category (not specific products)

EXAMPLES of good educational ideas for ${niche}:
- "5 Training Mistakes That Slow Down Most Runners"
- "Why Elite Runners Change Their Form Based on Terrain"
- "The Psychology Behind Runner's High: Science Explained"
- "I Analyzed 100 Marathon Winners' Training Schedules - Here's What I Found"`;
    }

    // Add custom ideas and previous context
    userPrompt += `
${customIdeas ? `CREATOR'S OWN IDEAS TO INSPIRE YOU: "${customIdeas}"` : ""}
${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Format each idea with:
1. A specific, scroll-stopping title (not generic)
2. Content category/format (be specific and creative)
3. Brief description with the unique angle
4. 3-5 relevant hashtags

Each idea must be distinctly different from the others. Vary topics, formats, and approaches.`;

    // Call OpenAI with simplified parameters for creativity
    console.log('Calling OpenAI API with simplified creative prompt...');
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
      // Try to extract structured data with regex patterns
      const ideaBlocks = rawResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
      
      if (ideaBlocks.length >= 1) {
        ideas = ideaBlocks.map(block => {
          const titleMatch = block.match(/^(.+?)(?:\n|$)/);
          const categoryMatch = block.match(/Category\/Format:?\s*([^\n]+)/i) || 
                               block.match(/Content (?:category|format|type):?\s*([^\n]+)/i) ||
                               block.match(/\(([^)]+)\)/);
          const descriptionMatch = block.match(/Description:?\s*([^#]+)/i) ||
                                  block.match(/[^\n]+\n[^\n]+\n([^#]+)/);
          const hashtagsMatch = block.match(/#[a-zA-Z0-9]+(?: #[a-zA-Z0-9]+)*/g);
          
          // Extract title, stripping quotes if present
          const title = titleMatch 
            ? titleMatch[1].replace(/^["'](.+)["']$/, '$1').trim() 
            : "Creative Content Idea";
            
          // Extract or create category
          const category = categoryMatch 
            ? categoryMatch[1].trim() 
            : "Creative Format";
            
          // Extract or create description
          const description = descriptionMatch 
            ? descriptionMatch[1].trim() 
            : block.trim();
            
          // Extract or create tags
          let tags = [];
          if (hashtagsMatch) {
            tags = hashtagsMatch[0].split(' ').map(tag => tag.replace('#', ''));
          } else {
            // Create default tags based on niche
            tags = [niche.toLowerCase().replace(/\s+/g, ''), 'content', 'creators'];
          }
          
          return {
            title,
            category,
            description,
            tags
          };
        });
      }
      
      // If no ideas were extracted, try fallback parsing
      if (ideas.length === 0) {
        // Basic extraction - find numbered items or sections with titles
        const fallbackMatches = rawResponse.match(/(?:\d+\.|Title:)\s*([^\n]+)/g);
        if (fallbackMatches && fallbackMatches.length > 0) {
          ideas = fallbackMatches.map(match => {
            const title = match.replace(/(?:\d+\.|Title:)\s*/, '').trim();
            return {
              title,
              category: "Content Idea",
              description: `Creative content about ${title} for ${audience}`,
              tags: [niche.toLowerCase().replace(/\s+/g, ''), 'content', 'creative']
            };
          });
        }
      }
      
      // Last resort: create basic ideas if parsing failed completely
      if (ideas.length === 0) {
        console.log("Failed to parse ideas, creating fallback ideas");
        
        // For ecommerce, create balanced set of product/non-product ideas
        if (validAccountType === 'ecommerce') {
          ideas = [
            {
              title: `5 Common ${niche} Myths Debunked by Science`,
              category: "Myth Busting",
              description: `Explore scientific facts that contradict popular misconceptions about ${niche}, providing evidence-based insights that help your audience make better decisions.`,
              tags: ["mythbusting", "science", "facts", niche.toLowerCase().replace(/\s+/g, '')]
            },
            {
              title: `What I Learned Tracking My ${niche.split(' ')[0]} Progress for 30 Days`,
              category: "Personal Experiment",
              description: `Share insights from a month-long experiment related to ${niche}, revealing patterns and discoveries that can help others improve their own results.`,
              tags: ["experiment", "results", "tracking", "improvement"]
            },
            {
              title: `The History of ${niche} Most People Don't Know`,
              category: "Educational Deep Dive",
              description: `Explore the fascinating evolution and little-known origin stories of ${niche}, providing context that enriches your audience's appreciation of the subject.`,
              tags: ["history", "origins", "education", "facts"]
            },
            {
              title: `Interview: How Elite ${audience} Approach Their Training`,
              category: "Expert Insights",
              description: `Share wisdom from conversations with top performers in the ${niche} space, extracting practical advice that viewers can apply to their own practice.`,
              tags: ["expertise", "interview", "eliteperformance", "training"]
            },
            {
              title: `How to Choose the Right ${niche} for Your Specific Needs`,
              category: "Buying Guide",
              description: `Provide an educational overview of different types of ${niche} options, explaining how features benefit different use cases without pushing specific products.`,
              tags: ["guide", "education", "choices", "features"]
            }
          ];
        } else {
          // Generic creative ideas for personal/business accounts
          ideas = [
            {
              title: `What Nobody Tells You About ${niche} When Starting Out`,
              category: "Insider Knowledge",
              description: `Share honest insights about ${niche} that beginners rarely discover until they've gained significant experience, helping your audience avoid common pitfalls.`,
              tags: ["insiderknowledge", "beginners", "truth", "advice"]
            },
            {
              title: `I Tried 5 Different ${niche} Approaches: Here's What Worked`,
              category: "Experiment Results",
              description: `Compare multiple methods for ${niche}, providing an authentic assessment of each approach's strengths and weaknesses based on personal experience.`,
              tags: ["comparison", "methods", "results", "testing"]
            },
            {
              title: `The Surprising Connection Between ${niche} and Mental Health`,
              category: "Psychological Insights",
              description: `Explore the unexpected ways that ${niche} impacts psychological wellbeing, drawing connections that most people overlook but that can significantly enhance results.`,
              tags: ["mentalhealth", "psychology", "wellbeing", "mindset"]
            },
            {
              title: `Behind-the-Scenes: My ${niche} Process from Start to Finish`,
              category: "Process Documentary",
              description: `Provide unprecedented access to your complete workflow, showing both the polished results and the messy reality of working with ${niche}.`,
              tags: ["behindthescenes", "process", "workflow", "reality"]
            },
            {
              title: `The Future of ${niche}: Trends to Watch in the Next Year`,
              category: "Trend Analysis",
              description: `Share forward-looking insights about emerging developments in the ${niche} space, positioning yourself as a knowledgeable voice on where the industry is heading.`,
              tags: ["trends", "future", "predictions", "industry"]
            }
          ];
        }
      }
      
      // Ensure we have exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Log the parsed ideas for debugging
      console.log(`Successfully extracted ${ideas.length} ideas`);
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      return new Response(
        JSON.stringify({ error: `Error parsing ideas: ${error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
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

// Helper function to detect if content is product-focused
function detectProductFocus(title: string, description: string, category: string): boolean {
  const combinedText = (title + ' ' + description + ' ' + category).toLowerCase();
  
  // Product-focused categories
  const productCategories = [
    'product', 'review', 'unboxing', 'showcase', 'demo', 'tutorial', 
    'how-to', 'guide', 'comparison', 'versus', 'vs', 'buyer'
  ];
  
  // Product-related phrases
  const productPhrases = [
    'product', 'item', 'gear', 'equipment', 'device', 'tool',
    'buy', 'purchase', 'shop', 'sale', 'deal', 'offer',
    'our', 'we sell', 'collection', 'line', 'model', 'brand',
    'review', 'unbox', 'test', 'try out', 'check out'
  ];
  
  // Check for product categories
  const hasProductCategory = productCategories.some(cat => 
    category.toLowerCase().includes(cat)
  );
  
  // Check for product phrases in title or description
  const hasProductPhrases = productPhrases.some(phrase => 
    combinedText.includes(phrase)
  );
  
  return hasProductCategory || hasProductPhrases;
}

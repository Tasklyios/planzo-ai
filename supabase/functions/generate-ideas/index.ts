
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
    const mainTopic = nicheWords[nicheWords.length - 1] || niche;
    const relatedTopics = generateRelatedTopics(niche, audience);
    
    // Enhanced system prompt with creativity instructions and divergent thinking techniques
    let systemPrompt = `You are a world-class content strategist known for creating original, insightful, and breakthrough content ideas.

Your expertise is creating CREATIVE and ORIGINAL content ideas for ${validAccountType} creators in the "${niche}" space targeting "${audience}".

CREATIVITY PROTOCOLS:
1. Use lateral thinking to connect unexpected concepts
2. Consider counterintuitive angles that challenge common wisdom
3. Focus on specific stories, experiences, and unique perspectives
4. Break conventional content formats and approaches
5. Create ideas that make people think "I've never seen that before"
6. Focus on the AUDIENCE'S needs, challenges, dreams, and desires`;

    // Tailor system prompt based on account type
    if (validAccountType === 'ecommerce') {
      systemPrompt += `
FOR ECOMMERCE BRANDS - ABSOLUTELY CRITICAL:
- Create a MIX OF CONTENT with this exact balance:
  * 4 out of 5 ideas MUST HAVE NOTHING to do with products, selling, or your brand
  * Only 1 out of 5 ideas can subtly mention the product category
- The 4 non-product ideas should focus on:
  * Industry expertise and thought leadership
  * Audience lifestyle content beyond the product
  * Educational content that builds trust
  * Entertainment that relates to audience interests
  * Personal stories with emotional resonance
  * Broader topic exploration in adjacent interest areas
- For non-product ideas, use ZERO language like:
  * "our" anything
  * "we sell" phrasing
  * "product" mentions
  * buying, purchasing, deals, etc.
- Non-product ideas should sound like they come from an independent expert or educator
- The ONE subtle product idea should be educational first, with product mentioned only as a small part
- Remember: Content marketing success comes from building trust through value FIRST`;
    } else if (validAccountType === 'personal') {
      systemPrompt += `
FOR PERSONAL CREATORS:
- Create a DIVERSE MIX of distinctive content formats:
  * Personal narrative with emotional depth
  * Contrarian perspective on industry norms
  * Immersive day-in-the-life with unexpected moments
  * Expert deep dive with unique insights
  * Behind-the-scenes revelation
- Avoid basic, templated approaches used by average creators
- Each idea should contain a specific hook and original angle
- Focus on authenticity, vulnerability, and distinctive voice
- Include content that showcases your unique experience or perspective`;
    } else if (validAccountType === 'business') {
      systemPrompt += `
FOR BUSINESS ACCOUNTS:
- Create content ideas that establish thought leadership without being boring
- Balance professionalism with authentic, human connection
- Include a mix of case studies, industry analysis, and behind-the-scenes
- Demonstrate expertise through stories, not just facts
- Create content that resonates with decision-makers on a personal level`;
    }

    // Add style profile and content preferences
    systemPrompt += `
${styleProfile ? `CREATOR'S UNIQUE STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

PLATFORM ADAPTATION: 
Create ideas specifically optimized for ${platform} with platform-native hooks, formats, and engagement approaches.`;

    // Enhanced user prompt with creative thinking techniques and clearer guidance
    let userPrompt = `Create 5 HIGHLY ORIGINAL, outside-the-box video ideas for a ${validAccountType} creator in the "${niche}" space targeting "${audience}" on ${platform}.`;

    // Add related topics to spark creativity
    userPrompt += `
CREATIVITY SPARKS:
* Consider these related topics for inspiration: ${relatedTopics.join(', ')}
* Think about emotional angles: curiosity, surprise, awe, contradiction, nostalgia
* Consider perspectives from: beginners, experts, skeptics, enthusiasts, adjacent fields`;

    // Specialized prompts for different account types
    if (validAccountType === 'ecommerce') {
      userPrompt += `
FOR ECOMMERCE BRANDS - ABSOLUTELY CRITICAL:
- Create a mix with EXACTLY this balance:
  * 4 ideas that have ABSOLUTELY NOTHING to do with your products or brand (pure value)
  * 1 idea that can subtly mention the product category (educational first, product second)
  
For the 4 NON-PRODUCT ideas, focus on:
1. Industry expertise that builds authority (trends, research, insights)
2. Audience lifestyle content related to their broader interests
3. Educational content that solves problems without mentioning products
4. Entertainment or inspiration that resonates emotionally with the audience

The 4 non-product ideas MUST NOT include:
* ANY mention of products, items, gear, equipment
* ANY brand references (our, we, company name)
* ANY selling language (buy, purchase, shop, deal)
* ANYTHING that sounds like marketing

For these 4 ideas, write as if you're an independent expert or educator with NO connection to any brand.

For the 1 SUBTLE product idea:
* Make it 80% educational, 20% product
* The product should be mentioned as a small part of a larger story
* Focus on the problem being solved, not the product itself

EXAMPLES OF EXCELLENT NON-PRODUCT IDEAS FOR ${niche.toUpperCase()}:
* "I Tracked My Athletic Performance For 6 Months - The Data Will Surprise You"
* "What Elite Coaches Look For When Evaluating Young Athletes"
* "The Psychology Behind Breaking Through Performance Plateaus"
* "The 'Flow State' Training Protocol That Changed Everything For Me"`;
    } else if (validAccountType === 'personal') {
      userPrompt += `
FOR PERSONAL CREATORS:
Create these 5 DISTINCT formats with original angles:
1. A personal narrative that reveals vulnerability and authenticity
2. A perspective that challenges a common belief in your industry
3. A behind-the-scenes look at something normally hidden
4. A unique teaching approach that no one else is doing
5. A creative format that breaks platform conventions

Each idea MUST:
* Have a specific, attention-grabbing hook (not generic)
* Include an unexpected element that surprises viewers
* Feel distinctly DIFFERENT from typical content in your niche
* Provide real value that builds your authority

AVOID GENERIC TEMPLATES like:
* "5 Tips for X"
* "How to X in Y Steps"
* "The Ultimate Guide to X"
* "What I Wish I Knew About X"`;
    } else if (validAccountType === 'business') {
      userPrompt += `
FOR BUSINESS ACCOUNTS:
Create these 5 DISTINCTIVE content types:
1. A case study with an unexpected outcome or approach
2. An industry analysis with a bold prediction or contrarian view
3. A behind-the-scenes look at your work culture or process
4. A thought leadership piece that challenges industry assumptions
5. A client-focused story that emotionally resonates

Each idea MUST:
* Balance professionalism with authentic human connection
* Demonstrate expertise through storytelling, not just facts
* Include specific details that make it uniquely YOURS
* Appeal to both rational and emotional decision-making factors`;
    }

    // Add custom ideas and previous context
    userPrompt += `
${customIdeas ? `CREATOR'S OWN IDEAS TO INSPIRE YOU: "${customIdeas}"` : ""}

${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Format each idea with:
1. A specific, scroll-stopping title (not generic)
2. Content category/format (be specific and creative)
3. Detailed description with the unique angle
4. 3-5 relevant hashtags

CRITICAL: Each idea must be DISTINCTLY DIFFERENT from the others. Vary topics, formats, emotional angles, and approaches.`;

    // Call OpenAI with effective parameters for creativity
    console.log('Calling OpenAI API with creativity-enhanced prompts...');
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
        top_p: 1.0,
        presence_penalty: 0.7, // Encourage new topics
        frequency_penalty: 0.7 // Discourage repetition
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
    
    let ideas = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        if (parsedData.ideas && Array.isArray(parsedData.ideas)) {
          ideas = parsedData.ideas;
        }
      }
      
      // If ideas extraction failed, try to parse the raw text
      if (ideas.length === 0) {
        console.log("JSON parsing failed, attempting to extract ideas from raw text");
        // Attempt to extract individual ideas by looking for numbered patterns
        const ideaPatterns = rawResponse.split(/\d+\.\s+/).filter(Boolean);
        if (ideaPatterns.length >= 3) { // We have some valid idea-like segments
          ideas = ideaPatterns.map(text => {
            // Try to extract title, category, description and tags
            const titleMatch = text.match(/^([^:]+):/);
            const categoryMatch = text.match(/Category\/Format:?\s*([^\n]+)/i) || 
                                  text.match(/Content category\/format:?\s*([^\n]+)/i) ||
                                  text.match(/\(([^)]+)\)/);
            const descriptionMatch = text.match(/Description:?\s*([^#]+)/i) ||
                                    text.match(/Detailed description:?\s*([^#]+)/i);
            const hashtagsMatch = text.match(/#([^#\s]+)(?:\s+#([^#\s]+))?(?:\s+#([^#\s]+))?(?:\s+#([^#\s]+))?(?:\s+#([^#\s]+))?/g);
            
            const title = titleMatch ? titleMatch[1].trim() : createCreativeTitle(niche, audience);
            const category = categoryMatch ? categoryMatch[1].trim() : getRandomContentFormat();
            const description = descriptionMatch ? descriptionMatch[1].trim() : text.trim();
            
            let tags = [];
            if (hashtagsMatch) {
              tags = hashtagsMatch.map(tag => tag.replace('#', '').trim());
            } else {
              // Generate relevant tags if none found
              tags = generateRelevantTags(niche, category, audience);
            }
            
            return {
              title,
              category,
              description,
              tags
            };
          });
        }
      }
      
      // For ecommerce accounts, verify proper balance of product vs non-product ideas
      if (validAccountType === 'ecommerce' && ideas.length > 0) {
        console.log("Ecommerce account detected - checking for content balance");
        
        // Comprehensive list of product-selling phrases to detect
        const productPhrases = [
          "our product", "our products", "we sell", "we offer", "buy", "purchase", 
          "shop", "item", "merchandise", "for sale", "selling", "sold", "available",
          "our brand", "our company", "our store", "our collection", "our line",
          "check out", "try out", "get yours", "limited edition", "exclusive",
          "deal", "discount", "promo", "promotion", "shipping", "order", "customer",
          "showcase", "featuring", "introducing", "launch", "new release", "stock",
          "using our", "with our", "our premium", "our quality", "our model", 
          `our ${niche}`, `${niche} product`, `${niche} collection`,
          `best ${niche}`, `top ${niche} products`, "product review"
        ];
        
        // Add direct product niche mentions for detection
        if (nicheWords.length > 0) {
          if (nicheWords.length > 1) {
            productPhrases.push(nicheWords[nicheWords.length - 1]);
          }
          
          productPhrases.push(
            "our " + niche, 
            niche + " product", 
            niche + " line",
            niche + " model",
            "quality " + niche,
            "premium " + niche
          );
        }
        
        // Check each idea for product mentions
        let productMentionCount = 0;
        const ideasWithProductMentions = [];
        
        ideas.forEach((idea, index) => {
          const combinedText = (idea.title + ' ' + idea.description).toLowerCase();
          const hasProductMention = productPhrases.some(phrase => 
            combinedText.includes(phrase.toLowerCase())
          );
          
          if (hasProductMention) {
            productMentionCount++;
            ideasWithProductMentions.push(index);
          }
        });
        
        console.log(`Detected ${productMentionCount}/${ideas.length} ideas with product mentions`);
        
        // Create balanced idea library
        const nonProductIdeas = getCreativeNonProductIdeas(niche, audience, nicheWords);
        const subtleProductIdeas = getSubtleProductIdeas(niche, audience, nicheWords);
        
        // Fix balance if needed: should be 4 non-product, 1 product idea for ecommerce
        if (productMentionCount > 1 || productMentionCount === 0 || ideas.length < 5) {
          console.log("Adjusting content balance for ecommerce account");
          
          // Create a balanced set of 4 non-product + 1 product idea
          const newIdeas = [];
          
          // Add 4 non-product ideas
          for (let i = 0; i < 4; i++) {
            // Use a creative algorithm to pick diverse non-product ideas
            const nonProductIndex = (i * 3 + Date.now() % 3) % nonProductIdeas.length;
            newIdeas.push(nonProductIdeas[nonProductIndex]);
          }
          
          // Add 1 product-focused idea
          const productIdeaIndex = Date.now() % subtleProductIdeas.length;
          newIdeas.push(subtleProductIdeas[productIdeaIndex]);
          
          // Replace the original ideas with our balanced set
          ideas = newIdeas;
          
          console.log("Created balanced set: 4 non-product ideas, 1 subtle product idea");
        }
      }
      
      // For personal and business accounts, check for creativity and originality
      if (validAccountType !== 'ecommerce') {
        // Check if ideas look too templated or generic
        const templatePatterns = [
          /^5 Tips for/i,
          /^How to/i,
          /^Top \d+ Ways/i,
          /^The Ultimate Guide to/i,
          /^What I Wish I Knew/i,
          /^The Best/i
        ];
        
        let genericIdeasCount = 0;
        ideas.forEach(idea => {
          if (templatePatterns.some(pattern => pattern.test(idea.title))) {
            genericIdeasCount++;
          }
        });
        
        // If more than 40% of ideas look generic, regenerate with creative alternatives
        if (genericIdeasCount >= Math.floor(ideas.length * 0.4)) {
          console.log("Detected generic ideas, providing creative alternatives");
          
          // Replace generic ideas with creative alternatives
          const creativeIdeas = getCreativeIdeasForAccountType(validAccountType, niche, audience);
          
          // For each generic idea, replace with a creative one
          ideas = ideas.map((idea, index) => {
            if (templatePatterns.some(pattern => pattern.test(idea.title))) {
              // Use modulo to cycle through creative ideas
              const creativeIndex = index % creativeIdeas.length;
              return creativeIdeas[creativeIndex];
            }
            return idea;
          });
          
          console.log("Replaced generic ideas with creative alternatives");
        }
      }
      
      // Ensure diversity of content types
      ensureContentDiversity(ideas);
      
      // Limit to exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure all ideas have required fields
      ideas = ideas.map(idea => ({
        title: idea.title || createCreativeTitle(niche, audience),
        category: idea.category || getRandomContentFormat(),
        description: idea.description || createCreativeDescription(niche, audience, idea.title),
        tags: Array.isArray(idea.tags) && idea.tags.length > 0 ? 
          idea.tags : generateRelevantTags(niche, idea.category || "Content", audience)
      }));
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      
      // Provide creative fallback ideas based on account type
      if (validAccountType === 'ecommerce') {
        ideas = getCreativeEcommerceIdeas(niche, audience, nicheWords);
      } else if (validAccountType === 'personal') {
        ideas = getCreativePersonalIdeas(niche, audience);
      } else {
        ideas = getCreativeBusinessIdeas(niche, audience);
      }
    }

    console.log('Final ideas count:', ideas.length);

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

// ----- HELPER FUNCTIONS FOR CREATIVITY -----

// Generate related topics for creative thinking
function generateRelatedTopics(niche: string, audience: string): string[] {
  const nicheWords = niche.toLowerCase().split(/\s+/);
  const mainTopic = nicheWords[nicheWords.length - 1] || niche;
  
  // Create broader context topics
  const topics = [
    `${mainTopic} psychology`,
    `${mainTopic} history`,
    `${mainTopic} science`,
    `${mainTopic} culture`,
    `${mainTopic} community`,
    `${mainTopic} lifestyle`,
    `${mainTopic} technology`,
    `${mainTopic} innovation`,
    `${mainTopic} trends`,
    `${mainTopic} controversies`,
    `${mainTopic} myths`,
    `${mainTopic} experiments`,
    `${mainTopic} stories`,
    `${mainTopic} challenges`,
    `${mainTopic} future`,
  ];
  
  // Return 5 random topics from the list
  return topics
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);
}

// Create a creative title if needed
function createCreativeTitle(niche: string, audience: string): string {
  const titles = [
    `What I Discovered After 30 Days of ${niche} Experimentation`,
    `The Unconventional ${niche} Approach That Changed Everything`,
    `Why Everything You Know About ${niche} Might Be Wrong`,
    `The Secret ${niche} Technique That Only Insiders Know`,
    `I Interviewed 50 ${niche} Experts - Here's What They All Agreed On`,
    `The ${niche} Paradox: Why More Effort Leads to Worse Results`,
    `What ${audience} Never Tell You About Their ${niche} Journey`,
    `The Surprising Truth About ${niche} That No One Discusses`,
    `How I Transformed My ${niche} Results With One Simple Change`,
    `The Hidden Psychology Behind Successful ${niche}`,
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

// Get a random content format
function getRandomContentFormat(): string {
  const formats = [
    "Personal Journey",
    "Data Analysis",
    "Expert Interview",
    "Myth Busting",
    "Behind-the-Scenes",
    "Case Study",
    "Experimental",
    "Storytelling",
    "Contrarian Take",
    "Deep Dive",
    "Investigative",
    "Trend Analysis",
    "Technical Breakdown",
    "Psychological Insight",
    "Cultural Examination"
  ];
  
  return formats[Math.floor(Math.random() * formats.length)];
}

// Create a creative description
function createCreativeDescription(niche: string, audience: string, title: string): string {
  const descriptions = [
    `A deep exploration of ${niche} from a completely new angle, challenging conventional wisdom and providing actionable insights that most ${audience} miss. This content combines personal experience with research to deliver unique value.`,
    
    `An eye-opening journey into the world of ${niche} that reveals hidden patterns and unexpected connections. By examining both successes and failures, this content offers a balanced perspective that helps ${audience} make better decisions.`,
    
    `A provocative analysis that questions standard ${niche} practices and introduces a framework for thinking differently. Drawing from cross-disciplinary research, this content creates breakthrough insights for ${audience} looking to innovate.`,
    
    `A vulnerable, authentic look at the real challenges of ${niche} that most content creators won't discuss. By sharing both struggles and triumphs, this content creates a genuine connection with ${audience} facing similar obstacles.`,
    
    `A methodical breakdown of ${niche} techniques that combines data analysis with practical application. This research-backed approach gives ${audience} both the "why" and "how" behind effective strategies.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Generate relevant hashtags
function generateRelevantTags(niche: string, category: string, audience: string): string[] {
  const baseTag = niche.toLowerCase().replace(/\s+/g, '');
  const categoryTag = category.toLowerCase().replace(/\s+/g, '');
  
  const possibleTags = [
    baseTag,
    categoryTag,
    'content',
    'creator',
    'authentic',
    'valuedriven',
    'education',
    'insights',
    'deepdive',
    'behindthescenes',
    'storytelling',
    'expertise',
    'thoughtleadership',
    'learning',
    'growth',
    'community',
    'strategy',
    'success',
    'creativity',
    'innovation'
  ];
  
  // Shuffle and take 3-5 tags
  const shuffled = possibleTags.sort(() => 0.5 - Math.random());
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 tags
  
  return shuffled.slice(0, count);
}

// Get creative non-product ideas for ecommerce
function getCreativeNonProductIdeas(niche: string, audience: string, nicheWords: string[]): any[] {
  const mainTopic = nicheWords[0] || niche;
  
  return [
    {
      title: `The Surprising History of ${niche} That Most People Don't Know`,
      category: "Historical Deep Dive",
      description: `Explore the fascinating evolution of ${niche} through the ages, uncovering forgotten innovations and unexpected origins that shaped today's practices. This historically-rich content positions you as a knowledgeable industry voice while providing genuinely interesting context that goes far beyond product discussions.`,
      tags: ["history", "evolution", "industryinsights"]
    },
    {
      title: `I Interviewed 10 ${audience} About Their Biggest ${mainTopic} Challenges`,
      category: "Community Research",
      description: `Share authentic insights from real conversations with your target audience, highlighting common struggles, surprising patterns, and emotional touchpoints. This empathetic content demonstrates that you truly understand your audience's needs while building community through shared experiences.`,
      tags: ["research", "communityinsights", "realstories"]
    },
    {
      title: `The Science-Backed ${mainTopic} Method That Changed Everything For Me`,
      category: "Research-Based Technique",
      description: `Detail a specific approach to ${mainTopic} that leverages scientific principles, explaining both the research and practical application. This educational content establishes your expertise through evidence-based insights while providing immediately actionable value to your audience.`,
      tags: ["sciencebacked", "researchbased", "methodology"]
    },
    {
      title: `5 ${mainTopic} Myths I Believed Until I Became an Expert`,
      category: "Myth Busting",
      description: `Challenge common misconceptions in the ${niche} space with evidence and experience, explaining why these myths persist and what the reality actually is. This clarifying content helps your audience avoid common mistakes while positioning you as a truthful, authoritative voice.`,
      tags: ["mythbusting", "expertinsights", "truthtelling"]
    },
    {
      title: `What Top ${mainTopic} Coaches Never Tell Beginners (But Should)`,
      category: "Insider Knowledge",
      description: `Reveal important but often overlooked fundamentals that make a critical difference in ${mainTopic} success, explained in an accessible way for newcomers. This supportive content helps beginners avoid frustration while establishing you as someone who genuinely cares about others' success.`,
      tags: ["beginneradvice", "insidertips", "fundamentals"]
    },
    {
      title: `I Tracked My ${mainTopic} Progress For 100 Days - Here's What The Data Revealed`,
      category: "Personal Experiment",
      description: `Share the fascinating results and unexpected insights from a structured self-experiment related to ${mainTopic}, including methodology, data visualization, and practical takeaways. This analytical content demonstrates your commitment to improvement and evidence-based approaches.`,
      tags: ["experiment", "dataanalysis", "progresstracking"]
    },
    {
      title: `The Psychological Barriers Holding Back Most ${audience} (And How To Overcome Them)`,
      category: "Performance Psychology",
      description: `Explore the mental blocks and limiting beliefs that prevent progress in ${mainTopic}, offering psychological frameworks and practical mental techniques. This empowering content addresses the often-neglected mental aspect of performance while providing tools for breakthrough progress.`,
      tags: ["psychology", "mindset", "mentalbarriers"]
    },
    {
      title: `What I Learned Shadowing Elite ${mainTopic} Practitioners For 30 Days`,
      category: "Expert Immersion",
      description: `Take your audience behind the scenes of high-level ${mainTopic} practice, sharing surprising routines, mindsets, and approaches observed firsthand. This exclusive content provides rare access to elite methodologies while positioning you as connected to top-tier expertise.`,
      tags: ["elitepractices", "behindthescenes", "expertmethods"]
    },
    {
      title: `The Counterintuitive ${mainTopic} Approach That Produces Better Results With Less Effort`,
      category: "Strategic Optimization",
      description: `Present a methodology that challenges conventional wisdom by focusing on leverage points and efficiency rather than brute force, backed by principles and examples. This strategic content demonstrates sophisticated thinking while offering a refreshing alternative to typical grind-focused advice.`,
      tags: ["optimization", "efficiency", "strategicthinking"]
    },
    {
      title: `What the Latest Research Says About Optimizing ${mainTopic} Performance`,
      category: "Scientific Review",
      description: `Synthesize recent scientific findings related to ${mainTopic} into accessible, practical insights that anyone can apply, connecting research to real-world application. This evidence-based content establishes you as current with emerging knowledge while providing value through translation of complex research.`,
      tags: ["research", "sciencebackedadvice", "performanceoptimization"]
    }
  ];
}

// Get subtle product ideas for ecommerce
function getSubtleProductIdeas(niche: string, audience: string, nicheWords: string[]): any[] {
  const mainTopic = nicheWords[0] || niche;
  
  return [
    {
      title: `How ${mainTopic} Technology Has Evolved: Past, Present, and Future Innovations`,
      category: "Industry Evolution",
      description: `Trace the fascinating technological development of ${niche} equipment over time, exploring historical milestones, current state-of-the-art advances, and emerging innovations across the industry. This educational approach positions you as knowledgeable about the broader market while subtly establishing context for quality differences.`,
      tags: ["innovation", "technology", "industrytrends"]
    },
    {
      title: `What Actually Matters When Evaluating ${niche} Quality: An Expert's Perspective`,
      category: "Educational Guide",
      description: `Break down the technical criteria experts use to assess ${niche} performance and durability, explaining key features and their functional impact. This informative content helps your audience make more informed decisions by understanding quality indicators across all products in the category.`,
      tags: ["qualityassessment", "buyereducation", "expertadvice"]
    },
    {
      title: `The Surprising Environmental Impact of Different ${niche} Manufacturing Approaches`,
      category: "Sustainability Analysis",
      description: `Examine how various production methods and materials in the ${niche} industry affect environmental footprint, discussing innovations in sustainable manufacturing. This conscious content demonstrates values beyond profit while educating on an aspect of products consumers increasingly care about.`,
      tags: ["sustainability", "environmentalimpact", "consciousproduction"]
    },
    {
      title: `How To Properly Maintain Any ${niche} for Maximum Longevity and Performance`,
      category: "Care & Maintenance",
      description: `Provide detailed maintenance guidance applicable to all ${niche} equipment, explaining techniques, timing, and common mistakes to avoid. This helpful content delivers practical value while subtly emphasizing the importance of quality and care in extending product life.`,
      tags: ["maintenance", "productcare", "longevity"]
    },
    {
      title: `What I Wish Someone Told Me Before Investing in ${niche} Equipment`,
      category: "Consumer Wisdom",
      description: `Share honest advice about evaluating needs, priorities, and trade-offs when considering ${niche} purchases, helping viewers avoid common regrets and make choices aligned with their specific situation. This authentic content builds trust through transparency and genuine desire to help consumers make the right choice for them.`,
      tags: ["buyeradvice", "smartinvestment", "honestguidance"]
    }
  ];
}

// Get creative personal ideas
function getCreativePersonalIdeas(niche: string, audience: string): any[] {
  return [
    {
      title: `What a $10,000 ${niche} Masterclass Taught Me That Changed Everything`,
      category: "Exclusive Knowledge Share",
      description: `Reveal the most valuable insights gained from a high-investment learning experience, focusing on unexpected or counterintuitive lessons that contradicted conventional wisdom. This generous content provides unique value while positioning you as someone who invests seriously in your expertise.`,
      tags: ["expertinsights", "exclusiveknowledge", "gamechangers"]
    },
    {
      title: `The ${niche} Experiment That Failed Spectacularly (And Why It Was My Most Valuable Lesson)`,
      category: "Vulnerability Story",
      description: `Share a detailed account of a significant professional failure, the emotional journey through it, and the transformative insights that emerged only because of this challenging experience. This authentic content creates deep connection with viewers through shared vulnerability while demonstrating resilience and wisdom.`,
      tags: ["failure", "vulnerability", "lessonlearned"]
    },
    {
      title: `I Documented Every Step of My Most Successful ${niche} Project Ever`,
      category: "Process Documentary",
      description: `Provide unprecedented access to your complete workflow on a stand-out project, showing both the polished result and the messy reality of creating it, including decision points, challenges, and breakthroughs. This transparent content builds trust while giving your audience practical insights into professional-level work.`,
      tags: ["creativeprocess", "behindthescenes", "workflowrevealed"]
    },
    {
      title: `The Counterintuitive ${niche} Framework That Doubled My Results`,
      category: "Strategic Methodology",
      description: `Present a unique approach that challenges standard practices in your field, explaining the conceptual foundation, implementation details, and measurable outcomes that demonstrate its effectiveness. This innovative content establishes you as a forward-thinking expert who develops original solutions rather than following conventions.`,
      tags: ["methodology", "innovation", "resultsdriven"]
    },
    {
      title: `I Interviewed My ${niche} Hero - The Conversation Changed My Entire Approach`,
      category: "Transformative Dialogue",
      description: `Share insights from a meaningful conversation with someone you deeply respect in your field, focusing on perspective shifts and fundamental principles that altered your understanding of your craft. This inspirational content demonstrates your connection to expertise while creating an emotional narrative about growth and mentorship.`,
      tags: ["interview", "mentorship", "perspectiveshift"]
    }
  ];
}

// Get creative business ideas
function getCreativeBusinessIdeas(niche: string, audience: string): any[] {
  return [
    {
      title: `The Unconventional ${niche} Strategy That Generated $1M For Our Client`,
      category: "Case Study",
      description: `Document a breakthrough approach that delivered exceptional results, detailing the initial challenge, strategic innovation, implementation process, and specific outcomes with metrics. This results-focused content demonstrates your impact while providing a framework others can adapt to their situations.`,
      tags: ["casestudy", "strategy", "results"]
    },
    {
      title: `Behind Closed Doors: How Executive ${niche} Decisions Actually Get Made`,
      category: "Industry Insider",
      description: `Reveal the hidden dynamics, unspoken considerations, and decision-making frameworks used at the highest levels of business, based on your experience working with leadership teams. This exclusive content provides rare access to executive thinking while positioning your business as operating at the highest level.`,
      tags: ["executiveinsights", "decisionmaking", "leadershipstrategy"]
    },
    {
      title: `The ${niche} Failure Analysis: 5 Critical Mistakes That Sink Most Projects`,
      category: "Strategic Warning",
      description: `Analyze patterns across unsuccessful initiatives to identify key warning signs, process breakdowns, and organizational blind spots that consistently lead to failure, with guidance for prevention. This protective content demonstrates your experience-based wisdom while providing valuable risk mitigation for potential clients.`,
      tags: ["failureanalysis", "riskprevention", "strategicoversight"]
    },
    {
      title: `We Studied 100 Successful ${niche} Implementations - Here's What They Had in Common`,
      category: "Pattern Recognition Research",
      description: `Share insights from systematic analysis of high-performing projects, identifying the non-obvious factors and approaches that consistently contributed to success across different contexts. This analytical content establishes your firm as thoughtfully data-driven while providing valuable strategic guidance.`,
      tags: ["research", "successpatterns", "implementationinsights"]
    },
    {
      title: `The Future of ${niche}: 5 Emerging Trends Reshaping The Industry`,
      category: "Forward-Looking Analysis",
      description: `Present a well-reasoned forecast of coming changes in your industry, connecting technological, social, and economic shifts to specific implications for businesses in your sector. This visionary content positions your company as a thought leader that clients can trust to keep them ahead of market evolution.`,
      tags: ["futurepredictions", "industrytrends", "strategicforesight"]
    }
  ];
}

// Get creative ideas for a specific account type
function getCreativeIdeasForAccountType(accountType: string, niche: string, audience: string): any[] {
  if (accountType === 'personal') {
    return getCreativePersonalIdeas(niche, audience);
  } else if (accountType === 'business') {
    return getCreativeBusinessIdeas(niche, audience);
  } else {
    const nicheWords = niche.toLowerCase().split(/\s+/);
    return getCreativeNonProductIdeas(niche, audience, nicheWords);
  }
}

// Ensure content diversity across ideas
function ensureContentDiversity(ideas: any[]): void {
  // Check for duplicate categories or very similar titles
  const categories = new Set();
  const titleWords = [];
  
  for (let i = 0; i < ideas.length; i++) {
    // Get core words from title (excluding common words)
    const titleCore = ideas[i].title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3 && !['what', 'when', 'where', 'why', 'how', 'the', 'this', 'that', 'with', 'your', 'their', 'our'].includes(word));
    
    // Check for duplicate categories
    if (categories.has(ideas[i].category)) {
      // Assign a new category
      ideas[i].category = getUniqueContentFormat(Array.from(categories));
    }
    categories.add(ideas[i].category);
    
    // Check for title similarity with previous ideas
    for (let j = 0; j < i; j++) {
      const previousTitleCore = titleWords[j] || [];
      const overlap = previousTitleCore.filter(word => titleCore.includes(word));
      
      // If too similar (more than 50% overlap), replace with a more diverse title
      if (overlap.length > titleCore.length * 0.5) {
        ideas[i].title = getDiverseTitle(ideas.map(idea => idea.title));
        break;
      }
    }
    
    titleWords[i] = titleCore;
  }
}

// Get a unique content format not in the existing list
function getUniqueContentFormat(existingFormats: string[]): string {
  const allFormats = [
    "Personal Journey",
    "Data Analysis",
    "Expert Interview",
    "Myth Busting",
    "Behind-the-Scenes",
    "Case Study",
    "Experimental",
    "Storytelling",
    "Contrarian Take",
    "Deep Dive",
    "Investigative",
    "Trend Analysis",
    "Technical Breakdown",
    "Psychological Insight",
    "Cultural Examination",
    "Historical Context",
    "Future Prediction",
    "Comparative Analysis",
    "Critical Review",
    "Thought Experiment"
  ];
  
  // Filter out existing formats
  const availableFormats = allFormats.filter(format => !existingFormats.includes(format));
  
  // Return a random available format, or a completely new one if all are used
  if (availableFormats.length > 0) {
    return availableFormats[Math.floor(Math.random() * availableFormats.length)];
  } else {
    return "Innovative Perspective " + Math.floor(Math.random() * 100);
  }
}

// Get a diverse title not similar to existing ones
function getDiverseTitle(existingTitles: string[]): string {
  const diverseTitles = [
    "The Unexpected Connection Between [Topic] and [Surprising Field]",
    "Why I Completely Changed My Approach to [Topic] After 10 Years",
    "The [Topic] Technique That No One Talks About (But Everyone Should Know)",
    "I Challenged My Own [Topic] Assumptions and Here's What Happened",
    "The [Counter-intuitive Number] Rule for [Topic] That Defies Convention",
    "What My Biggest [Topic] Failure Taught Me About [Key Lesson]",
    "The Secret History of [Topic] That Reshapes How We Think About It",
    "Why Everything You've Learned About [Topic] Might Be Outdated",
    "The [Topic] Framework I Discovered By Accident",
    "How a Single Conversation Changed My Entire [Topic] Philosophy"
  ];
  
  // Pick a title not similar to existing ones
  for (const title of diverseTitles) {
    // Check similarity with existing titles
    let isSimilar = false;
    for (const existingTitle of existingTitles) {
      // Basic similarity check - if they share more than 3 significant words
      const words1 = title.toLowerCase().split(' ').filter(w => w.length > 3);
      const words2 = existingTitle.toLowerCase().split(' ').filter(w => w.length > 3);
      const sharedWords = words1.filter(w => words2.includes(w));
      
      if (sharedWords.length > 2) {
        isSimilar = true;
        break;
      }
    }
    
    if (!isSimilar) {
      return title.replace('[Topic]', 'Topic').replace('[Surprising Field]', 'Surprising Field')
        .replace('[Counter-intuitive Number]', '3').replace('[Key Lesson]', 'Success');
    }
  }
  
  // Fallback - current timestamp ensures uniqueness
  return `A Completely Different Perspective on ${Date.now() % 1000}`;
}

// Get creative ecommerce ideas (with balanced product/non-product mix)
function getCreativeEcommerceIdeas(niche: string, audience: string, nicheWords: string[]): any[] {
  // Create a mix of 4 non-product and 1 subtle product ideas
  const nonProductIdeas = getCreativeNonProductIdeas(niche, audience, nicheWords).slice(0, 4);
  const productIdea = getSubtleProductIdeas(niche, audience, nicheWords)[0];
  
  return [...nonProductIdeas, productIdea];
}

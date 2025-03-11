
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

    // Enhanced system prompt with more specific guidance
    let systemPrompt = `You are an elite marketing strategist and viral content expert specializing in ${platform} content.

Your expertise is creating viral content ideas for ${validAccountType} creators in the "${niche}" space targeting "${audience}".`;

    // Tailor system prompt based on account type
    if (validAccountType === 'ecommerce') {
      systemPrompt += `
FOR ECOMMERCE BRANDS - CRITICAL GUIDELINES:
- Create MOSTLY ideas (at least 4 out of 5) that have NOTHING to do with products
- Focus on providing pure value to the audience through educational content
- These pure value ideas MUST NOT contain ANY references to:
  * The creator's products
  * "Our" products or services
  * "We sell" language
  * Anything that sounds like selling
- The pure value ideas should focus on:
  * Industry expertise
  * Educational content
  * Helpful tips and guidance
  * Trends and insights
  * Solving audience problems
- MAXIMUM 1 out of 5 ideas can subtly reference products as solutions
- The best ecommerce content marketing establishes expertise FIRST without selling
- Pure value ideas should read like they came from an independent expert, not a brand`;
    } else if (validAccountType === 'personal') {
      systemPrompt += `
For this PERSONAL CREATOR account:
- Focus on creating professional, straight-to-the-point content that avoids cringy or gimmicky approaches
- Generate a diverse mix of content formats: storytelling, day-in-the-life, educational tutorials, top lists, behind-the-scenes
- Ideas should showcase expertise without appearing forced or inauthentic
- Each idea must have clear viral potential with strong hooks and unique angles
- Avoid anything that feels amateur or desperate for attention`;
    } else if (validAccountType === 'business') {
      systemPrompt += `
For this BUSINESS account:
- Focus on thought leadership, industry expertise, and building brand trust
- Ideas should position the business as an authority while providing genuine value
- Include a mix of educational content, behind-the-scenes, and industry insights
- Prioritize ideas that establish credibility and trust with potential clients`;
    }

    // Add style profile and content preferences
    systemPrompt += `
${styleProfile ? `CREATOR'S UNIQUE STYLE: "${styleProfile.name}": ${styleProfile.description}
TONE: ${styleProfile.tone}` : ''}

${contentStyle ? `CONTENT STYLE: ${contentStyle}` : ''}
${contentPersonality ? `CONTENT PERSONALITY: ${contentPersonality}` : ''}

PLATFORM ADAPTATION: Optimize specifically for ${platform} with the right format, hooks, and engagement tactics.`;

    // Enhanced user prompt with clearer instructions
    let userPrompt = `Create 5 original, viral-potential video ideas for a ${validAccountType} creator in the "${niche}" niche targeting "${audience}" on ${platform}.`;

    // Specialized prompts for different account types
    if (validAccountType === 'ecommerce') {
      userPrompt += `
FOR ECOMMERCE BRANDS - EXTREMELY IMPORTANT:
- Create at least 4 ideas that have ABSOLUTELY NOTHING to do with products:
  * Educational content about broader ${niche} topics
  * Industry insights, trends and news
  * Lifestyle content related to the interests of ${audience}
  * Problem-solving content that helps your audience
  * Content that builds community around shared interests
- These 4+ ideas MUST NOT mention, imply, or reference products in ANY way
- DO NOT use words like "our", "we sell", "product", "offering", etc. in these ideas
- AT MOST 1 idea can subtly reference products or your brand - the rest should be completely product-free
- Think like a content creator or educator, NOT like a brand

EXAMPLES OF GOOD PURE-VALUE IDEAS FOR ${niche.toUpperCase()}:
* "The Secret Warm-Up Routine Pro Athletes Use Before Intense Training"
* "I Tracked My Performance For 30 Days - Here's What The Data Revealed"
* "The Surprising Connection Between Sleep Quality and Athletic Performance"
* "5 Unconventional Training Methods That Changed Everything For Me"`;
    } else if (validAccountType === 'personal') {
      userPrompt += `
FOR PERSONAL BRANDS - IMPORTANT GUIDELINES:
- Create a DIVERSE MIX of content formats with NO REPETITION:
  * 1 storytelling idea with a specific narrative focus
  * 1 behind-the-scenes or day-in-the-life content 
  * 1 educational or expert insight video
  * 1 list-based content with a compelling angle
  * 1 trend analysis or current event perspective
- All ideas must be PROFESSIONAL and STRAIGHT-TO-THE-POINT - avoid anything that feels gimmicky or cringy
- Each idea should have CLEAR VIRAL POTENTIAL with strong hooks and unique angles
- Aim for ideas that would genuinely interest ${audience} and provide real value
- Focus on content that builds authority while being authentic and relatable`;
    } else if (validAccountType === 'business') {
      userPrompt += `
FOR BUSINESS BRANDS:
- Ideas should establish industry authority and thought leadership
- Include case studies, insider knowledge, and educational content
- Focus on building trust and credibility with potential clients
- Demonstrate expertise without being overly technical or jargon-heavy`;
    }

    // Add custom ideas and previous context
    userPrompt += `
${customIdeas ? `CREATOR'S OWN IDEAS: "${customIdeas}"` : ""}

${previousIdeas && previousIdeas.titles && previousIdeas.titles.length ? 
  `DO NOT REPEAT THESE PREVIOUS IDEAS: ${previousIdeas.titles.slice(0, 5).join(', ')}` : ''}

Format each idea with:
1. A specific, scroll-stopping title
2. Content category/format
3. Detailed description
4. 3-5 relevant hashtags`;

    // Call OpenAI with effective parameters
    console.log('Calling OpenAI API...');
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
        temperature: 0.9,
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
            
            const title = titleMatch ? titleMatch[1].trim() : "Viral Content Idea";
            const category = categoryMatch ? categoryMatch[1].trim() : "Content";
            const description = descriptionMatch ? descriptionMatch[1].trim() : text.trim();
            
            let tags = [];
            if (hashtagsMatch) {
              tags = hashtagsMatch.map(tag => tag.replace('#', '').trim());
            } else {
              // Default tags if none found
              tags = [niche.toLowerCase().replace(/\s+/g, ''), "content", "viral"]; 
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
      
      // Aggressively check for product mentions in all ideas for ecommerce accounts
      if (validAccountType === 'ecommerce' && ideas.length > 0) {
        console.log("Ecommerce account detected - checking for product mentions");
        
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
        
        // Add direct product niche mentions as selling language to detect
        // For example if niche is "running sunglasses", match "sunglasses" or "glasses" as product words
        const nicheWords = niche.toLowerCase().split(/\s+/);
        if (nicheWords.length > 0) {
          // For multi-word niches, also add the last word as it's often the product
          if (nicheWords.length > 1) {
            productPhrases.push(nicheWords[nicheWords.length - 1]);
          }
          
          // Add specific product patterns for the niche
          productPhrases.push(
            "our " + niche, 
            niche + " product", 
            niche + " line",
            niche + " model",
            "quality " + niche,
            "premium " + niche
          );
        }
        
        // Define pure-value, educational ideas that make NO mention of products whatsoever
        const pureValueIdeas = [
          {
            title: `The Science of Optimal Performance: What Top Athletes Know About ${audience[0].toUpperCase() + audience.slice(1)} Training`,
            category: "Educational Content",
            description: `A deep dive into the scientific principles behind peak athletic performance, sharing research-backed insights that top coaches use with elite athletes. This educational content positions you as a knowledge authority while providing actionable training wisdom without any product promotion.`,
            tags: ["performancescience", "athletictraining", "researchbacked"]
          },
          {
            title: `5 Training Myths Debunked: What Science Actually Says About ${nicheWords[0]} Performance`,
            category: "Myth Busting",
            description: `Challenge common misconceptions in the ${nicheWords[0]} space with evidence-based explanations. This science-focused content helps your audience avoid training mistakes while establishing you as a trustworthy, fact-based resource in your field.`,
            tags: ["mythbusting", "sciencebacked", "trainingtips"]
          },
          {
            title: `What I Learned Shadowing Elite ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Coaches for 30 Days`,
            category: "Behind-the-Scenes",
            description: `Share exclusive insights gained from spending time with top coaches in the industry. This behind-the-scenes content gives your audience access to professional-level knowledge while positioning you as connected and informed in the ${nicheWords[0]} community.`,
            tags: ["elitecoaching", "behindthescenes", "insiderknowledge"]
          },
          {
            title: `The Recovery Protocol That Transformed My ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Performance`,
            category: "Personal Experience",
            description: `Detail a specific recovery system that significantly improved your performance, focusing on techniques anyone can implement. This experience-based content provides immediate value to your audience while establishing your credibility through personal results.`,
            tags: ["recoveryprotocol", "performanceenhancement", "athleticrecovery"]
          },
          {
            title: `I Analyzed the Training Routines of 50 Pro ${audience.charAt(0).toUpperCase() + audience.slice(1)} - Here's What They All Have in Common`,
            category: "Data Analysis",
            description: `Present findings from studying the training habits of professional athletes, highlighting the patterns that contribute to their success. This research-driven content delivers unique insights your audience can't find elsewhere while establishing you as a serious analyst of athletic performance.`,
            tags: ["dataanalysis", "protraining", "performancepatterns"]
          },
          {
            title: `The Mental Game: Psychological Techniques That Set Elite ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Athletes Apart`,
            category: "Sports Psychology",
            description: `Explore the mental strategies used by top performers to overcome challenges and achieve peak performance. This psychology-focused content addresses an often-overlooked aspect of training while providing valuable mindset tools for your audience.`,
            tags: ["sportpsychology", "mentalstrength", "eliteperformance"]
          },
          {
            title: `What Your ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Form Says About Your Training Needs`,
            category: "Technique Analysis",
            description: `Break down common technique patterns and what they reveal about training imbalances or areas for improvement. This analytical content helps your audience identify personalized training needs while demonstrating your expert eye for technical details.`,
            tags: ["formanalysis", "techniquebreakdown", "customtraining"]
          },
          {
            title: `The Training Calendar of a Champion: How Elite ${audience.charAt(0).toUpperCase() + audience.slice(1)} Structure Their Year`,
            category: "Training Periodization",
            description: `Reveal how professional athletes plan their training cycles throughout the year for optimal performance. This strategic content gives your audience a high-level framework for their own training while positioning you as someone who understands the big picture of athletic development.`,
            tags: ["periodization", "seasonplanning", "elitetraining"]
          },
          {
            title: `7 Performance-Boosting Habits I Learned From Olympic ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Athletes`,
            category: "Lifestyle Optimization",
            description: `Share key lifestyle practices that Olympic-level athletes use to support their training and recovery. This holistic content broadens your expertise beyond just workouts to show how everyday habits contribute to athletic excellence.`,
            tags: ["athletehabits", "performancelifestyle", "olympicmindset"]
          },
          {
            title: `The Hidden Factors Affecting Your ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Performance That No One Talks About`,
            category: "Performance Analysis",
            description: `Explore overlooked elements that significantly impact athletic performance, such as environmental factors, timing considerations, or subtle technique adjustments. This insightful content demonstrates your deep understanding of performance optimization beyond the obvious factors.`,
            tags: ["performancefactors", "hiddenvariables", "trainingoptimization"]
          }
        ];
        
        // Product-focused idea templates (only 1 of these maximum should be used)
        const productFocusedIdeas = [
          {
            title: `What No One Tells You About Choosing the Right ${niche} for Your Performance Level`,
            category: "Buyer's Guide",
            description: `A helpful guide for athletes looking to make informed decisions about their equipment. This educational approach focuses primarily on criteria for evaluation rather than specific product promotion, helping your audience understand what features matter most for their specific needs.`,
            tags: ["buyersguide", "equipmentchoice", "informeddecision"]
          },
          {
            title: `How Equipment Technology Has Transformed ${nicheWords[0].charAt(0).toUpperCase() + nicheWords[0].slice(1)} Performance Over the Last Decade`,
            category: "Industry Evolution",
            description: `Explore the technological advancements in the industry and how they've changed the sport, touching on various brands and innovations including but not focusing exclusively on your own. This educational approach positions you as knowledgeable about the broader industry landscape.`,
            tags: ["techevolution", "sportsinnovation", "equipmentadvancement"]
          }
        ];
        
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
        
        // For ecommerce, we want maximum 1 product idea, minimum 4 pure value ideas
        if (productMentionCount > 1 || ideas.length < 5) {
          console.log("Too many product mentions or too few ideas - replacing with balanced set");
          
          // Create a balanced set of ideas: 4 pure value + 1 subtle product mention
          const newIdeas = [];
          
          // Add 4 pure value ideas (randomly selected from our pool)
          for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * pureValueIdeas.length);
            newIdeas.push(pureValueIdeas[randomIndex]);
            // Remove to avoid duplicates
            pureValueIdeas.splice(randomIndex, 1);
          }
          
          // Add 1 product-focused idea
          const productIdeaIndex = Math.floor(Math.random() * productFocusedIdeas.length);
          newIdeas.push(productFocusedIdeas[productIdeaIndex]);
          
          // Replace the original ideas with our balanced set
          ideas = newIdeas;
          
          console.log("Replaced with 4 pure value ideas and 1 product-focused idea");
        } else if (productMentionCount === 0 && ideas.length >= 5) {
          // If we have 0 product mentions and enough ideas, replace one with a product-focused idea
          console.log("No product mentions detected - adding one product-focused idea");
          
          const productIdeaIndex = Math.floor(Math.random() * productFocusedIdeas.length);
          const randomIdeaToReplace = Math.floor(Math.random() * ideas.length);
          
          // Replace a random idea with a product-focused one
          ideas[randomIdeaToReplace] = productFocusedIdeas[productIdeaIndex];
          
          console.log("Added 1 product-focused idea");
        }
      }
      
      // For personal and business accounts, check if ideas look too templated
      if (validAccountType !== 'ecommerce') {
        // Check if ideas are just templates with the niche plugged in
        const templatePatterns = [
          /^5 Tips for/i,
          /^How to/i,
          /^Top \d+ Ways/i,
          /^The Ultimate Guide to/i
        ];
        
        let templatedIdeasCount = 0;
        ideas.forEach(idea => {
          if (templatePatterns.some(pattern => pattern.test(idea.title))) {
            templatedIdeasCount++;
          }
        });
        
        // If more than 60% of ideas look templated, regenerate with stricter instructions
        if (templatedIdeasCount >= Math.floor(ideas.length * 0.6)) {
          console.log("Detected templated ideas, running fallback with creative examples");
          
          // Enhanced fallback examples based on account type
          let exampleIdeas = "";
          
          if (validAccountType === 'personal') {
            exampleIdeas = `
- "What a $50K ${niche} Expert Taught Me in Just One Hour (Worth Every Penny)"
- "My Daily ${niche} Routine: The 15-Minute System That Doubled My Results"
- "I Studied Every Top ${niche} Creator's Process for 30 Days - Here's What Actually Works"
- "Behind-the-Scenes: What Managing a ${niche} Business Really Looks Like"
- "5 ${niche} Myths I Believed Until I Worked With Industry Leaders"`;
          } else if (validAccountType === 'business') {
            exampleIdeas = `
- "The Client Strategy We Refused to Share With Our ${niche} Competitors Until Now"
- "What 100 Successful ${niche} Professionals Have in Common - Our 3-Year Research Study"
- "The Unconventional ${niche} Framework That Cut Our Client's Costs by 40%"
- "Behind Closed Doors: How Top ${niche} Firms Actually Make Strategic Decisions"
- "The ${niche} Analysis Method That Changed How We Approach Every Client Project"`;
          }
          
          const stricterPrompt = `${userPrompt}

IMPORTANT: Your previous ideas were too templated. Create TRULY ORIGINAL ideas like these examples:${exampleIdeas}

- Create a diverse mix of content formats with NO REPETITION
- All ideas must be professional, straight-to-the-point, and have viral potential
- Avoid cringy, clickbaity or gimmicky approaches entirely`;
          
          const stricterResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: stricterPrompt }
              ],
              temperature: 1.0,
              max_tokens: 1200
            }),
          });
          
          if (stricterResponse.ok) {
            const stricterData = await stricterResponse.json();
            const stricterRawResponse = stricterData.choices[0].message.content;
            console.log('Stricter AI response:', stricterRawResponse);
            
            const stricterJsonMatch = stricterRawResponse.match(/\{[\s\S]*\}/);
            if (stricterJsonMatch) {
              const stricterParsedData = JSON.parse(stricterJsonMatch[0]);
              if (stricterParsedData.ideas && Array.isArray(stricterParsedData.ideas)) {
                ideas = stricterParsedData.ideas;
              }
            }
          }
        }
      }
      
      // Limit to exactly 5 ideas
      ideas = ideas.slice(0, 5);
      
      // Ensure all ideas have required fields
      ideas = ideas.map(idea => ({
        title: idea.title || `Viral ${niche} Concept`,
        category: idea.category || "Creative Content",
        description: idea.description || `A unique approach to creating content about ${niche} that will resonate with ${audience}.`,
        tags: Array.isArray(idea.tags) && idea.tags.length > 0 ? 
          idea.tags : ["viral", "content", niche.toLowerCase().replace(/\s+/g, '-')]
      }));
      
    } catch (error) {
      console.error("Error parsing ideas:", error);
      
      // Carefully selected fallback ideas based on account type
      if (validAccountType === 'ecommerce') {
        // Return a mix of 4 pure value ideas and 1 product idea
        ideas = [
          {
            title: `The Science Behind Recovery: What Elite Athletes Know That Most Don't`,
            category: "Educational Content",
            description: `A deep dive into the science of athletic recovery, sharing research-backed techniques used by elite athletes. This educational content builds authority while providing valuable knowledge without any product promotion.`,
            tags: ["recovery", "sciencebacked", "eliteperformance"]
          },
          {
            title: `I Tracked My Training Data for 6 Months - Here's What Actually Improved My Performance`,
            category: "Data Analysis",
            description: `Share insights from personal data tracking, revealing unexpected patterns and effective strategies that anyone can apply. This data-driven content demonstrates your commitment to improvement and provides actionable insights.`,
            tags: ["datadriven", "performancetracking", "athleticimprovement"]
          },
          {
            title: `5 Pre-Competition Rituals of Olympic Athletes That Anyone Can Use`,
            category: "Performance Psychology",
            description: `Explore the mental preparation techniques used by Olympic-level athletes before important events. This psychological content addresses the often-overlooked mental aspect of performance without selling any products.`,
            tags: ["mentalpreperation", "performancepsychology", "precompetitionritual"]
          },
          {
            title: `What Pro Coaches Look for When Evaluating Athlete Potential`,
            category: "Expert Insights",
            description: `Share insider knowledge about how professional coaches identify and develop talent. This insider content positions you as connected in the industry while providing valuable perspective for ambitious athletes.`,
            tags: ["talentdevelopment", "coachinginsights", "athleticpotential"]
          },
          {
            title: `How Equipment Technology Has Evolved and What It Means for Today's Athletes`,
            category: "Industry Trends",
            description: `Examine how technological advancements have changed the sport, discussing various brands and innovations (including but not exclusively yours). This educational approach positions you as knowledgeable about the broader industry landscape.`,
            tags: ["equipmentevolution", "sportstechnology", "industrytrends"]
          }
        ];
      } else if (validAccountType === 'personal') {
        ideas = [
          {
            title: `What a $10,000 ${niche} Workshop Taught Me That Changed Everything`,
            category: "Personal Experience",
            description: `Share the most valuable insights gained from a high-level professional development experience, focusing on unexpected or counter-intuitive lessons. This narrative content provides unique value while positioning you as someone who invests seriously in your expertise.`,
            tags: ["expertinsights", "professionaltraining", "gamechangers"]
          },
          {
            title: `Behind My Most Successful ${niche} Project: The Full Process Breakdown`,
            category: "Behind-the-Scenes",
            description: `Provide a detailed look at your workflow on a particularly successful project, showing both the polished result and the messy reality of creating it. This transparent content builds trust while giving your audience practical insights into professional-level work.`,
            tags: ["creativeprocess", "behindthescenes", "projectbreakdown"]
          },
          {
            title: `The ${niche} Myths I Believed Until I Worked With Industry Leaders`,
            category: "Myth Busting",
            description: `Challenge common misconceptions in your field based on your professional experience working with top experts. This perspective-shifting content helps your audience avoid common mistakes while establishing your credibility through association with industry leaders.`,
            tags: ["mythbusting", "industryinsider", "expertperspective"]
          },
          {
            title: `3 Unconventional ${niche} Techniques That Produced My Best Results Ever`,
            category: "Tactical Advice",
            description: `Share specific, unusual methods you've personally tested that delivered outstanding results, with detailed instructions for implementation. This actionable content provides immediate value while showcasing your innovative approach to your craft.`,
            tags: ["unconventionaltechniques", "creativemethods", "proventactics"]
          },
          {
            title: `What My Day As A ${niche} Professional Actually Looks Like (Reality vs Expectations)`,
            category: "Day in the Life",
            description: `Contrast the glamorized perception of your profession with the day-to-day reality, sharing both challenges and rewarding moments. This authentic content builds relatability while satisfying curiosity about professional life in your field.`,
            tags: ["dayinthelife", "professionreality", "behindthescenes"]
          }
        ];
      } else {
        ideas = [
          {
            title: `The Client Framework We Use to Double ${niche} Results in Half the Time`,
            category: "Business Methodology",
            description: `Outline a proprietary system your business uses that consistently delivers superior results for clients. This methodological content demonstrates your systematic approach while providing actionable insights that position your business as exceptionally effective.`,
            tags: ["framework", "methodology", "businessresults"]
          },
          {
            title: `Inside Our Most Challenging ${niche} Project: How We Turned Failure Into Success`,
            category: "Case Study",
            description: `Share a detailed account of a difficult project that initially went wrong, focusing on how your team's problem-solving approach ultimately created a successful outcome. This narrative builds credibility by showing your resilience and adaptability in challenging situations.`,
            tags: ["casestudy", "problemsolving", "businesschallenges"]
          },
          {
            title: `What 50+ Client Projects Taught Us About Effective ${niche} Strategy`,
            category: "Industry Insights",
            description: `Present key patterns and conclusions drawn from extensive client work, distilling practical wisdom that applies across your industry. This experience-based content establishes your business as having broad and deep expertise gained through substantial real-world application.`,
            tags: ["strategyinsights", "industrypatterns", "clientexperience"]
          },
          {
            title: `The Future of ${niche}: 5 Trends Reshaping the Industry in 2023`,
            category: "Trend Analysis",
            description: `Provide forward-looking insights about emerging developments in your field, demonstrating your business's finger on the pulse of industry evolution. This visionary content positions your company as a thought leader that clients can trust to keep them ahead of the curve.`,
            tags: ["industrytrends", "futurepredictions", "businessevolution"]
          },
          {
            title: `Behind Closed Doors: How Our ${niche} Team Approaches Complex Client Challenges`,
            category: "Process Reveal",
            description: `Take viewers inside your internal workflows, showing how your team collaborates to solve difficult problems. This transparent content humanizes your business while showcasing the intellectual firepower and teamwork that clients benefit from when working with you.`,
            tags: ["teamprocess", "businessworkflow", "problemsolving"]
          }
        ];
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

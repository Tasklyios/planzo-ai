
import { supabase } from "@/integrations/supabase/client";
import { HookType, SavedHook } from "@/types/hooks";
import { toast } from "@/components/ui/use-toast";

export const generateHooks = async (
  topic: string,
  audience: string,
  details?: string
): Promise<HookType[]> => {
  try {
    // First check usage limits
    const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
      body: { action: 'hooks' }
    });

    if (usageError) {
      console.error("Usage check error:", usageError);
      throw new Error(`Usage check error: ${usageError.message}`);
    }

    // Check if we can proceed or not
    if (usageResponse?.canProceed === false) {
      console.error("Usage limit reached:", usageResponse?.message);
      throw new Error(usageResponse?.message || "You've reached your daily limit for generating hooks.");
    }

    // Enhanced topic analysis
    // Analyze if this is for a specific industry or content type
    const isEcommerce = topic.toLowerCase().includes('product') || 
                        topic.toLowerCase().includes('shop') ||
                        topic.toLowerCase().includes('store') ||
                        topic.toLowerCase().includes('ecommerce') ||
                        topic.toLowerCase().includes('e-commerce') ||
                        topic.toLowerCase().includes('marketplace');
    
    const isFinance = topic.toLowerCase().includes('finance') ||
                      topic.toLowerCase().includes('money') ||
                      topic.toLowerCase().includes('investing') ||
                      topic.toLowerCase().includes('wealth') ||
                      topic.toLowerCase().includes('budget');
                      
    const isTech = topic.toLowerCase().includes('tech') ||
                   topic.toLowerCase().includes('software') ||
                   topic.toLowerCase().includes('developer') ||
                   topic.toLowerCase().includes('coding') ||
                   topic.toLowerCase().includes('digital');
                   
    const isLifestyle = topic.toLowerCase().includes('lifestyle') ||
                        topic.toLowerCase().includes('wellness') ||
                        topic.toLowerCase().includes('fitness') ||
                        topic.toLowerCase().includes('health') ||
                        topic.toLowerCase().includes('travel');
    
    // Generate audience psychographics based on input
    const audienceProfile = analyzeAudience(audience);
    
    // Enhanced industry-specific research for viral hooks
    const industryResearch = {
      viralTrends: getViralTrendsForIndustry(topic, isEcommerce, isFinance, isTech, isLifestyle),
      hookPatterns: getSuccessfulHookPatterns(isEcommerce, isFinance, isTech, isLifestyle),
      contentTriggers: getEmotionalTriggers(audienceProfile),
      attentionGrabbers: getAttentionTechniques(topic, audience)
    };

    // Call Supabase Edge Function to generate hooks with enhanced context
    const { data, error } = await supabase.functions.invoke("generate-hooks", {
      body: { 
        topic, 
        audience, 
        details,
        isEcommerce,
        isFinance,
        isTech,
        isLifestyle,
        audienceProfile,
        industryResearch,
        optimizeForViral: true
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to generate hooks");
    }
    
    if (!data || !data.hooks) {
      console.error("No hooks returned from the edge function:", data);
      throw new Error("No hooks were returned. Please try again.");
    }
    
    console.log("Hooks generated successfully:", data.hooks);
    
    // Transform the returned hooks to match the expected HookType structure
    // and assign them to specific categories
    const formattedHooks = data.hooks.map((hook: any, index: number) => {
      // Determine category based on index or content
      let category: string;
      
      // Intelligent category assignment based on content
      const hookText = hook.hook?.toLowerCase() || "";
      if (hookText.includes("?") || hookText.startsWith("what") || hookText.startsWith("how") || 
          hookText.startsWith("why") || hookText.startsWith("when") || hookText.startsWith("are")) {
        category = "question";
      } else if (hookText.includes("%") || hookText.match(/\d+(\.\d+)?%/) || 
                 hookText.match(/\d+ out of \d+/) || hookText.includes("study shows") ||
                 hookText.includes("according to") || hookText.includes("research")) {
        category = "statistic";  
      } else if (hookText.includes("imagine") || hookText.includes("picture this") || 
                 hookText.includes("when i") || hookText.includes("my story") ||
                 hookText.includes("once upon") || hookText.includes("day")) {
        category = "story";
      } else if (hookText.includes("challenge") || hookText.includes("try this") || 
                 hookText.includes("can you") || hookText.startsWith("if you can")) {
        category = "challenge";
      } else {
        // Fallback to simple distribution across categories
        const categoryIndex = index % 4;
        switch (categoryIndex) {
          case 0: category = "question"; break;
          case 1: category = "statistic"; break;
          case 2: category = "story"; break;
          case 3: category = "challenge"; break;
          default: category = "question";
        }
      }

      return {
        id: crypto.randomUUID(),
        hook_text: hook.hook || "",
        category: category,
        explanation: hook.explanation || ""
      };
    });

    return formattedHooks || [];
  } catch (error: any) {
    console.error("Error generating hooks:", error);
    throw new Error(error.message || "Failed to generate hooks");
  }
};

// Helper function to analyze audience and create psychographic profile
function analyzeAudience(audience: string): any {
  const agePattern = /(young|teen|middle-aged|senior|elderly|adult|gen z|millennial|boomer)/i;
  const ageMatch = audience.match(agePattern);
  
  const incomePattern = /(affluent|wealthy|budget|low-income|middle-class|high-income)/i;
  const incomeMatch = audience.match(incomePattern);
  
  const interestPattern = /(tech|fitness|fashion|beauty|travel|food|gaming|business|creative|professional)/i;
  const interestMatch = audience.match(interestPattern);
  
  const educationPattern = /(student|college|educated|professional|academic)/i;
  const educationMatch = audience.match(educationPattern);
  
  return {
    demographicAge: ageMatch ? ageMatch[0].toLowerCase() : "adult",
    demographicIncome: incomeMatch ? incomeMatch[0].toLowerCase() : "middle-class",
    primaryInterest: interestMatch ? interestMatch[0].toLowerCase() : "general",
    educationLevel: educationMatch ? educationMatch[0].toLowerCase() : "general",
    attentionSpan: isGenZ(audience) ? "short" : "medium",
    contentPreference: isGenZ(audience) ? "visual-first" : "balanced",
    valuesTriggers: determineValues(audience)
  };
}

// Helper function to determine if audience is Gen Z
function isGenZ(audience: string): boolean {
  return audience.toLowerCase().includes("gen z") || 
         audience.toLowerCase().includes("young") || 
         audience.toLowerCase().includes("teen") ||
         audience.toLowerCase().includes("tiktok");
}

// Helper function to determine audience values
function determineValues(audience: string): string[] {
  const values = [];
  
  if (audience.toLowerCase().includes("eco") || audience.toLowerCase().includes("sustainable")) {
    values.push("sustainability", "environmental-consciousness");
  }
  
  if (audience.toLowerCase().includes("entrepreneur") || audience.toLowerCase().includes("business")) {
    values.push("ambition", "success", "innovation");
  }
  
  if (audience.toLowerCase().includes("parent") || audience.toLowerCase().includes("family")) {
    values.push("family", "safety", "nurturing");
  }
  
  if (audience.toLowerCase().includes("fitness") || audience.toLowerCase().includes("health")) {
    values.push("health", "self-improvement", "discipline");
  }
  
  // Default values if none detected
  if (values.length === 0) {
    values.push("authenticity", "belonging", "self-expression");
  }
  
  return values;
}

// Helper function to get viral trends for specific industry
function getViralTrendsForIndustry(
  topic: string, 
  isEcommerce: boolean,
  isFinance: boolean,
  isTech: boolean,
  isLifestyle: boolean
): string[] {
  if (isEcommerce) {
    return [
      "Unboxing experiences",
      "Behind-the-scenes manufacturing",
      "Customer testimonial spotlights",
      "Product usage time-lapses",
      "Unexpected product uses",
      "Price-to-value reveals",
      "Product durability tests"
    ];
  }
  
  if (isFinance) {
    return [
      "Money-saving challenges",
      "Financial myth-busting",
      "Dramatic financial transformations",
      "Side hustle success stories",
      "Money management hacks",
      "Investment strategy simplifications"
    ];
  }
  
  if (isTech) {
    return [
      "Tech life hacks",
      "Product comparison reveals",
      "Hidden features exposés",
      "Tech problem quick solutions",
      "Future tech predictions",
      "Tech myth debunking"
    ];
  }
  
  if (isLifestyle) {
    return [
      "Day-in-the-life content",
      "Before and after transformations",
      "Routine optimizations",
      "Unexpected lifestyle hacks",
      "Expert secrets revealed",
      "Productivity breakthroughs"
    ];
  }
  
  // Generic viral trends
  return [
    "Shocking reveals",
    "Counterintuitive insights",
    "Expert secrets",
    "Day-in-the-life content", 
    "Before/after transformations",
    "Quick solution hacks"
  ];
}

// Helper function to get successful hook patterns by industry
function getSuccessfulHookPatterns(
  isEcommerce: boolean,
  isFinance: boolean,
  isTech: boolean,
  isLifestyle: boolean
): string[] {
  const universalPatterns = [
    "The one thing most [topic] experts won't tell you...",
    "I tried [topic] for 30 days straight. Here's what happened...",
    "3 [topic] secrets that changed my life...",
    "What they don't want you to know about [topic]...",
    "The truth about [topic] nobody is discussing..."
  ];
  
  const industrySpecificPatterns = isEcommerce ? [
    "This [product] hack saved me $X per month...",
    "Why you've been using [product] wrong your entire life...",
    "I tested X [products] and found the clear winner..."
  ] : isFinance ? [
    "How I paid off $X in debt using this one strategy...",
    "The X% rule that transformed my finances...",
    "Why your bank doesn't want you to know this simple trick..."
  ] : isTech ? [
    "This hidden [tech] feature will change everything...",
    "I switched from [tech product A] to [tech product B] and discovered...",
    "The [tech] setting that instantly improved my experience..."
  ] : isLifestyle ? [
    "I tried the viral [lifestyle] trend for a week...",
    "My [routine] secret to [outcome] every single day...",
    "How changing this ONE habit transformed my [aspect of life]..."
  ] : [];
  
  return [...universalPatterns, ...industrySpecificPatterns];
}

// Helper function to get emotional triggers based on audience
function getEmotionalTriggers(audienceProfile: any): string[] {
  const universalTriggers = [
    "curiosity", 
    "surprise", 
    "insider knowledge", 
    "belonging", 
    "fear of missing out"
  ];
  
  const ageBasedTriggers = audienceProfile.demographicAge.includes("young") || 
                           audienceProfile.demographicAge.includes("gen z") ? 
    ["authenticity", "identity", "social currency", "humor", "creativity"] :
    audienceProfile.demographicAge.includes("middle") || 
    audienceProfile.demographicAge.includes("adult") ?
    ["efficiency", "value", "expertise", "status", "self-improvement"] :
    ["security", "tradition", "reliability", "wisdom", "legacy"];
  
  const valuesTriggers = audienceProfile.valuesTriggers.map((value: string) => {
    switch(value) {
      case "sustainability": return ["eco-responsibility", "future impact"];
      case "ambition": return ["success indicators", "competitive advantage"];
      case "health": return ["optimization", "vitality", "longevity"];
      case "family": return ["protection", "legacy", "togetherness"];
      default: return ["personal growth", "transformation"];
    }
  }).flat();
  
  return [...universalTriggers, ...ageBasedTriggers, ...valuesTriggers];
}

// Helper function to get attention-grabbing techniques
function getAttentionTechniques(topic: string, audience: string): string[] {
  const basicTechniques = [
    "controversial statements",
    "unexpected statistics",
    "bold claims with proof",
    "relatable mistakes",
    "direct audience callout",
    "counterintuitive insights",
    "solving common pain points"
  ];
  
  // Personalized techniques based on topic and audience
  const personalizedTechniques = [];
  
  if (topic.toLowerCase().includes("how to") || topic.toLowerCase().includes("guide")) {
    personalizedTechniques.push(
      "expert credential showcase",
      "transformation timeline snapshot",
      "common misconception correction"
    );
  }
  
  if (audience.toLowerCase().includes("beginner") || audience.toLowerCase().includes("new")) {
    personalizedTechniques.push(
      "simplified explanations",
      "beginner-friendly comparisons",
      "reassurance of learning curve"
    );
  }
  
  if (audience.toLowerCase().includes("expert") || audience.toLowerCase().includes("advanced")) {
    personalizedTechniques.push(
      "cutting-edge insights",
      "industry insider perspective",
      "nuanced technique optimization"
    );
  }
  
  return [...basicTechniques, ...personalizedTechniques];
}

export const getSavedHooks = async (): Promise<SavedHook[]> => {
  try {
    const { data, error } = await supabase
      .from("script_hooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching saved hooks:", error);
    throw new Error(error.message || "Failed to fetch saved hooks");
  }
};

export const saveHook = async (hook: HookType): Promise<SavedHook> => {
  try {
    // Get the current user ID first
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from("script_hooks")
      .insert({
        hook: hook.hook_text,
        category: hook.category || "general",
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error saving hook:", error);
    throw new Error(error.message || "Failed to save hook");
  }
};

export const deleteSavedHook = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("script_hooks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error: any) {
    console.error("Error deleting saved hook:", error);
    throw new Error(error.message || "Failed to delete saved hook");
  }
};

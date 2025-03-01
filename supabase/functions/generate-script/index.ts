
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    const { title, description, details, ideaId } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating script for: ${title}`);
    console.log(`Description: ${description || 'None provided'}`);
    console.log(`Details: ${details || 'None provided'}`);
    console.log(`Idea ID: ${ideaId || 'None'}`);

    // Create a basic script structure
    const script = `# ${title}

## Introduction
Hook: [Insert an attention-grabbing hook here]

${description ? `${description}\n\n` : ''}

## Main Content
1. First key point about ${title}
   - Supporting detail A
   - Supporting detail B

2. Second key point
   - Example 1
   - Example 2

3. Third key point
   - Fact or statistic
   - Practical application

## Conclusion
- Summarize the main points
- Call to action: What should the viewer do next?
${details ? `\n\nAdditional Notes:\n${details}` : ''}
`;

    // For the demo, we'll just use the generated script template
    // In a real implementation, you might use an AI model like OpenAI to generate the script

    console.log("Script generated successfully");
    
    // Check if this is linked to an idea and update accordingly
    if (ideaId) {
      try {
        const { error } = await supabase
          .from('video_ideas')
          .update({ script })
          .eq('id', ideaId);
          
        if (error) {
          console.error("Error updating idea with script:", error);
        } else {
          console.log(`Updated idea ${ideaId} with generated script`);
        }
      } catch (error) {
        console.error("Error updating idea:", error);
      }
    }

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-script function:", error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate script. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

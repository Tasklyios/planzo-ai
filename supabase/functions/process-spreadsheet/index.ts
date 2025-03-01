
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

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
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type')?.toString();

    if (!file || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing file or type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check that type is either "hooks" or "structures"
    if (type !== 'hooks' && type !== 'structures') {
      return new Response(
        JSON.stringify({ error: 'Type must be either "hooks" or "structures"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Convert the uploaded file to an ArrayBuffer
    const arrayBuffer = await (file as File).arrayBuffer();
    
    // Parse the Excel or CSV file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert the worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Validate the data structure based on type
    if (type === 'hooks' && (!data.length || !data[0].hook)) {
      return new Response(
        JSON.stringify({ error: 'Invalid hooks format. The spreadsheet must include a "hook" column.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (type === 'structures' && (!data.length || !data[0].name || !data[0].structure)) {
      return new Response(
        JSON.stringify({ error: 'Invalid structures format. The spreadsheet must include "name" and "structure" columns.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${data.length} ${type}`,
        rows: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing spreadsheet:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process spreadsheet' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import * as XLSX from "https://cdn.skypack.dev/xlsx";

// Check if user has access to this function (must be authenticated)
const checkAccess = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { error: 'Missing authorization header', status: 401 }
  }

  return null
}

// Parse multipart form data
const parseFormData = async (req: Request) => {
  const formData = await req.formData()
  const file = formData.get('file')
  const type = formData.get('type')

  if (!file || !(file instanceof File)) {
    return { error: 'Missing or invalid file', status: 400 }
  }

  if (!type || typeof type !== 'string') {
    return { error: 'Missing upload type', status: 400 }
  }

  return { file, type }
}

// Process hooks spreadsheet
const processHooksFile = async (file: File, supabaseClient: any, userId: string) => {
  try {
    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet)
    
    if (rows.length === 0) {
      return { error: 'Spreadsheet is empty', status: 400 }
    }
    
    // Validate required fields
    const invalidRows = rows.filter(row => !row['hook'])
    if (invalidRows.length > 0) {
      return { 
        error: 'Some rows are missing required "hook" field', 
        status: 400,
        invalidRows 
      }
    }
    
    // Prepare data for insertion
    const hooks = rows.map(row => ({
      user_id: userId,
      hook: row['hook'],
      category: row['category'] || 'general',
      description: row['description'] || null
    }))
    
    // Insert data
    const { error } = await supabaseClient
      .from('script_hooks')
      .insert(hooks)
    
    if (error) throw error
    
    return { rows: hooks }
  } catch (error) {
    console.error('Error processing hooks file:', error)
    return { 
      error: `Error processing file: ${error.message || 'Unknown error'}`, 
      status: 500 
    }
  }
}

// Process structures spreadsheet
const processStructuresFile = async (file: File, supabaseClient: any, userId: string) => {
  try {
    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet)
    
    if (rows.length === 0) {
      return { error: 'Spreadsheet is empty', status: 400 }
    }
    
    // Validate required fields
    const invalidRows = rows.filter(row => !row['name'] || !row['structure'])
    if (invalidRows.length > 0) {
      return { 
        error: 'Some rows are missing required "name" or "structure" fields', 
        status: 400,
        invalidRows 
      }
    }
    
    // Prepare data for insertion
    const structures = rows.map(row => ({
      user_id: userId,
      name: row['name'],
      structure: row['structure'],
      description: row['description'] || null
    }))
    
    // Insert data
    const { error } = await supabaseClient
      .from('script_structures')
      .insert(structures)
    
    if (error) throw error
    
    return { rows: structures }
  } catch (error) {
    console.error('Error processing structures file:', error)
    return { 
      error: `Error processing file: ${error.message || 'Unknown error'}`, 
      status: 500 
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization token - required for this endpoint
    const accessCheck = await checkAccess(req)
    if (accessCheck) {
      return new Response(
        JSON.stringify({ error: accessCheck.error }),
        {
          status: accessCheck.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the JWT token to get the user ID
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    )
    
    // Get user's auth details from their JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Error authenticating user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the form data
    const parseResult = await parseFormData(req)
    if ('error' in parseResult) {
      return new Response(
        JSON.stringify({ error: parseResult.error }),
        {
          status: parseResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { file, type } = parseResult
    let result

    // Process based on type
    if (type === 'hooks') {
      result = await processHooksFile(file, supabaseClient, user.id)
    } else if (type === 'structures') {
      result = await processStructuresFile(file, supabaseClient, user.id)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be either "hooks" or "structures"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle processing errors
    if ('error' in result) {
      return new Response(
        JSON.stringify({ error: result.error, details: result.invalidRows }),
        {
          status: result.status || 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Success!
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Import the createClient here to avoid Deno errors with imports in the global scope
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

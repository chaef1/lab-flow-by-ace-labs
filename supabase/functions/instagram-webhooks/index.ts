import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders, formatResponse } from '../_shared/utils.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || ''
const WEBHOOK_VERIFY_TOKEN = Deno.env.get('WEBHOOK_VERIFY_TOKEN') || ''

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper function to validate webhook signature
function validateSignature(payload: string, signature: string): boolean {
  if (!META_APP_SECRET) return false
  
  const expectedSignature = 'sha256=' + crypto.subtle.digestSync('SHA-256', 
    new TextEncoder().encode(META_APP_SECRET + payload)).toString()
  
  return signature === expectedSignature
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const url = new URL(req.url)
    
    // Handle GET request - Webhook Verification
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const challenge = url.searchParams.get('hub.challenge')
      const verifyToken = url.searchParams.get('hub.verify_token')
      
      console.log('Webhook verification request:', { mode, verifyToken })
      
      // Verify the token matches what we expect
      if (mode === 'subscribe' && verifyToken === WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge || 'verified', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Webhook verification failed:', { 
          expectedToken: WEBHOOK_VERIFY_TOKEN, 
          receivedToken: verifyToken 
        })
        return new Response('Verification failed', { 
          status: 403,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    }
    
    // Handle POST request - Event Notifications
    if (req.method === 'POST') {
      const signature = req.headers.get('X-Hub-Signature-256') || ''
      const payload = await req.text()
      
      // Validate the signature (optional but recommended)
      if (META_APP_SECRET && !validateSignature(payload, signature)) {
        console.error('Invalid webhook signature')
        return new Response('Invalid signature', { status: 401 })
      }
      
      let data
      try {
        data = JSON.parse(payload)
      } catch (error) {
        console.error('Failed to parse webhook payload:', error)
        return new Response('Invalid JSON', { status: 400 })
      }
      
      console.log('Webhook event received:', JSON.stringify(data, null, 2))
      
      // Process the webhook data
      if (data.object === 'instagram') {
        for (const entry of data.entry || []) {
          const instagramId = entry.id
          const time = entry.time
          
          // Process each change in the entry
          for (const change of entry.changes || []) {
            const field = change.field
            const value = change.value
            
            console.log(`Processing ${field} event for Instagram account ${instagramId}:`, value)
            
            // Handle different webhook fields
            switch (field) {
              case 'comments':
                await handleCommentEvent(instagramId, value, time)
                break
              case 'mentions':
                await handleMentionEvent(instagramId, value, time)
                break
              case 'messages':
                await handleMessageEvent(instagramId, value, time)
                break
              case 'story_insights':
                await handleStoryInsightsEvent(instagramId, value, time)
                break
              default:
                console.log(`Unhandled webhook field: ${field}`)
            }
          }
        }
      }
      
      // Always return 200 OK to acknowledge receipt
      return new Response('EVENT_RECEIVED', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    return new Response('Method not allowed', { status: 405 })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

// Handler functions for different webhook events
async function handleCommentEvent(instagramId: string, value: any, time: number) {
  try {
    console.log('Processing comment event:', value)
    
    // Store comment data in database
    const { error } = await supabase
      .from('instagram_webhook_events')
      .insert({
        instagram_account_id: instagramId,
        event_type: 'comment',
        event_data: value,
        timestamp: new Date(time * 1000).toISOString()
      })
    
    if (error) {
      console.error('Failed to store comment event:', error)
    }
  } catch (error) {
    console.error('Error handling comment event:', error)
  }
}

async function handleMentionEvent(instagramId: string, value: any, time: number) {
  try {
    console.log('Processing mention event:', value)
    
    // Store mention data in database
    const { error } = await supabase
      .from('instagram_webhook_events')
      .insert({
        instagram_account_id: instagramId,
        event_type: 'mention',
        event_data: value,
        timestamp: new Date(time * 1000).toISOString()
      })
    
    if (error) {
      console.error('Failed to store mention event:', error)
    }
  } catch (error) {
    console.error('Error handling mention event:', error)
  }
}

async function handleMessageEvent(instagramId: string, value: any, time: number) {
  try {
    console.log('Processing message event:', value)
    
    // Store message data in database
    const { error } = await supabase
      .from('instagram_webhook_events')
      .insert({
        instagram_account_id: instagramId,
        event_type: 'message',
        event_data: value,
        timestamp: new Date(time * 1000).toISOString()
      })
    
    if (error) {
      console.error('Failed to store message event:', error)
    }
  } catch (error) {
    console.error('Error handling message event:', error)
  }
}

async function handleStoryInsightsEvent(instagramId: string, value: any, time: number) {
  try {
    console.log('Processing story insights event:', value)
    
    // Store story insights data in database
    const { error } = await supabase
      .from('instagram_webhook_events')
      .insert({
        instagram_account_id: instagramId,
        event_type: 'story_insights',
        event_data: value,
        timestamp: new Date(time * 1000).toISOString()
      })
    
    if (error) {
      console.error('Failed to store story insights event:', error)
    }
  } catch (error) {
    console.error('Error handling story insights event:', error)
  }
}
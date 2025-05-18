
// Common utility functions for edge functions

/**
 * Formats a response with the appropriate CORS headers
 */
export function formatResponse(body: any, status = 200, additionalHeaders = {}) {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        ...additionalHeaders 
      } 
    }
  );
}

/**
 * Safely waits for Apify runs to complete with proper timeout handling
 */
export async function waitForApifyRun(runId: string, apiKey: string, maxWaitTime = 30000) {
  const startTime = Date.now();
  
  while ((Date.now() - startTime) < maxWaitTime) {
    // Check run status
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
    
    if (!statusResponse.ok) {
      console.error(`Failed to check run status: ${statusResponse.status}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds before next check
      continue;
    }
    
    const statusData = await statusResponse.json();
    
    if (statusData.data.status === 'SUCCEEDED') {
      // Get the dataset items
      const datasetResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`);
      
      if (!datasetResponse.ok) {
        const errorText = await datasetResponse.text();
        console.error(`Failed to fetch dataset: ${datasetResponse.status} - ${errorText}`);
        throw new Error(`Failed to fetch profile data from dataset: ${errorText}`);
      }
      
      return {
        success: true,
        data: await datasetResponse.json()
      };
    } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT') {
      console.error(`Run failed with status: ${statusData.data.status}`);
      throw new Error(`Profile scraping failed with status: ${statusData.data.status}`);
    } else {
      // Still running, wait before checking again
      console.log(`Run status: ${statusData.data.status}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Profile scraping timed out');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

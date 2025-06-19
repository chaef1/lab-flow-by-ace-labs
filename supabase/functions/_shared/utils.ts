
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
export async function waitForApifyRun(runId: string, apiKey: string, maxWaitTime = 90000) {
  const startTime = Date.now();
  const maxAttempts = Math.ceil(maxWaitTime / 3000); // Check every 3 seconds
  let attempts = 0;
  
  while ((Date.now() - startTime) < maxWaitTime) {
    attempts++;
    console.log(`Checking run status (attempt ${attempts}/${maxAttempts})...`);
    
    try {
      // Check run status using the Authorization header instead of query param
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!statusResponse.ok) {
        console.error(`Failed to check run status: ${statusResponse.status}`);
        if (statusResponse.status === 404) {
          console.error(`Run ID ${runId} not found. This could be due to an invalid API key or run ID.`);
        }
        
        // Try to log the response body for debugging
        try {
          const errorText = await statusResponse.text();
          console.error(`Status response error body: ${errorText}`);
        } catch (e) {
          console.error("Could not read status response body");
        }
        
        // Wait before next check instead of failing immediately
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Run status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get the dataset items
        const datasetId = statusData.data.defaultDatasetId;
        console.log(`Fetching dataset with ID: ${datasetId}`);
        
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (!datasetResponse.ok) {
          const errorText = await datasetResponse.text();
          console.error(`Failed to fetch dataset: ${datasetResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch profile data from dataset: ${errorText}`);
        }
        
        return {
          success: true,
          data: await datasetResponse.json()
        };
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT' || statusData.data.status === 'ABORTED') {
        console.error(`Run failed with status: ${statusData.data.status}`);
        
        // Try to fetch error message if available
        try {
          const logsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/log`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });
          if (logsResponse.ok) {
            const logs = await logsResponse.text();
            console.error(`Run logs excerpt: ${logs.substring(0, 500)}...`);
          }
        } catch (e) {
          console.error('Could not fetch run logs:', e);
        }
        
        throw new Error(`Profile scraping failed with status: ${statusData.data.status}`);
      } else {
        // Still running, wait before checking again
        console.log(`Run status: ${statusData.data.status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      if (error.message.includes('Profile scraping failed')) {
        // This is a terminal error, so we should throw it immediately
        throw error;
      }
      
      console.error('Error checking run status:', error);
      // For other errors, we'll try again until timeout
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error(`Profile scraping timed out after ${maxWaitTime/1000} seconds`);
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_SERVER = MAILCHIMP_API_KEY?.split("-")[1]; // Extract server from API key

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailUserRequest {
  email: string;
  subject: string;
  message: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, message, name }: EmailUserRequest = await req.json();

    // Note: Regular Mailchimp API is designed for marketing campaigns, not individual emails
    // For individual user emails, we should use Resend or another transactional service
    // This is a placeholder - recommend switching to Resend for individual emails
    
    return new Response(JSON.stringify({ 
      error: "Regular Mailchimp API is for campaigns, not individual emails. Please use Resend for transactional emails." 
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
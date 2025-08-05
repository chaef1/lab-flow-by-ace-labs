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

    // Send email using Mailchimp Transactional API
    const emailResponse = await fetch(`https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          from_email: "noreply@acelabs.com",
          from_name: "Ace Labs",
          to: [{
            email: email,
            name: name,
            type: "to"
          }],
          subject: subject,
          html: `
            <h1>Hello ${name}!</h1>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p>Best regards,<br>Ace Labs Team</p>
          `,
        }
      })
    });

    const responseData = await emailResponse.json();

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
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
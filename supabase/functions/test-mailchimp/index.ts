import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_LIST_ID = Deno.env.get("MAILCHIMP_LIST_ID");
const MAILCHIMP_SERVER = MAILCHIMP_API_KEY?.split("-")[1];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Mailchimp API connection...");
    console.log("API Key exists:", !!MAILCHIMP_API_KEY);
    console.log("List ID exists:", !!MAILCHIMP_LIST_ID);
    console.log("Server:", MAILCHIMP_SERVER);

    if (!MAILCHIMP_API_KEY) {
      return new Response(JSON.stringify({ error: "MAILCHIMP_API_KEY not set" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!MAILCHIMP_LIST_ID) {
      return new Response(JSON.stringify({ error: "MAILCHIMP_LIST_ID not set" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Test API connection by getting list info
    const listResponse = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log("List API response status:", listResponse.status);
    const listData = await listResponse.json();
    console.log("List API response:", listData);

    if (listResponse.ok) {
      // Test adding a sample member (will fail if already exists, which is fine)
      const testEmail = "test@example.com";
      const memberResponse = await fetch(
        `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: testEmail,
            status: "subscribed",
            merge_fields: {
              FNAME: "Test",
              LNAME: "User"
            }
          })
        }
      );

      console.log("Member API response status:", memberResponse.status);
      const memberData = await memberResponse.json();
      console.log("Member API response:", memberData);

      return new Response(JSON.stringify({
        success: true,
        listInfo: {
          name: listData.name,
          memberCount: listData.stats?.member_count || 0,
          id: listData.id
        },
        testMemberResponse: {
          status: memberResponse.status,
          data: memberData
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      return new Response(JSON.stringify({
        error: "Failed to connect to Mailchimp API",
        response: listData
      }), {
        status: listResponse.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in test-mailchimp function:", error);
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
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_LIST_ID = Deno.env.get("MAILCHIMP_LIST_ID");
const MAILCHIMP_SERVER = MAILCHIMP_API_KEY?.split("-")[1];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  userRole?: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, userRole, organizationName }: SignupRequest = await req.json();

    // Add user to Mailchimp audience
    const addMemberResponse = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: firstName || "",
            LNAME: lastName || "",
            ORGANIZATION: organizationName || "",
          }
        })
      }
    );

    const memberData = await addMemberResponse.json();
    
    if (!addMemberResponse.ok) {
      console.error("Failed to add member to Mailchimp:", memberData);
      return new Response(JSON.stringify({ error: memberData }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Add comprehensive tags based on user role and type
    const tags = ["ace-labs-user"];
    
    // Add role-based tags
    if (userRole) {
      tags.push(`role-${userRole}`);
      
      // Add specific audience tags
      if (userRole === 'influencer') {
        tags.push('audience-influencer');
      } else if (userRole === 'brand') {
        tags.push('audience-brand');
      } else if (userRole === 'agency') {
        tags.push('audience-agency');
      } else if (userRole === 'admin') {
        tags.push('audience-admin');
      } else if (userRole === 'creator') {
        tags.push('audience-creator');
      }
    }
    
    // Add organization tag
    if (organizationName) {
      tags.push(`org-${organizationName.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Create subscriber hash (MD5 of lowercase email)
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const subscriberHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Add tags to the member
    const tagResponse = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: tags.map(tag => ({ name: tag, status: "active" }))
        })
      }
    );

    const tagData = await tagResponse.json();
    
    console.log("User added to Mailchimp:", memberData);
    console.log("Tags added:", tagData);

    return new Response(JSON.stringify({ 
      success: true, 
      member: memberData,
      tags: tagData 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in mailchimp-signup function:", error);
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
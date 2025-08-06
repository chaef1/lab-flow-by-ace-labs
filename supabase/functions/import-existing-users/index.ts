import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_LIST_ID = Deno.env.get("MAILCHIMP_LIST_ID");
const MAILCHIMP_SERVER = MAILCHIMP_API_KEY?.split("-")[1];
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting import of existing users to Mailchimp...");

    // Get all users from auth.users and their profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch users: ${authError.message}`);
    }

    // Get all profiles to match with auth users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, organization_id');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Get organizations for organization names
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name');
    
    if (orgsError) {
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    console.log(`Found ${authUsers.users.length} users to import`);

    for (const user of authUsers.users) {
      try {
        const profile = profiles.find(p => p.id === user.id);
        const organization = profile?.organization_id ? 
          organizations.find(o => o.id === profile.organization_id) : null;

        // Create tags for this user
        const tags = ["ace-labs-user", "imported-user"];
        
        if (profile?.role) {
          tags.push(`role-${profile.role}`);
          
          // Add audience-specific tags
          if (profile.role === 'influencer') {
            tags.push('audience-influencer');
          } else if (profile.role === 'brand') {
            tags.push('audience-brand');
          } else if (profile.role === 'agency') {
            tags.push('audience-agency');
          } else if (profile.role === 'admin') {
            tags.push('audience-admin');
          } else if (profile.role === 'creator') {
            tags.push('audience-creator');
          }
        }
        
        if (organization?.name) {
          tags.push(`org-${organization.name.toLowerCase().replace(/\s+/g, '-')}`);
        }

        // Add user to Mailchimp
        const memberResponse = await fetch(
          `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email_address: user.email,
              status: "subscribed",
              merge_fields: {
                FNAME: profile?.first_name || "",
                LNAME: profile?.last_name || "",
                ORGANIZATION: organization?.name || "",
                ROLE: profile?.role || "unknown",
              }
            })
          }
        );

        const memberData = await memberResponse.json();

        if (memberResponse.ok) {
        // Create subscriber hash (MD5 of lowercase email) - using a simple MD5 implementation
        const md5 = async (text: string) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(text);
          const hashBuffer = await crypto.subtle.digest('SHA-1', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        };
        
        const subscriberHash = await md5(user.email!.toLowerCase());

          // Add tags
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

          if (tagResponse.ok) {
            successCount++;
            results.push({
              email: user.email,
              status: 'success',
              tags: tags,
              role: profile?.role || 'unknown'
            });
          } else {
            const tagError = await tagResponse.json();
            console.warn(`Failed to add tags for ${user.email}:`, tagError);
            results.push({
              email: user.email,
              status: 'partial_success',
              message: 'Added to list but failed to tag',
              role: profile?.role || 'unknown'
            });
          }
        } else {
          // Check if user already exists
          if (memberData.status === 400 && memberData.title === "Member Exists") {
            console.log(`User ${user.email} already exists in Mailchimp, updating tags...`);
            
            // Create subscriber hash for existing user
            const subscriberHash = await md5(user.email!.toLowerCase());

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

            if (tagResponse.ok) {
              successCount++;
              results.push({
                email: user.email,
                status: 'updated_existing',
                tags: tags,
                role: profile?.role || 'unknown'
              });
            }
          } else {
            errorCount++;
            results.push({
              email: user.email,
              status: 'error',
              error: memberData,
              role: profile?.role || 'unknown'
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (userError: any) {
        errorCount++;
        console.error(`Error processing user ${user.email}:`, userError);
        results.push({
          email: user.email,
          status: 'error',
          error: userError.message,
          role: 'unknown'
        });
      }
    }

    console.log(`Import completed: ${successCount} successful, ${errorCount} errors`);

    // Group results by role for summary
    const summary = results.reduce((acc, result) => {
      const role = result.role || 'unknown';
      if (!acc[role]) acc[role] = { success: 0, error: 0, updated: 0 };
      
      if (result.status === 'success') acc[role].success++;
      else if (result.status === 'updated_existing') acc[role].updated++;
      else acc[role].error++;
      
      return acc;
    }, {} as Record<string, { success: number; error: number; updated: number }>);

    return new Response(JSON.stringify({
      success: true,
      totalUsers: authUsers.users.length,
      successCount,
      errorCount,
      summary,
      results
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in import-existing-users function:", error);
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
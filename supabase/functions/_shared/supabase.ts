
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

export const getServiceSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
};

export const getAnonSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || ''
  );
};

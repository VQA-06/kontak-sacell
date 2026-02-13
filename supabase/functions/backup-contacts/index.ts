import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all contacts
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .order("name");

    if (error) throw error;

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}-${contacts.length}kontak.json`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, JSON.stringify(contacts, null, 2), {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backup saved: ${fileName}`,
        count: contacts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

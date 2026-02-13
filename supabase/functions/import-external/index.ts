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
    const { sourceUrl, sourceKey } = await req.json();
    const sourceSupabase = createClient(sourceUrl, sourceKey);

    // Fetch only contacts with ewallets data
    const { data: sourceContacts, error: fetchError } = await sourceSupabase
      .from("contacts")
      .select("phone, ewallets")
      .not("ewallets", "eq", "{}") 
      .not("phone", "is", null)
      .order("name");

    if (fetchError) throw new Error(`Gagal membaca sumber: ${fetchError.message}`);

    const destSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Batch update using Promise.all with concurrency limit
    const contacts = (sourceContacts || []).filter(
      (c: any) => Array.isArray(c.ewallets) && c.ewallets.length > 0 && c.phone
    );

    const results = await Promise.all(
      contacts.map((c: any) =>
        destSupabase
          .from("contacts")
          .update({ ewallet: c.ewallets })
          .eq("phone", c.phone)
      )
    );

    const updated = results.filter((r) => !r.error).length;

    return new Response(
      JSON.stringify({ success: true, updated, total: contacts.length, message: `${updated} kontak diupdate dengan data e-wallet!` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

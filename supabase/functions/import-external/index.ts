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

    // Connect to source database
    const sourceSupabase = createClient(sourceUrl, sourceKey);

    // Fetch all contacts from source
    const { data: sourceContacts, error: fetchError } = await sourceSupabase
      .from("contacts")
      .select("*")
      .order("name");

    if (fetchError) throw new Error(`Gagal membaca sumber: ${fetchError.message}`);
    if (!sourceContacts || sourceContacts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Tidak ada kontak ditemukan", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to destination (our) database
    const destSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map contacts - adapt fields
    const mapped = sourceContacts.map((c: any) => ({
      name: c.name || "Tanpa Nama",
      phone: c.phone || null,
      ewallet: Array.isArray(c.ewallet) ? c.ewallet : [],
    }));

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < mapped.length; i += 100) {
      const batch = mapped.slice(i, i + 100);
      const { error: insertError } = await destSupabase
        .from("contacts")
        .insert(batch);
      if (insertError) throw new Error(`Gagal insert batch: ${insertError.message}`);
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ success: true, count: inserted, message: `${inserted} kontak berhasil diimport!` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

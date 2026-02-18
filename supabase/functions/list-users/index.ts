import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Verify caller is admin
    const { data: roleRow } = await supabaseUser.from("user_roles").select("role").eq("user_id", user.id).single();
    if (roleRow?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    // Use service role to list all auth users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (listError) throw listError;

    // Get all roles
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    // Get all profiles
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, phone");

    const rolesMap: Record<string, string> = {};
    (roles ?? []).forEach((r: any) => { rolesMap[r.user_id] = r.role; });

    const profilesMap: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { profilesMap[p.id] = p; });

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: rolesMap[u.id] ?? "sales",
      full_name: profilesMap[u.id]?.full_name ?? "",
      phone: profilesMap[u.id]?.phone ?? "",
    }));

    return new Response(JSON.stringify({ users: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

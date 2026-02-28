import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "invite") {
      const { email, full_name, role } = body;
      if (!email) return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });

      // Create user with a random password (they'll reset via email)
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });
      if (createError) throw createError;

      // Update role if specified (default is sales via trigger)
      if (role === "admin" && newUser.user) {
        await supabaseAdmin.from("user_roles").update({ role: "admin" }).eq("user_id", newUser.user.id);
      }

      // Update profile name if provided
      if (full_name && newUser.user) {
        await supabaseAdmin.from("profiles").update({ full_name }).eq("id", newUser.user.id);
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      // Non-critical if reset email fails
      if (resetError) console.warn("Could not send recovery email:", resetError.message);

      return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: corsHeaders });
      if (user_id === user.id) return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: corsHeaders });

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

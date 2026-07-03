import { getSupabaseAdmin } from "../src/lib/supabase";

async function main() {
  const supabase = getSupabaseAdmin();
  const { data: token } = await supabase
    .from("onboarding_tokens")
    .select("token, employees(full_name, employee_id)")
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!token) {
    console.log("No active onboarding link found. Run: npm run db:seed");
    process.exit(1);
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  console.log(`Onboarding link: ${appUrl}/onboard/${token.token}`);
}

main().catch(console.error);

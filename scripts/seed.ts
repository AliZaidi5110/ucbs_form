import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../src/lib/supabase";
import { getTokenExpiryDate } from "../src/lib/rate-limit";

async function main() {
  console.log("🌱 Seeding UCBS Onboarding database (Supabase)...\n");

  const supabase = getSupabaseAdmin();
  const passwordHash = await bcrypt.hash("hradmin123", 12);

  const { data: hrUser, error: hrError } = await supabase
    .from("hr_users")
    .upsert(
      {
        email: "hr@ucbs.com",
        password_hash: passwordHash,
        name: "HR Administrator",
        role: "HR",
      },
      { onConflict: "email" }
    )
    .select("*")
    .single();

  if (hrError) throw hrError;

  console.log("✅ HR User ready:");
  console.log("   Email: hr@ucbs.com");
  console.log("   Password: hradmin123\n");

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .upsert(
      {
        employee_id: "UCBS-2026-0001",
        full_name: "Priya Sharma",
        department: "Information Technology",
        designation: "Software Engineer",
        reporting_manager: "Rajesh Kumar",
        date_of_joining: "2026-07-15",
        work_location: "Head Office",
        official_email: "priya.sharma@ucbs.com",
        personal_email: "priya.personal@gmail.com",
        mobile_number: "9876543210",
        status: "INVITED",
      },
      { onConflict: "employee_id" }
    )
    .select("*")
    .single();

  if (empError) throw empError;

  await supabase
    .from("onboarding_tokens")
    .update({ is_active: false })
    .eq("employee_id", employee.id)
    .eq("is_active", true);

  const { data: token, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .insert({
      employee_id: employee.id,
      expires_at: getTokenExpiryDate().toISOString(),
    })
    .select("*")
    .single();

  if (tokenError) throw tokenError;

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  console.log("✅ Sample employee created:");
  console.log(`   Name: ${employee.full_name}`);
  console.log(`   ID: ${employee.employee_id}`);
  console.log(`   Onboarding link: ${appUrl}/onboard/${token.token}\n`);

  console.log("🎉 Seed complete!");
  console.log("\nNext steps:");
  console.log("  1. npm run dev");
  console.log("  2. Open http://localhost:3000/admin/login");
  console.log("  3. Login with hr@ucbs.com / hradmin123");
  console.log(`  4. Or test joinee flow: ${appUrl}/onboard/${token.token}`);
  console.log(`\nHR user id: ${hrUser.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

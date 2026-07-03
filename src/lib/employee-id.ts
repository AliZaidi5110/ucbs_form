import { getSupabaseAdmin } from "./supabase";

export async function generateUcbsEmployeeId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `UCBS-${year}-`;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("employees")
    .select("employee_id")
    .like("employee_id", `${prefix}%`)
    .order("employee_id", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data?.[0]?.employee_id) {
    const match = String(data[0].employee_id).match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

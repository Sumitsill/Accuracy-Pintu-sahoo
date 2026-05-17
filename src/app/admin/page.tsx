import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPortalClient from "./AdminPortalClient";

// Server Component fetching initial auth state and profile
export default async function AdminDashboard() {
  const supabase = createClient();
  
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch the dynamic profile from the database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // If somehow the profile is missing, force onboarding
    redirect("/onboarding");
  }

  // Double check admin role authorization and email whitelist
  const ALLOWED_ADMINS = ["sumitsill2605@gmail.com", "sg.swapnanil.72@gmail.com"];
  
  if (
    profile.role !== "admin" || 
    !user.email || 
    !ALLOWED_ADMINS.includes(user.email.toLowerCase().trim())
  ) {
    redirect("/dashboard");
  }

  return <AdminPortalClient user={user} profile={profile} />;
}

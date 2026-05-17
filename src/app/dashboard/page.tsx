import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentPortalClient from "./StudentPortalClient";

// Server Component fetching initial auth state and profile
export default async function StudentDashboard() {
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

  return <StudentPortalClient user={user} profile={profile} />;
}

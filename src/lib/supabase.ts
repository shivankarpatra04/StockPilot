// filepath: src/lib/supabase.ts
// Re-exports the SSR-compatible Supabase clients.
// Use createClient() from @/utils/supabase/server for Server Components / API routes.
// Use createClient() from @/utils/supabase/client for Client Components.

export { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
export { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

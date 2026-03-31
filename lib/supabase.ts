import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CoffeeLog = {
  id: number;
  created_at: string;
  date: string;
  grind_size: number;
  grinder: string | null;
  bean: string | null;
  origin: string | null;
  rating: number | null;
  memo: string | null;
};

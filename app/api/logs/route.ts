import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("coffee_logs")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { date, grind_size, grinder, bean, origin, rating, memo } = body;

  if (!date || grind_size === undefined) {
    return NextResponse.json({ error: "date と grind_size は必須です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("coffee_logs")
    .insert([{ date, grind_size, grinder, bean, origin, rating, memo }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

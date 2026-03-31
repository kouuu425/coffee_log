"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRINDERS = ["デリモ電動コーヒーミル"];

const defaultForm = (today: string) => ({
  date: today,
  location_type: "home" as "home" | "cafe",
  grind_size: "",
  grinder: "",
  bean: "",
  origin: "",
  rating: 3.0,
  memo: "",
});

export default function Home() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const today = new Date().toLocaleDateString("sv-SE");
  const [form, setForm] = useState(defaultForm(today));
  const isHome = form.location_type === "home";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    if (isHome && !form.grind_size) return;

    setSaving(true);
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        grind_size: form.grind_size ? parseFloat(form.grind_size) : null,
      }),
    });

    setForm(defaultForm(today));
    setSaving(false);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-16">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--primary-dark)" }}>
          Coffee Log
        </h1>
        <button
          onClick={() => router.push("/logs")}
          className="px-4 py-2 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
        >
          記録を見る →
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* 家/お店トグル */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, location_type: "home" })}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: isHome ? "var(--primary)" : "#fafafa", color: isHome ? "#fff" : "var(--text-muted)" }}
            >
              🏠 家で飲んだ
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, location_type: "cafe", grind_size: "", grinder: "" })}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: !isHome ? "var(--primary)" : "#fafafa", color: !isHome ? "#fff" : "var(--text-muted)" }}
            >
              ☕ お店で飲んだ
            </button>
          </div>

          {/* 日付 + 挽き目 */}
          <div className="flex gap-3 min-w-0">
            <div className={`min-w-0 ${isHome ? "flex-1" : "flex-1"}`}>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full min-w-0 px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
              />
            </div>
            {isHome && (
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>挽き目</label>
                <input
                  type="number"
                  value={form.grind_size}
                  onChange={(e) => setForm({ ...form, grind_size: e.target.value })}
                  step="any" min="0" placeholder="例: 15" required
                  className="w-full min-w-0 px-3 py-2 rounded-lg border"
                  style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
                />
              </div>
            )}
          </div>

          {/* コーヒーミル（家のみ） */}
          {isHome && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>コーヒーミル</label>
              <select
                value={form.grinder}
                onChange={(e) => setForm({ ...form, grinder: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
              >
                <option value="">選択してください</option>
                {GRINDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}

          {/* 店名 / 豆 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              {isHome ? "コーヒー豆（購入店/ブランド）" : "お店の名前"}
            </label>
            <input
              type="text"
              value={form.bean}
              onChange={(e) => setForm({ ...form, bean: e.target.value })}
              placeholder={isHome ? "例: Blue Bottle Coffee" : "例: %Arabica, 猿田彦珈琲"}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
            />
          </div>

          {/* 産地 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>豆の産地</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              placeholder="例: エチオピア, ブラジル, コロンビア"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
            />
          </div>

          {/* 味の評価 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: "var(--primary)" }}>味の評価</label>
              <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                {form.rating.toFixed(1)}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> / 5.0</span>
              </span>
            </div>
            <input
              type="range" min="1" max="5" step="0.1" value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
              className="w-full appearance-none cursor-pointer"
              style={{
                accentColor: "var(--accent)", height: "6px", borderRadius: "9999px",
                background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(form.rating - 1) / 4 * 100}%, var(--border) ${(form.rating - 1) / 4 * 100}%, var(--border) 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className="text-xs" style={{ color: form.rating >= n ? "var(--accent)" : "var(--border)" }}>{n}</span>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>メモ</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="味の感想、次回への改善点など"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
              style={{ borderColor: "var(--border)", background: "#fafafa", fontSize: "16px" }}
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: saving ? "var(--text-muted)" : "var(--primary)" }}
          >
            {saving ? "保存中..." : "記録する"}
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import type { CoffeeLog } from "@/lib/supabase";

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
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString("sv-SE");
  const [form, setForm] = useState(defaultForm(today));

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/logs");
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    if (form.location_type === "home" && !form.grind_size) return;

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
    await fetchLogs();
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const beanSuggestions = [...new Set(logs.map((l) => l.bean).filter(Boolean))];
  const originSuggestions = [...new Set(logs.map((l) => l.origin).filter(Boolean))];
  const isHome = form.location_type === "home";

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-16">
      <h1 className="text-center text-xl font-bold mb-5" style={{ color: "var(--primary-dark)" }}>
        Coffee Log
      </h1>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* 家/お店トグル */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, location_type: "home" })}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: isHome ? "var(--primary)" : "#fafafa",
                color: isHome ? "#fff" : "var(--text-muted)",
              }}
            >
              🏠 家で飲んだ
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, location_type: "cafe", grind_size: "", grinder: "" })}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: !isHome ? "var(--primary)" : "#fafafa",
                color: !isHome ? "#fff" : "var(--text-muted)",
              }}
            >
              ☕ お店で飲んだ
            </button>
          </div>

          {/* 日付 + 挽き目（家のみ） */}
          <div className="flex gap-3">
            <div className={isHome ? "flex-1" : "w-full"}>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                日付
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              />
            </div>
            {isHome && (
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                  挽き目
                </label>
                <input
                  type="number"
                  value={form.grind_size}
                  onChange={(e) => setForm({ ...form, grind_size: e.target.value })}
                  step="any"
                  min="0"
                  placeholder="例: 15"
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }}
                />
              </div>
            )}
          </div>

          {/* コーヒーミル（家のみ） */}
          {isHome && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                コーヒーミル
              </label>
              <select
                value={form.grinder}
                onChange={(e) => setForm({ ...form, grinder: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              >
                <option value="">選択してください</option>
                {GRINDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          {/* コーヒー豆 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              {isHome ? "コーヒー豆（購入店/ブランド）" : "お店の名前"}
            </label>
            <input
              type="text"
              value={form.bean}
              onChange={(e) => setForm({ ...form, bean: e.target.value })}
              list="bean-list"
              placeholder={isHome ? "例: Blue Bottle Coffee" : "例: %Arabica, 猿田彦珈琲"}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
            <datalist id="bean-list">
              {beanSuggestions.map((b) => <option key={b!} value={b!} />)}
            </datalist>
          </div>

          {/* 豆の産地 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              豆の産地
            </label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              list="origin-list"
              placeholder="例: エチオピア, ブラジル, コロンビア"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
            <datalist id="origin-list">
              {originSuggestions.map((o) => <option key={o!} value={o!} />)}
            </datalist>
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
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
              className="w-full appearance-none cursor-pointer"
              style={{
                accentColor: "var(--accent)",
                height: "6px",
                borderRadius: "9999px",
                background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(form.rating - 1) / 4 * 100}%, var(--border) ${(form.rating - 1) / 4 * 100}%, var(--border) 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className="text-xs" style={{ color: form.rating >= n ? "var(--accent)" : "var(--border)" }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              メモ
            </label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="味の感想、次回への改善点など"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: saving ? "var(--text-muted)" : "var(--primary)" }}
          >
            {saving ? "保存中..." : "記録する"}
          </button>
        </form>
      </div>

      {/* Log list */}
      <div className="text-sm font-semibold mb-3" style={{ color: "var(--primary)" }}>
        記録一覧
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>まだ記録がありません</div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isHomeLog = log.location_type !== "cafe";
            return (
              <div key={log.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm relative">
                <button
                  onClick={() => handleDelete(log.id)}
                  className="absolute top-3 right-3 text-lg leading-none"
                  style={{ color: "var(--border)" }}
                >
                  ×
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{log.date}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: isHomeLog ? "#efebe9" : "#fff8e1",
                      color: isHomeLog ? "var(--primary)" : "#f57f17",
                    }}
                  >
                    {isHomeLog ? "🏠 家" : "☕ お店"}
                  </span>
                </div>
                {isHomeLog && log.grind_size != null && (
                  <div className="font-semibold text-sm mb-1">挽き目: {log.grind_size}</div>
                )}
                <div className="text-xs space-y-0.5" style={{ color: "var(--primary)" }}>
                  {isHomeLog && log.grinder && <div>ミル: {log.grinder}</div>}
                  {log.bean && <div>{isHomeLog ? "豆" : "お店"}: {log.bean}</div>}
                  {log.origin && <div>産地: {log.origin}</div>}
                </div>
                {log.rating && (
                  <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>
                    ★ {Number(log.rating).toFixed(1)} / 5.0
                  </div>
                )}
                {log.memo && (
                  <div
                    className="text-xs mt-2 pt-2 whitespace-pre-wrap"
                    style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
                  >
                    {log.memo}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

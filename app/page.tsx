"use client";

import { useEffect, useState, useCallback } from "react";
import type { CoffeeLog } from "@/lib/supabase";

const GRINDERS = ["デリモ電動コーヒーミル"];

export default function Home() {
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

  const [form, setForm] = useState({
    date: today,
    grind_size: "",
    grinder: "",
    bean: "",
    origin: "",
    rating: 3.0,
    memo: "",
  });

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
    if (!form.date || !form.grind_size) return;

    setSaving(true);
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        grind_size: parseFloat(form.grind_size),
      }),
    });

    setForm({ date: today, grind_size: "", grinder: "", bean: "", origin: "", rating: 3.0, memo: "" });
    await fetchLogs();
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  // Autocomplete suggestions from existing logs
  const beanSuggestions = [...new Set(logs.map((l) => l.bean).filter(Boolean))];
  const originSuggestions = [...new Set(logs.map((l) => l.origin).filter(Boolean))];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-16">
      <h1 className="text-center text-xl font-bold mb-5" style={{ color: "var(--primary-dark)" }}>
        Coffee Log
      </h1>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
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
          </div>

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

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              コーヒー豆（購入店/ブランド）
            </label>
            <input
              type="text"
              value={form.bean}
              onChange={(e) => setForm({ ...form, bean: e.target.value })}
              list="bean-list"
              placeholder="例: Blue Bottle Coffee"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
            <datalist id="bean-list">
              {beanSuggestions.map((b) => <option key={b!} value={b!} />)}
            </datalist>
          </div>

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

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
              味の評価
              <span className="font-bold text-base" style={{ color: "var(--primary-dark)" }}>
                {form.rating.toFixed(1)}
              </span>
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> / 5.0</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>1</span>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>5</span>
            </div>
          </div>

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
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm relative">
              <button
                onClick={() => handleDelete(log.id)}
                className="absolute top-3 right-3 text-lg leading-none"
                style={{ color: "var(--border)" }}
              >
                ×
              </button>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{log.date}</div>
              <div className="font-semibold text-sm mb-1">挽き目: {log.grind_size}</div>
              <div className="text-xs space-y-0.5" style={{ color: "var(--primary)" }}>
                {log.grinder && <div>ミル: {log.grinder}</div>}
                {log.bean && <div>豆: {log.bean}</div>}
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
          ))}
        </div>
      )}
    </main>
  );
}

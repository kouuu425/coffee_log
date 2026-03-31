"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CoffeeLog } from "@/lib/supabase";

type SortKey = "newest" | "rating_desc" | "rating_asc";
type FilterTab = "all" | "home" | "cafe";

function RatingBar({ rating }: { rating: number }) {
  const pct = ((rating - 1) / 4) * 100;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "5px", background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: "var(--accent)", minWidth: "28px" }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function LogCard({ log, onDelete }: { log: CoffeeLog; onDelete: (id: number) => void }) {
  const isHome = log.location_type !== "cafe";
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm relative">
      <button
        onClick={() => onDelete(log.id)}
        className="absolute top-3 right-3 text-lg leading-none"
        style={{ color: "var(--border)" }}
      >×</button>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{log.date}</span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: isHome ? "#efebe9" : "#fff8e1", color: isHome ? "var(--primary)" : "#f57f17" }}
        >
          {isHome ? "🏠 家" : "☕ お店"}
        </span>
      </div>

      <div className="font-bold text-sm" style={{ color: "var(--primary-dark)" }}>
        {log.bean || "—"}
      </div>
      {log.origin && (
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{log.origin}</div>
      )}
      {isHome && log.grind_size != null && (
        <div className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>
          挽き目: {log.grind_size}{log.grinder ? ` ／ ${log.grinder}` : ""}
        </div>
      )}

      {log.rating != null && <RatingBar rating={Number(log.rating)} />}

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
}

function GroupedView({ logs, onDelete }: { logs: CoffeeLog[]; onDelete: (id: number) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, CoffeeLog[]>();
    for (const log of logs) {
      const key = log.bean || "（店名なし）";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries())
      .map(([store, items]) => ({
        store,
        items,
        avg: items.reduce((s, l) => s + (l.rating ?? 0), 0) / items.filter(l => l.rating != null).length || 0,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [logs]);

  return (
    <div className="space-y-4">
      {groups.map(({ store, items, avg }) => (
        <div key={store}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold" style={{ color: "var(--primary-dark)" }}>{store}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{items.length}件</span>
              {avg > 0 && (
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                  平均 {avg.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {items.map(log => <LogCard key={log.id} log={log} onDelete={onDelete} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [grouped, setGrouped] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/logs");
    setLogs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleDelete(id: number) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  // ユニークな店名リスト（お店のみ）
  const cafeStores = useMemo(() =>
    [...new Set(logs.filter(l => l.location_type === "cafe").map(l => l.bean).filter(Boolean))].sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    let result = [...logs];

    // タブフィルター
    if (tab === "home") result = result.filter(l => l.location_type !== "cafe");
    if (tab === "cafe") result = result.filter(l => l.location_type === "cafe");

    // 店名フィルター
    if (storeFilter) result = result.filter(l => l.bean === storeFilter);

    // 検索（店名・豆名・産地）
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l =>
        [l.bean, l.origin, l.memo].some(v => v?.toLowerCase().includes(q))
      );
    }

    // ソート
    if (sort === "newest") result.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === "rating_desc") result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "rating_asc") result.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

    return result;
  }, [logs, tab, storeFilter, search, sort]);

  const tabStyle = (active: boolean) => ({
    background: active ? "var(--primary)" : "#fafafa",
    color: active ? "#fff" : "var(--text-muted)",
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-16">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          ← 記録する
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--primary-dark)" }}>記録一覧</h1>
      </div>

      {/* 検索バー */}
      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="店名・豆名・産地で検索..."
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        />
      </div>

      {/* フィルタータブ */}
      <div className="flex rounded-xl overflow-hidden border mb-3" style={{ borderColor: "var(--border)" }}>
        {(["all", "home", "cafe"] as FilterTab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setStoreFilter(""); setGrouped(t === "cafe"); }}
            className="flex-1 py-2.5 font-semibold transition-colors"
            style={{ ...tabStyle(tab === t), fontSize: "13px" }}
          >
            {t === "all" ? "すべて" : t === "home" ? "🏠 家" : "☕ お店"}
          </button>
        ))}
      </div>

      {/* お店タブ：店名フィルター */}
      {tab === "cafe" && cafeStores.length > 0 && (
        <div className="mb-3">
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          >
            <option value="">すべてのお店</option>
            {cafeStores.map(s => <option key={s!} value={s!}>{s}</option>)}
          </select>
        </div>
      )}

      {/* ソート + グルーピング */}
      <div className="flex gap-2 mb-4">
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="flex-1 px-3 py-2 rounded-xl border text-xs"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <option value="newest">新しい順</option>
          <option value="rating_desc">評価が高い順</option>
          <option value="rating_asc">評価が低い順</option>
        </select>
        {tab === "cafe" && (
          <button
            onClick={() => setGrouped(g => !g)}
            className="px-3 py-2 rounded-xl border text-xs font-semibold transition-colors"
            style={{
              borderColor: grouped ? "var(--primary)" : "var(--border)",
              background: grouped ? "var(--primary)" : "#fff",
              color: grouped ? "#fff" : "var(--text-muted)",
            }}
          >
            お店別
          </button>
        )}
      </div>

      {/* 件数 */}
      {!loading && (
        <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          {filtered.length}件
        </div>
      )}

      {/* リスト */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>記録が見つかりません</div>
      ) : grouped && tab === "cafe" ? (
        <GroupedView logs={filtered} onDelete={handleDelete} />
      ) : (
        <div className="space-y-3">
          {filtered.map(log => <LogCard key={log.id} log={log} onDelete={handleDelete} />)}
        </div>
      )}
    </main>
  );
}

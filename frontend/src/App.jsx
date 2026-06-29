import { useState, useEffect, useRef, useCallback } from "react";

// ── API Client ────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:8000/api";

function getToken() { return localStorage.getItem("token"); }

async function api(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Object.values(err).flat().join(" ") || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const Icons = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  food: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v4m0 4h.01",
  chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  profile: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  fire: "M12 2c0 0-5 5-5 10a5 5 0 0010 0C17 7 12 2 12 2z",
  weight: "M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  bot: "M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3v-8a3 3 0 013-3h3V5.73A2 2 0 0110 4a2 2 0 012-2zM9 13a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z",
};

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  accent: "#39d353",
  accentDim: "#1a4a23",
  text: "#e6edf3",
  muted: "#8b949e",
  danger: "#f85149",
  warning: "#d29922",
  card: "#21262d",
};

// ── Shared UI Components ──────────────────────────────────────────────────────
const Button = ({ children, variant = "primary", onClick, disabled, small, style = {} }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: small ? "6px 12px" : "10px 18px",
    borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600, fontSize: small ? 13 : 14, transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { background: C.accent, color: "#0d1117" },
    secondary: { background: C.card, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.danger, border: `1px solid ${C.danger}` },
    ghost: { background: "transparent", color: C.muted },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", color: C.muted, fontSize: 12, marginBottom: 4 }}>{label}</label>}
    <input
      {...props}
      style={{
        width: "100%", padding: "10px 12px", background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
        fontSize: 14, boxSizing: "border-box", outline: "none",
        ...props.style,
      }}
    />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 20, ...style,
  }}>
    {children}
  </div>
);

const MacroBar = ({ label, value, max, color }) => {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
        <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{value}g</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
};

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login/" : "/auth/register/";
      const body = mode === "login"
        ? { username: form.username, password: form.password }
        : { username: form.username, email: form.email, password: form.password, password2: form.password2, goal: "maintain", activity_level: "moderate" };
      const { token, user } = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("token", token);
      onLogin(user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🥦</div>
          <h1 style={{ color: C.text, margin: 0, fontFamily: "monospace", letterSpacing: -1 }}>NutriTrack</h1>
          <p style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>AI-powered diet tracking</p>
        </div>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: mode === m ? C.accent : C.surface,
                color: mode === m ? "#0d1117" : C.muted,
                fontWeight: 600, fontSize: 13, textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
          <Input label="Username" value={form.username} onChange={set("username")} placeholder="bikash9cmd" />
          {mode === "register" && <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />}
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
          {mode === "register" && <Input label="Confirm Password" type="password" value={form.password2} onChange={set("password2")} placeholder="••••••••" />}
          {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#2d0e0e", borderRadius: 8 }}>{error}</div>}
          <Button onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api(`/diet/summary/?date=${today}`).then(setSummary).catch(() => {});
    api("/diet/weekly/").then(setWeekly).catch(() => {});
  }, [today]);

  const target = user.daily_calorie_target || 2000;
  const calories = summary?.total_calories || 0;
  const pct = Math.min(100, Math.round((calories / target) * 100));
  const remaining = target - calories;

  const ring = 88;
  const stroke = 10;
  const r = (ring - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <div>
      <h2 style={{ color: C.text, marginTop: 0, fontSize: 22 }}>Today's Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Calorie Ring */}
        <Card style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={ring} height={ring}>
            <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
            <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke={C.accent} strokeWidth={stroke}
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`} style={{ transition: "stroke-dashoffset 0.8s" }} />
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={C.text} fontSize="14" fontWeight="bold">{pct}%</text>
          </svg>
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Calories</div>
            <div style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>{Math.round(calories)}</div>
            <div style={{ color: C.muted, fontSize: 12 }}>of {target} kcal</div>
            <div style={{ color: remaining >= 0 ? C.accent : C.danger, fontSize: 13, marginTop: 4, fontWeight: 600 }}>
              {remaining >= 0 ? `${Math.round(remaining)} remaining` : `${Math.round(-remaining)} over`}
            </div>
          </div>
        </Card>

        {/* Macros */}
        <Card>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Macros</div>
          <MacroBar label="Protein" value={Math.round(summary?.total_protein || 0)} max={150} color="#4f9cf9" />
          <MacroBar label="Carbs" value={Math.round(summary?.total_carbs || 0)} max={250} color={C.warning} />
          <MacroBar label="Fat" value={Math.round(summary?.total_fat || 0)} max={65} color="#f97316" />
        </Card>
      </div>

      {/* Weekly Avg */}
      {weekly && (
        <Card>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>7-Day Average</div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ color: C.text, fontSize: 28, fontWeight: 700 }}>{weekly.averages.calories}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>avg kcal/day</div>
            </div>
            <div>
              <div style={{ color: C.text, fontSize: 28, fontWeight: 700 }}>{weekly.averages.protein}g</div>
              <div style={{ color: C.muted, fontSize: 12 }}>avg protein/day</div>
            </div>
            <div>
              <div style={{ color: C.text, fontSize: 28, fontWeight: 700 }}>{weekly.days_logged}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>days logged</div>
            </div>
          </div>
          {/* Sparkline bars */}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60, marginTop: 16 }}>
            {weekly.daily_data.map((d, i) => {
              const h = Math.max(4, (d.total_calories / (target || 2000)) * 60);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", height: h, borderRadius: 4,
                    background: d.total_calories >= target * 0.8 ? C.accent : C.border,
                    transition: "height 0.5s",
                  }} />
                  <span style={{ color: C.muted, fontSize: 9 }}>{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Food Logger ───────────────────────────────────────────────────────────────
function FoodLogger() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState([]);
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [meal, setMeal] = useState("breakfast");
  const [qty, setQty] = useState("100");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    const data = await api(`/diet/logs/?date=${date}`);
    setLogs(data.results || data);
  }, [date]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const searchFoods = useCallback(async (q) => {
    if (!q.trim()) return setFoods([]);
    const data = await api(`/diet/foods/?search=${encodeURIComponent(q)}`);
    setFoods(data.results || data);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchFoods(search), 300);
    return () => clearTimeout(t);
  }, [search, searchFoods]);

  const addLog = async () => {
    if (!selected || !qty) return;
    setLoading(true);
    try {
      await api("/diet/logs/", {
        method: "POST",
        body: JSON.stringify({ food_item: selected.id, meal_type: meal, quantity_g: parseFloat(qty), date }),
      });
      setSelected(null); setSearch(""); setFoods([]); setQty("100");
      fetchLogs();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const deleteLog = async (id) => {
    await api(`/diet/logs/${id}/`, { method: "DELETE" });
    fetchLogs();
  };

  const meals = ["breakfast", "lunch", "dinner", "snack"];
  const grouped = meals.reduce((acc, m) => {
    acc[m] = logs.filter((l) => l.meal_type === m);
    return acc;
  }, {});
  const mealColors = { breakfast: "#f97316", lunch: "#4f9cf9", dinner: "#a78bfa", snack: C.accent };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: C.text, margin: 0, fontSize: 22 }}>Food Log</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ padding: "6px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
      </div>

      {/* Add Food */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Log a Food</div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Search food database…"
            style={{ width: "100%", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, boxSizing: "border-box" }} />
          {foods.length > 0 && !selected && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
              {foods.map((f) => (
                <div key={f.id} onClick={() => { setSelected(f); setSearch(f.name); setFoods([]); }}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = C.surface}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: C.text, fontSize: 13 }}>{f.name}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>{f.calories_per_100g} kcal/100g</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div style={{ background: C.accentDim, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
            <span style={{ color: C.accent, fontWeight: 600 }}>{selected.name}</span>
            <span style={{ color: C.muted }}> — {selected.calories_per_100g} kcal | P:{selected.protein_per_100g}g | C:{selected.carbs_per_100g}g | F:{selected.fat_per_100g}g per 100g</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <select value={meal} onChange={(e) => setMeal(e.target.value)}
            style={{ flex: 1, padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>
            {meals.map((m) => <option key={m} value={m} style={{ textTransform: "capitalize" }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="grams"
            style={{ width: 100, padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }} />
          <Button onClick={addLog} disabled={!selected || loading}>
            <Icon path={Icons.plus} size={16} /> Add
          </Button>
        </div>
      </Card>

      {/* Logs by meal */}
      {meals.map((m) => grouped[m].length > 0 && (
        <div key={m} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: mealColors[m] }} />
            <span style={{ color: C.muted, fontSize: 12, textTransform: "capitalize", fontWeight: 600 }}>{m}</span>
            <span style={{ color: C.muted, fontSize: 12 }}>
              — {Math.round(grouped[m].reduce((a, l) => a + l.calories, 0))} kcal
            </span>
          </div>
          {grouped[m].map((log) => (
            <div key={log.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: C.card, borderRadius: 8, marginBottom: 6,
              border: `1px solid ${C.border}`,
            }}>
              <div>
                <div style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{log.food_item_detail?.name}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{log.quantity_g}g · P:{log.protein}g · C:{log.carbs}g · F:{log.fat}g</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{log.calories}</span>
                <button onClick={() => deleteLog(log.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}>
                  <Icon path={Icons.trash} size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
      {logs.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 14 }}>
          No meals logged for this date yet. Search for a food above!
        </div>
      )}
    </div>
  );
}

// ── AI Nutrition Assistant ────────────────────────────────────────────────────
function NutritionAssistant({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user.username}! 👋 I'm NutriBot, your AI nutrition assistant.\n\nI can help you with:\n• **Personalised meal advice** based on your ${user.goal} goal\n• **Macro calculations** and nutrient timing\n• **Food substitutions** and healthy alternatives\n• **Weight loss/gain strategies**\n\nWhat would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    "How much protein do I need daily?",
    "Best foods for my goal?",
    "How do I break a weight plateau?",
    "What should I eat post-workout?",
  ];

  const send = async (msg) => {
    if (!msg.trim() || loading) return;
    const userMsg = { role: "user", content: msg };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api("/chatbot/chat/", {
        method: "POST",
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      });
      setSessionId(res.session_id);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: "⚠️ Unable to reach the AI service. Make sure the backend is running and your OpenAI API key is configured.",
      }]);
    }
    finally { setLoading(false); }
  };

  const renderContent = (text) => {
    // Simple markdown-ish render
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <strong key={i} style={{ color: C.accent }}>{line.slice(2, -2)}</strong>;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.accent }}>{p}</strong> : p)}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon path={Icons.bot} size={18} color={C.accent} />
        </div>
        <div>
          <div style={{ color: C.text, fontWeight: 600 }}>NutriBot</div>
          <div style={{ color: C.accent, fontSize: 11 }}>● Powered by GPT-4 + RAG</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, marginBottom: 16,
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "user" ? C.accent : C.accentDim,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: msg.role === "user" ? "#0d1117" : C.accent,
            }}>
              {msg.role === "user" ? user.username[0].toUpperCase() : "N"}
            </div>
            <div style={{
              maxWidth: "78%", padding: "12px 16px", borderRadius: 12,
              background: msg.role === "user" ? C.accent : C.card,
              border: msg.role === "user" ? "none" : `1px solid ${C.border}`,
              color: msg.role === "user" ? "#0d1117" : C.text,
              fontSize: 14, lineHeight: 1.6,
              borderBottomRightRadius: msg.role === "user" ? 4 : 12,
              borderBottomLeftRadius: msg.role === "assistant" ? 4 : 12,
            }}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 13 }}>N</div>
            <div style={{ padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, borderBottomLeftRadius: 4 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((j) => (
                  <div key={j} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.accent,
                    animation: "bounce 1s infinite",
                    animationDelay: `${j * 0.15}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length === 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} style={{
              padding: "6px 12px", background: C.accentDim, border: `1px solid ${C.accentDim}`,
              borderRadius: 20, color: C.accent, fontSize: 12, cursor: "pointer",
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about nutrition, macros, meal plans…"
          disabled={loading}
          style={{
            flex: 1, padding: "12px 16px", background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 10,
            color: C.text, fontSize: 14, outline: "none",
          }}
        />
        <Button onClick={() => send(input)} disabled={!input.trim() || loading}>
          <Icon path={Icons.send} size={16} />
        </Button>
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser }) {
  const [form, setForm] = useState({
    age: user.age || "",
    height_cm: user.height_cm || "",
    weight_kg: user.weight_kg || "",
    goal: user.goal || "maintain",
    activity_level: user.activity_level || "moderate",
  });
  const [weightEntry, setWeightEntry] = useState("");
  const [weights, setWeights] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api("/diet/weight/").then((d) => setWeights(d.results || d)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveProfile = async () => {
    try {
      const updated = await api("/auth/profile/", { method: "PATCH", body: JSON.stringify(form) });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
  };

  const logWeight = async () => {
    if (!weightEntry) return;
    await api("/diet/weight/", {
      method: "POST",
      body: JSON.stringify({ weight_kg: parseFloat(weightEntry), date: new Date().toISOString().split("T")[0] }),
    });
    setWeightEntry("");
    api("/diet/weight/").then((d) => setWeights(d.results || d));
  };

  return (
    <div>
      <h2 style={{ color: C.text, marginTop: 0, fontSize: 22 }}>Profile & Settings</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Personal Info</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Input label="Age" type="number" value={form.age} onChange={set("age")} /></div>
            <div style={{ flex: 1 }}><Input label="Height (cm)" type="number" value={form.height_cm} onChange={set("height_cm")} /></div>
          </div>
          <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={set("weight_kg")} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, marginBottom: 4 }}>Goal</label>
            <select value={form.goal} onChange={set("goal")} style={{ width: "100%", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Muscle</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, marginBottom: 4 }}>Activity Level</label>
            <select value={form.activity_level} onChange={set("activity_level")} style={{ width: "100%", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Very Active</option>
              <option value="extra">Extra Active</option>
            </select>
          </div>
          <Button onClick={saveProfile}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </Button>
          {user.daily_calorie_target && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: C.accentDim, borderRadius: 8 }}>
              <div style={{ color: C.muted, fontSize: 12 }}>Calculated Daily Target</div>
              <div style={{ color: C.accent, fontSize: 24, fontWeight: 700 }}>{user.daily_calorie_target} kcal</div>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Weight Tracker</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input type="number" value={weightEntry} onChange={(e) => setWeightEntry(e.target.value)}
              placeholder="e.g. 72.5 kg"
              style={{ flex: 1, padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }} />
            <Button onClick={logWeight} small><Icon path={Icons.plus} size={14} /> Log</Button>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {weights.slice(0, 10).map((w) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 13 }}>{w.date}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{w.weight_kg} kg</span>
              </div>
            ))}
            {weights.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", paddingTop: 20 }}>No weight logs yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api("/auth/profile/")
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    await api("/auth/logout/", { method: "POST" }).catch(() => {});
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.accent, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={setUser} />;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "log", label: "Food Log", icon: Icons.food },
    { id: "chat", label: "AI Assistant", icon: Icons.chat },
    { id: "profile", label: "Profile", icon: Icons.profile },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        input::placeholder { color: ${C.muted}; }
        select option { background: ${C.card}; }
      `}</style>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex" }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", padding: "24px 16px",
          position: "fixed", height: "100vh",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <span style={{ fontSize: 28 }}>🥦</span>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>NutriTrack</div>
              <div style={{ color: C.accent, fontSize: 10 }}>AI-Powered</div>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === t.id ? C.accentDim : "transparent",
                color: tab === t.id ? C.accent : C.muted,
                fontWeight: tab === t.id ? 600 : 400, fontSize: 14, marginBottom: 4,
                transition: "all 0.15s",
              }}>
                <Icon path={t.icon} size={17} color={tab === t.id ? C.accent : C.muted} />
                {t.label}
                {t.id === "chat" && (
                  <span style={{ marginLeft: "auto", background: C.accent, color: "#0d1117", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>RAG</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{user.username}</div>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>{user.email}</div>
            <button onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13,
            }}>
              <Icon path={Icons.logout} size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft: 220, flex: 1, padding: "32px 40px", maxWidth: "calc(100vw - 220px)" }}>
          {tab === "dashboard" && <Dashboard user={user} />}
          {tab === "log" && <FoodLogger />}
          {tab === "chat" && <NutritionAssistant user={user} />}
          {tab === "profile" && <ProfilePage user={user} setUser={setUser} />}
        </div>
      </div>
    </>
  );
}

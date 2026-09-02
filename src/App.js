import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart
} from "recharts";
import "./App.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const BUNDLER_NAMES = {
  "0xce54f65abb8b61b83c14cbe97de97fce75bbf556": "Pimlico",
  "0x81e3add2b2b6ee38558c8c5a347d4f79e7aeb98e": "Alchemy",
  "0x4337000c2828f5260d8921fd25829f606b9e8680": "Candide",
  "0x3e8e9423d80e1774a7ca128fcb70cd6283b8042e": "Stackup",
};

function getBundlerName(address) {
  if (!address) return "Unknown";
  return BUNDLER_NAMES[address.toLowerCase()] || address.slice(0, 10) + "...";
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/,/g, "").replace("%", ""));
    if (isNaN(end)) { setDisplay(value); return; }
    const duration = 1500;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(typeof value === "string" && value.includes("%") ? end + "%" : end.toLocaleString());
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start).toLocaleString());
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data: rows } = await supabase
        .from("userops")
        .select("*")
        .order("blocktimestamp", { ascending: false })
        .limit(1000);
      setData(rows || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const bundlerMap = {};
  data.forEach((row) => {
    const name = getBundlerName(row.bundler);
    bundlerMap[name] = (bundlerMap[name] || 0) + 1;
  });
  const bundlerStats = Object.entries(bundlerMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const timelineMap = {};
  data.forEach((row) => {
    if (!row.blocktimestamp) return;
    const hour = new Date(row.blocktimestamp * 1000);
    hour.setMinutes(0, 0, 0);
    const key = hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    timelineMap[key] = (timelineMap[key] || 0) + 1;
  });
  const timeline = Object.entries(timelineMap)
    .map(([time, count]) => ({ time, count }))
    .slice(-24);

  const totalOps = data.length;
  const uniqueBundlers = Object.keys(bundlerMap).length;
  const uniqueSenders = new Set(data.map((d) => d.sender)).size;
  const top1 = bundlerStats[0];
  const top1Share = top1 ? ((top1.count / totalOps) * 100).toFixed(1) : 0;

  if (loading) return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="grid-bg" />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1, 0.98] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ color: "#cc0000", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}
      >
        Initializing...
      </motion.div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ height: "2px", background: "linear-gradient(90deg, transparent, #cc0000, transparent)", marginTop: "1rem" }}
      />
    </div>
  );

  return (
    <div style={{ background: "#000", minHeight: "100vh", position: "relative" }}>
      <div className="grid-bg" />
      <div className="scanline" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          borderBottom: "1px solid #cc000033",
          padding: "1.5rem 3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(10px)",
          zIndex: 100,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "3px", height: "24px", background: "#cc0000" }} />
            <h1 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fff" }}>
              ERC-4337 Bundler Monitor
            </h1>
          </div>
          <p style={{ color: "#444", fontSize: "0.75rem", marginTop: "0.3rem", letterSpacing: "0.05em", paddingLeft: "19px" }}>
            ETHEREUM MAINNET / REAL-TIME ANALYSIS
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#cc0000" }}
          />
          <span style={{ color: "#cc0000", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
        </div>
      </motion.header>

      <div style={{ padding: "5rem 3rem 3rem", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p style={{ color: "#cc0000", fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Independent Research Tool
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem" }}>
            Who Controls<br />
            <span style={{ color: "#cc0000" }}>Your Transactions?</span>
          </h2>
          <p style={{ color: "#666", fontSize: "1rem", maxWidth: "600px", lineHeight: 1.7 }}>
            ERC-4337 smart wallet transactions pass through bundlers before reaching Ethereum.
            This tool monitors whether bundlers treat all transactions fairly — or manipulate order for profit.
          </p>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "#cc000022",
            border: "1px solid #cc000033",
            borderRadius: "4px",
            marginTop: "4rem",
            overflow: "hidden"
          }}
        >
          {[
            { label: "UserOps Analyzed", value: totalOps },
            { label: "Bundlers Tracked", value: uniqueBundlers },
            { label: "Unique Senders", value: uniqueSenders },
            { label: "Top Bundler Share", value: top1Share + "%" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ background: "#cc000011" }}
              style={{ padding: "2rem", background: "#0a0a0a", cursor: "default" }}
            >
              <div style={{ color: "#444", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.8rem" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff" }}>
                <AnimatedNumber value={m.value} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          background: "#cc000022",
          border: "1px solid #cc000033",
          borderRadius: "4px",
          marginTop: "1px",
          overflow: "hidden"
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ padding: "2rem", background: "#0a0a0a" }}
          >
            <p style={{ color: "#444", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
              Bundler Market Share
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bundlerStats} margin={{ top: 5, right: 5, left: -25, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#444", fontSize: 11 }} angle={-40} textAnchor="end" />
                <YAxis tick={{ fill: "#444", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #cc000033", color: "#fff", fontSize: "0.85rem" }} cursor={{ fill: "#cc000011" }} />
                <Bar dataKey="count" fill="#cc0000" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ padding: "2rem", background: "#0a0a0a" }}
          >
            <p style={{ color: "#444", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
              Activity Timeline
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeline} margin={{ top: 5, right: 5, left: -25, bottom: 70 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cc0000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#cc0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#444", fontSize: 11 }} angle={-40} textAnchor="end" />
                <YAxis tick={{ fill: "#444", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #cc000033", color: "#fff", fontSize: "0.85rem" }} />
                <Area type="monotone" dataKey="count" stroke="#cc0000" strokeWidth={2} fill="url(#redGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          style={{
            marginTop: "1px",
            padding: "1.5rem 2rem",
            background: top1Share > 40 ? "#1a0000" : "#001a00",
            border: `1px solid ${top1Share > 40 ? "#cc000066" : "#00cc0066"}`,
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ width: "3px", height: "40px", background: top1Share > 40 ? "#cc0000" : "#00cc00", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: top1Share > 40 ? "#cc0000" : "#00cc00", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {top1Share > 40 ? "Concentration Risk Detected" : "Healthy Distribution"}
            </div>
            <div style={{ color: "#555", fontSize: "0.85rem", marginTop: "0.3rem" }}>
              {top1 ? `${top1.name} controls ${top1Share}% of all UserOps — ${top1Share > 40 ? "significant centralization detected" : "no single bundler dominates the network"}` : "Collecting data..."}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ marginTop: "1px", background: "#0a0a0a", border: "1px solid #cc000033", borderRadius: "4px", overflow: "hidden" }}
        >
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #cc000022" }}>
            <p style={{ color: "#444", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Recent UserOperations
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #111" }}>
                  {["UserOp Hash", "Bundler", "Sender", "Block", "Time"].map((h) => (
                    <th key={h} style={{ color: "#333", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.8rem 1.5rem", textAlign: "left", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((row, i) => (
                  <tr
                    key={row.userophash}
                    onMouseEnter={() => setActiveRow(i)}
                    onMouseLeave={() => setActiveRow(null)}
                    style={{
                      borderBottom: "1px solid #0d0d0d",
                      background: activeRow === i ? "#cc000008" : "transparent",
                      cursor: "default",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={{ color: "#444", fontSize: "0.8rem", padding: "0.9rem 1.5rem", fontFamily: "monospace" }}>{row.userophash?.slice(0, 20)}...</td>
                    <td style={{ color: "#cc0000", fontSize: "0.8rem", padding: "0.9rem 1.5rem", fontWeight: 600 }}>{getBundlerName(row.bundler)}</td>
                    <td style={{ color: "#444", fontSize: "0.8rem", padding: "0.9rem 1.5rem", fontFamily: "monospace" }}>{row.sender?.slice(0, 16)}...</td>
                    <td style={{ color: "#444", fontSize: "0.8rem", padding: "0.9rem 1.5rem" }}>{row.blocknumber}</td>
                    <td style={{ color: "#444", fontSize: "0.8rem", padding: "0.9rem 1.5rem" }}>{row.blocktimestamp ? new Date(row.blocktimestamp * 1000).toLocaleTimeString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer */}
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #cc000022", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#333", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            Data sourced directly from Ethereum mainnet via Alchemy · Updates every 2 minutes
          </span>
          <a href="https://github.com/kridaygupta0907-hue/erc4337-bundler-monitor" style={{ color: "#cc0000", fontSize: "0.75rem", textDecoration: "none", letterSpacing: "0.1em" }}>
            VIEW SOURCE
          </a>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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
    const end = parseInt(value.toString().replace(/[^0-9]/g, ""));
    if (isNaN(end)) { setDisplay(value); return; }
    const duration = 1500;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end.toLocaleString());
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
  const top3Share = bundlerStats.slice(0, 3).reduce((a, b) => a + b.count, 0) / totalOps * 100;

  if (loading) return (
    <div className="loading-screen">
      <div className="grid-bg" />
      <div className="scanline" />
      <div className="loading-content">
        <div className="loading-bar" />
        <div className="loading-text">INITIALIZING SYSTEM</div>
        <div className="loading-sub">Connecting to Ethereum mainnet...</div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <div className="grid-bg" />
      <div className="scanline" />
      <div className="corner-tl" />
      <div className="corner-br" />

      {/* NAV */}
      <header className="nav">
        <div className="nav-brand">
          <div className="nav-accent" />
          ERC-4337 Bundler Monitor
        </div>
        <div className="nav-status">
          <div className="nav-dot" />
          LIVE / ETHEREUM MAINNET
        </div>
      </header>

      <div className="page">

        {/* HERO */}
        <section className="hero fade-up">
          <div className="hero-tag">// Independent Research Tool / Ethereum Mainnet</div>
          <h1 className="hero-title">
            Who Controls<br />
            <span className="red">Your Transactions?</span>
          </h1>
          <p className="hero-sub">
            ERC-4337 smart wallet transactions pass through bundlers before reaching Ethereum.
            This tool monitors whether bundlers treat all transactions fairly —
            or manipulate ordering for profit.
          </p>
        </section>

        {/* STATS */}
        <div className="stat-grid fade-up delay-1">
          {[
            { index: "// 01", label: "UserOps Analyzed", value: totalOps, sub: "from ethereum mainnet" },
            { index: "// 02", label: "Bundlers Tracked", value: uniqueBundlers, sub: "active on-chain" },
            { index: "// 03", label: "Unique Senders", value: uniqueSenders, sub: "smart wallet users" },
            { index: "// 04", label: "Top Bundler Share", value: top1Share + "%", sub: top1?.name?.toLowerCase() || "" },
          ].map((s) => (
            <div key={s.label} className="stat-cell">
              <div className="stat-index">{s.index}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value"><AnimatedNumber value={s.value} /></div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="chart-grid fade-up delay-2">
          <div className="panel">
            <div className="panel-title">// Bundler Market Share</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bundlerStats} margin={{ top: 5, right: 5, left: -25, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#444", fontSize: 11 }} angle={-40} textAnchor="end" />
                <YAxis tick={{ fill: "#444", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #cc000033", color: "#fff", fontSize: "0.85rem" }} cursor={{ fill: "#cc000011" }} />
                <Bar dataKey="count" fill="#cc0000" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <div className="panel-title">// Activity Timeline</div>
            <ResponsiveContainer width="100%" height={260}>
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
          </div>
        </div>

        {/* ALERT */}
        <div className={`alert-box fade-up delay-3 ${top1Share > 40 ? "alert-danger" : "alert-safe"}`}>
          <div className="alert-bar" />
          <div>
            <div className="alert-head">
              {top1Share > 40 ? "CONCENTRATION RISK DETECTED" : "HEALTHY DISTRIBUTION"}
            </div>
            <div className="alert-body">
              {top1 ? `${top1.name} controls ${top1Share}% of all UserOps. Top 3 bundlers combined: ${top3Share.toFixed(1)}%. ${top1Share > 40 ? "Significant centralization detected." : "No single bundler dominates the network."}` : "Collecting data..."}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="data-panel fade-up delay-3">
          <div className="data-panel-header">
            <div className="panel-title">// Recent UserOperations</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {["UserOp Hash", "Bundler", "Sender", "Block", "Time"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((row, i) => (
                  <tr
                    key={row.userophash}
                    className={activeRow === i ? "active-row" : ""}
                    onMouseEnter={() => setActiveRow(i)}
                    onMouseLeave={() => setActiveRow(null)}
                  >
                    <td className="mono">{row.userophash?.slice(0, 20)}...</td>
                    <td className="red-text">{getBundlerName(row.bundler)}</td>
                    <td className="mono dim">{row.sender?.slice(0, 16)}...</td>
                    <td className="dim">{row.blocknumber}</td>
                    <td className="dim">{row.blocktimestamp ? new Date(row.blocktimestamp * 1000).toLocaleTimeString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="footer fade-up delay-4">
          <span className="footer-left">
            Data sourced from Ethereum mainnet via Alchemy &nbsp;·&nbsp; Updates every 10 minutes &nbsp;·&nbsp; {totalOps.toLocaleString()} UserOps collected
          </span>
          <a href="https://github.com/Operant7-lang/erc4337-bundler-monitor" className="footer-link">
            VIEW SOURCE
          </a>
        </footer>

      </div>
    </div>
  );
}
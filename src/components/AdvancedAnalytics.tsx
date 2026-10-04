"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Clock, TrendingDown, Users } from "lucide-react";

interface ApplicationData {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  jobTitle?: string;
  division?: string;
}

interface AdvancedAnalyticsProps {
  applications: ApplicationData[];
}

const COLORS = ["#00205B", "#FF5E00", "#10B981", "#8B5CF6", "#F59E0B", "#3B82F6"];

export default function AdvancedAnalytics({ applications }: AdvancedAnalyticsProps) {
  const [filterDaop, setFilterDaop] = useState("ALL");
  const [filterPeriod, setFilterPeriod] = useState("ALL");

  // Analytics Calculations
  const { funnelData, timeToHire, divisionData, dropOffRate } = useMemo(() => {
    const now = new Date();

    const filteredApps = applications.filter(app => {
      // 1. Daop Filter
      const matchDaop = filterDaop === "ALL" || app.division === filterDaop;
      
      // 2. Period Filter
      let matchPeriod = true;
      if (filterPeriod !== "ALL") {
        const appDate = new Date(app.createdAt);
        const diffTime = now.getTime() - appDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (filterPeriod === "DAY") matchPeriod = diffDays <= 1;
        else if (filterPeriod === "WEEK") matchPeriod = diffDays <= 7;
        else if (filterPeriod === "MONTH") matchPeriod = diffDays <= 30;
        else if (filterPeriod === "YEAR") matchPeriod = diffDays <= 365;
      }

      return matchDaop && matchPeriod;
    });

    // 1. Funnel & Drop-off
    const total = filteredApps.length;
    const adminCheck = filteredApps.filter(a => !["PENDING", "REJECTED"].includes(a.status)).length; 
    const testStage = filteredApps.filter(a => ["TEST_SCHEDULED", "IN_TEST", "TEST_COMPLETED", "INTERVIEW", "MCU", "OFFERING", "OFFERED", "ACCEPTED"].includes(a.status)).length;
    const interviewStage = filteredApps.filter(a => ["INTERVIEW", "MCU", "OFFERING", "OFFERED", "ACCEPTED"].includes(a.status)).length;
    const accepted = filteredApps.filter(a => ["OFFERING", "OFFERED", "ACCEPTED"].includes(a.status)).length;

    const funnel = [
      { name: "Pendaftar", value: total },
      { name: "Lolos Berkas", value: adminCheck },
      { name: "Tahap Tes", value: testStage },
      { name: "Wawancara", value: interviewStage },
      { name: "Diterima", value: accepted },
    ];

    let overallDropOff = 0;
    if (total > 0) {
      overallDropOff = Math.round(((total - accepted) / total) * 100);
    }

    // 2. Time-to-Hire (Avg days from creation to ACCEPTED)
    let totalDays = 0;
    let acceptedCount = 0;

    filteredApps.forEach(app => {
      if (["ACCEPTED", "OFFERING", "OFFERED"].includes(app.status)) {
        const start = new Date(app.createdAt).getTime();
        const end = app.updatedAt ? new Date(app.updatedAt).getTime() : Date.now(); 
        const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
        totalDays += Math.max(days, 1);
        acceptedCount++;
      }
    });

    const avgTimeToHire = acceptedCount > 0 ? Math.round(totalDays / acceptedCount) : 0;

    // 3. Division/Daop Distribution
    const divCounts = filteredApps.reduce((acc: Record<string, number>, curr) => {
      const div = curr.division || "Umum";
      acc[div] = (acc[div] || 0) + 1;
      return acc;
    }, {});

    const divisions = Object.keys(divCounts).map(key => ({
      name: key.replace("_", " "),
      value: divCounts[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5); // top 5

    return {
      funnelData: funnel,
      timeToHire: avgTimeToHire,
      divisionData: divisions,
      dropOffRate: overallDropOff
    };
  }, [applications, filterDaop, filterPeriod]);

  return (
    <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", margin: "0 0 4px" }}>Advanced Analytics</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#888888" }}>Wawasan mendalam mengenai performa rekrutmen perusahaan</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
            {[
              { key: "DAY", label: "Harian" },
              { key: "WEEK", label: "Mingguan" },
              { key: "MONTH", label: "Bulanan" },
              { key: "YEAR", label: "Tahunan" },
              { key: "ALL", label: "Semua Waktu" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilterPeriod(btn.key)}
                style={{
                  padding: "6px 12px",
                  background: filterPeriod === btn.key ? "#ffffff" : "transparent",
                  color: filterPeriod === btn.key ? "#00205B" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: filterPeriod === btn.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <select 
            value={filterDaop}
            onChange={(e) => setFilterDaop(e.target.value)}
            style={{ padding: "8px 16px", borderRadius: "10px", border: "2px solid #eeeeee", background: "#ffffff", outline: "none", fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
          >
            <option value="ALL">Semua Divisi / Daop</option>
            <option value="ON_TRAIN_SERVICE">On-Train Service</option>
            <option value="RES_CLEAN">ResClean</option>
            <option value="RES_PARKING">ResParking</option>
            <option value="LOGISTICS">Logistik</option>
            <option value="IT_STAFF">IT Staff</option>
            <option value="ADMIN">Administrasi</option>
          </select>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={28} />
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Time-to-Hire (Rata-rata)</p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#111111" }}>{timeToHire} <span style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8" }}>Hari</span></h3>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingDown size={28} />
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Drop-off Rate Global</p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#111111" }}>{dropOffRate}%</h3>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Kandidat Diterima</p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#111111" }}>
              {funnelData.length > 0 ? funnelData[funnelData.length - 1].value : 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        
        {/* Funnel Chart */}
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 24px", color: "#111111" }}>Tingkat Konversi Pelamar (Funnel)</h3>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Division Distribution Pie Chart */}
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 24px", color: "#111111" }}>Sebaran Divisi</h3>
          <div style={{ width: "100%", height: "300px" }}>
            {divisionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={divisionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {divisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                Belum ada data pelamar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

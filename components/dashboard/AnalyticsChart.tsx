"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PiggyBank, Receipt, ArrowUpRight, TrendingUp } from "lucide-react";

export default function AnalyticsChart() {
  const savings = useAppStore((state) => state.savings);
  const payments = useAppStore((state) => state.payments);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate last 6 months keys and labels
  const monthlyData = useMemo(() => {
    const list: { key: string; label: string; savings: number; repayments: number }[] = [];
    const today = new Date();
    
    // Generate chronological list from 5 months ago to today
    for (let i = 5; i >= 0; i--) {
      const tempDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth(); // 0-indexed
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      
      list.push({
        key,
        label: tempDate.toLocaleDateString("en-US", { month: "short" }),
        savings: 0,
        repayments: 0,
      });
    }

    // Accumulate savings
    savings.forEach((s) => {
      if (!s.date) return;
      const parts = s.date.split("-");
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`; // 'YYYY-MM'
      const match = list.find((item) => item.key === key);
      if (match) {
        match.savings += s.amount;
      }
    });

    // Accumulate repayments (payments)
    payments.forEach((p) => {
      if (!p.date) return;
      const parts = p.date.split("-");
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`; // 'YYYY-MM'
      const match = list.find((item) => item.key === key);
      if (match) {
        match.repayments += p.amount;
      }
    });

    return list;
  }, [savings, payments]);

  // Chart coordinate mapping math
  const maxVal = useMemo(() => {
    let max = 1000; // fallback minimum range
    monthlyData.forEach((item) => {
      if (item.savings > max) max = item.savings;
      if (item.repayments > max) max = item.repayments;
    });
    // Add 15% margin at top of chart
    return max * 1.15;
  }, [monthlyData]);

  // Dimension Constants
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = useMemo(() => {
    return monthlyData.map((item, idx) => {
      const x = paddingLeft + (idx / (monthlyData.length - 1)) * chartWidth;
      const savingsY = height - paddingBottom - (item.savings / maxVal) * chartHeight;
      const repaymentsY = height - paddingBottom - (item.repayments / maxVal) * chartHeight;

      return {
        x,
        savingsY,
        repaymentsY,
        label: item.label,
        savingsVal: item.savings,
        repaymentsVal: item.repayments,
      };
    });
  }, [monthlyData, maxVal, chartWidth, chartHeight]);

  // Construct SVG paths
  const paths = useMemo(() => {
    if (points.length === 0) return { savingsLine: "", savingsArea: "", repaymentsLine: "", repaymentsArea: "" };

    let savingsLine = `M ${points[0].x} ${points[0].savingsY}`;
    let repaymentsLine = `M ${points[0].x} ${points[0].repaymentsY}`;

    for (let i = 1; i < points.length; i++) {
      savingsLine += ` L ${points[i].x} ${points[i].savingsY}`;
      repaymentsLine += ` L ${points[i].x} ${points[i].repaymentsY}`;
    }

    // Areas: loop back to bottom-right, then bottom-left, then close
    const baseLineY = height - paddingBottom;
    const savingsArea = `${savingsLine} L ${points[points.length - 1].x} ${baseLineY} L ${points[0].x} ${baseLineY} Z`;
    const repaymentsArea = `${repaymentsLine} L ${points[points.length - 1].x} ${baseLineY} L ${points[0].x} ${baseLineY} Z`;

    return { savingsLine, savingsArea, repaymentsLine, repaymentsArea };
  }, [points]);

  // Grid line helpers
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const formatRupee = (value: number) => {
    if (value >= 100000) return `Rs. ${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `Rs. ${(value / 1000).toFixed(0)}k`;
    return `Rs. ${value}`;
  };

  return (
    <div className="p-6 rounded-2xl glass border border-slate-900/60 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4 select-none">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Analytics desk</span>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Monthly Savings vs Repayments
          </h3>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-400">Savings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </span>
            <span className="text-slate-400">Repayments</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto select-none"
        >
          {/* Gradients Defs */}
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="repaymentsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Ticks */}
          {yTicks.map((tick, idx) => {
            const y = height - paddingBottom - tick * chartHeight;
            const gridVal = tick * maxVal;
            return (
              <g key={idx}>
                {/* Grid line */}
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  className="stroke-slate-900" 
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                {/* Y Axis Label */}
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="fill-slate-600 font-bold text-[9px] uppercase tracking-wider"
                >
                  {formatRupee(gridVal)}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-500 font-bold text-[9px] uppercase tracking-wider"
            >
              {p.label}
            </text>
          ))}

          {/* filled Areas */}
          {paths.savingsArea && (
            <path d={paths.savingsArea} fill="url(#savingsGrad)" />
          )}
          {paths.repaymentsArea && (
            <path d={paths.repaymentsArea} fill="url(#repaymentsGrad)" />
          )}

          {/* Drawing Lines */}
          {paths.savingsLine && (
            <path 
              d={paths.savingsLine} 
              fill="none" 
              className="stroke-emerald-400" 
              strokeWidth={2.5} 
            />
          )}
          {paths.repaymentsLine && (
            <path 
              d={paths.repaymentsLine} 
              fill="none" 
              className="stroke-indigo-400" 
              strokeWidth={2.5} 
            />
          )}

          {/* Nodes Circles */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                {/* Savings node */}
                <circle 
                  cx={p.x} 
                  cy={p.savingsY} 
                  r={isHovered ? 5.5 : 3.5} 
                  className="fill-slate-950 stroke-emerald-400" 
                  strokeWidth={2}
                />
                {/* Repayments node */}
                <circle 
                  cx={p.x} 
                  cy={p.repaymentsY} 
                  r={isHovered ? 5.5 : 3.5} 
                  className="fill-slate-950 stroke-indigo-400" 
                  strokeWidth={2}
                />

                {/* Vertical hover guidance line */}
                {isHovered && (
                  <line 
                    x1={p.x} 
                    y1={paddingTop} 
                    x2={p.x} 
                    y2={height - paddingBottom} 
                    className="stroke-slate-800" 
                    strokeWidth={1}
                  />
                )}

                {/* Invisible hover catcher bars */}
                <rect
                  x={p.x - chartWidth / 10}
                  y={paddingTop}
                  width={chartWidth / 5}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover interactive tooltip card */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute z-10 glass border border-slate-800 bg-slate-950/90 rounded-xl p-3 shadow-xl space-y-1.5 transition-all text-xs"
            style={{
              left: `${Math.min(
                width - 150, 
                Math.max(paddingLeft, points[hoveredIndex].x - 70)
              ) * (100 / width)}%`,
              top: "0px",
            }}
          >
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {points[hoveredIndex].label} 2026
            </div>
            
            <div className="space-y-1 select-text">
              <div className="flex items-center justify-between gap-4 font-semibold text-emerald-400">
                <span className="flex items-center gap-1"><PiggyBank className="w-3 h-3" /> Deposit:</span>
                <span>{new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(points[hoveredIndex].savingsVal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-semibold text-indigo-400">
                <span className="flex items-center gap-1"><Receipt className="w-3 h-3" /> Repayment:</span>
                <span>{new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(points[hoveredIndex].repaymentsVal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

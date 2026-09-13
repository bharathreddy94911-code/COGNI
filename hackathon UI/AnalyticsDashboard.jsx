import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BarChart3, PieChart, TrendingUp, TrendingDown, Clock, ShieldAlert, 
    FileText, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Download, 
    Filter, Search, ArrowUpDown, Layers, Cpu, Check, FileCheck, Eye, Activity
} from "lucide-react";
import { analyticsService } from "./analyticsService";

const FONT = `"Sen", ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;

export default function AnalyticsDashboard({ colors, theme, onBack, onNavigateApp }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Global Filters State
    const [dateRange, setDateRange] = useState("Last 30 Days");
    const [selectedDocType, setSelectedDocType] = useState("All");
    const [selectedAgent, setSelectedAgent] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedRisk, setSelectedRisk] = useState("All");

    // Table Search, Sort, Pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("timestamp");
    const [sortDirection, setSortDirection] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Fetch Analytics Data
    const loadAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsService.getAnalyticsData({
                dateRange,
                selectedDocType,
                selectedAgent,
                selectedStatus,
                selectedRisk
            });
            setData(result);
        } catch (err) {
            setError(err.message || "Failed to load analytics metrics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [dateRange, selectedDocType, selectedAgent, selectedStatus, selectedRisk]);

    // Reset pagination to page 1 on filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange, selectedDocType, selectedAgent, selectedStatus, selectedRisk, searchQuery]);

    // Filtered Recent Activities Data
    const filteredActivities = useMemo(() => {
        if (!data || !data.recentActivities) return [];
        const now = Date.now();

        return data.recentActivities.filter(item => {
            const matchesSearch = !searchQuery || 
                (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.loanType && item.loanType.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.documentType && item.documentType.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.agentUsed && item.agentUsed.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesDate = true;
            if (item.timestamp) {
                const itemTime = new Date(item.timestamp).getTime();
                if (!isNaN(itemTime)) {
                    const diffHours = (now - itemTime) / (1000 * 60 * 60);
                    if (dateRange === "Today") matchesDate = diffHours <= 24;
                    else if (dateRange === "Last 7 Days") matchesDate = diffHours <= 24 * 7;
                    else if (dateRange === "Last 30 Days") matchesDate = diffHours <= 24 * 30;
                    else if (dateRange === "Last 3 Months") matchesDate = diffHours <= 24 * 90;
                }
            }

            let matchesDoc = true;
            if (selectedDocType !== "All") {
                const target = selectedDocType.toLowerCase();
                const doc = (item.documentType || "").toLowerCase();
                matchesDoc = doc.includes(target) || target.includes(doc);
            }

            let matchesAgent = true;
            if (selectedAgent !== "All") {
                const target = selectedAgent.toLowerCase();
                const agt = (item.agentUsed || "").toLowerCase();
                matchesAgent = agt.includes(target);
            }

            let matchesStatus = true;
            if (selectedStatus !== "All") {
                const target = selectedStatus.toUpperCase();
                const st = (item.status || "").toUpperCase();
                if (target === "PENDING_REVIEW") {
                    matchesStatus = st === "PENDING_REVIEW" || st === "PENDING" || st === "NEEDS_REVIEW";
                } else {
                    matchesStatus = st === target;
                }
            }

            let matchesRisk = true;
            if (selectedRisk !== "All") {
                const target = selectedRisk.toUpperCase();
                const rk = (item.riskCategory || item.risk_level || "").toUpperCase();
                matchesRisk = rk === target;
            }

            return matchesSearch && matchesDate && matchesDoc && matchesAgent && matchesStatus && matchesRisk;
        }).sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (sortField === "timestamp") {
                valA = new Date(a.timestamp || 0).getTime();
                valB = new Date(b.timestamp || 0).getTime();
            }
            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, searchQuery, dateRange, selectedDocType, selectedAgent, selectedStatus, selectedRisk, sortField, sortDirection]);

    // Dynamic metrics derived from active filters for immediate visual updates across all cards & charts
    const displayMetrics = useMemo(() => {
        if (!data) return null;
        
        const isFiltered = dateRange !== "Last 30 Days" || selectedDocType !== "All" || selectedAgent !== "All" || selectedStatus !== "All" || selectedRisk !== "All" || searchQuery.trim() !== "";
        
        if (!isFiltered) {
            return data;
        }

        const items = filteredActivities;
        const total = items.length;
        const completed = items.filter(a => (a.status || "").toUpperCase() === 'COMPLETED').length;
        const review = items.filter(a => ["PENDING_REVIEW", "PENDING", "NEEDS_REVIEW"].includes((a.status || "").toUpperCase())).length;
        const failed = items.filter(a => (a.status || "").toUpperCase() === 'FAILED').length;
        const processing = items.filter(a => ["PROCESSING", "IN_PROGRESS"].includes((a.status || "").toUpperCase())).length;

        const confScores = items.map(a => parseInt(a.confidenceScore || "90")).filter(n => !isNaN(n));
        const avgConf = confScores.length > 0 ? (confScores.reduce((a, b) => a + b, 0) / confScores.length).toFixed(1) : (data.confidenceStats?.averageConfidence || 94.8);

        const highConf = confScores.filter(s => s >= 90).length;
        const medConf = confScores.filter(s => s >= 75 && s < 90).length;
        const lowConf = confScores.filter(s => s < 75).length;

        const typeCounts = {};
        items.forEach(a => {
            const dt = a.documentType || "Other Documents";
            typeCounts[dt] = (typeCounts[dt] || 0) + 1;
        });

        const docTypes = Object.keys(typeCounts).length > 0 
            ? Object.entries(typeCounts).map(([type, count]) => ({
                type,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
              }))
            : (total === 0 ? [] : data.docTypes);

        const agentPerformance = (data.agentPerformance || []).map(agent => {
            const agentItems = items.filter(a => (a.agentUsed || "").toLowerCase().includes(agent.id.toLowerCase()));
            const count = agentItems.length;
            const succ = agentItems.filter(a => (a.status || "").toUpperCase() === "COMPLETED").length;
            const fail = agentItems.filter(a => (a.status || "").toUpperCase() === "FAILED").length;
            return {
                ...agent,
                executions: count > 0 ? count : (isFiltered ? 0 : agent.executions),
                successful: count > 0 ? succ : (isFiltered ? 0 : agent.successful),
                failed: count > 0 ? fail : (isFiltered ? 0 : agent.failed),
                successRate: count > 0 ? Math.round((succ / count) * 100) : (isFiltered ? 0 : agent.successRate)
            };
        });

        const lowRisk = items.filter(a => (a.riskCategory || "").toUpperCase() === 'LOW').length;
        const medRisk = items.filter(a => (a.riskCategory || "").toUpperCase() === 'MEDIUM').length;
        const highRisk = items.filter(a => (a.riskCategory || "").toUpperCase() === 'HIGH').length;

        return {
            ...data,
            summary: {
                totalApplications: total,
                previousPeriodTotal: Math.round(total * 0.85),
                volumeTrendPercent: data.summary?.volumeTrendPercent || 15,
                completedDocs: completed,
                processingDocs: processing,
                failedDocs: failed,
                reviewDocs: review,
                averageConfidence: avgConf
            },
            docTypes,
            agentPerformance,
            confidenceStats: {
                averageConfidence: avgConf,
                highConfidence: highConf,
                mediumConfidence: medConf,
                lowConfidence: lowConf,
                fieldsRequiringVerification: review * 2
            },
            validationResults: {
                passed: completed,
                failed: failed,
                missingInfo: Math.round(review * 0.5),
                duplicateDocs: Math.round(review * 0.2),
                mismatchedInfo: Math.round(review * 0.3)
            },
            riskCategoryDistribution: {
                lowRisk,
                mediumRisk: medRisk,
                highRisk,
                requiringManualReview: review
            },
            manualReviewAnalytics: {
                totalRequired: review,
                pending: Math.round(review * 0.6),
                completed: Math.round(review * 0.4),
                avgReviewMinutes: data.manualReviewAnalytics?.avgReviewMinutes || 8.5,
                topReasons: data.manualReviewAnalytics?.topReasons || []
            },
            recentActivities: items
        };
    }, [data, filteredActivities, dateRange, selectedDocType, selectedAgent, selectedStatus, selectedRisk, searchQuery]);

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage) || 1;
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredActivities.slice(start, start + itemsPerPage);
    }, [filteredActivities, currentPage]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleExport = () => {
        analyticsService.exportToCSV(filteredActivities, `analytics_report_${dateRange.replace(/\s+/g, '_')}.csv`);
    };

    const cardStyle = {
        background: colors.bubbleBg,
        borderRadius: "20px",
        padding: "24px",
        border: `1px solid ${colors.panelBorder}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        transition: "all 0.2s ease"
    };

    return (
        <div style={{ fontFamily: FONT, background: colors.bgTop, color: colors.bubbleText, minHeight: "100vh", paddingBottom: "60px" }}>
            
            {/* TOP HEADER */}
            <header style={{ 
                position: "sticky", top: 0, zIndex: 30,
                background: colors.panelBg, borderBottom: `1px solid ${colors.panelBorder}`,
                backdropFilter: "blur(12px)", padding: "16px 32px",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {onBack && (
                        <button onClick={onBack} style={{ background: "transparent", border: "none", color: colors.faint, cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: FONT }}>
                            ← Back
                        </button>
                    )}
                    <div>
                        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: colors.bubbleText }}>
                            <BarChart3 size={24} color={colors.pillBg} /> Analytics Dashboard
                        </h1>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: colors.faint }}>
                            Real-time AI document processing activity, agent metrics, and risk pattern insights
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {/* Refresh Button */}
                    <button 
                        onClick={loadAnalytics}
                        disabled={loading}
                        style={{
                            background: "transparent",
                            border: `1px solid ${colors.panelBorder}`,
                            color: colors.bubbleText,
                            padding: "8px 14px", borderRadius: "10px",
                            fontSize: "13px", fontWeight: 600, fontFamily: FONT, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}
                    >
                        <RefreshCw size={14} className={loading ? "spin-icon" : ""} /> Refresh
                    </button>

                    {/* Export Report Button */}
                    <button 
                        onClick={handleExport}
                        style={{
                            background: colors.pillBg,
                            border: "none",
                            color: "#FFFFFF",
                            padding: "8px 16px", borderRadius: "10px",
                            fontSize: "13px", fontWeight: 700, fontFamily: FONT, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </header>

            {/* GLOBAL FILTERS BAR */}
            <div style={{ padding: "16px 32px", background: colors.panelBg, borderBottom: `1px solid ${colors.panelBorder}`, display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: colors.faint, fontSize: "13px", fontWeight: 700 }}>
                    <Filter size={15} /> Filters:
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
                    <select 
                        value={selectedDocType} 
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        style={{ background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#FFFFFF", color: colors.bubbleText, border: `1px solid ${colors.panelBorder}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: FONT }}
                    >
                        <option value="All">All Document Types</option>
                        <option value="Payslip">Payslip</option>
                        <option value="Bank Statement">Bank Statement</option>
                        <option value="Aadhaar">Aadhaar / ID</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Address Proof">Address Proof</option>
                    </select>

                    <select 
                        value={selectedAgent} 
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        style={{ background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#FFFFFF", color: colors.bubbleText, border: `1px solid ${colors.panelBorder}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: FONT }}
                    >
                        <option value="All">All AI Agents</option>
                        <option value="Agent-1">Agent-1 Classifier</option>
                        <option value="Agent-2">Agent-2 Extractor</option>
                        <option value="Agent-3">Agent-3 Validator</option>
                        <option value="Agent-4">Agent-4 Cross Verifier</option>
                        <option value="Agent-5">Agent-5 Risk Scanner</option>
                        <option value="Agent-6">Agent-6 Report Generator</option>
                    </select>

                    <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{ background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#FFFFFF", color: colors.bubbleText, border: `1px solid ${colors.panelBorder}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: FONT }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING_REVIEW">Needs Review</option>
                        <option value="FAILED">Failed</option>
                    </select>

                    <select 
                        value={selectedRisk} 
                        onChange={(e) => setSelectedRisk(e.target.value)}
                        style={{ background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#FFFFFF", color: colors.bubbleText, border: `1px solid ${colors.panelBorder}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: FONT }}
                    >
                        <option value="All">All Risk Categories</option>
                        <option value="LOW">Low Risk</option>
                        <option value="MEDIUM">Medium Risk</option>
                        <option value="HIGH">High Risk</option>
                    </select>
                </div>

                {(selectedDocType !== "All" || selectedAgent !== "All" || selectedStatus !== "All" || selectedRisk !== "All") && (
                    <button 
                        onClick={() => { setSelectedDocType("All"); setSelectedAgent("All"); setSelectedStatus("All"); setSelectedRisk("All"); }}
                        style={{ background: "transparent", border: "none", color: "#EA4335", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* MAIN CONTENT DASHBOARD BODY */}
            <main style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
                
                {/* SKELETON LOADER STATE */}
                {loading && !data && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ ...cardStyle, height: "120px", background: theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", animation: "pulse 1.5s infinite" }} />
                        ))}
                    </div>
                )}

                {/* ERROR STATE */}
                {error && (
                    <div style={{ ...cardStyle, borderColor: "rgba(234,67,53,0.3)", background: "rgba(234,67,53,0.08)", color: "#EA4335", display: "flex", alignItems: "center", gap: "12px" }}>
                        <AlertTriangle size={20} />
                        <div><strong>Error:</strong> {error}</div>
                    </div>
                )}

                {displayMetrics && (
                    <>
                        {/* 1. TOP PROMINENT KPI CARDS */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                            
                            {/* KPI 1: Total Applications Analyzed */}
                            <motion.div whileHover={{ y: -3 }} style={cardStyle} onClick={() => setSelectedStatus("All")}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.faint }}>TOTAL APPLICATIONS</span>
                                    <div style={{ background: `${colors.pillBg}20`, padding: "8px", borderRadius: "10px", color: colors.pillBg }}>
                                        <FileText size={20} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "36px", fontWeight: 800, color: colors.bubbleText, lineHeight: 1 }}>
                                    {displayMetrics.summary.totalApplications}
                                </div>
                            </motion.div>

                            {/* KPI 2: Completed Documents */}
                            <motion.div whileHover={{ y: -3 }} style={cardStyle} onClick={() => setSelectedStatus("COMPLETED")}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.faint }}>COMPLETED DOCUMENTS</span>
                                    <div style={{ background: "rgba(52,168,83,0.15)", padding: "8px", borderRadius: "10px", color: "#34A853" }}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "36px", fontWeight: 800, color: colors.bubbleText, lineHeight: 1 }}>
                                    {displayMetrics.summary.completedDocs}
                                </div>
                            </motion.div>

                            {/* KPI 3: Average Extraction Confidence */}
                            <motion.div whileHover={{ y: -3 }} style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.faint }}>AVG EXTRACTION CONFIDENCE</span>
                                    <div style={{ background: "rgba(59,130,246,0.15)", padding: "8px", borderRadius: "10px", color: "#3B82F6" }}>
                                        <Activity size={20} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "36px", fontWeight: 800, color: colors.bubbleText, lineHeight: 1 }}>
                                    {displayMetrics.summary.averageConfidence}%
                                </div>
                            </motion.div>

                            {/* KPI 4: Documents Requiring Review */}
                            <motion.div whileHover={{ y: -3 }} style={cardStyle} onClick={() => setSelectedStatus("PENDING_REVIEW")}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.faint }}>REQUIRES MANUAL REVIEW</span>
                                    <div style={{ background: "rgba(245,158,11,0.15)", padding: "8px", borderRadius: "10px", color: "#F59E0B" }}>
                                        <ShieldAlert size={20} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "36px", fontWeight: 800, color: colors.bubbleText, lineHeight: 1 }}>
                                    {displayMetrics.summary.reviewDocs}
                                </div>
                            </motion.div>

                        </div>

                        {/* 2 & 3. PROCESSING OVERVIEW & DOCUMENT TYPES */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            
                            {/* Processing Status Breakdown */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <PieChart size={18} color={colors.pillBg} /> Document Processing Status
                                </h3>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {[
                                        { label: "Completed", count: displayMetrics.summary.completedDocs, color: "#34A853", statusKey: "COMPLETED" },
                                        { label: "In Processing", count: displayMetrics.summary.processingDocs, color: "#3B82F6", statusKey: "PROCESSING" },
                                        { label: "Needs Review", count: displayMetrics.summary.reviewDocs, color: "#F59E0B", statusKey: "PENDING_REVIEW" },
                                        { label: "Failed", count: displayMetrics.summary.failedDocs, color: "#EA4335", statusKey: "FAILED" },
                                    ].map((item, idx) => {
                                        const pct = displayMetrics.summary.totalApplications > 0 
                                            ? Math.round((item.count / displayMetrics.summary.totalApplications) * 100) 
                                            : 0;
                                        return (
                                            <div key={idx} style={{ cursor: "pointer" }} onClick={() => setSelectedStatus(item.statusKey)}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                                    <span style={{ color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                                                        {item.label}
                                                    </span>
                                                    <span style={{ color: colors.faint }}>{item.count} ({pct}%)</span>
                                                </div>
                                                <div style={{ height: "8px", background: theme === 'dark' ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                                    <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Documents by Document Type */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Layers size={18} color={colors.pillBg} /> Documents by Document Type
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    {displayMetrics.docTypes.map((doc, idx) => (
                                        <div key={idx} style={{ cursor: "pointer" }} onClick={() => setSelectedDocType(doc.type.split(" ")[0])}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                                <span style={{ color: colors.bubbleText }}>{doc.type}</span>
                                                <span style={{ color: colors.faint }}>{doc.count} docs ({doc.percentage}%)</span>
                                            </div>
                                            <div style={{ height: "8px", background: theme === 'dark' ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${doc.percentage}%`, height: "100%", background: colors.pillBg, borderRadius: "4px", opacity: 0.85 + (idx * 0.02) }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* 4. AI AGENT PERFORMANCE TABLE & CHART */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                <Cpu size={18} color={colors.pillBg} /> AI Agent Pipeline Performance (Agents 1 - 6)
                            </h3>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                                    <thead>
                                        <tr style={{ background: theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${colors.panelBorder}` }}>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Agent ID & Name</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Primary Task</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Executions</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Successful</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Failed</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600 }}>Success %</th>
                                            <th style={{ padding: "12px 16px", color: colors.faint, fontWeight: 600, textAlign: "right" }}>Avg Latency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayMetrics.agentPerformance.map((agent, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx < displayMetrics.agentPerformance.length - 1 ? `1px solid ${colors.panelBorder}` : "none" }}>
                                                <td style={{ padding: "14px 16px", fontWeight: 700, color: colors.bubbleText }}>
                                                    <span style={{ color: colors.pillBg, marginRight: "8px" }}>{agent.id}</span>
                                                    {agent.name}
                                                </td>
                                                <td style={{ padding: "14px 16px", color: colors.faint }}>{agent.role}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 600, color: colors.bubbleText }}>{agent.executions}</td>
                                                <td style={{ padding: "14px 16px", color: "#34A853", fontWeight: 600 }}>{agent.successful}</td>
                                                <td style={{ padding: "14px 16px", color: agent.failed > 0 ? "#EA4335" : colors.faint, fontWeight: 600 }}>{agent.failed}</td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontWeight: 700, color: agent.successRate >= 95 ? "#34A853" : "#F59E0B" }}>{agent.successRate}%</span>
                                                        <div style={{ flex: 1, height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                                                            <div style={{ width: `${agent.successRate}%`, height: "100%", background: agent.successRate >= 95 ? "#34A853" : "#F59E0B", borderRadius: "3px" }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: colors.bubbleText }}>{agent.avgTimeSec}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 5 & 6. ACCURACY & VALIDATION RESULTS */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            
                            {/* Extraction Accuracy & Confidence */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FileCheck size={18} color={colors.pillBg} /> Extraction Confidence Buckets
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div style={{ padding: "16px", background: theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: "12px", border: `1px solid ${colors.panelBorder}` }}>
                                        <div style={{ fontSize: "12px", color: colors.faint, marginBottom: "4px" }}>Overall Average Extraction Confidence</div>
                                        <div style={{ fontSize: "28px", fontWeight: 800, color: "#34A853" }}>{displayMetrics.confidenceStats.averageConfidence}%</div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                            <span style={{ color: "#34A853" }}>High Confidence (&gt;90%)</span>
                                            <span>{displayMetrics.confidenceStats.highConfidence} docs</span>
                                        </div>
                                        <div style={{ height: "8px", background: "rgba(52,168,83,0.15)", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ width: `${displayMetrics.summary.totalApplications > 0 ? (displayMetrics.confidenceStats.highConfidence / displayMetrics.summary.totalApplications) * 100 : 0}%`, height: "100%", background: "#34A853", borderRadius: "4px" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                            <span style={{ color: "#F59E0B" }}>Medium Confidence (75% - 90%)</span>
                                            <span>{displayMetrics.confidenceStats.mediumConfidence} docs</span>
                                        </div>
                                        <div style={{ height: "8px", background: "rgba(245,158,11,0.15)", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ width: `${displayMetrics.summary.totalApplications > 0 ? (displayMetrics.confidenceStats.mediumConfidence / displayMetrics.summary.totalApplications) * 100 : 0}%`, height: "100%", background: "#F59E0B", borderRadius: "4px" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                            <span style={{ color: "#EA4335" }}>Low Confidence (&lt;75%)</span>
                                            <span>{displayMetrics.confidenceStats.lowConfidence} docs</span>
                                        </div>
                                        <div style={{ height: "8px", background: "rgba(234,67,53,0.15)", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ width: `${displayMetrics.summary.totalApplications > 0 ? (displayMetrics.confidenceStats.lowConfidence / displayMetrics.summary.totalApplications) * 100 : 0}%`, height: "100%", background: "#EA4335", borderRadius: "4px" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Validation Outcomes */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <CheckCircle2 size={18} color={colors.pillBg} /> Validation Rule Outcomes
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div style={{ background: "rgba(52,168,83,0.1)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(52,168,83,0.2)" }}>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#34A853" }}>{displayMetrics.validationResults.passed}</div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#34A853" }}>Passed Validations</div>
                                    </div>

                                    <div style={{ background: "rgba(234,67,53,0.1)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(234,67,53,0.2)" }}>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#EA4335" }}>{displayMetrics.validationResults.failed}</div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#EA4335" }}>Failed Validations</div>
                                    </div>

                                    <div style={{ background: "rgba(245,158,11,0.1)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.2)" }}>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#F59E0B" }}>{displayMetrics.validationResults.missingInfo}</div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#F59E0B" }}>Missing Info Slots</div>
                                    </div>

                                    <div style={{ background: "rgba(59,130,246,0.1)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(59,130,246,0.2)" }}>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#3B82F6" }}>{displayMetrics.validationResults.mismatchedInfo}</div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#3B82F6" }}>Mismatched Data</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* 7 & 8. RISK PATTERNS & LATENCY BREAKDOWN */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            
                            {/* Risk Category Distribution */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <ShieldAlert size={18} color={colors.pillBg} /> Risk Pattern Distribution
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                        <div style={{ background: "rgba(52,168,83,0.1)", padding: "14px", borderRadius: "12px", textAlign: "center", cursor: "pointer" }} onClick={() => setSelectedRisk("LOW")}>
                                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#34A853" }}>{displayMetrics.riskCategoryDistribution.lowRisk}</div>
                                            <div style={{ fontSize: "12px", color: "#34A853", fontWeight: 700 }}>Low Risk</div>
                                        </div>

                                        <div style={{ background: "rgba(245,158,11,0.1)", padding: "14px", borderRadius: "12px", textAlign: "center", cursor: "pointer" }} onClick={() => setSelectedRisk("MEDIUM")}>
                                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#F59E0B" }}>{displayMetrics.riskCategoryDistribution.mediumRisk}</div>
                                            <div style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700 }}>Medium Risk</div>
                                        </div>

                                        <div style={{ background: "rgba(234,67,53,0.1)", padding: "14px", borderRadius: "12px", textAlign: "center", cursor: "pointer" }} onClick={() => setSelectedRisk("HIGH")}>
                                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#EA4335" }}>{displayMetrics.riskCategoryDistribution.highRisk}</div>
                                            <div style={{ fontSize: "12px", color: "#EA4335", fontWeight: 700 }}>High Risk</div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "12px", background: theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: "10px", fontSize: "13px", color: colors.faint }}>
                                        💡 <em>Note: Risk categories highlight document processing anomalies and extraction variances for quality assurance.</em>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Time Breakdown */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Clock size={18} color={colors.pillBg} /> Average Processing Latency Breakdown
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    {[
                                        { stage: "Total End-to-End Pipeline", time: `${displayMetrics.processingTimes.avgTotal}s`, pct: 100, color: colors.pillBg },
                                        { stage: "OCR Engine Processing", time: `${displayMetrics.processingTimes.avgOCR}s`, pct: 24, color: "#3B82F6" },
                                        { stage: "Information Extraction (LLM)", time: `${displayMetrics.processingTimes.avgExtraction}s`, pct: 26, color: "#8B5CF6" },
                                        { stage: "Validation & Cross-Doc Rules", time: `${displayMetrics.processingTimes.avgValidation}s`, pct: 18, color: "#EC4899" },
                                        { stage: "Manual Underwriter Review", time: `${displayMetrics.processingTimes.avgReview}s`, pct: 32, color: "#F59E0B" },
                                    ].map((stg, i) => (
                                        <div key={i}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                                <span style={{ color: colors.bubbleText }}>{stg.stage}</span>
                                                <span style={{ color: colors.faint }}>{stg.time}</span>
                                            </div>
                                            <div style={{ height: "8px", background: "rgba(0,0,0,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${stg.pct}%`, height: "100%", background: stg.color, borderRadius: "4px" }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* 9. MANUAL REVIEW ANALYTICS */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertTriangle size={18} color="#F59E0B" /> Manual Review Analytics
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ padding: "14px", background: theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: "10px", border: `1px solid ${colors.panelBorder}` }}>
                                        <div style={{ fontSize: "12px", color: colors.faint }}>Total Flagged Reviews</div>
                                        <div style={{ fontSize: "22px", fontWeight: 800, color: colors.bubbleText }}>{displayMetrics.manualReviewAnalytics.totalRequired}</div>
                                    </div>
                                    <div style={{ padding: "14px", background: "rgba(245,158,11,0.08)", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>
                                        <div style={{ fontSize: "12px", color: "#F59E0B" }}>Average Review Duration</div>
                                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#F59E0B" }}>{displayMetrics.manualReviewAnalytics.avgReviewMinutes} mins</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: colors.faint, marginBottom: "12px" }}>MOST COMMON REVIEW REASONS</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {displayMetrics.manualReviewAnalytics.topReasons.map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", padding: "10px 14px", background: theme === 'dark' ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderRadius: "8px", border: `1px solid ${colors.panelBorder}` }}>
                                                <span style={{ fontSize: "13px", fontWeight: 600, color: colors.bubbleText, flex: 1 }}>{item.reason}</span>
                                                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", background: `${colors.pillBg}20`, color: colors.pillBg, borderRadius: "6px" }}>{item.count} cases</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 10. RECENT PROCESSING ACTIVITY TABLE */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: colors.bubbleText, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Activity size={18} color={colors.pillBg} /> Recent Document Processing Activity
                                </h3>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ position: "relative" }}>
                                        <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: colors.faint }} />
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search Application ID, Type..."
                                            style={{
                                                padding: "8px 12px 8px 32px", borderRadius: "8px", border: `1px solid ${colors.panelBorder}`,
                                                background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#FFFFFF", color: colors.bubbleText,
                                                fontSize: "13px", fontFamily: FONT, outline: "none", width: "220px"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${colors.panelBorder}` }}>
                                            <th style={{ padding: "12px 14px", color: colors.faint, cursor: "pointer" }} onClick={() => handleSort("id")}>
                                                App ID <ArrowUpDown size={12} />
                                            </th>
                                            <th style={{ padding: "12px 14px", color: colors.faint, cursor: "pointer" }} onClick={() => handleSort("documentType")}>
                                                Document Type <ArrowUpDown size={12} />
                                            </th>
                                            <th style={{ padding: "12px 14px", color: colors.faint }}>AI Agent Used</th>
                                            <th style={{ padding: "12px 14px", color: colors.faint }}>Status</th>
                                            <th style={{ padding: "12px 14px", color: colors.faint }}>Confidence</th>
                                            <th style={{ padding: "12px 14px", color: colors.faint }}>Risk Category</th>
                                            <th style={{ padding: "12px 14px", color: colors.faint }}>Latency</th>
                                            <th style={{ padding: "12px 14px", color: colors.faint, textAlign: "right" }}>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ padding: "32px", textAlign: "center", color: colors.faint }}>
                                                    No activity items match the active search and filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedActivities.map((act, idx) => (
                                                <tr key={idx} style={{ borderBottom: idx < paginatedActivities.length - 1 ? `1px solid ${colors.panelBorder}` : "none" }}>
                                                    <td style={{ padding: "12px 14px", fontWeight: 700, color: colors.bubbleText }}>{act.id}</td>
                                                    <td style={{ padding: "12px 14px", color: colors.faint }}>{act.documentType}</td>
                                                    <td style={{ padding: "12px 14px", color: colors.bubbleText, fontWeight: 500 }}>{act.agentUsed}</td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, background: act.status === "COMPLETED" ? "rgba(52,168,83,0.12)" : (act.status === "FAILED" ? "rgba(234,67,53,0.12)" : "rgba(245,158,11,0.12)"), color: act.status === "COMPLETED" ? "#34A853" : (act.status === "FAILED" ? "#EA4335" : "#F59E0B") }}>
                                                            {act.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px", fontWeight: 700, color: colors.bubbleText }}>{act.confidenceScore}</td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{ fontWeight: 700, fontSize: "12px", color: act.riskCategory === "HIGH" ? "#EA4335" : (act.riskCategory === "MEDIUM" ? "#F59E0B" : "#34A853") }}>
                                                            {act.riskCategory}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px", color: colors.faint }}>{act.processingTimeSec}</td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right", color: colors.faint, fontSize: "12px" }}>
                                                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${colors.panelBorder}` }}>
                                    <div style={{ fontSize: "12px", color: colors.faint }}>
                                        Showing page {currentPage} of {totalPages} ({filteredActivities.length} total entries)
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${colors.panelBorder}`, background: "transparent", color: colors.bubbleText, fontSize: "12px", fontWeight: 600, cursor: currentPage === 1 ? "default" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
                                        >
                                            Previous
                                        </button>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${colors.panelBorder}`, background: "transparent", color: colors.bubbleText, fontSize: "12px", fontWeight: 600, cursor: currentPage === totalPages ? "default" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </>
                )}

            </main>
        </div>
    );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LogOut, Moon, Sun, AlertCircle, FileText, CheckCircle, 
    XCircle, Clock, ShieldAlert, ChevronRight, Download, Eye
} from "lucide-react";
import MASCOT_IMG from "./mascot-clean.png";
import { Mascot } from "./mascot-login-flow";

const FONT = `"Sen", ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function EmployeeDashboard({ colors, theme, toggleTheme, onSignOut, onStartProcessing }) {
    const [applications, setApplications] = useState([]);
    
    // Cursor glow effect for dot background
    const glowRef = useRef(null);
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || ('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;

        function onPointerMove(e) {
            if (glowRef.current) {
                glowRef.current.style.setProperty('--glow-x', `${e.clientX}px`);
                glowRef.current.style.setProperty('--glow-y', `${e.clientY}px`);
            }
        }
        window.addEventListener("pointermove", onPointerMove);
        return () => window.removeEventListener("pointermove", onPointerMove);
    }, []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("All");
    const [selectedAppId, setSelectedAppId] = useState(null);

    const [managerAnalytics, setManagerAnalytics] = useState(null);
    const [selectedAppDetails, setSelectedAppDetails] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE_URL}/api/applications`, { headers });
            if (!response.ok) {
                throw new Error("Failed to fetch applications.");
            }
            const data = await response.json();
            setApplications(data.applications || []);

            const sessionUser = JSON.parse(localStorage.getItem('demo_session') || '{}');
            if (sessionUser.role === 'BANK_MANAGER') {
                try {
                    const mgrRes = await fetch(`${API_BASE_URL}/api/manager/dashboard/summary`, { headers });
                    if (mgrRes.ok) {
                        const mgrData = await mgrRes.json();
                        setManagerAnalytics(mgrData);
                    }
                } catch (_) {}
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAppId) {
            const fetchDetails = async () => {
                const token = localStorage.getItem('auth_token');
                const headers = token ? { "Authorization": `Bearer ${token}` } : {};
                try {
                    const [appRes, extRes, valRes, crossRes, riskRes, repRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}`, { headers }).then(r => r.ok ? r.json() : null),
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}/extractions`, { headers }).then(r => r.ok ? r.json() : null),
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}/validation`, { headers }).then(r => r.ok ? r.json() : null),
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}/cross-document`, { headers }).then(r => r.ok ? r.json() : null),
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}/risk`, { headers }).then(r => r.ok ? r.json() : null),
                        fetch(`${API_BASE_URL}/api/applications/${selectedAppId}/report`, { headers }).then(r => r.ok ? r.json() : null),
                    ]);
                    setSelectedAppDetails({
                        app: appRes,
                        extractions: extRes?.extraction_results || [],
                        validation: valRes?.validation_results || [],
                        crossDoc: crossRes || {},
                        risk: riskRes || {},
                        report: repRes || {}
                    });
                } catch (e) {
                    console.error("Error fetching single application details:", e);
                }
            };
            fetchDetails();
        } else {
            setSelectedAppDetails(null);
        }
    }, [selectedAppId]);

    const downloadReport = async (appId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${appId}/report/pdf`);
            if (!response.ok) throw new Error("Failed to generate PDF report");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `employee_review_report_${appId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSignOut = () => {
        onSignOut();
    };

    // Derived Summary stats (if we had data)
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING_REVIEW').length,
        highRisk: applications.filter(a => a.riskLevel === 'HIGH').length,
        approved: applications.filter(a => a.decision === 'APPROVED').length,
        rejected: applications.filter(a => a.decision === 'REJECTED').length,
    };

    const filteredApps = applications.filter(app => {
        if (filter === "All") return true;
        if (filter === "Pending Review") return app.status === "PENDING_REVIEW";
        if (filter === "High Risk") return app.riskLevel === "HIGH";
        if (filter === "Approved") return app.decision === "APPROVED";
        if (filter === "Rejected") return app.decision === "REJECTED";
        return true;
    });

    if (selectedAppId) {
        const appInfo = applications.find(a => a.application_id === selectedAppId) || { application_id: selectedAppId };
        
        const app = selectedAppDetails?.app || appInfo;
        const extracted = selectedAppDetails?.extractions || appInfo.extraction_results || [];
        const risk = selectedAppDetails?.risk || appInfo.risk_assessment_results || {};
        const finalReport = selectedAppDetails?.report || appInfo.final_report_results || {};
        const validation = selectedAppDetails?.validation || appInfo.validation_results || [];
        
        const applicantName = extracted.find(e => e.fields?.applicant_name?.value)?.fields?.applicant_name?.value || app.applicant_name || "Not available";
        const monthlyIncome = extracted.find(e => e.fields?.net_salary?.value)?.fields?.net_salary?.value || "Not available";
        const employer = extracted.find(e => e.fields?.employer_name?.value)?.fields?.employer_name?.value || "Not available";
        const bankBalance = extracted.find(e => e.fields?.closing_balance?.value)?.fields?.closing_balance?.value || "Not available";
        const panNumber = extracted.find(e => e.fields?.pan_number?.value)?.fields?.pan_number?.value || "Not available";
        const address = extracted.find(e => e.fields?.address?.value)?.fields?.address?.value || "Not available";

        return (
            <div style={{ fontFamily: FONT, background: colors.bgBottom, color: colors.bubbleText, minHeight: "100vh", padding: "24px" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <button 
                        onClick={() => setSelectedAppId(null)}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: colors.faint, cursor: "pointer", fontFamily: FONT, fontSize: 16, fontWeight: 600 }}
                    >
                        ← Back to Queue
                    </button>
                    <div style={{ display: "flex", gap: 16 }}>
                        <button 
                            onClick={() => downloadReport(app.application_id || selectedAppId)}
                            style={{ display: "flex", alignItems: "center", gap: 8, background: colors.pillBg, color: "white", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}
                        >
                            <Download size={16} /> Download Report
                        </button>
                    </div>
                 </div>

                 <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200, margin: "0 auto" }}>

                    {/* 6. Application Review Summary */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h2 style={{ margin: "0 0 24px 0", fontSize: 24 }}>Application {app.application_id}</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div><strong>Loan Type:</strong> {app.loan_type || "Not available"}</div>
                            <div><strong>Processing Status:</strong> {app.status || "Not available"}</div>
                            <div><strong>Risk Score:</strong> {risk.risk_score !== undefined ? risk.risk_score : "Not available"}</div>
                            <div><strong>Risk Level:</strong> {risk.risk_level || "Not available"}</div>
                            <div style={{ gridColumn: "span 2" }}><strong>Decision Reason:</strong> {finalReport.decision_reason || "Not available"}</div>
                            <div style={{ gridColumn: "span 2" }}><strong>Executive Summary:</strong> {finalReport.executive_summary || "Not available"}</div>
                        </div>
                    </div>

                    {/* 7. Document Verification */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Document Verification</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {app.classification_results?.length > 0 ? app.classification_results.map((doc, i) => (
                                <div key={i} style={{ padding: 16, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{doc.file_name || "Unknown Document"}</div>
                                        <div style={{ fontSize: 13, color: colors.faint }}>Expected: {doc.expected_type || "Any"} | Detected: {doc.document_type || "Unknown"}</div>
                                    </div>
                                    <div style={{ color: doc.status === "success" ? "#10B981" : doc.status === "needs_review" ? "#D97706" : "#EF4444", fontWeight: 700 }}>
                                        {doc.status === "success" ? "Accepted" : doc.status === "needs_review" ? "Needs Review" : "Rejected"}
                                    </div>
                                </div>
                            )) : <div style={{ color: colors.faint }}>Not available</div>}
                        </div>
                    </div>

                    {/* 8. Six AI Agents */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>AI Agent Processing Status</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {["01 Document Classification", "02 Information Extraction", "03 Validation", "04 Cross-Document Verification", "05 Risk & Anomaly Assessment", "06 Final Report"].map(agent => (
                                <div key={agent} style={{ padding: 12, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: 600 }}>{agent}</span>
                                    <span style={{ color: app.status === "COMPLETED" ? "#10B981" : colors.faint }}>
                                        {app.status === "COMPLETED" ? "Completed" : "Pending / Not available"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 9. Extracted Information */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Extracted Information</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div><strong>Applicant Name:</strong> {applicantName}</div>
                            <div><strong>Monthly Income:</strong> {monthlyIncome}</div>
                            <div><strong>Employer:</strong> {employer}</div>
                            <div><strong>Bank Balance:</strong> {bankBalance}</div>
                            <div><strong>PAN:</strong> {panNumber}</div>
                            <div><strong>Address:</strong> {address}</div>
                        </div>
                    </div>

                    {/* 10. Risk & Anomaly Assessment */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Risk & Anomaly Assessment</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div><strong>Risk Score:</strong> {risk.risk_score !== undefined ? risk.risk_score : "Not available"}</div>
                            <div><strong>Risk Level:</strong> {risk.risk_level || "Not available"}</div>
                            <div><strong>Human Review Required:</strong> {finalReport.review_required ? "YES" : "NO"}</div>
                            <div>
                                <strong>Anomalies Detected:</strong>
                                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: colors.faint }}>
                                    {risk.anomalies?.length > 0 ? risk.anomalies.map((a, i) => <li key={i}>{a.description || a}</li>) : <li>None / Not available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 11. Final Report */}
                    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "32px", backdropFilter: "blur(8px)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Final Report</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <strong>Final Decision:</strong> 
                                <span style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 4, background: finalReport.decision === "APPROVED" ? "#10B981" : finalReport.decision === "REJECTED" ? "#EF4444" : colors.faint, color: "white", fontWeight: 700 }}>
                                    {finalReport.decision || "Not available"}
                                </span>
                            </div>
                            <div><strong>Executive Summary:</strong> <br/><span style={{ color: colors.faint }}>{finalReport.executive_summary || "Not available"}</span></div>
                            <div>
                                <strong>Key Findings:</strong>
                                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: colors.faint }}>
                                    {finalReport.key_findings?.length > 0 ? finalReport.key_findings.map((k, i) => <li key={i}>{k}</li>) : <li>Not available</li>}
                                </ul>
                            </div>
                            <div>
                                <strong>Actionable Recommendations:</strong>
                                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: colors.faint }}>
                                    {finalReport.recommendations?.length > 0 ? finalReport.recommendations.map((r, i) => <li key={i}>{r}</li>) : <li>Not available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>

                 </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: FONT, color: colors.bubbleText, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
            
            {/* Atmospheric Theme-Aware Background */}
            <div style={{ position: "fixed", top: -100, bottom: -100, left: "-100px", width: "100vw", zIndex: -1, background: `linear-gradient(180deg, ${colors.bgTop} 0%, ${colors.bgBottom} 100%)`, overflow: "hidden", pointerEvents: "none" }}>
                {/* Dotted pattern (static base) */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${colors.dot} 1.5px, transparent 1.5px)`, backgroundSize: "32px 32px", opacity: 0.7 }} />
                
                {/* Cursor glow overlay – brighter dots near cursor */}
                <div 
                    ref={glowRef}
                    style={{ 
                        position: "absolute", inset: 0, 
                        backgroundImage: `radial-gradient(${theme === 'dark' ? 'rgba(148,163,184,0.9)' : 'rgba(59,130,246,0.7)'} 1.5px, transparent 1.5px)`, 
                        backgroundSize: "32px 32px",
                        maskImage: `radial-gradient(circle 180px at var(--glow-x, -200px) var(--glow-y, -200px), black 0%, transparent 100%)`,
                        WebkitMaskImage: `radial-gradient(circle 180px at var(--glow-x, -200px) var(--glow-y, -200px), black 0%, transparent 100%)`,
                        pointerEvents: "none",
                        transition: "none",
                    }} 
                />
                
                {/* Large Soft Clouds */}
                <div style={{ position: "absolute", top: "10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(76,140,232,0.08) 0%, transparent 60%)", filter: "blur(100px)" }} />
                <div style={{ position: "absolute", top: "20%", right: "-5%", width: "50%", height: "40%", background: "radial-gradient(circle, rgba(76,140,232,0.06) 0%, transparent 60%)", filter: "blur(120px)" }} />
                <div style={{ position: "absolute", top: "50%", left: "30%", width: "30%", height: "30%", background: "radial-gradient(circle, rgba(76,140,232,0.05) 0%, transparent 60%)", filter: "blur(90px)" }} />
            </div>

            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: `1px solid ${colors.panelBorder}`, background: colors.panelBg, backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: colors.pillBg, color: "white", padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>ADMIN</div>
                    <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Loan Document Processing Agent</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={toggleTheme} style={{ background: "transparent", border: "none", color: colors.faint, cursor: "pointer", display: "flex" }}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={handleSignOut} style={{ background: "transparent", border: "none", color: colors.faint, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontWeight: 600 }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, padding: "32px", maxWidth: 1400, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Welcome & Action Section 50/50 Split */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Left: Application Review Center */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24, background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 20, padding: "32px", position: "relative", overflow: "hidden" }}>
                        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <motion.div layoutId="employee-shared-mascot" transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                                <Mascot size={42} mood="neutral" />
                            </motion.div>
                        </div>
                        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 800 }}>Application Review Center</h2>
                            <p style={{ margin: 0, color: colors.faint, fontSize: 15, lineHeight: 1.5 }}>
                                Review AI-processed loan applications and cases requiring human attention.
                            </p>
                            <div style={{ background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: 12, marginTop: 16, display: "inline-block", fontStyle: "italic", fontSize: 13, alignSelf: "flex-start", position: "relative" }}>
                                {/* Speech bubble pointer */}
                                <div style={{ position: "absolute", top: "50%", left: -6, marginTop: -6, width: 12, height: 12, background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", transform: "rotate(45deg)" }} />
                                <span style={{ position: "relative", zIndex: 1 }}>"I've reviewed the applications. I'll highlight anything that needs your attention."</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Loan Processing */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 20, padding: "32px", position: "relative", overflow: "hidden" }}>
                        <h2 style={{ margin: "0 0 12px 0", fontSize: 24, fontWeight: 800 }}>Loan Processing</h2>
                        <p style={{ margin: "0 0 24px 0", color: colors.faint, fontSize: 15, lineHeight: 1.5 }}>
                            Start a new loan application processing session on behalf of a user. Upload required documents and run the AI analysis.
                        </p>
                        <button 
                            onClick={onStartProcessing}
                            style={{ 
                                alignSelf: "flex-start",
                                background: colors.pillBg, 
                                color: "white", 
                                border: "none", 
                                padding: "14px 24px", 
                                borderRadius: 12, 
                                fontSize: 16, 
                                fontWeight: 700, 
                                cursor: "pointer", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 8,
                                fontFamily: FONT,
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            Start Loan Processing <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Error Notice if endpoint is missing */}
                {missingEndpoint && (
                    <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "16px", borderRadius: 16, color: "#D97706", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong>Backend Endpoint Missing:</strong> The application queue endpoint (<code>/api/admin/applications</code>) does not exist in the current backend. 
                            The structure below is functional, but currently shows zero applications because it cannot fetch real data. 
                            To view a functional review flow, this endpoint must be implemented.
                        </div>
                    </div>
                )}
                {error && !missingEndpoint && (
                    <div style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", padding: "16px", borderRadius: 16, color: "#EA4335", display: "flex", gap: 12 }}>
                        <AlertCircle size={20} />
                        <div><strong>Error loading applications:</strong> {error}</div>
                    </div>
                )}

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                        { label: "TOTAL APPLICATIONS", value: stats.total, icon: FileText, color: colors.accent },
                        { label: "PENDING REVIEW", value: stats.pending, icon: Clock, color: "#D97706" },
                        { label: "HIGH RISK", value: stats.highRisk, icon: ShieldAlert, color: "#EA4335" },
                        { label: "APPROVED", value: stats.approved, icon: CheckCircle, color: "#10B981" },
                        { label: "REJECTED", value: stats.rejected, icon: XCircle, color: "#EF4444" }
                    ].map((stat, i) => (
                        <div key={i} style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: colors.faint, letterSpacing: 1 }}>{stat.label}</span>
                                <stat.icon size={18} color={stat.color} />
                            </div>
                            <span style={{ fontSize: 32, fontWeight: 800 }}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                {/* Queue Table */}
                <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "20px", borderBottom: `1px solid ${colors.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Loan Applications</h3>
                        <div style={{ display: "flex", gap: 8 }}>
                            {["All", "Pending Review", "High Risk", "Approved", "Rejected"].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{ 
                                        background: filter === f ? colors.pillBg : "transparent",
                                        color: filter === f ? "white" : colors.faint,
                                        border: filter === f ? "none" : `1px solid ${colors.panelBorder}`,
                                        padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        cursor: "pointer", fontFamily: FONT, transition: "all 0.2s ease"
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: theme === 'dark' ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>Application ID</th>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>Loan Type</th>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>Document Status</th>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>AI Decision</th>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>Risk Level</th>
                                    <th style={{ padding: "16px 20px", fontSize: 13, color: colors.faint, fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ padding: "32px", textAlign: "center", color: colors.faint }}>Loading applications...</td></tr>
                                ) : filteredApps.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: "48px", textAlign: "center", color: colors.faint }}>No applications found.</td></tr>
                                ) : (
                                    filteredApps.map(app => (
                                        <tr key={app.application_id} style={{ borderTop: `1px solid ${colors.panelBorder}` }}>
                                            <td style={{ padding: "16px 20px", fontWeight: 600 }}>{app.application_id}</td>
                                            <td style={{ padding: "16px 20px", color: colors.faint }}>{app.loan_type}</td>
                                            <td style={{ padding: "16px 20px" }}>{app.document_status}</td>
                                            <td style={{ padding: "16px 20px" }}>{app.decision}</td>
                                            <td style={{ padding: "16px 20px" }}>{app.riskLevel}</td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <button 
                                                    onClick={() => setSelectedAppId(app.application_id)}
                                                    style={{ background: colors.accent, color: colors.bgTop, border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                                >
                                                    <Eye size={14} /> Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

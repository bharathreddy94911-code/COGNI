import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "./apiService";
import {
  Search, Bell, Settings, User, FileText, CheckCircle,
  AlertTriangle, ShieldAlert, CreditCard, Briefcase, Building, 
  Home, GraduationCap, Car, Coins, Tractor, Moon, Sun, X, ArrowRight,
  Upload, Check, RefreshCw, Trash2, Cpu, File, AlertCircle, ShoppingBag, Tv, Wallet, Plane, Triangle,
  Layers, XCircle, Download, LogOut
} from "lucide-react";
import { Mascot } from "./mascot-login-flow";


const ContextualMascot = ({ message, type = "normal", colors }) => {
    if (!message) return null;
    return (
        <>
        <style>{`
            .mascot-fixed-container {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                position: fixed;
                top: 90px;
                left: 40px;
                z-index: 40;
                flex-direction: row;
                pointer-events: none;
            }
            .mascot-fixed-container > * {
                pointer-events: auto;
            }
            .mascot-speech-bubble {
                width: max-content;
                max-width: 340px;
            }
            @media (max-width: 1366px) {
                .mascot-fixed-container {
                    left: 20px;
                }
                .mascot-speech-bubble {
                    max-width: 260px;
                }
            }
        `}</style>
        <div className="mascot-fixed-container">
            {/* Mascot */}
            <div style={{ flexShrink: 0 }}>
                <Mascot mood={type === "error" ? "sad" : (type === "success" ? "happy" : "neutral")} size={64} />
            </div>
            
            {/* Speech Bubble */}
            <div className="mascot-speech-bubble" style={{
                position: "relative",
                background: type === "error" ? "rgba(234,67,53,0.15)" : (type === "success" ? "rgba(52,168,83,0.15)" : colors.bubbleBg),
                border: `1px solid ${type === "error" ? "rgba(234,67,53,0.3)" : (type === "success" ? "rgba(52,168,83,0.3)" : colors.panelBorder)}`,
                padding: "16px 20px", 
                borderRadius: "16px", 
                color: colors.bubbleText, 
                fontSize: "16px", 
                fontWeight: 600, 
                lineHeight: 1.5,
                boxShadow: "0 8px 32px rgba(0,0,0,0.05)"
            }}>
                {message}
                <div style={{
                    position: "absolute", top: "50%", left: "-7px", marginTop: "-7px", width: "14px", height: "14px",
                    background: type === "error" ? "rgba(234,67,53,0.15)" : (type === "success" ? "rgba(52,168,83,0.15)" : colors.bubbleBg),
                    borderBottom: `1px solid ${type === "error" ? "rgba(234,67,53,0.3)" : (type === "success" ? "rgba(52,168,83,0.3)" : colors.panelBorder)}`,
                    borderLeft: `1px solid ${type === "error" ? "rgba(234,67,53,0.3)" : (type === "success" ? "rgba(52,168,83,0.3)" : colors.panelBorder)}`,
                    clipPath: "polygon(0 0, 0 100%, 100% 100%)",
                    transform: "rotate(45deg)"
                }} />
            </div>
        </div>
        </>
    );
};

export default function Dashboard({ colors, theme, toggleTheme, onSignOut, isEmployee }) {
  // --- Persistent State ---
  const [currentPage, setCurrentPage] = useState(() => {
      const page = localStorage.getItem('currentPage') || 'LOAN_SELECTION';
      if (page === 'FINAL_ANALYSIS') {
          try {
              const stored = JSON.parse(localStorage.getItem('analysisResults'));
              if (!stored || !stored.riskSummary) return 'LOAN_SELECTION';
          } catch { return 'LOAN_SELECTION'; }
      }
      return page;
  }); 
  const [selectedLoanType, setSelectedLoanType] = useState(() => localStorage.getItem('selectedLoanType') || null);
  const [docStatuses, setDocStatuses] = useState(() => JSON.parse(localStorage.getItem('docStatuses')) || {}); 
  const [analysisResults, setAnalysisResults] = useState(() => {
      try {
          const stored = JSON.parse(localStorage.getItem('analysisResults'));
          if (stored && !stored.riskSummary) return null; // Invalidate old cached schema
          return stored || null;
      } catch { return null; }
  });
  const [applicationId, setApplicationId] = useState(() => localStorage.getItem('applicationId') || null);

  // --- Ephemeral State ---
  const [loanTypes, setLoanTypes] = useState([]);
  const [reqDocs, setReqDocs] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null); // Reference ID
  
  const scrollRef = useRef(null);
  const uploadControllersRef = useRef({});

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTo(0, 0);
      }
  }, [currentPage]);

  // --- Effects for Persistence ---
  useEffect(() => { localStorage.setItem('currentPage', currentPage); }, [currentPage]);
  useEffect(() => { localStorage.setItem('selectedLoanType', selectedLoanType || ''); }, [selectedLoanType]);
  useEffect(() => { localStorage.setItem('docStatuses', JSON.stringify(docStatuses)); }, [docStatuses]);
  useEffect(() => { localStorage.setItem('analysisResults', JSON.stringify(analysisResults)); }, [analysisResults]);
  useEffect(() => { localStorage.setItem('applicationId', applicationId || ''); }, [applicationId]);

  // --- Initial Data Loading ---
  useEffect(() => {
      apiService.fetchLoanTypes()
          .then(setLoanTypes)
          .catch(err => console.error("Failed to fetch loan types:", err));
  }, []);

  useEffect(() => {
      if (selectedLoanType) {
          apiService.fetchLoanRequirements(selectedLoanType)
              .then(setReqDocs)
              .catch(err => console.error("Failed to fetch loan requirements:", err));
      }
  }, [selectedLoanType]);

  // --- Handlers ---
  const handleLoanSelect = async (loanId) => {
      try {
          const res = await apiService.createApplication(loanId);
          setApplicationId(res.application_id);
          setSelectedLoanType(loanId);
          setDocStatuses({});
          setCurrentPage('DOCUMENT_UPLOAD');
      } catch (err) {
          console.error(err);
          alert("Failed to create application session.");
      }
  };

  
  const handleFileUpload = async (docId, fileList) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      const filesArray = Array.from(fileList).map(f => ({ name: f.name, type: f.type }));
      
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'].includes(ext)) {
          setDocStatuses(prev => ({
              ...prev,
              [docId]: { files: filesArray, status: 'unsupported_type', error: 'Unsupported file type' }
          }));
          return;
      }

      // Phase 5: Cancel in-flight upload for this slot to prevent race conditions
      if (uploadControllersRef.current[docId]) {
          uploadControllersRef.current[docId].abort();
      }

      const controller = new AbortController();
      uploadControllersRef.current[docId] = controller;

      // Phase 5: Reset slot state before uploading
      setDocStatuses(prev => ({
          ...prev,
          [docId]: { files: filesArray, status: 'uploading', error: null, slotData: null, detectedType: null, confidence: null, request_id: null }
      }));

      try {
          const data = await apiService.uploadDocument(file, docId, applicationId, controller.signal);
          
          if (uploadControllersRef.current[docId] !== controller) {
              return; // Superseded request
          }

          if (data && data.slot) {
              const status = data.slot.status;
              const agentId = data.agent_id || data.agent_result?.agentId || data.slot?.agent_id;
              const agentName = data.agent_name || data.agent_result?.agentName || data.slot?.agent_name;
              const confidenceVal = data.confidence || data.agent_result?.confidenceScore || data.slot?.confidence;
              const reqId = data.request_id || data.agent_result?.requestId;

              if (status === 'accepted') {
                  setDocStatuses(prev => ({
                      ...prev,
                      [docId]: {
                          files: filesArray,
                          status: 'accepted',
                          error: null,
                          slotData: data.slot,
                          request_id: reqId,
                          confidence: confidenceVal,
                          agent_id: agentId,
                          agent_name: agentName,
                          agent_result: data.agent_result
                      }
                  }));
              } else if (status === 'wrong_document') {
                  setDocStatuses(prev => ({
                      ...prev,
                      [docId]: {
                          files: filesArray,
                          status: 'wrong_document',
                          error: data.slot.error || data.agent_result?.message || 'Document type mismatch',
                          slotData: data.slot,
                          request_id: reqId,
                          agent_id: agentId,
                          agent_name: agentName,
                          agent_result: data.agent_result
                      }
                  }));
              } else {
                  setDocStatuses(prev => ({
                      ...prev,
                      [docId]: { files: filesArray, status: 'error', error: data.slot.error || 'Upload failed', request_id: reqId }
                  }));
              }
          } else {
              setDocStatuses(prev => ({
                  ...prev,
                  [docId]: {
                      files: filesArray,
                      status: 'accepted',
                      error: null,
                      request_id: data.request_id || data.agent_result?.requestId,
                      agent_id: data.agent_id || data.agent_result?.agentId,
                      agent_name: data.agent_name || data.agent_result?.agentName,
                      agent_result: data.agent_result
                  }
              }));
          }
      } catch (err) {
          if (err.name === 'AbortError') {
              console.log(`[Upload Aborted] Slot '${docId}' superseded by newer upload.`);
              return;
          }
          if (uploadControllersRef.current[docId] === controller) {
              setDocStatuses(prev => ({
                  ...prev,
                  [docId]: { files: filesArray, status: 'error', error: err.message }
              }));
          }
      }
  };

  const removeDocument = (docId) => {
      setDocStatuses(prev => {
          const newState = { ...prev };
          delete newState[docId];
          return newState;
      });
  };

  const startAnalysis = () => {
      setCurrentPage('AI_PROCESSING');
  };

  const handleAnalysisComplete = (mappedResults) => {
      setAnalysisResults(mappedResults);
      setCurrentPage('FINAL_ANALYSIS');
  };

  const handleSubmitApplication = async () => {
      setIsSubmitting(true);
      try {
          const res = await apiService.submitApplication(applicationId || `APP-${Date.now()}`);
          setSubmitSuccess(res.referenceId);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleStartNew = () => {
      setSubmitSuccess(null);
      setAnalysisResults(null);
      setDocStatuses({});
      setSelectedLoanType(null);
      setApplicationId(null);
      setCurrentPage('LOAN_SELECTION');
  };

  const confirmLogout = () => {
      localStorage.removeItem('currentPage');
      localStorage.removeItem('selectedLoanType');
      localStorage.removeItem('docStatuses');
      localStorage.removeItem('analysisResults');
      localStorage.removeItem('applicationId');
      onSignOut();
  };

  const requiredDocs = reqDocs.filter(doc => doc.required);
  const allRequiredUploaded = requiredDocs.every(doc => docStatuses[doc.id]?.status === 'accepted');

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const getIconForLoan = (id) => {
      const map = { personal: User, home: Home, education: GraduationCap, vehicle: Car, business: Briefcase, gold: Coins, agriculture: Tractor, lap: Building, lafd: Wallet, consumer_durable: Tv };
      return map[id] || Briefcase;
  };

  
    
    // Calculate dynamic mascot message inside Dashboard
    let mascotMessage = "Choose a loan type to get started.";
    let mascotType = "normal";
    
    if (currentPage === 'LOAN_SELECTION') {
        mascotMessage = "Choose a loan type to get started.";
    } else if (currentPage === 'DOCUMENT_UPLOAD') {
        mascotMessage = "Upload the required documents and I'll verify each one.";
        const statuses = Object.values(docStatuses).map(s => s.status);
        if (statuses.includes('uploading')) {
            mascotMessage = "I'm checking your document...";
        } else if (statuses.includes('wrong_document')) {
            mascotType = "error";
            const wrongObj = Object.values(docStatuses).find(s => s.status === 'wrong_document');
            if (wrongObj && wrongObj.slotData && wrongObj.slotData.detected_document_type) {
                const detected = wrongObj.slotData.detected_document_type.replace('_', ' ');
                mascotMessage = `⚠ You uploaded a ${detected}, but this slot requires something else.`;
            } else {
                mascotMessage = "⚠ This doesn't match the required document type.";
            }
        } else if (statuses.includes('unsupported_type')) {
            mascotType = "error";
            mascotMessage = "Please upload a PDF, DOC, or DOCX document.";
        } else if (statuses.includes('error')) {
            mascotType = "error";
            mascotMessage = "⚠ An error occurred during verification.";
        } else if (allRequiredUploaded && requiredDocs.length > 0) {
            mascotType = "success";
            mascotMessage = "✓ All required documents are ready. You can start the analysis.";
        } else if (statuses.includes('accepted')) {
            mascotType = "success";
            mascotMessage = "✓ Document accepted.";
        }
    } else if (currentPage === 'AI_PROCESSING') {
        mascotMessage = "Six AI agents are processing your application.";
    } else if (currentPage === 'FINAL_ANALYSIS') {
        mascotType = "success";
        mascotMessage = "✓ Analysis complete. Your results are ready.";
    }

    return (
        <div ref={scrollRef} style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>

      
      {/* Fixed Top Navigation */}
      <div style={{
        position: "sticky", top: 0, zIndex: 999999, background: colors.panelBg,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.panelBorder}`, padding: "16px 24px 16px 100px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: colors.bubbleText }}>
          Loan Document Processing Agent
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Search and Bell removed as per requirement */}
          <button onClick={toggleTheme} style={iconBtnStyle(colors)} title="Toggle Theme">
             {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          {/* User Profile Avatar Logo & Modal */}
          {(() => {
              const currentUser = JSON.parse(localStorage.getItem('demo_session') || '{}');
              const authData = JSON.parse(localStorage.getItem('mascot_authData') || '{}');
              const isEmp = isEmployee || currentUser.role === 'BANK_EMPLOYEE' || currentUser.role === 'BANK_MANAGER';
              const userName = currentUser.displayName || currentUser.name || currentUser.full_name || authData?.user?.displayName || authData?.user?.name || "Bank Employee";
              const userEmail = currentUser.email || authData?.user?.email || "employee@bank.com";
              const userRole = "BANK_EMPLOYEE";
              const initial = userName.charAt(0).toUpperCase();

              return (
                  <div style={{ position: "relative" }}>
                      <button
                          onClick={() => setShowProfileModal(prev => !prev)}
                          title="View Profile"
                          style={{
                              display: "flex", alignItems: "center", gap: 10,
                              background: showProfileModal 
                                  ? (theme === 'dark' ? "rgba(26,115,232,0.25)" : "rgba(26,115,232,0.12)")
                                  : (theme === 'dark' ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"),
                              border: showProfileModal 
                                  ? "2px solid #1A73E8" 
                                  : `1px solid ${colors.panelBorder}`,
                              padding: "4px 14px 4px 4px", borderRadius: 24,
                              cursor: "pointer", fontFamily: "inherit", color: colors.bubbleText,
                              boxShadow: showProfileModal ? "0 0 14px rgba(26,115,232,0.4)" : "none",
                              transition: "all 0.2s ease"
                          }}
                      >
                          <div style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
                              color: "#FFFFFF",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 800, fontSize: 15,
                              boxShadow: "0 2px 6px rgba(26,115,232,0.4)"
                          }}>
                              {initial}
                          </div>
                          <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, color: colors.bubbleText }}>{userName.split(' ')[0]}</div>
                              <div style={{ fontSize: 10, color: colors.faint, fontWeight: 600 }}>Bank Employee</div>
                          </div>
                      </button>

                      {/* Profile Floating Card Modal */}
                      <AnimatePresence>
                          {showProfileModal && (
                              <>
                                  {/* Transparent Outside Click Backdrop */}
                                  <div 
                                      onClick={() => setShowProfileModal(false)}
                                      style={{
                                          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                                          zIndex: 999999, background: "transparent"
                                      }}
                                  />
                                  <motion.div
                                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                      style={{
                                          position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 1000000,
                                          width: "330px", 
                                          background: theme === 'dark' ? '#181E2A' : '#FFFFFF',
                                          color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(0,0,0,0.15)',
                                          borderRadius: "18px", padding: "20px",
                                          boxShadow: theme === 'dark' 
                                              ? "0 20px 60px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)" 
                                              : "0 20px 60px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)",
                                          fontFamily: "inherit"
                                      }}
                                  >
                                      {/* Header Row */}
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                              <div style={{
                                                  width: 48, height: 48, borderRadius: "50%",
                                                  background: "linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)",
                                                  color: "#FFFFFF",
                                                  display: "flex", alignItems: "center", justifyContent: "center",
                                                  fontWeight: 800, fontSize: 20,
                                                  boxShadow: "0 4px 12px rgba(26,115,232,0.4)",
                                                  flexShrink: 0
                                              }}>
                                                  {initial}
                                              </div>
                                              <div style={{ overflow: "hidden" }}>
                                                  <div style={{ 
                                                      fontWeight: 800, fontSize: 16, 
                                                      color: theme === 'dark' ? '#FFFFFF' : '#0F172A', 
                                                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
                                                  }}>
                                                      {userName}
                                                  </div>
                                                  <div style={{ 
                                                      fontSize: 12, fontWeight: 500,
                                                      color: theme === 'dark' ? '#94A3B8' : '#475569', 
                                                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                      marginTop: 2
                                                  }}>
                                                      {userEmail}
                                                  </div>
                                              </div>
                                          </div>
                                          <button
                                              onClick={() => setShowProfileModal(false)}
                                              style={{
                                                  background: theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                                                  border: "none", borderRadius: "50%",
                                                  width: 26, height: 26,
                                                  display: "flex", alignItems: "center", justifyContent: "center",
                                                  color: theme === 'dark' ? '#94A3B8' : '#64748B',
                                                  cursor: "pointer", transition: "all 0.2s ease"
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.color = theme === 'dark' ? '#FFFFFF' : '#000000'}
                                          >
                                              ✕
                                          </button>
                                      </div>

                                      {/* User Details Box */}
                                      <div style={{ 
                                          background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                                          borderRadius: "14px",
                                          padding: "14px", margin: "14px 0", 
                                          display: "flex", flexDirection: "column", gap: 10, fontSize: 13 
                                      }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                              <span style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Account Role</span>
                                              <span style={{ 
                                                  fontWeight: 800, color: "#1A73E8", 
                                                  background: theme === 'dark' ? 'rgba(26,115,232,0.2)' : 'rgba(26,115,232,0.1)',
                                                  padding: "2px 8px", borderRadius: "6px", fontSize: 11
                                              }}>
                                                  {userRole}
                                              </span>
                                          </div>
                                          {applicationId && (
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                  <span style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Application ID</span>
                                                  <span style={{ fontWeight: 700, color: theme === 'dark' ? '#F1F5F9' : '#1E293B' }}>{applicationId}</span>
                                              </div>
                                          )}
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                              <span style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Account Status</span>
                                              <span style={{ 
                                                  fontWeight: 800, color: "#16A34A",
                                                  background: theme === 'dark' ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.1)',
                                                  padding: "2px 8px", borderRadius: "6px", fontSize: 11,
                                                  display: "flex", alignItems: "center", gap: 6
                                              }}>
                                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                                                  Active & Verified
                                              </span>
                                          </div>
                                      </div>

                                      <button 
                                          onClick={() => {
                                              setShowProfileModal(false);
                                              setShowLogoutConfirm(true);
                                          }}
                                          style={{
                                              width: "100%", padding: "10px", borderRadius: "10px",
                                              background: "rgba(220,38,38,0.1)", 
                                              border: "1px solid rgba(220,38,38,0.25)",
                                              color: "#DC2626", fontWeight: 800, fontSize: 13, cursor: "pointer",
                                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                              fontFamily: "inherit", transition: "all 0.2s ease"
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.18)"}
                                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.1)"}
                                      >
                                          <LogOut size={16} /> Sign Out
                                      </button>
                                  </motion.div>
                              </>
                          )}
                      </AnimatePresence>
                  </div>
              );
          })()}
        </div>
      </div>

      <div style={{ padding: "24px", paddingLeft: "100px", flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Full Page Success Overlay */}
        <AnimatePresence>
            {submitSuccess && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "absolute", inset: 0, zIndex: 50, background: colors.bgTop, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#34A85320", color: "#34A853", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 16px 0", color: colors.bubbleText }}>Application Submitted Successfully</h2>
                    <p style={{ fontSize: "18px", color: colors.faint, marginBottom: "40px", maxWidth: "500px", lineHeight: 1.6 }}>Your loan application and AI analysis report have been securely transmitted to the review team.</p>
                    <div style={{ padding: "16px 32px", background: colors.bubbleBg, borderRadius: "16px", border: `1px solid ${colors.panelBorder}`, marginBottom: "40px" }}>
                        <span style={{ color: colors.faint, fontSize: "14px", marginRight: "12px" }}>Reference ID:</span>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: colors.bubbleText }}>{submitSuccess}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                        <button style={{ padding: "16px 32px", borderRadius: "14px", background: "transparent", border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View Application</button>
                        <button onClick={handleStartNew} style={{ padding: "16px 32px", borderRadius: "14px", background: colors.pillBg, border: "none", color: "white", fontSize: "16px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Start New Application</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {!submitSuccess && (
            <>
            {(currentPage === 'LOAN_SELECTION' || currentPage === 'DOCUMENT_UPLOAD') && (
                <ContextualMascot 
                    message={mascotMessage} 
                    type={mascotType} 
                    colors={colors} 
                />
            )}
            <AnimatePresence mode="wait">
            
            {/* PAGE 1: LOAN SELECTION */}
            {currentPage === 'LOAN_SELECTION' && (
                <motion.div key="selection" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center",
                    width: "100%",
                    maxWidth: "1200px",
                    alignSelf: "center",
                    paddingTop: "56px"
                }}>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 12px 0", color: colors.bubbleText }}>Select Loan Type</h2>
                    <p style={{ color: colors.faint, fontSize: "16px", margin: "0 0 32px 0" }}>Choose the type of loan to begin the document verification process.</p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "24px", width: "100%" }}>
                        {loanTypes.map(loan => {
                            const Icon = getIconForLoan(loan.id);
                            return (
                                <button
                                    key={loan.id}
                                    onClick={() => handleLoanSelect(loan.id)}
                                    style={{
                                        background: colors.bubbleBg, border: `1px solid ${colors.panelBorder}`, borderRadius: "24px",
                                        padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                                        cursor: "pointer", transition: "all 0.2s ease", color: colors.bubbleText,
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.pillBg}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.panelBorder}
                                >
                                    <div style={{ background: `${colors.pillBg}15`, padding: "16px", borderRadius: "50%", color: colors.pillBg }}>
                                        <Icon size={32} />
                                    </div>
                                    <span style={{ fontSize: "18px", fontWeight: 600, fontFamily: "inherit", textAlign: "center" }}>{loan.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            
            
            {/* PAGE 2: DOCUMENT UPLOAD */}
            {currentPage === 'DOCUMENT_UPLOAD' && (
                <motion.div key="upload" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: "flex", flexDirection: "column", maxWidth: "900px", margin: "0 auto", width: "100%", paddingTop: "120px" }}>
                    
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "32px", gap: "16px" }}>
                        <button onClick={() => setCurrentPage('LOAN_SELECTION')} style={{ background: "transparent", border: "none", color: colors.faint, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, fontFamily: "inherit" }}>
                            ← Back
                        </button>
                    </div>

                    <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: colors.bubbleText }}>Upload Documents</h2>
                    <p style={{ color: colors.faint, fontSize: "16px", marginBottom: "32px", lineHeight: 1.5 }}>
                        Please upload the required documents for your {loanTypes.find(l => l.id === selectedLoanType)?.label}.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
                        {reqDocs.map(doc => {
                            const statusObj = docStatuses[doc.id];
                            const status = statusObj?.status || 'idle';
                            const files = statusObj?.files || [];
                            const filename = files.length > 0 ? files[0].name : '';
                            
                            const isErrorState = status === 'wrong_document' || status === 'unsupported_type' || status === 'error';
                            let detectedType = null;
                            if (statusObj?.slotData) {
                                detectedType = statusObj.slotData.detected_document_type;
                            }
                            
                            return (
                                <div key={doc.id} style={{
                                    background: isErrorState ? "rgba(234,67,53,0.02)" : colors.bubbleBg, 
                                    borderRadius: "16px", 
                                    border: isErrorState ? '1px solid rgba(234,67,53,0.5)' : (status === 'accepted' ? '1px solid rgba(52,168,83,0.3)' : `1px solid ${colors.panelBorder}`),
                                    padding: "24px", display: "flex", flexDirection: "column", gap: "16px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                                    transition: "all 0.3s ease"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                            <div style={{ 
                                                background: status === 'accepted' ? "#34A85315" : (isErrorState ? "#EA433515" : `${colors.pillBg}10`), 
                                                padding: "12px", borderRadius: "12px", 
                                                color: status === 'accepted' ? "#34A853" : (isErrorState ? "#EA4335" : colors.pillBg) 
                                            }}>
                                                {status === 'accepted' ? <CheckCircle size={24} /> : (isErrorState ? <AlertTriangle size={24} /> : <FileText size={24} />)}
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <span style={{ fontSize: "16px", fontWeight: 700, color: isErrorState ? "#EA4335" : colors.bubbleText }}>{doc.label}</span>
                                                    {doc.required ? <span style={{ color: colors.pillBg, fontSize: "12px", fontWeight: 800, padding: "2px 8px", background: `${colors.pillBg}15`, borderRadius: "6px" }}>*Required</span> : <span style={{ color: colors.faint, fontSize: "12px", fontWeight: 600, padding: "2px 8px", background: "rgba(0,0,0,0.05)", borderRadius: "6px" }}>Optional</span>}
                                                </div>
                                                <div style={{ fontSize: "13px", color: colors.faint, marginTop: "4px", fontWeight: 500 }}>
                                                    Supported formats: PDF, DOC, DOCX
                                                </div>
                                                
                                                {/* Status Display */}
                                                {status !== 'idle' && (
                                                    <div style={{ marginTop: "12px", fontSize: "14px", padding: "12px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${isErrorState ? '#EA433550' : (status === 'accepted' ? '#34A85350' : colors.panelBorder)}` }}>
                                                        {status === 'uploading' && <div style={{ color: colors.pillBg, fontWeight: 600 }}>Checking document: {filename}...</div>}
                                                        {status === 'accepted' && (
                                                            <div>
                                                                <div style={{ color: "#34A853", fontWeight: 700, marginBottom: "4px" }}>✓ ACCEPTED</div>
                                                                <div style={{ color: colors.bubbleText }}>{filename}</div>
                                                                <div style={{ color: colors.faint, fontSize: "12px", marginTop: "4px" }}>Document type: {doc.label}</div>
                                                                {(statusObj.agent_name || statusObj.slotData?.agent_name) && (
                                                                    <div style={{ color: colors.pillBg, fontSize: "11px", fontWeight: 700, marginTop: "4px" }}>
                                                                        Processed by: {statusObj.agent_name || statusObj.slotData?.agent_name} ({statusObj.agent_id || statusObj.slotData?.agent_id})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {status === 'unsupported_type' && (
                                                            <div>
                                                                <div style={{ color: "#EA4335", fontWeight: 700, marginBottom: "4px" }}>✕ Unsupported file type</div>
                                                                <div style={{ color: colors.bubbleText, marginBottom: "4px" }}>Uploaded: {filename}</div>
                                                                <div style={{ color: colors.faint, fontSize: "13px" }}>Please upload a PDF, DOC, or DOCX file.</div>
                                                            </div>
                                                        )}
                                                        {status === 'wrong_document' && (
                                                            <div>
                                                                <div style={{ color: "#EA4335", fontWeight: 700, marginBottom: "4px" }}>✕ WRONG DOCUMENT TYPE</div>
                                                                <div style={{ color: colors.bubbleText, marginBottom: "4px" }}>Uploaded: {filename}</div>
                                                                {detectedType ? (
                                                                    <>
                                                                        <div style={{ color: colors.faint, fontSize: "13px" }}>Detected: {detectedType.replace('_', ' ')}</div>
                                                                        <div style={{ color: colors.faint, fontSize: "13px" }}>Expected: {doc.label}</div>
                                                                    </>
                                                                ) : (
                                                                    <div style={{ color: colors.faint, fontSize: "13px" }}>This document does not match the required {doc.label}.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {status === 'error' && (
                                                            <div>
                                                                <div style={{ color: "#EA4335", fontWeight: 700, marginBottom: "4px" }}>✕ ERROR</div>
                                                                <div style={{ color: colors.bubbleText, marginBottom: "4px" }}>Uploaded: {filename}</div>
                                                                <div style={{ color: colors.faint, fontSize: "13px" }}>{statusObj.error}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {(status === 'idle' || isErrorState) && (
                                                <>
                                                    <input 
                                                        type="file" id={`file-upload-${doc.id}`} style={{ display: "none" }} accept=".pdf,.doc,.docx"
                                                        onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                                                    />
                                                    <label htmlFor={`file-upload-${doc.id}`} style={{
                                                        background: isErrorState ? "transparent" : colors.pillBg, 
                                                        color: isErrorState ? colors.bubbleText : "white", 
                                                        border: isErrorState ? `1px solid ${colors.panelBorder}` : "none",
                                                        padding: "10px 20px", borderRadius: "10px",
                                                        fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s ease"
                                                    }}>
                                                        {isErrorState ? <RefreshCw size={14} /> : <Upload size={16} />} 
                                                        {isErrorState ? "Retry Upload" : "Upload"}
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        onClick={startAnalysis}
                        disabled={!allRequiredUploaded}
                        style={{
                            width: "100%", padding: "18px", borderRadius: "16px", border: "none",
                            background: !allRequiredUploaded ? colors.panelBorder : colors.pillBg,
                            color: !allRequiredUploaded ? colors.faint : "white",
                            fontSize: "16px", fontWeight: 700, cursor: !allRequiredUploaded ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            fontFamily: "inherit", transition: "all 0.3s ease", marginBottom: "60px"
                        }}
                    >
                        Analyze Documents <ArrowRight size={18} />
                    </button>
                    {reqDocs.length > 0 && !allRequiredUploaded && <div style={{ textAlign: "center", marginTop: "-48px", marginBottom: "48px", color: colors.faint, fontSize: "13px" }}>Please upload all required documents to continue.</div>}
                </motion.div>
            )}

            {/* PAGE 3: AI PROCESSING */}
            {currentPage === 'AI_PROCESSING' && (
                <ProcessingPipeline 
                    colors={colors} 
                    theme={theme} 
                    onComplete={handleAnalysisComplete}
                    onBack={() => setCurrentPage('DOCUMENT_UPLOAD')}
                    applicationId={applicationId} 
                    documentCount={Object.keys(docStatuses).length}
                />
            )}

            {/* PAGE 4: FINAL ANALYSIS */}
            {currentPage === 'FINAL_ANALYSIS' && !analysisResults && (
                <motion.div key="error" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "white" }}>
                    <AlertTriangle size={48} color="#EA4335" style={{ marginBottom: "16px" }} />
                    <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Analysis results are unavailable.</h2>
                    <p style={{ color: colors.faint, marginBottom: "24px" }}>We couldn't find the stored processing response.</p>
                    <button onClick={() => setCurrentPage('AI_PROCESSING')} style={{ padding: "12px 24px", borderRadius: "12px", background: colors.panelBorder, border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        Back to Analysis
                    </button>
                </motion.div>
            )}

            {currentPage === 'FINAL_ANALYSIS' && analysisResults && (
                <motion.div key="analysis" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
                    
                    {/* Back Button */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                        <button 
                            onClick={() => {
                                if (isEmployee) {
                                    onSignOut();
                                } else {
                                    setCurrentPage('DOCUMENT_UPLOAD');
                                }
                            }} 
                            style={{ 
                                background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, 
                                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", 
                                fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
                                padding: "10px 16px", borderRadius: "12px", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.pillBg; e.currentTarget.style.transform = "translateX(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.panelBorder; e.currentTarget.style.transform = "translateX(0)"; }}
                        >
                            <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> {isEmployee ? "Back to Employee Dashboard" : "Back to Document Upload"}
                        </button>
                    </div>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", background: colors.panelBg, padding: "24px", borderRadius: "20px", border: `1px solid ${colors.panelBorder}`, backdropFilter: "blur(12px)" }}>
                        <div>
                            <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 16px 0", color: colors.bubbleText }}>Analysis Complete</h2>
                            <div style={{ display: "flex", gap: "24px" }}>
                                <div>
                                    <div style={{ fontSize: "12px", color: colors.faint, marginBottom: "4px" }}>Application ID</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: colors.bubbleText }}>{analysisResults.applicationId || "Unknown"}</div>
                                </div>
                                <div style={{ width: "1px", background: colors.panelBorder }} />
                                <div>
                                    <div style={{ fontSize: "12px", color: colors.faint, marginBottom: "4px" }}>Loan Type</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: colors.bubbleText }}>{loanTypes.find(l => l.id === selectedLoanType)?.label || "Unknown"}</div>
                                </div>
                                <div style={{ width: "1px", background: colors.panelBorder }} />
                                <div>
                                    <div style={{ fontSize: "12px", color: colors.faint, marginBottom: "4px" }}>Processing Status</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#34A853", background: "rgba(52,168,83,0.1)", padding: "2px 8px", borderRadius: "6px" }}>{analysisResults.status || "COMPLETED"}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setCurrentPage('DOCUMENT_UPLOAD')} style={{ padding: "12px 20px", borderRadius: "12px", background: "transparent", border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                Re-upload Documents
                            </button>
                            <button onClick={() => apiService.downloadReport(applicationId)} style={{ padding: "12px 20px", borderRadius: "12px", background: "transparent", border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px" }}>
                                <File size={16} /> Download Report
                            </button>
                            <button onClick={handleSubmitApplication} disabled={isSubmitting} style={{ padding: "12px 20px", borderRadius: "12px", background: colors.pillBg, border: "none", color: "white", fontWeight: 600, cursor: isSubmitting ? "default" : "pointer", fontFamily: "inherit", opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
                        
                        {/* ROW 1: Final Decision & Risk */}
                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column", minHeight: "280px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                <ShieldAlert size={24} color="#3B82F6" />
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: colors.bubbleText }}>Final Decision</h3>
                            </div>
                            <h2 style={{ fontSize: "48px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-1px", color: (analysisResults.finalDecision === "PASS" || analysisResults.finalDecision === "APPROVED") ? "#34A853" : ((analysisResults.finalDecision === "REJECT" || analysisResults.finalDecision === "REJECTED") ? "#EA4335" : "#F59E0B") }}>
                                {analysisResults.finalDecision || "PENDING"}
                            </h2>
                            <div style={{ display: "inline-block", background: `${colors.panelBorder}60`, padding: "6px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, color: colors.bubbleText, marginBottom: "24px", width: "fit-content" }}>
                                Underwriter Review: {analysisResults.requiresReview || "NO"}
                            </div>
                            <div style={{ marginTop: "auto", background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)", padding: "16px", borderRadius: "12px", border: `1px solid ${colors.panelBorder}` }}>
                                <div style={{ fontSize: "12px", color: colors.faint, marginBottom: "4px" }}>Decision Reason</div>
                                <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0, color: colors.bubbleText }}>{analysisResults.rationale || "Not available"}</p>
                            </div>
                        </div>

                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column", minHeight: "280px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                                <AlertTriangle size={24} color="#F59E0B" />
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: colors.bubbleText }}>Risk Assessment</h3>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "32px", marginBottom: "32px" }}>
                                <div>
                                    <div style={{ fontSize: "13px", color: colors.faint, marginBottom: "8px" }}>Risk Score</div>
                                    <div style={{ fontSize: "48px", fontWeight: 800, color: colors.bubbleText, lineHeight: 1 }}>{analysisResults.riskSummary?.score || "0 / 100"}</div>
                                </div>
                                <div style={{ width: "1px", height: "60px", background: colors.panelBorder }} />
                                <div>
                                    <div style={{ fontSize: "13px", color: colors.faint, marginBottom: "8px" }}>Risk Level</div>
                                    <div style={{ fontSize: "24px", fontWeight: 800, color: analysisResults.riskSummary?.level === 'LOW' ? '#4ADE80' : (analysisResults.riskSummary?.level === 'MEDIUM' ? '#FBBF24' : '#F87171') }}>
                                        {analysisResults.riskSummary?.level || "UNKNOWN"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Executive Summary */}
                        <div style={{ ...cardStyle(colors), gridColumn: "span 2" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <FileText size={20} color={colors.faint} />
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: colors.bubbleText }}>Executive Summary</h3>
                            </div>
                            <p style={{ fontSize: "15px", lineHeight: 1.6, color: colors.bubbleText, margin: 0 }}>
                                {analysisResults.executiveSummary || "Not available"}
                            </p>
                        </div>

                        {/* ROW 3: Document Completeness & Extraction */}
                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Document Summary & Completeness</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                                <div style={{ fontSize: "32px", fontWeight: 800, color: colors.bubbleText, marginBottom: "8px" }}>
                                    {analysisResults.documentCompleteness?.slotsSatisfied || 0} / {analysisResults.documentCompleteness?.requiredSlots || 0}
                                    <span style={{ fontSize: "14px", fontWeight: 500, color: colors.faint, marginLeft: "8px" }}>required slots</span>
                                </div>
                                <InfoRow icon={FileText} label="Total Uploaded" value={analysisResults.documentCompleteness?.totalUploaded || 0} colors={colors} />
                                <InfoRow icon={AlertCircle} label="Missing Required" value={analysisResults.documentCompleteness?.missingRequired || 0} colors={colors} />
                                <InfoRow icon={XCircle} label="Wrong Documents" value={analysisResults.documentCompleteness?.wrongDocuments || 0} colors={colors} />
                                <div style={{ marginTop: "auto", padding: "12px", background: analysisResults.documentCompleteness?.overallStatus === 'COMPLETE' ? "rgba(52,168,83,0.1)" : "rgba(234,67,53,0.1)", color: analysisResults.documentCompleteness?.overallStatus === 'COMPLETE' ? "#34A853" : "#EA4335", borderRadius: "8px", textAlign: "center", fontWeight: 700 }}>
                                    STATUS: {analysisResults.documentCompleteness?.overallStatus || "UNKNOWN"}
                                </div>
                            </div>
                        </div>

                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Income & Extracted Information</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" }}>
                                <InfoRow icon={User} label="Applicant Name" value={analysisResults.extractionSummary?.applicantName || "Not detected"} colors={colors} />
                                <InfoRow icon={Briefcase} label="Employer" value={analysisResults.extractionSummary?.employer || "Not detected"} colors={colors} />
                                <InfoRow icon={CreditCard} label="Monthly Income" value={analysisResults.extractionSummary?.monthlyIncome || "Not detected"} colors={colors} />
                                <InfoRow icon={CreditCard} label="PAN Number" value={analysisResults.extractionSummary?.panNumber || "Not detected"} colors={colors} />
                                <InfoRow icon={Home} label="Address" value={analysisResults.extractionSummary?.address || "Not detected"} colors={colors} />
                                <InfoRow icon={Building} label="Bank Balance (Avg)" value={analysisResults.extractionSummary?.bankBalance || "Not detected"} colors={colors} />
                            </div>
                        </div>

                        {/* ROW 4: Document Verification */}
                        <div style={{ ...cardStyle(colors), gridColumn: "span 2" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Document Verification (Classification)</h3>
                            <div style={{ background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)", borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.panelBorder}` }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr", padding: "12px 16px", background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderBottom: `1px solid ${colors.panelBorder}`, fontSize: "12px", fontWeight: 600, color: colors.faint }}>
                                    <div>Document Name</div>
                                    <div>Expected Type</div>
                                    <div>Detected Type</div>
                                    <div>Status</div>
                                    <div style={{ textAlign: "right" }}>Confidence</div>
                                </div>
                                {analysisResults.classificationSummary && analysisResults.classificationSummary.length > 0 ? (
                                    analysisResults.classificationSummary.map((doc, idx) => (
                                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr", padding: "16px", borderBottom: idx < analysisResults.classificationSummary.length - 1 ? `1px solid ${colors.panelBorder}` : "none", fontSize: "14px", alignItems: "center" }}>
                                            <div style={{ color: colors.bubbleText, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "16px" }}>{doc.name}</div>
                                            <div style={{ color: colors.bubbleText }}>{doc.expectedType}</div>
                                            <div style={{ color: colors.bubbleText }}>{doc.detectedType}</div>
                                            <div>
                                                <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: doc.status === 'ACCEPTED' ? "rgba(52,168,83,0.1)" : "rgba(234,67,53,0.1)", color: doc.status === 'ACCEPTED' ? "#34A853" : "#EA4335" }}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: "right", color: colors.bubbleText, fontWeight: 600 }}>{doc.confidence}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: "24px", textAlign: "center", color: colors.faint, fontSize: "14px" }}>No document classification results available.</div>
                                )}
                            </div>
                        </div>

                        {/* ROW 5: Validation & Cross-Doc */}
                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Validation Summary (Agent 3)</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", background: `${colors.panelBorder}40`, padding: "12px", borderRadius: "8px" }}>
                                    <span style={{ color: colors.faint, fontSize: "14px" }}>Total Checks</span>
                                    <span style={{ color: colors.bubbleText, fontWeight: 700 }}>{analysisResults.validationSummary?.totalChecks || 0}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(52,168,83,0.1)", padding: "12px", borderRadius: "8px" }}>
                                    <span style={{ color: "#34A853", fontSize: "14px" }}>Passed Checks</span>
                                    <span style={{ color: "#34A853", fontWeight: 700 }}>{analysisResults.validationSummary?.passedChecks || 0}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(250,204,21,0.1)", padding: "12px", borderRadius: "8px" }}>
                                    <span style={{ color: "#FACC15", fontSize: "14px" }}>Warnings</span>
                                    <span style={{ color: "#FACC15", fontWeight: 700 }}>{analysisResults.validationSummary?.warnings || 0}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(234,67,53,0.1)", padding: "12px", borderRadius: "8px" }}>
                                    <span style={{ color: "#EA4335", fontSize: "14px" }}>Error Checks / Blocking</span>
                                    <span style={{ color: "#EA4335", fontWeight: 700 }}>{analysisResults.validationSummary?.blockingIssues || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Cross-Document Verification (Agent 4)</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: colors.faint, fontSize: "14px" }}>Consistency Score</span>
                                    <span style={{ color: colors.bubbleText, fontWeight: 800, fontSize: "18px" }}>{analysisResults.crossDocSummary?.consistencyScore || "0 / 100"}</span>
                                </div>
                                <InfoRow icon={Layers} label="Coverage" value={analysisResults.crossDocSummary?.coverage || "0%"} colors={colors} />
                                <InfoRow icon={CheckCircle} label="Total Comparisons" value={analysisResults.crossDocSummary?.totalComparisons?.toString() || "0"} colors={colors} />
                                <InfoRow icon={CheckCircle} label="Matches" value={analysisResults.crossDocSummary?.matches?.toString() || "0"} colors={colors} />
                                <InfoRow icon={AlertTriangle} label="Minor Variations" value={analysisResults.crossDocSummary?.minorVariations?.toString() || "0"} colors={colors} />
                                <InfoRow icon={XCircle} label="Mismatches" value={analysisResults.crossDocSummary?.mismatches?.toString() || "0"} colors={colors} />
                                <InfoRow icon={AlertCircle} label="Unverifiable" value={analysisResults.crossDocSummary?.unverifiable?.toString() || "0"} colors={colors} />
                            </div>
                        </div>

                        {/* ROW 6: Risk & Anomaly Assessment */}
                        <div style={{ ...cardStyle(colors), gridColumn: "span 2" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                <AlertCircle size={20} color={analysisResults.riskSummary?.criticalIssues > 0 ? "#EA4335" : colors.faint} />
                                <h3 style={{ fontSize: "16px", color: analysisResults.riskSummary?.criticalIssues > 0 ? "#EA4335" : colors.bubbleText, margin: 0, fontWeight: 700 }}>Risk & Anomaly Findings (Agent 5)</h3>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                                <div style={{ background: "rgba(234,67,53,0.1)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#EA4335" }}>{analysisResults.riskSummary?.criticalIssues || 0}</div>
                                    <div style={{ fontSize: "13px", color: "#EA4335", fontWeight: 600 }}>Critical</div>
                                </div>
                                <div style={{ background: "rgba(249,115,22,0.1)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#F97316" }}>{analysisResults.riskSummary?.highSeverity || 0}</div>
                                    <div style={{ fontSize: "13px", color: "#F97316", fontWeight: 600 }}>High</div>
                                </div>
                                <div style={{ background: "rgba(250,204,21,0.1)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#FACC15" }}>{analysisResults.riskSummary?.mediumSeverity || 0}</div>
                                    <div style={{ fontSize: "13px", color: "#FACC15", fontWeight: 600 }}>Medium</div>
                                </div>
                                <div style={{ background: "rgba(52,168,83,0.1)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#34A853" }}>{analysisResults.riskSummary?.lowSeverity || 0}</div>
                                    <div style={{ fontSize: "13px", color: "#34A853", fontWeight: 600 }}>Low</div>
                                </div>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {!analysisResults.riskSummary?.anomalies || analysisResults.riskSummary.anomalies.length === 0 ? (
                                     <div style={{ display: "flex", alignItems: "center", gap: "12px", background: `${colors.panelBorder}40`, padding: "16px", borderRadius: "12px" }}>
                                         <CheckCircle size={18} color="#34A853" />
                                         <span style={{ fontSize: "14px", fontWeight: 500, color: colors.bubbleText }}>No risk anomalies detected.</span>
                                     </div>
                                ) : (
                                    analysisResults.riskSummary.anomalies.map((a, i) => (
                                        <ValidationRow key={`a-${i}`} label={a.category || a.label || "Anomaly"} note={a.description || a.note || ""} status="warn" colors={colors} warningText={a.severity} />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ROW 7: Key Findings & Recommendations */}
                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Key Findings</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {analysisResults.keyFindings && analysisResults.keyFindings.length > 0 ? (
                                    analysisResults.keyFindings.map((finding, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", background: theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: "8px" }}>
                                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3B82F6", marginTop: "8px", flexShrink: 0 }} />
                                            <div style={{ fontSize: "14px", lineHeight: 1.5, color: colors.bubbleText }}>{finding}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: "14px", color: colors.faint }}>Not available</div>
                                )}
                            </div>
                        </div>

                        <div style={{ ...cardStyle(colors), display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "16px", color: colors.bubbleText, marginTop: 0, marginBottom: "20px", fontWeight: 700 }}>Actionable Recommendations</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {analysisResults.recommendations && analysisResults.recommendations.length > 0 ? (
                                    analysisResults.recommendations.map((rec, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", background: "rgba(52,168,83,0.05)", borderRadius: "8px", border: "1px solid rgba(52,168,83,0.1)" }}>
                                            <CheckCircle size={16} color="#34A853" style={{ marginTop: "2px", flexShrink: 0 }} />
                                            <div style={{ fontSize: "14px", lineHeight: 1.5, color: colors.bubbleText }}>{rec}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: "14px", color: colors.faint }}>Not available</div>
                                )}
                            </div>
                        </div>

                        {/* BOTTOM: Final Summary */}
                        <div style={{ ...cardStyle(colors), gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: "13px", color: colors.faint, marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>FINAL DECISION / RECOMMENDED ACTION</div>
                                <h3 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: (analysisResults.finalDecision === "PASS" || analysisResults.finalDecision === "APPROVED") ? "#34A853" : ((analysisResults.finalDecision === "REJECT" || analysisResults.finalDecision === "REJECTED") ? "#EA4335" : "#F59E0B") }}>{analysisResults.finalDecision || "PENDING"}</h3>
                                {analysisResults.requiresReview === "YES" && (
                                    <div style={{ marginTop: "8px", display: "inline-block", background: "#F59E0B", color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                                        HUMAN REVIEW REQUIRED
                                    </div>
                                )}
                            </div>
                            <div style={{ maxWidth: "50%", textAlign: "right" }}>
                                <p style={{ fontSize: "14px", color: colors.bubbleText, margin: 0, lineHeight: 1.5 }}>
                                    {analysisResults.rationale || "Not available"}
                                </p>
                            </div>
                        </div>

                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            </>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
           <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                 position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                 background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)"
              }}
           >
              <motion.div
                 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                 style={{
                    background: colors.bubbleBg, borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "400px",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.2)", border: `1px solid ${colors.panelBorder}`, position: "relative"
                 }}
              >
                 <button onClick={() => setShowLogoutConfirm(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", color: colors.faint, cursor: "pointer" }}>
                    <X size={20} />
                 </button>
                 <h2 style={{ marginTop: 0, fontSize: "20px", fontWeight: 700, color: colors.bubbleText }}>Sign Out</h2>
                 <p style={{ color: colors.faint, fontSize: "15px", lineHeight: 1.5, marginBottom: "28px" }}>
                    Are you sure you want to log out? Any unsaved document progress will be lost.
                 </p>
                 <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "transparent", border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                       Cancel
                    </button>
                    <button onClick={confirmLogout} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#EA4335", border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                       Sign Out
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents

const AgentMascot = ({ color, agentId, isProcessing }) => {
    const assets = {
        'document': '/agents/document-blue.png',
        'extraction': '/agents/extraction-green.png',
        'validation': '/agents/validation-yellow.png',
        'crossDocument': '/agents/cross-document-purple.jpg',
        'riskAnomaly': '/agents/risk-red.png',
        'reportDecision': '/agents/report-teal.jpg'
    };
    
    const fallbackMap = [
        '/agents/document-blue.png',
        '/agents/extraction-green.png',
        '/agents/validation-yellow.png',
        '/agents/cross-document-purple.jpg',
        '/agents/risk-red.png',
        '/agents/report-teal.jpg'
    ];
    
    let idx = parseInt(agentId);
    if (isNaN(idx)) {
        const indices = { 'document': 0, 'extraction': 1, 'validation': 2, 'crossDocument': 3, 'riskAnomaly': 4, 'reportDecision': 5 };
        idx = indices[agentId] !== undefined ? indices[agentId] : 0;
    }
    
    const imgSrc = assets[agentId] || fallbackMap[idx] || fallbackMap[0];

    return (
        <img 
            src={imgSrc} 
            alt="AI Agent"
            style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                zIndex: 2,
                transform: isProcessing ? "scale(1.1) translateY(-2px)" : "scale(1) translateY(0)",
                transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
            }} 
        />
    );
};

function ProcessingPipeline({ colors, theme, onComplete, onBack, applicationId, documentCount = 5 }) {

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

    const agentsConfig = [
        { id: "document", name: "Document Classification" },
        { id: "extraction", name: "Information Extraction" },
        { id: "validation", name: "Validation" },
        { id: "crossDocument", name: "Cross-Document Verification" },
        { id: "riskAnomaly", name: "Risk & Anomaly Assessment" },
        { id: "reportDecision", name: "Final Report" }
    ];

    const [statusData, setStatusData] = useState({ status: 'PROCESSING', currentStageIndex: 0, error: null });

    useEffect(() => {
        let isMounted = true;
        let isApiDone = false;
        let apiResponse = null;
        let apiError = null;
        let localStage = 0;

        // 1. Start the actual backend processing
        apiService.startAIProcessing(applicationId)
            .then(res => {
                if (isMounted) {
                    isApiDone = true;
                    apiResponse = res;
                }
            })
            .catch(err => {
                if (isMounted) {
                    isApiDone = true;
                    apiError = err;
                }
            });

        // 2. Synchronized Visual Animation Loop
        const tick = () => {
            if (!isMounted) return;

            if (apiError) {
                setStatusData(prev => ({ ...prev, status: 'FAILED', error: apiError.message || "Unknown Error" }));
                return;
            }

            if (isApiDone) {
                if (localStage < 5) {
                    localStage++;
                    setStatusData(prev => ({ ...prev, currentStageIndex: localStage, status: 'PROCESSING' }));
                    setTimeout(tick, 400); // fast forward
                } else if (localStage === 5) {
                    localStage = 6;
                    const finalRes = apiService.mapAnalysisResults(apiResponse);
                    setStatusData(prev => ({ ...prev, currentStageIndex: 6, status: 'COMPLETED', finalRes: finalRes }));
                    // Do NOT auto-navigate. Wait for user to click VIEW DASHBOARD.
                }
            } else {
                if (localStage < 5) {
                    localStage++;
                    setStatusData(prev => ({ ...prev, currentStageIndex: localStage, status: 'PROCESSING' }));
                    setTimeout(tick, 1800); // normal progression
                } else {
                    // Waiting for real API to finish at stage 5
                    setTimeout(tick, 500);
                }
            }
        };

        setTimeout(tick, 1500);

        return () => { isMounted = false; };
    }, [applicationId, onComplete]);

    const { currentStageIndex, status, error } = statusData;
    const agents = agentsConfig;

    const agentColors = [
        "#3B82F6", // Blue
        "#10B981", // Green
        "#EAB308", // Yellow (Validation)
        "#A855F7", // Purple (Cross-Document)
        "#EF4444", // Red (Risk)
        "#06B6D4"  // Teal (Report)
    ];

    const completedCount = status === 'COMPLETED' ? agents.length : Math.min(currentStageIndex, agents.length - 1);
    const progressPercent = agents.length > 0 ? (completedCount / agents.length) * 100 : 0;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", flex: 1, margin: "0 auto", width: "100%", paddingBottom: "60px", color: colors.bubbleText, position: "relative", zIndex: 1, paddingTop: "40px", minHeight: "100vh" }}>
            
            {/* Atmospheric Theme-Aware Background */}
            <div style={{ position: "absolute", top: -100, bottom: -100, left: "-100px", width: "100vw", zIndex: -1, background: `linear-gradient(180deg, ${colors.bgTop} 0%, ${colors.bgBottom} 100%)`, overflow: "hidden", pointerEvents: "none" }}>
                {/* Dotted pattern (static base) */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${colors.dot} 1.5px, transparent 1.5px)`, backgroundSize: "32px 32px", opacity: 0.7 }} />
                
                {/* Cursor glow overlay — brighter dots near cursor */}
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

            <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", padding: "0 24px" }}>
                
                {/* Back Button */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "32px", marginTop: "16px" }}>
                    <button 
                        onClick={onBack} 
                        style={{ 
                            background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, color: colors.bubbleText, 
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", 
                            fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
                            padding: "10px 16px", borderRadius: "12px", transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.pillBg; e.currentTarget.style.transform = "translateX(-2px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.panelBorder; e.currentTarget.style.transform = "translateX(0)"; }}
                    >
                        <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to Document Upload
                    </button>
                </div>

                {/* Heading Area (Compact) */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", background: theme === 'dark' ? "linear-gradient(90deg, #FFFFFF 0%, #94A3B8 100%)" : "none", color: theme === 'dark' ? "transparent" : colors.bubbleText, WebkitBackgroundClip: theme === 'dark' ? "text" : "none", WebkitTextFillColor: theme === 'dark' ? "transparent" : colors.bubbleText }}>
                        Analyzing Your Documents
                    </h2>
                    <p style={{ color: colors.faint, fontSize: "16px", maxWidth: "500px", margin: "0 auto" }}>
                        Our AI agents are working together to process and verify your documents.
                    </p>
                </div>

                {/* Agent Workflow HERO Section */}
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", marginBottom: "80px", padding: "0 40px", zIndex: 10, paddingTop: "40px" }}>

                    {/* 6 Agent Windows */}
                    {agents.map((agent, idx) => {
                        const isCompleted = idx < currentStageIndex || status === 'COMPLETED';
                        const isProcessing = idx === currentStageIndex && status !== 'COMPLETED' && status !== 'FAILED';
                        const isPending = idx > currentStageIndex && status !== 'COMPLETED';
                        
                        const agentColor = agentColors[idx % agentColors.length];
                        
                        return (
                            <div key={agent.id} style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", width: "140px", flex: 1 }}>
                                
                                {/* Hover Tooltip attached smartly above the window */}
                                {isCompleted && status !== 'FAILED' && (
                                    <div className="agent-tooltip" style={{
                                        position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
                                        background: "rgba(15, 23, 42, 0.95)", color: "white", padding: "16px", borderRadius: "16px",
                                        width: "240px", zIndex: 100, fontSize: "13px", 
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(16px)",
                                        pointerEvents: "none", opacity: 0, transition: "all 0.3s ease",
                                        transform: "translateX(-50%) translateY(10px)"
                                    }}>
                                        <div style={{ fontWeight: 700, marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "14px" }}>{agent.name}</span>
                                            <CheckCircle size={16} color="#34A853" />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                                <Check size={14} color="#34A853" style={{ flexShrink: 0, marginTop: "2px" }} />
                                                <span style={{ lineHeight: 1.3, color: "rgba(255,255,255,0.9)" }}>Step completed successfully.</span>
                                            </div>
                                        </div>
                                        <div style={{ position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "12px", height: "12px", background: "rgba(15, 23, 42, 0.95)", borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
                                    </div>
                                )}

                                {/* Airplane Window Frame */}
                                <div className="agent-window" style={{ 
                                    position: "relative", width: "130px", height: "140px", borderRadius: "32px", 
                                    background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)",
                                    backdropFilter: "blur(12px)",
                                    border: `2px solid ${isProcessing ? agentColor : 'rgba(255,255,255,0.1)'}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.5s ease",
                                    boxShadow: isProcessing ? `inset 0px 10px 30px rgba(0,0,0,0.8), 0 0 30px ${agentColor}80, 0 10px 20px rgba(0,0,0,0.5)` : "inset 0px 10px 30px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)",
                                    cursor: isCompleted ? "pointer" : "default"
                                }}>
                                    {/* Inner metallic rim */}
                                    <div style={{ position: "absolute", inset: "3px", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none", zIndex: 1 }} />
                                    
                                    {/* Ambient color glow inside the window */}
                                    <div style={{ position: "absolute", bottom: "-10%", width: "100%", height: "60%", background: agentColor, filter: "blur(25px)", opacity: isProcessing ? 0.35 : 0.0, pointerEvents: "none", zIndex: 1, transition: "opacity 0.5s ease" }} />
                                    
                                    {/* The Agent Character Image */}
                                    <div style={{ position: "absolute", inset: "2px", borderRadius: "28px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <AgentMascot color={agentColor} agentId={agent.id || agentColors.indexOf(agentColor).toString()} isProcessing={isProcessing} />
                                    </div>
                                </div>
                                
                                {/* Status Below Window */}
                                <div style={{ marginTop: "16px", width: "100%", display: "flex", flexDirection: "column", zIndex: 5, paddingLeft: "10px", paddingRight: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", width: "100%" }}>
                                        {isCompleted ? (
                                            <CheckCircle size={16} color="#34A853" style={{ flexShrink: 0, marginTop: "2px" }} />
                                        ) : (
                                            <div style={{ flexShrink: 0, marginTop: "2px", width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${isProcessing ? agentColor : "rgba(255,255,255,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {isProcessing && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: agentColor }} />}
                                            </div>
                                        )}
                                        
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: colors.bubbleText, lineHeight: 1.3, marginBottom: "4px", wordWrap: "break-word" }}>
                                                {agent.name}
                                            </div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: status === 'FAILED' ? "#EA4335" : (isProcessing ? agentColor : (isCompleted ? colors.faint : (theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"))) }}>
                                                {status === 'FAILED' && isProcessing ? "Failed" : (isProcessing ? "Processing..." : (isCompleted ? "Completed" : "Pending"))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Processing Progress & Stats */}
                <div style={{ background: colors.panelBg, borderRadius: "24px", padding: "28px 32px", border: `1px solid ${colors.panelBorder}`, marginBottom: "20px", backdropFilter: "blur(10px)", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: colors.bubbleText }}>Processing Progress</h3>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: colors.faint }}>{completedCount} of {agents?.length || 6} completed</div>
                    </div>
                    
                    <div style={{ height: "14px", background: theme === 'dark' ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.05)", borderRadius: "7px", overflow: "hidden", marginBottom: "28px", border: `1px solid ${colors.panelBorder}`, boxShadow: theme === 'dark' ? "inset 0 2px 4px rgba(0,0,0,0.5)" : "none" }}>
                        <div style={{ height: "100%", background: `linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)`, width: `${progressPercent}%`, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: "7px", boxShadow: "0 0 10px rgba(59,130,246,0.5)" }} />
                    </div>
                    
                    {/* Stats Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}><FileText size={20} /></div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: colors.bubbleText }}>{documentCount}</div>
                                <div style={{ fontSize: "12px", color: colors.faint }}>Documents Uploaded</div>
                            </div>
                        </div>
                        
                        <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, paddingLeft: "24px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(52,168,83,0.1)", border: "1px solid rgba(52,168,83,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34A853" }}><CheckCircle size={20} /></div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: colors.bubbleText }}>{status === 'COMPLETED' ? documentCount : Math.min(completedCount, documentCount)}</div>
                                <div style={{ fontSize: "12px", color: colors.faint }}>Verified</div>
                            </div>
                        </div>
                        
                        <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, paddingLeft: "24px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }}><RefreshCw size={20} /></div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: colors.bubbleText }}>{status === 'COMPLETED' ? 0 : 1}</div>
                                <div style={{ fontSize: "12px", color: colors.faint }}>In Progress</div>
                            </div>
                        </div>
                        
                        <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, paddingLeft: "24px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}><AlertCircle size={20} /></div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: colors.bubbleText }}>{statusData.finalRes?.riskSummary?.mediumSeverity || 0}</div>
                                <div style={{ fontSize: "12px", color: colors.faint }}>Issues Found (So Far)</div>
                            </div>
                        </div>
                    </div>
                    
                    {status === 'COMPLETED' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", padding: "24px", background: "rgba(52,168,83,0.1)", borderRadius: "16px", border: "1px solid rgba(52,168,83,0.2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#34A853" }}>
                                <CheckCircle size={32} />
                                <span style={{ fontSize: "20px", fontWeight: 700 }}>ANALYSIS COMPLETE</span>
                            </div>
                            <div style={{ color: colors.faint, fontSize: "16px", textAlign: "center" }}>
                                All 6 AI agents have completed their analysis.
                            </div>
                            <button 
                                onClick={() => onComplete(statusData.finalRes)}
                                style={{ marginTop: "12px", padding: "14px 32px", borderRadius: "12px", background: "#34A853", border: "none", color: "white", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(52,168,83,0.4)" }}
                            >
                                VIEW DASHBOARD
                            </button>
                        </motion.div>
                    )}
                    {status === 'FAILED' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "28px", display: "flex", gap: "16px", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(234,67,53,0.1)", borderRadius: "16px", border: "1px solid rgba(234,67,53,0.2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#EA4335" }}>
                                <AlertTriangle size={24} />
                                <span style={{ fontSize: "16px", fontWeight: 700 }}>Processing Failed: {error || "An error occurred during AI processing."}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
                
                {/* Live Processing Log */}
                <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "24px", padding: "28px 32px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", marginBottom: "60px", zIndex: 1 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 20px 0", color: "white" }}>Live Processing Log</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {agents.map((agent, idx) => {
                            const isCompleted = idx < currentStageIndex || status === 'COMPLETED';
                            const isProcessing = idx === currentStageIndex && status !== 'COMPLETED' && status !== 'FAILED';
                            const isPending = idx > currentStageIndex && status !== 'COMPLETED';
                            
                            return (
                                <div key={idx} style={{ display: "flex", gap: "24px", opacity: isCompleted || isProcessing ? 1 : 0.3, transition: "opacity 0.3s ease" }}>
                                    <div style={{ display: "flex", gap: "16px", width: "240px", alignItems: "center" }}>
                                        {isCompleted ? (
                                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#34A853", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Check size={14} color="white" strokeWidth={3} />
                                            </div>
                                        ) : (isProcessing ? (
                                            <div style={{ width: "20px", height: "20px", border: `2px solid rgba(255,255,255,0.1)`, borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                        ) : (
                                            <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid rgba(255,255,255,0.3)` }} />
                                        ))}
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{agent.name}</div>
                                    </div>
                                    <div style={{ fontSize: "14px", color: status === 'FAILED' && isProcessing ? "#EA4335" : (isCompleted ? "rgba(255,255,255,0.7)" : (isProcessing ? "#3B82F6" : "rgba(255,255,255,0.4)")), flex: 1, marginTop: "1px" }}>
                                        {status === 'FAILED' && isProcessing ? "Agent failed to execute." : (isCompleted ? "Execution complete." : (isProcessing ? "Agent is working..." : "Waiting for previous step..."))}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: "1px" }}>
                                        {isPending ? "--:--:--" : new Date(Date.now() - (agents.length - idx) * 1000).toLocaleTimeString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
            </div>
            
            <style>{`
                .agent-window:hover ~ .agent-tooltip, .agent-window:hover .agent-tooltip {
                    opacity: 1 !important;
                    transform: translateX(-50%) translateY(0) !important;
                }
                .agent-tooltip {
                    transform: translateX(-50%) translateY(10px);
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </motion.div>
    );
}

function cardStyle(colors) {
  return {
    background: colors.bubbleBg, borderRadius: "24px", padding: "32px",
    border: `1px solid ${colors.panelBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,0.03)"
  };
}

function iconBtnStyle(colors) {
  return {
    width: "36px", height: "36px", borderRadius: "50%", background: "transparent",
    border: `1px solid ${colors.panelBorder}`, display: "flex", alignItems: "center",
    justifyContent: "center", color: colors.bubbleText, cursor: "pointer"
  };
}

function InfoRow({ icon: Icon, label, value, colors }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "12px", borderBottom: `1px solid ${colors.panelBorder}` }}>
      <div style={{ color: colors.faint }}><Icon size={18} /></div>
      <div style={{ flex: 1, color: colors.faint, fontSize: "13px" }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: "14px", color: colors.bubbleText }}>{value}</div>
    </div>
  );
}

function ValidationRow({ label, status, colors, note, warningText }) {
    const isPass = status === "pass";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: isPass ? `${colors.panelBorder}40` : "#FBBC0515", borderRadius: "12px" }}>
            {isPass ? <CheckCircle size={18} color="#34A853" /> : <AlertTriangle size={18} color="#FBBC05" />}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: isPass ? colors.bubbleText : "#FBBC05" }}>{label}</div>
                {note && <div style={{ fontSize: "12px", color: isPass ? colors.faint : "#FBBC05", marginTop: "2px", opacity: 0.8 }}>{note}</div>}
            </div>
            {warningText && (
                <div style={{ background: "#FBBC05", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                    {warningText}
                </div>
            )}
        </div>
    );
}

function DocCheck({ status, label, colors }) {
  const isFound = status === "found";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: isFound ? `${colors.panelBorder}40` : "#EA433510", padding: "12px", borderRadius: "12px" }}>
      {isFound ? <CheckCircle size={18} color="#34A853" /> : <AlertTriangle size={18} color="#EA4335" />}
      <span style={{ fontSize: "14px", fontWeight: 500, color: isFound ? colors.bubbleText : "#EA4335" }}>{label}</span>
    </div>
  );
}

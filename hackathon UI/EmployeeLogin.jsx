import React, { useState } from "react";
import { ArrowRight, Briefcase, Lock, User, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Mascot } from "./mascot-login-flow";
import { authService } from "./authService";

const FONT = `"Sen", ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;

export default function EmployeeLogin({ colors, theme, onLogin, onBack }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await authService.signInWithEmail(email, password);
            onLogin(res.user);
        } catch (err) {
            setError(err.message || "Authentication failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="employee-login-page"
            style={{ 
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box"
            }}
        >
            <style>{`
                @keyframes authFadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .auth-in {
                    animation: authFadeSlideUp 0.6s ease-out forwards;
                }
                
                .employee-login-layout {
                    width: min(1100px, calc(100% - 100px));
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 460px;
                    gap: 70px;
                    align-items: center;
                    margin: 0 auto;
                }

                @media (max-width: 1000px) {
                    .employee-login-layout {
                        grid-template-columns: 1fr;
                        gap: 40px;
                        width: 100%;
                        max-width: 500px;
                    }
                }
            `}</style>
            
            {/* Subtle background glow */}
            <div style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100vw",
                height: "100vh",
                background: theme === 'dark' ? "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, rgba(0,0,0,0) 70%)" : "none",
                pointerEvents: "none",
                zIndex: 0
            }} />

            <div className="employee-login-layout" style={{ position: "relative", zIndex: 1 }}>
                
                {/* LEFT SIDE: Mascot & Speech Bubble */}
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    alignItems: "center", 
                    justifyContent: "center" 
                }}>
                    {/* Speech Bubble */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: isSubmitting ? 0 : 1, y: 0, scale: 1 }}
                        transition={{ 
                            delay: isSubmitting ? 0 : 0.2, 
                            duration: isSubmitting ? 0.3 : undefined,
                            type: isSubmitting ? "tween" : "spring", 
                            stiffness: 200, damping: 20 
                        }}
                        style={{
                            position: "relative",
                            background: colors.bubbleBg,
                            border: `1px solid ${colors.panelBorder}`,
                            borderRadius: "24px",
                            padding: "24px",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
                            width: "100%",
                            maxWidth: "400px",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            marginBottom: "24px" // space between bubble and mascot
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700, color: colors.bubbleText, fontFamily: FONT }}>
                            Welcome to the Admin Portal!
                        </h3>
                        <p style={{ margin: 0, color: colors.faint, fontSize: "14px", fontWeight: 400, lineHeight: 1.5, fontFamily: FONT }}>
                            Sign in to review and manage loan applications.
                        </p>
                        
                        {/* Pointer pointing down towards the mascot */}
                        <div style={{
                            position: "absolute",
                            bottom: "-10px",
                            left: "50%",
                            marginLeft: "-10px", // centered horizontally
                            width: "20px",
                            height: "20px",
                            background: colors.bubbleBg,
                            borderBottom: `1px solid ${colors.panelBorder}`,
                            borderRight: `1px solid ${colors.panelBorder}`,
                            transform: "rotate(45deg)",
                            clipPath: "polygon(100% 0, 100% 100%, 0 100%)"
                        }} />
                    </motion.div>

                    {/* Mascot */}
                    <motion.div layoutId="employee-shared-mascot" transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                        <Mascot mood="neutral" size={145} />
                    </motion.div>
                </div>

                {/* RIGHT SIDE: Login Card */}
                <motion.div 
                    animate={{ opacity: isSubmitting ? 0.4 : 1, scale: isSubmitting ? 0.98 : 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "460px", margin: "0 auto" }}
                >
                    <div className="auth-in" style={{ 
                        background: colors.panelBg, 
                        border: `1px solid ${colors.panelBorder}`, 
                        borderRadius: "22px", 
                        padding: "32px", 
                        backdropFilter: "blur(12px)", 
                        WebkitBackdropFilter: "blur(12px)", 
                        boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
                        boxSizing: "border-box",
                        width: "100%"
                    }}>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ background: `${colors.pillBg}15`, padding: "10px", borderRadius: "12px", color: colors.pillBg }}>
                                <Briefcase size={24} />
                            </div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: colors.bubbleText, fontFamily: FONT }}>Admin Sign In</h2>
                        </div>
                        <p style={{ color: colors.faint, fontSize: "14px", marginBottom: "24px", lineHeight: 1.5, fontFamily: FONT }}>
                            Access your workspace to review and manage loan applications.
                        </p>

                        {error && (
                            <div style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", padding: "12px 16px", borderRadius: "12px", color: "#EA4335", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontFamily: FONT }}>
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                            <div style={{ width: "100%", boxSizing: "border-box" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: colors.bubbleText, marginBottom: "8px", paddingLeft: "4px", fontFamily: FONT }}>Admin Email</label>
                                <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
                                    <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.faint }}>
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        style={{
                                            width: "100%", padding: "14px 16px 14px 44px", borderRadius: "14px", border: `1px solid ${colors.panelBorder}`,
                                            background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                                            color: colors.bubbleText, fontSize: "15px", fontFamily: FONT, outline: "none", transition: "all 0.2s ease",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ width: "100%", boxSizing: "border-box" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: colors.bubbleText, marginBottom: "8px", paddingLeft: "4px", fontFamily: FONT }}>Password</label>
                                <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
                                    <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.faint }}>
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{
                                            width: "100%", padding: "14px 16px 14px 44px", borderRadius: "14px", border: `1px solid ${colors.panelBorder}`,
                                            background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                                            color: colors.bubbleText, fontSize: "15px", fontFamily: FONT, outline: "none", transition: "all 0.2s ease",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{
                                    marginTop: "16px",
                                    width: "100%",
                                    padding: "16px",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: isSubmitting ? colors.faint : colors.pillBg,
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    fontFamily: FONT,
                                    cursor: isSubmitting ? "default" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    transition: "all 0.2s ease",
                                    boxSizing: "border-box",
                                    opacity: isSubmitting ? 0.8 : 1
                                }}
                            >
                                {isSubmitting ? "Signing In..." : "Sign In"}
                                {!isSubmitting && <ArrowRight size={18} />}
                            </button>
                        </form>
                        
                        <div style={{ marginTop: "24px", textAlign: "center", width: "100%" }}>
                            <button 
                                type="button"
                                onClick={onBack}
                                disabled={isSubmitting}
                                style={{
                                    background: "none", border: "none", color: colors.faint,
                                    fontSize: "14px", fontWeight: 600, fontFamily: FONT, cursor: isSubmitting ? "default" : "pointer",
                                    padding: "8px", transition: "color 0.2s ease"
                                }}
                                onMouseOver={(e) => { if(!isSubmitting) e.target.style.color = colors.bubbleText }}
                                onMouseOut={(e) => { if(!isSubmitting) e.target.style.color = colors.faint }}
                            >
                                ← Back to Role Selection
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

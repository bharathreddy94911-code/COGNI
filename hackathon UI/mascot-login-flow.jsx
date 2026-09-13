import { useState, useEffect, useRef } from "react";
import { authService, auth } from "./authService";
import MASCOT_IMG from "./mascot-clean.png";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { User, Briefcase, ArrowRight } from "lucide-react";
import Dashboard from "./Dashboard.jsx";
import EmployeeLogin from "./EmployeeLogin.jsx";
import EmployeeDashboard from "./EmployeeDashboard.jsx";
// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const LIGHT_COLORS = {
  bgTop: "#FDFBF8",
  bgBottom: "#F4E9E1",
  dot: "#D0CFAA",
  mascotEye: "#382F28",
  bubbleBg: "#FFFFFF",
  bubbleText: "#382F28",
  pillBg: "#857845",
  pillText: "#FFFFFF",
  pillMuted: "#D0CFAA",
  accent: "#857845",
  faint: "#736B5F",
  botBubbleBg: "#FFFFFF",
  userBubbleBg: "#FADEA9",
  userBubbleText: "#382F28",
  panelBorder: "#E6DCCF",
  panelBg: "rgba(255,255,255,0.78)",
  btnDisabled: "#D0CFAA",
  progressBg: "#F4E9E1",
};

const DARK_COLORS = {
  bgTop: "#12141A",
  bgBottom: "#1A1D24",
  dot: "#2A2E38",
  mascotEye: "#20232B",
  bubbleBg: "#2A2E38",
  bubbleText: "#E4E8F0",
  pillBg: "#4C8CE8",
  pillText: "#FFFFFF",
  pillMuted: "#3A404E",
  accent: "#FFFFFF",
  faint: "#8A94A6",
  botBubbleBg: "#232730",
  userBubbleBg: "#3A4252",
  userBubbleText: "#E4E8F0",
  panelBorder: "#2A2E38",
  panelBg: "rgba(26,29,36,0.6)",
  btnDisabled: "#4A505E",
  progressBg: "#3A404E",
};

const FONT = `"Sen", ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;

// ---------------------------------------------------------------------------
// Role Selection Component
// ---------------------------------------------------------------------------
function RoleSelection({ colors, onSelect }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "flex-start", 
        width: "100%", 
        minHeight: "100vh", 
        paddingTop: "2vh", // The Mascot component inherently has top empty space, so 2vh is perfect
        paddingBottom: "40px",
        paddingLeft: "20px",
        paddingRight: "20px"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 800, width: "100%" }}>
        
        {/* Mascot & Speech Bubble */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "16px" }}>
          <motion.div
             animate={{ y: [0, -8, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
             <Mascot mood="neutral" size={120} />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
               background: colors.bubbleBg,
               color: colors.bubbleText,
               padding: "16px 24px",
               borderRadius: "20px 20px 20px 4px",
               fontSize: "16px",
               fontWeight: 600,
               boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
               lineHeight: 1.4,
               marginBottom: "20px" // offset to align with mascot center
            }}
          >
            Welcome! How would you like to continue?
          </motion.div>
        </div>

        {/* Headings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", color: colors.bubbleText }}>
             Select how you want to continue
          </h1>
          <p style={{ fontSize: "16px", color: colors.faint, margin: 0 }}>
             Select your role to access the right experience.
          </p>
        </motion.div>
        
        {/* Cards */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          {/* User Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect("user")}
            style={{
              background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: "24px",
              padding: "32px", width: "320px", display: "flex", flexDirection: "column",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04)", transition: "all 0.3s ease",
              position: "relative", overflow: "hidden"
            }}
            onMouseEnter={(e) => { 
                e.currentTarget.style.transform = "translateY(-6px)"; 
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.12)"; 
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.querySelector('.role-icon').style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => { 
                e.currentTarget.style.transform = "translateY(0)"; 
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.04)"; 
                e.currentTarget.style.borderColor = colors.panelBorder;
                e.currentTarget.querySelector('.role-icon').style.transform = "scale(1)";
            }}
          >
            <div className="role-icon" style={{ background: `${colors.pillBg}15`, color: colors.pillBg, width: "64px", height: "64px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", transition: "transform 0.3s ease" }}>
              <User size={32} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0", color: colors.bubbleText }}>Employee</h3>
            <p style={{ fontSize: "15px", color: colors.faint, lineHeight: 1.5, margin: "0 0 32px 0", flex: 1 }}>
              Apply for a loan and upload your documents.
            </p>
            <button style={{
              background: "transparent", border: "none", color: colors.accent, fontSize: "16px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "8px", padding: 0, cursor: "pointer", fontFamily: FONT
            }}>
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Admin Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect("admin")}
            style={{
              flex: 1,background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: "24px",
              padding: "32px", width: "320px", display: "flex", flexDirection: "column",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04)", transition: "all 0.3s ease",
              position: "relative", overflow: "hidden"
            }}
            onMouseEnter={(e) => { 
                e.currentTarget.style.transform = "translateY(-6px)"; 
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.12)"; 
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.querySelector('.role-icon').style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => { 
                e.currentTarget.style.transform = "translateY(0)"; 
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.04)"; 
                e.currentTarget.style.borderColor = colors.panelBorder;
                e.currentTarget.querySelector('.role-icon').style.transform = "scale(1)";
            }}
          >
            <div className="role-icon" style={{ background: `${colors.pillBg}15`, color: colors.pillBg, width: "64px", height: "64px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", transition: "transform 0.3s ease" }}>
              <Briefcase size={32} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0", color: colors.bubbleText }}>Admin</h3>
            <p style={{ margin: 0, color: colors.faint, fontSize: "15px", lineHeight: 1.5 }}>
              Review applications, verify documents, and manage approvals.
            </p>
            <button style={{
              background: "transparent", border: "none", color: colors.accent, fontSize: "16px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "8px", padding: 0, cursor: "pointer", fontFamily: FONT
            }}>
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mascot — completely locked component
// ---------------------------------------------------------------------------
export function Mascot({ mood = "neutral", size = 190, onBoop }) {
  const [booped, setBooped] = useState(false);
  const [entered, setEntered] = useState(false);
  const boopTimer = useRef(null);
  const mascotRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, []);

  const requestRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  
  const headRef = useRef(null);
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) return;

    function onMouseMove(e) {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      const angle = Math.atan2(dy, dx);
      // Eye radius is roughly 10% of size, pupil is 6.5% of size. Max travel is ~3.5% of size.
      const maxDist = size * 0.035;
      const distance = Math.min(Math.hypot(dx, dy) / 40, maxDist);
      
      mousePos.current = {
         x: Math.cos(angle) * distance,
         y: Math.sin(angle) * distance
      };
    }
    
    // Smoothly return to center when mouse leaves window
    function onMouseLeave() {
      mousePos.current = { x: 0, y: 0 };
    }

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const update = () => {
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.12;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * 0.12;

      const cx = currentPos.current.x;
      const cy = currentPos.current.y;

      if (headRef.current) {
        headRef.current.style.transform = `rotateX(${-cy * 0.8}deg) rotateY(${cx * 0.8}deg) rotateZ(${cx * 0.1}deg)`;
      }
      if (eyeLRef.current) {
        eyeLRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
      }
      if (eyeRRef.current) {
        eyeRRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
      }

      requestRef.current = requestAnimationFrame(update);
    };
    
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(requestRef.current);
    };
  }, [size, prefersReducedMotion]);

  function handleBoop() {
    setBooped(true);
    if (boopTimer.current) clearTimeout(boopTimer.current);
    boopTimer.current = setTimeout(() => setBooped(false), 420);
    onBoop?.();
  }

  return (
    <motion.div
      layoutId="shared-mascot-container"
      animate={{
        width: size,
        height: size * 2.2,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <motion.div
        layoutId="shared-mascot-inner"
        className="mascot-enter mascot-sway"
        animate={{
          width: size,
          height: size * 1.94,
          opacity: entered ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          ref={mascotRef}
          className="mascot-bob"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            perspective: "800px",
            perspectiveOrigin: "50% 54.5%", 
            filter: "drop-shadow(0 22px 18px rgba(35,60,100,0.24))",
          }}
          onClick={handleBoop}
          role="button"
          aria-label="mascot"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleBoop()}
        >
          <img
            src={MASCOT_IMG}
            alt="mascot-body"
            draggable={false}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", objectFit: "contain", display: "block",
              clipPath: "polygon(0 54.2%, 100% 54.2%, 100% 100%, 0 100%)",
              userSelect: "none"
            }}
          />

          <div ref={headRef} style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            transformOrigin: "50% 54.5%",
            pointerEvents: "none"
          }}>
            <img
              src={MASCOT_IMG}
              alt="mascot-head"
              draggable={false}
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%", objectFit: "contain", display: "block",
                clipPath: "polygon(0 0, 100% 0, 100% 54.8%, 0 54.8%)",
                userSelect: "none"
              }}
            />

            <div style={{
                position: "absolute", width: "20%", aspectRatio: "1 / 1", borderRadius: "50%",
                left: "41%", top: "37%",
                transform: "translate(-50%, -50%) rotate(-3deg)",
                background: "#FFFFFF", pointerEvents: "none",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <div ref={eyeLRef} style={{
                    position: "absolute", width: "65%", aspectRatio: "1 / 1", borderRadius: "50%",
                    left: "50%", top: "50%",
                    transform: `translate(-50%, -50%)`,
                    background: LIGHT_COLORS.mascotEye,
                }}>
                    <div style={{ position: "absolute", width: "30%", aspectRatio: "1 / 1", borderRadius: "50%", background: "#FFFFFF", left: "15%", top: "15%" }} />
                </div>
            </div>
            
            <div style={{
                position: "absolute", width: "16%", aspectRatio: "1 / 1", borderRadius: "50%",
                left: "76%", top: "36%",
                transform: "translate(-50%, -50%) rotate(3deg)",
                background: "#FFFFFF", pointerEvents: "none",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <div ref={eyeRRef} style={{
                    position: "absolute", width: "65%", aspectRatio: "1 / 1", borderRadius: "50%",
                    left: "50%", top: "50%",
                    transform: `translate(-50%, -50%)`,
                    background: LIGHT_COLORS.mascotEye,
                }}>
                    <div style={{ position: "absolute", width: "30%", aspectRatio: "1 / 1", borderRadius: "50%", background: "#FFFFFF", left: "15%", top: "15%" }} />
                </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mascot-shadow" style={{ width: size * 0.58, height: size * 0.08, marginTop: -(size * 0.28) }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(120,145,190,0.3) 0%, rgba(120,145,190,0) 72%)",
          }}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Speech bubble with typewriter effect (updated for conversation layout)
// ---------------------------------------------------------------------------
function SpeechBubble({ text, type, colors, animate = true }) {
  const [shownLen, setShownLen] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) {
        setShownLen(text.length);
        return;
    }
    setShownLen(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShownLen(i);
      if (i >= text.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [text, animate]);

  const isBot = type === "bot";

  let charCount = 0;
  const words = text.split(" ");

  return (
    <div
      className={animate ? "bubble-in" : ""}
      style={{
        background: isBot ? colors.botBubbleBg : colors.userBubbleBg,
        color: isBot ? colors.bubbleText : colors.userBubbleText,
        padding: "16px 22px",
        borderRadius: 20,
        borderBottomRightRadius: isBot ? 20 : 4,
        borderBottomLeftRadius: isBot ? 4 : 20,
        boxShadow: isBot ? "0 4px 14px rgba(0,0,0,0.06)" : "none",
        fontSize: animate ? 22 : 18, 
        fontWeight: animate ? 600 : 500,
        maxWidth: 320,
        maxHeight: "40vh",
        overflowY: "auto",
        lineHeight: 1.35,
        alignSelf: isBot ? "flex-start" : "flex-end",
        marginBottom: animate ? 0 : 12,
        position: "relative",
      }}
    >
      {words.map((word, wIdx) => {
        const isLastWord = wIdx === words.length - 1;
        const letters = word.split("");
        return (
          <span key={wIdx}>
            <span style={{ whiteSpace: "nowrap" }}>
              {letters.map((char, cIdx) => {
                const i = charCount++;
                return (
                  <span
                    key={cIdx}
                    className={animate ? "bubbly-letter" : ""}
                    style={{
                      display: i < shownLen ? "inline-block" : "none",
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
            {!isLastWord && (
              <span style={{ display: charCount++ < shownLen ? "inline" : "none" }}>
                {" "}
              </span>
            )}
          </span>
        );
      })}
      {animate && <span style={{ opacity: shownLen < text.length ? 1 : 0 }}>▍</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pill button (quick-reply / suggestion chip)
// ---------------------------------------------------------------------------
function Pill({ children, onClick, tone = "muted", colors }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: tone === "solid" ? colors.pillBg : colors.pillMuted,
        color: colors.pillText,
        border: "none",
        borderRadius: 999,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: FONT,
        transition: "transform 120ms ease, opacity 120ms ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dot-grid background
// ---------------------------------------------------------------------------
function DotGrid({ colors }) {
  const gridRef = useRef(null);

  useEffect(() => {
    function onMouseMove(e) {
      if (gridRef.current) {
        gridRef.current.style.setProperty('--x', `${e.clientX}px`);
        gridRef.current.style.setProperty('--y', `${e.clientY}px`);
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      ref={gridRef}
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${colors.dot} 2px, transparent 2px)`,
        backgroundSize: "26px 26px",
        maskImage: `radial-gradient(circle 350px at var(--x, 50vw) var(--y, 50vh), black 0%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle 350px at var(--x, 50vw) var(--y, 50vh), black 0%, transparent 100%)`,
        pointerEvents: "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Flow
// ---------------------------------------------------------------------------
const NAME_SUGGESTIONS = ["Bunny", "Lora", "Dara", "Alix", "Billie"];

// ---------------------------------------------------------------------------
// Login Form Component (User Side Authentication)
// ---------------------------------------------------------------------------
function LoginForm({ colors, theme, onComplete, onStartOnboarding }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;
    setError("");

    try {
      if (isForgotPassword) {
        if (!email.trim() || !email.includes("@")) return setError("Valid email is required");
        setIsLoading(true);
        await authService.sendPasswordReset(email);
        setIsResetSent(true);
      } else if (isSignUp) {
        await handleGoogleAuth();
      } else {
        if (!email.trim() || !email.includes("@")) return setError("Valid email is required");
        if (!password.trim()) return setError("Password is required");
        setIsLoading(true);
        const { user, isNewUser } = await authService.signInWithEmail(email, password);
        onComplete(user, isNewUser);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const { user, isNewUser } = await authService.signInWithGoogle();
      onComplete(user, isNewUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    borderRadius: 14,
    border: `1px solid ${colors.panelBorder}`,
    fontSize: 15,
    fontFamily: FONT,
    outline: "none",
    background: colors.bubbleBg,
    color: colors.bubbleText,
    marginBottom: 12,
    boxSizing: "border-box"
  };

  return (
    <div className="auth-in" style={{
      display: "flex",
      flexDirection: "column",
      alignSelf: "flex-end",
      marginLeft: "auto",
      width: "100%",
      maxWidth: 340,
      gap: 8,
    }}>
      <style>{`
        @keyframes authFadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-in {
          animation: authFadeSlideUp 0.5s ease-out forwards;
        }
      `}</style>
      
      {!isForgotPassword && (
        <>
          <button 
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              border: `1px solid ${colors.panelBorder}`,
              background: colors.bubbleBg,
              color: colors.bubbleText,
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              fontFamily: FONT,
              boxSizing: "border-box"
            }}
            disabled={isLoading}
            onClick={handleGoogleAuth}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? "Please wait..." : (isSignUp ? "Sign up with Google" : "Continue with Google")}
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0", color: colors.faint, fontSize: 13, fontWeight: 500 }}>
            <div style={{ flex: 1, height: 1, background: colors.panelBorder }} />
            or
            <div style={{ flex: 1, height: 1, background: colors.panelBorder }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        {isSignUp && !isForgotPassword && (
          <input 
            placeholder="Your name" 
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          style={inputStyle}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {!isForgotPassword && (
          <input 
            type="password" 
            placeholder="Password" 
            style={{ ...inputStyle, marginBottom: error ? 8 : 16 }}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}
        
        {error && (
          <div style={{ color: "#ea4335", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{error}</div>
        )}
        
        {isResetSent ? (
          <div style={{ color: colors.accent, fontSize: 14, marginBottom: 16, textAlign: "center", fontWeight: 500 }}>
            Password reset email sent.
          </div>
        ) : (
          <button 
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              border: "none",
              background: colors.accent,
              color: colors.bgTop,
              fontSize: 16,
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              fontFamily: FONT,
              marginBottom: 16,
              boxSizing: "border-box"
            }}
          >
            {isLoading 
              ? (isForgotPassword ? "Sending..." : isSignUp ? "Creating account..." : "Signing in...") 
              : (isForgotPassword ? "Send reset link" : isSignUp ? "Create account" : "Sign in")}
          </button>
        )}
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
        {!isSignUp && !isForgotPassword && (
          <div onClick={() => { if(!isLoading) { setIsForgotPassword(true); setError(""); setIsResetSent(false); } }} style={{ color: colors.faint, cursor: "pointer" }}>Forgot password?</div>
        )}
        {isForgotPassword ? (
          <div onClick={() => { if(!isLoading) { setIsForgotPassword(false); setError(""); setIsResetSent(false); } }} style={{ color: colors.accent, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
            Back to sign in
          </div>
        ) : (
          <div 
            onClick={() => { 
              if(!isLoading) { 
                setIsSignUp(!isSignUp); 
                setError(""); 
              } 
            }}
            style={{ color: colors.accent, fontWeight: 600, cursor: isLoading ? "default" : "pointer", marginLeft: isSignUp ? 0 : "auto" }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </div>
        )}
      </div>

    </div>
  );
}

export default function MascotOnboarding() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  const [hasEnteredApp, setHasEnteredApp] = useState(() => {
    const session = authService.getCurrentUser();
    if (session && session.email) {
      const reg = authService.getRegisteredUser(session.email) || session;
      if (reg.role === 'BANK_EMPLOYEE' || reg.role === 'BANK_MANAGER') return true;
      return !!reg.onboardingCompleted;
    }
    return false;
  });

  const [appRole, setAppRole] = useState(() => {
    const session = authService.getCurrentUser();
    if (session && session.email) {
      const reg = authService.getRegisteredUser(session.email) || session;
      if (reg.role === 'BANK_EMPLOYEE' || reg.role === 'BANK_MANAGER') return 'admin';
      return 'user';
    }
    return localStorage.getItem("mascot_appRole") || null;
  });

  const [step, setStep] = useState(() => {
    const session = authService.getCurrentUser();
    if (!session) return 4;
    const reg = authService.getRegisteredUser(session.email) || session;
    if (reg.onboardingCompleted) return 4;
    const saved = typeof reg.onboardingStep === 'number' ? reg.onboardingStep : 4;
    return saved < 4 ? saved : 4;
  });

  const [employeeView, setEmployeeView] = useState(() => {
    return localStorage.getItem('mascot_employeeView') || "dashboard";
  });

  const [authData, setAuthData] = useState(() => {
    const session = authService.getCurrentUser();
    if (session && session.email) {
      const reg = authService.getRegisteredUser(session.email) || session;
      return { user: reg, isNewUser: !reg.onboardingCompleted };
    }
    const saved = localStorage.getItem('mascot_authData');
    return saved ? JSON.parse(saved) : { user: null, isNewUser: false };
  });

  useEffect(() => { localStorage.setItem('mascot_step', step); }, [step]);
  useEffect(() => { localStorage.setItem('mascot_hasEnteredApp', hasEnteredApp); }, [hasEnteredApp]);
  useEffect(() => { localStorage.setItem('mascot_employeeView', employeeView); }, [employeeView]);
  useEffect(() => { localStorage.setItem('mascot_authData', JSON.stringify(authData)); }, [authData]);

  const [welcomeUser, setWelcomeUser] = useState(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const initialAuthLoadRef = useRef(true);
  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [onboardingAnswers, setOnboardingAnswers] = useState({ name: "", age: "", city: "", profession: "" });
  const inputRef = useRef(null);

  const handleAuthComplete = (user, isNewUser) => {
    const cleanEmail = (user?.email || "").trim().toLowerCase();
    const registered = (cleanEmail ? authService.getRegisteredUser(cleanEmail) : null) || user;
    const nameToDisplay = registered?.name || registered?.displayName || user?.name || user?.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'user');

    if (registered && registered.onboardingCompleted) {
      setAuthData({ user: registered, isNewUser: false });
      setAppRole('user');
      setWelcomeUser({ ...(user || {}), ...(registered || {}), displayName: nameToDisplay, isNewUser: false });
      setShowWelcomeBack(true);
    } else {
      const initialAnswers = {
        name: registered?.onboardingData?.name || registered?.name || registered?.displayName || user?.name || user?.displayName || onboardingAnswers.name || "",
        age: registered?.onboardingData?.age || onboardingAnswers.age || "",
        city: registered?.onboardingData?.city || onboardingAnswers.city || "",
        profession: registered?.onboardingData?.profession || onboardingAnswers.profession || ""
      };
      
      setOnboardingAnswers(initialAnswers);
      const startStep = typeof registered?.onboardingStep === 'number' && registered.onboardingStep < 4 ? registered.onboardingStep : 0;
      setStep(startStep);
      setInputVal(startStep === 0 && initialAnswers.name ? initialAnswers.name : "");
      
      setAuthData({ user: registered || user, isNewUser: true });
      setAppRole('user');
      setHasEnteredApp(false);
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    const checkAuthStatus = () => {
      const sessionUser = authService.getCurrentUser();
      if (sessionUser && sessionUser.email) {
        const cleanEmail = sessionUser.email.trim().toLowerCase();
        const registered = authService.getRegisteredUser(cleanEmail) || sessionUser;
        const isCompleted = !!registered.onboardingCompleted;

        setAuthData({ user: registered, isNewUser: !isCompleted });

        if (registered.role === 'BANK_EMPLOYEE' || registered.role === 'BANK_MANAGER') {
          setAppRole('admin');
          setHasEnteredApp(true);
        } else if (isCompleted) {
          setAppRole('user');
          setHasEnteredApp(true);
        } else {
          setAppRole('user');
          setHasEnteredApp(false);
          if (registered.onboardingData) {
            setOnboardingAnswers(registered.onboardingData);
          }
          const savedStep = typeof registered.onboardingStep === 'number' ? registered.onboardingStep : 4;
          const validStep = savedStep >= 0 && savedStep < 4 ? savedStep : 4;
          setStep(validStep);
        }
      } else {
        localStorage.removeItem('mascot_step');
        localStorage.removeItem('mascot_hasEnteredApp');
        setHasEnteredApp(false);
        setStep(4);
      }
    };

    if (auth && auth.onAuthStateChanged) {
      unsubscribe = auth.onAuthStateChanged(() => {
        if (initialAuthLoadRef.current) {
          checkAuthStatus();
          initialAuthLoadRef.current = false;
        }
      });
    } else {
      checkAuthStatus();
    }
    return () => unsubscribe();
  }, []);

  // Conversation history: { type: 'bot' | 'user', text: string }
  const [conversationLog, setConversationLog] = useState([]);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [step, conversationLog]);

  const toggleTheme = () => {
    setTheme(t => t === "light" ? "dark" : "light");
  };

  const steps = [
    {
      mood: "neutral",
      prompt: "What's your name?",
      body: (
        <div style={{ display: "flex", gap: 10, marginTop: 14, width: "100%", justifyContent: "flex-end" }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your name"
            style={{
              width: "100%",
              maxWidth: 300,
              padding: "16px 20px",
              borderRadius: 14,
              border: `1px solid ${colors.panelBorder}`,
              fontSize: 16,
              fontFamily: FONT,
              outline: "none",
              background: colors.bubbleBg,
              color: colors.bubbleText,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputVal.trim()) advance();
            }}
          />
        </div>
      ),
      canContinue: () => inputVal.trim().length > 0,
      getUserReply: () => inputVal.trim(),
    },
    {
      mood: "neutral",
      prompt: "How old are you?",
      body: (
        <div style={{ display: "flex", gap: 10, marginTop: 14, width: "100%", justifyContent: "flex-end" }}>
          <input
            ref={inputRef}
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. 21"
            style={{
              width: "100%",
              maxWidth: 300,
              padding: "16px 20px",
              borderRadius: 14,
              border: `1px solid ${colors.panelBorder}`,
              fontSize: 16,
              fontFamily: FONT,
              outline: "none",
              background: colors.bubbleBg,
              color: colors.bubbleText,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputVal.trim()) advance();
            }}
          />
        </div>
      ),
      canContinue: () => inputVal.trim().length > 0,
      getUserReply: () => inputVal.trim(),
    },
    {
      mood: "happy",
      prompt: "Where are you from?",
      body: (
        <div style={{ display: "flex", gap: 10, marginTop: 14, width: "100%", justifyContent: "flex-end" }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. Hyderabad"
            style={{
              width: "100%",
              maxWidth: 300,
              padding: "16px 20px",
              borderRadius: 14,
              border: `1px solid ${colors.panelBorder}`,
              fontSize: 16,
              fontFamily: FONT,
              outline: "none",
              background: colors.bubbleBg,
              color: colors.bubbleText,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputVal.trim()) advance();
            }}
          />
        </div>
      ),
      canContinue: () => inputVal.trim().length > 0,
      getUserReply: () => inputVal.trim(),
    },
    {
      mood: "happy",
      prompt: "What is your occupation?",
      body: (
        <div style={{ display: "flex", gap: 10, marginTop: 14, width: "100%", justifyContent: "flex-end" }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. Software Engineer"
            style={{
              width: "100%",
              maxWidth: 300,
              padding: "16px 20px",
              borderRadius: 14,
              border: `1px solid ${colors.panelBorder}`,
              fontSize: 16,
              fontFamily: FONT,
              outline: "none",
              background: colors.bubbleBg,
              color: colors.bubbleText,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputVal.trim()) advance();
            }}
          />
        </div>
      ),
      canContinue: () => inputVal.trim().length > 0,
      getUserReply: () => inputVal.trim(),
    },
    {
      mood: "happy",
      prompt: "Please sign in or create an account to continue.",
      body: <LoginForm colors={colors} theme={theme} onComplete={handleAuthComplete} />,
      canContinue: () => false,
      getUserReply: () => null,
    }
  ];

  function advance() {
    const currentStepObj = steps[step];
    if (!currentStepObj.canContinue()) return;

    const currentVal = inputVal.trim();
    const updatedAnswers = { ...onboardingAnswers };

    if (step === 0) {
      setUserName(currentVal);
      updatedAnswers.name = currentVal;
    } else if (step === 1) {
      updatedAnswers.age = currentVal;
    } else if (step === 2) {
      updatedAnswers.city = currentVal;
    } else if (step === 3) {
      updatedAnswers.profession = currentVal;
    }
    setOnboardingAnswers(updatedAnswers);

    if (step === 3) {
      if (authData.user && authData.user.email) {
        const updated = authService.updateUserProfile(authData.user.email, updatedAnswers, true, 3);
        setAuthData({ user: updated, isNewUser: false });
        const nameToDisplay = updated.name || updated.displayName || updated.email.split('@')[0];
        setWelcomeUser({ ...updated, displayName: nameToDisplay, isNewUser: true });
        setShowWelcomeBack(true);
      } else {
        setInputVal("");
        setStep(4);
      }
    } else if (step < steps.length - 1) {
      const nextStep = step + 1;
      if (authData.user && authData.user.email) {
        authService.updateUserProfile(authData.user.email, updatedAnswers, false, nextStep);
      }
      setInputVal("");
      setStep(nextStep);
    }
  }

  const current = showWelcomeBack ? {
    mood: "happy",
    prompt: welcomeUser?.isNewUser 
      ? `Welcome, ${welcomeUser?.displayName || welcomeUser?.name || 'user'}!`
      : `Welcome back, ${welcomeUser?.displayName || welcomeUser?.name || 'user'}!`,
    body: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, width: "100%", maxWidth: 320, alignItems: "flex-start" }}>
        <div style={{ fontSize: 15, color: colors.faint, fontWeight: 500 }}>
          {welcomeUser?.isNewUser ? "Great to have you here. Let's continue." : "Good to see you again. Let's continue."}
        </div>
        <button
          onClick={() => {
            setShowWelcomeBack(false);
            setHasEnteredApp(true);
          }}
          style={{
            width: "100%",
            padding: "16px 20px",
            borderRadius: 14,
            border: "none",
            background: colors.accent,
            color: colors.bgTop,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT,
            marginTop: 8,
            boxSizing: "border-box"
          }}
        >
          Continue
        </button>
      </div>
    ),
    canContinue: () => false
  } : (steps[step] || steps[steps.length - 1]);

  return (
    <div
      style={{
        fontFamily: FONT,
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: hasEnteredApp ? "auto" : "hidden",
        background: `linear-gradient(180deg, ${colors.bgTop}, ${colors.bgBottom})`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        color: colors.bubbleText,
        transition: "background 0.3s ease"
      }}
    >
      <DotGrid colors={colors} />

      {/* The Floating Mascot is now handled by Dashboard's ContextualMascot component,
         so we no longer render a separate one here to avoid duplication. */}

      <AnimatePresence mode="wait">
        {!hasEnteredApp ? (
          appRole === null ? (
            <RoleSelection key="role-select" colors={colors} onSelect={(r) => { 
              setAppRole(r); 
              localStorage.setItem('mascot_appRole', r); 
              if (r === 'user') {
                const session = authService.getCurrentUser();
                if (session && session.email) {
                  const reg = authService.getRegisteredUser(session.email) || session;
                  if (reg.onboardingCompleted) {
                    setHasEnteredApp(true);
                  } else {
                    setStep(typeof reg.onboardingStep === 'number' && reg.onboardingStep < 4 ? reg.onboardingStep : 4);
                  }
                } else {
                  setStep(4);
                }
              }
            }} />
          ) : appRole === 'admin' ? (
            <EmployeeLogin 
              key="admin-login" 
              colors={colors} 
              theme={theme} 
              onLogin={(user) => { setAuthData({ user, isNewUser: false }); setHasEnteredApp(true); }} 
              onBack={() => { setAppRole(null); localStorage.removeItem('mascot_appRole'); }} 
            />
          ) : (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "auto minmax(320px, 420px)",
                alignItems: "center", 
                justifyContent: "center",
                flex: 1,
                padding: "40px 5vw",
                columnGap: "50px",
              }}
            >
              {/* Left Column: Native Mascot */}
              <motion.div 
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
              >
                  <Mascot mood={current.mood} size={260} />
              </motion.div>

              {/* Right Column: Conversation Anchor */}
              <div 
                style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "center",
                }}>
                
                <div 
                  style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px",
                      gap: 16
                  }}>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
                      {/* Render Current Prominent Question */}
                      <SpeechBubble 
                          key={`current-${step}`} 
                          text={current.prompt} 
                          type="bot" 
                          colors={colors} 
                          animate={true} 
                      />
                      
                      {/* Render Current Input/Body */}
                      {current.body && (
                          <div className="bubble-in" style={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", marginLeft: "auto" }}>
                              {current.body}
                          </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* bottom bar */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 28px",
                borderTop: `1px solid ${colors.panelBorder}`,
                background: colors.panelBg,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <button
                onClick={() => {
                    if (step === 4) {
                        setAppRole(null);
                        localStorage.removeItem('mascot_appRole');
                    } else if (step === 0) {
                        setStep(4);
                    } else if (step > 0 && step < 4) {
                        setConversationLog(log => log.slice(0, -2));
                        setStep((s) => s - 1);
                    } else if (appRole === 'user') {
                        setAppRole(null);
                        localStorage.removeItem('mascot_appRole');
                    }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontFamily: FONT,
                  fontWeight: 600,
                  color: colors.accent,
                  cursor: "pointer",
                  fontSize: 15,
                  opacity: 1,
                }}
              >
                Back
              </button>

              {appRole === 'user' && step < 4 && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {steps.slice(0, 4).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === step ? 18 : 6,
                          height: 6,
                          borderRadius: 999,
                          background: i === step ? colors.pillBg : colors.progressBg,
                          transition: "width 200ms ease, background 200ms ease",
                        }}
                      />
                    ))}
                  </div>
              )}

              <button
                onClick={advance}
                disabled={!current.canContinue()}
                style={{
                  background: current.canContinue() ? colors.pillBg : colors.btnDisabled,
                  color: current.canContinue() ? "white" : "rgba(255,255,255,0.6)",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 22px",
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: current.canContinue() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease"
                }}
              >
                {step === steps.length - 1 ? current.finalLabel || "Continue" : "Continue"}
                <span style={{ fontSize: 15 }}>↵</span>
              </button>
            </div>
          </motion.div>
          )
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", inset: 0, overflowY: "auto" }}
          >
            {appRole === 'admin' ? (
              employeeView === 'dashboard' ? (
                <EmployeeDashboard 
                  colors={colors} 
                  theme={theme} 
                  toggleTheme={toggleTheme}
                  onStartProcessing={() => setEmployeeView("processing")}
                  onSignOut={() => {
                    localStorage.removeItem('demo_session');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('mascot_appRole');
                    localStorage.removeItem('mascot_hasEnteredApp');
                    localStorage.removeItem('mascot_authData');
                    localStorage.removeItem('mascot_employeeView');
                    auth.signOut();
                    setAuthData({ user: null, isNewUser: false });
                    setHasEnteredApp(false);
                    setAppRole(null);
                    setStep(4);
                  }} 
                />
              ) : (
                <Dashboard 
                  colors={colors} 
                  theme={theme} 
                  toggleTheme={toggleTheme}
                  onSignOut={() => setEmployeeView("dashboard")} 
                  isEmployee={true}
                />
              )
            ) : (
              <Dashboard 
                colors={colors} 
                theme={theme} 
                toggleTheme={toggleTheme}
                onSignOut={() => {
                  localStorage.removeItem('demo_session');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('mascot_step');
                  localStorage.removeItem('mascot_hasEnteredApp');
                  localStorage.removeItem('mascot_authData');
                  localStorage.removeItem('mascot_appRole');
                  localStorage.removeItem('mascot_employeeView');
                  localStorage.removeItem('currentPage');
                  localStorage.removeItem('selectedLoanType');
                  localStorage.removeItem('docStatuses');
                  localStorage.removeItem('analysisResults');
                  localStorage.removeItem('applicationId');
                  auth.signOut();
                  setAuthData({ user: null, isNewUser: false });
                  setHasEnteredApp(false);
                  setAppRole(null);
                  setStep(4);
                  setOnboardingAnswers({ name: "", age: "", city: "", profession: "" });
                  setInputVal("");
                }} 
                isEmployee={false}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sen:wght@400;500;600;700;800&display=swap');
        .bubble-in {
          animation: bubbleIn 350ms cubic-bezier(.2,.9,.3,1.2) forwards;
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes giggle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        .bubbly-letter {
          animation: giggle 2.8s ease-in-out infinite;
        }
        .mascot-enter {
          animation: mascotEnter 640ms cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes mascotEnter {
          from { opacity: 0; transform: translateY(26px) scale(0.82); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mascot-sway {
          animation: mascotSway 6.4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes mascotSway {
          0%, 100% { transform: rotate(-2.2deg); }
          50% { transform: rotate(2.2deg); }
        }
        .mascot-bob {
          animation: mascotBob 3.5s ease-in-out infinite;
          transform-origin: bottom center;
          will-change: transform;
        }
        @keyframes mascotBob {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          45% { transform: translateY(-10px) scale(0.99, 1.02); }
          55% { transform: translateY(-10px) scale(0.99, 1.02); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        .mascot-boop {
          animation: mascotBoop 420ms cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes mascotBoop {
          0% { transform: scale(1, 1); }
          35% { transform: scale(1.12, 0.86); }
          65% { transform: scale(0.94, 1.08); }
          100% { transform: scale(1, 1); }
        }
        .mascot-shadow {
          animation: mascotShadow 3.5s ease-in-out infinite;
        }
        @keyframes mascotShadow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(0.85); opacity: 0.4; }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(120, 140, 160, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(120, 140, 160, 0.5);
        }
        @media (prefers-reduced-motion: reduce) {
          .bubble-in,
          .mascot-enter,
          .mascot-sway,
          .mascot-bob,
          .mascot-boop,
          .mascot-shadow,
          .dot-grid-anim,
          .bubbly-letter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

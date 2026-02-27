import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "blueprint_welcomed";

export function hasBeenWelcomed(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) !== null;
}

export function setWelcomed(): void {
  localStorage.setItem(STORAGE_KEY, "1");
}

interface WelcomeScreenProps {
  onContinue: () => void;
}

const GRID_SHAPES = [
  { x: 8, y: 15, size: 18, delay: 0.4, dur: 7 },
  { x: 88, y: 22, size: 12, delay: 1.1, dur: 6 },
  { x: 78, y: 68, size: 22, delay: 0.7, dur: 8 },
  { x: 15, y: 72, size: 14, delay: 1.5, dur: 7 },
  { x: 55, y: 6, size: 10, delay: 0.9, dur: 6 },
  { x: 92, y: 45, size: 16, delay: 0.3, dur: 7.5 },
  { x: 5, y: 48, size: 20, delay: 1.8, dur: 6.5 },
  { x: 65, y: 85, size: 12, delay: 0.6, dur: 8 },
];

const LETTERS = ["B", "l", "u", "e", "p", "r", "i", "n", "t"];

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [visible, setVisible] = useState(true);

  const handleContinue = () => {
    setWelcomed();
    setVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={onContinue}>
      {visible && (
        <motion.div
          key="welcome"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            background: "radial-gradient(ellipse 100% 90% at 50% 50%, #0d1f38 0%, #07111f 50%, #030810 100%)",
          }}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.96,
            filter: "blur(8px)",
            transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] },
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
                linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
                linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)",
            }}
          />

          <motion.div
            style={{
              position: "absolute",
              width: 700,
              height: 700,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)",
              filter: "blur(40px)",
              top: "50%",
              left: "50%",
              translateX: "-50%",
              translateY: "-50%",
              pointerEvents: "none",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            style={{
              position: "absolute",
              top: -100,
              right: -80,
              width: 450,
              height: 450,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
            animate={{ x: [0, -25, 0], y: [0, 18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            style={{
              position: "absolute",
              bottom: -80,
              left: -60,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />

          {GRID_SHAPES.map((shape, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: shape.size,
                height: shape.size,
                border: "1px solid rgba(14,165,233,0.35)",
                borderRadius: "2px",
                pointerEvents: "none",
              }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 0.6, 0.3, 0.6, 0],
                scale: [0, 1, 0.85, 1, 0],
                rotate: [0, 45, 45, 90, 90],
              }}
              transition={{
                delay: shape.delay,
                duration: shape.dur,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: 40, position: "relative" }}>
              <motion.div
                style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: "1.75rem",
                  background: "linear-gradient(135deg, rgba(14,165,233,0.45), rgba(56,189,248,0.3))",
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }}
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                style={{
                  position: "relative",
                  width: 88,
                  height: 88,
                  borderRadius: "1.5rem",
                  background: "linear-gradient(145deg, rgba(14,165,233,0.2) 0%, rgba(56,189,248,0.1) 100%)",
                  border: "1px solid rgba(14,165,233,0.4)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              >
                <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="bg_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <motion.rect
                    x="18" y="18" width="64" height="64" rx="10"
                    stroke="url(#bg_grad)" strokeWidth="4" fill="rgba(14,165,233,0.08)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.path
                    d="M 32 30 L 32 70 M 32 30 L 52 30 Q 62 30 62 42 Q 62 53 52 53 L 32 53 M 32 53 L 55 53 Q 68 53 68 62 Q 68 70 55 70 L 32 70"
                    stroke="rgba(255,255,255,0.92)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", marginBottom: 12, letterSpacing: "0.04em" }}>
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  style={{
                    fontSize: "3.25rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                  initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 1.3 + i * 0.055,
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.p
              style={{
                color: "rgba(56,189,248,0.55)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: 0,
                fontFamily: "'Manrope', sans-serif",
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.95, duration: 0.5 }}
            >
              Управление бизнесом
            </motion.p>
          </div>

          <motion.div
            style={{ position: "absolute", bottom: 40, right: 40 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.45 }}
          >
            <motion.button
              onClick={handleContinue}
              whileHover={{ scale: 1.05, borderColor: "rgba(14,165,233,0.7)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 28px",
                borderRadius: 10,
                overflow: "hidden",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.9)",
                background: "rgba(14,165,233,0.12)",
                border: "1px solid rgba(14,165,233,0.35)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              <motion.span
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(105deg, transparent 25%, rgba(56,189,248,0.15) 50%, transparent 75%)",
                  translateX: "-100%",
                  pointerEvents: "none",
                }}
                animate={{ translateX: ["-100%", "250%"] }}
                transition={{
                  delay: 3.0,
                  duration: 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 4,
                }}
              />
              Начать работу
              <motion.svg
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                animate={{ x: [0, 4, 0] }}
                transition={{ delay: 2.7, duration: 1.3, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </motion.button>
          </motion.div>

          <motion.div
            style={{
              position: "absolute",
              bottom: 40,
              left: 40,
              color: "rgba(255,255,255,0.18)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              fontFamily: "'Manrope', sans-serif",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            v0.1.0
          </motion.div>

          <motion.div
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(14,165,233,0.4)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              fontFamily: "'Manrope', sans-serif",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
          >
            <motion.span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#0ea5e9",
                display: "inline-block",
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            READY
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const BALLS = [
  { left: "8%", top: "18%", size: 18, color: "#fd960b", delay: "0s", duration: "18s" },
  { left: "22%", top: "72%", size: 12, color: "#0aada7", delay: "2s", duration: "22s" },
  { left: "78%", top: "14%", size: 16, color: "#8bc34a", delay: "4s", duration: "20s" },
  { left: "88%", top: "62%", size: 14, color: "#fd960b", delay: "1s", duration: "24s" },
  { left: "48%", top: "8%", size: 10, color: "#0aada7", delay: "6s", duration: "16s" },
  { left: "64%", top: "80%", size: 20, color: "#f5c400", delay: "3s", duration: "26s" },
  { left: "12%", top: "48%", size: 11, color: "#26c6da", delay: "5s", duration: "19s" },
  { left: "92%", top: "32%", size: 13, color: "#0aada7", delay: "7s", duration: "21s" },
];

export function AmbientBalls() {
  return (
    <div className="tv-ambient pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BALLS.map((ball, index) => (
        <span
          key={index}
          className="tv-float absolute rounded-full opacity-25"
          style={{
            left: ball.left,
            top: ball.top,
            width: ball.size,
            height: ball.size,
            background: ball.color,
            boxShadow: `0 0 18px ${ball.color}`,
            animationDelay: ball.delay,
            animationDuration: ball.duration,
          }}
        />
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";

export default function SecureScreen({ children }) {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div className="relative overflow-hidden will-change-transform transform-gpu">
      <div className={`${isBlurred ? "brightness-0" : ""} transition-all`}>
        {children}
      </div>

      {isBlurred && (
        <div className="absolute inset-0 bg-black z-50 pointer-events-none" />
      )}
    </div>
  );
}

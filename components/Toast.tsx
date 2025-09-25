import { useEffect } from "react";
import { FaLightbulb } from "react-icons/fa";

type ToastProps = {
  message: string;
  type?: "info" | "success" | "error";
  duration?: number;
  onClose?: () => void;
};

export default function Toast({ message, type = "info", duration = 10000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors =
    type === "success"
      ? "bg-green-50 text-green-800 border-green-200"
      : type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-blue-50 text-blue-800 border-blue-200";

  return (
   <div
      className={`fixed top-6 right-6 max-w-xs w-full p-3 border border-white/30 rounded-lg shadow-md
        flex gap-3 bg-white/30 backdrop-blur-sm transform transition-all duration-300 animate-fadeIn`}
    >
      <FaLightbulb className="text-yellow-400 text-xl flex-shrink-0 mt-1" />
      <span className="text-blue-800 font-mono whitespace-pre-line">{message}</span>
    </div>
  );
}

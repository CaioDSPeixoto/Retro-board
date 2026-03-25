type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "white" | "gray";
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-6 h-6 border-[3px]",
};

const colorMap = {
  blue: "border-blue-600/30 border-t-blue-600",
  white: "border-white/30 border-t-white",
  gray: "border-gray-300 border-t-gray-600",
};

export default function Spinner({ size = "md", color = "blue", className = "", label }: SpinnerProps) {
  return (
    <div
      className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]} ${className}`}
      role="status"
      aria-label={label || "Loading"}
    />
  );
}

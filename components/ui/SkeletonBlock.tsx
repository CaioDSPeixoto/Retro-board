type Props = {
  className?: string;
};

export default function SkeletonBlock({ className = "" }: Props) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: "var(--color-border)" }} />;
}

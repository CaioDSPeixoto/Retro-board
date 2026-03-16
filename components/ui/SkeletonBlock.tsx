type Props = {
  className?: string;
};

export default function SkeletonBlock({ className = "" }: Props) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />;
}

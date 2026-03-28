
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: borderRadius ?? 'var(--radius-md)' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:20, display:'flex', flexDirection:'column', gap:12 }}>
      <Skeleton height="18px" width="60%" />
      <Skeleton height="12px" width="90%" />
      <Skeleton height="12px" width="75%" />
      <Skeleton height="12px" width="80%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--color-border)' }}>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <Skeleton height="13px" width="40%" />
        <Skeleton height="11px" width="60%" />
      </div>
      <Skeleton width={60} height="24px" borderRadius="var(--radius-full)" />
    </div>
  );
}

export default Skeleton;

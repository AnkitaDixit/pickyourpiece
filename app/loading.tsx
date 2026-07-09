import MainLayout from "@/components/layout/MainLayout";
import SkeletonCard from "@/components/cards/SkeletonCard";

export default function Loading() {
  return (
    <MainLayout>
      <div className="filterbar" aria-hidden="true">
        <div className="filterbar-left">
          <div className="filter-btn-primary">Loading filters...</div>
        </div>
      </div>
      <div className="content-grid">
        {Array.from({ length: 48 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </MainLayout>
  );
}

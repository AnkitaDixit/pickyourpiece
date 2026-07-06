import MainLayout from "@/components/layout/MainLayout";
import FilterBar from "@/components/search/FilterBar";
import SkeletonCard from "@/components/cards/SkeletonCard";

export default function Home() {
  return (
    <MainLayout>
      <FilterBar />
      <div className="content-grid">
        {Array.from({ length: 48 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </MainLayout>
  );
}

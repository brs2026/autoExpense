import BottomNav from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-md">
        {children}
      </div>

      <BottomNav />
    </main>
  );
}
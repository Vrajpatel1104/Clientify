import Search from "@/components/Search";

export default function Home() {
  return (
    <main className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-900">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-200 mb-3">
          <span className="text-blue-600">Smart Lead Generation</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">
          Find local businesses, track your outreach, and automate your sales process.
        </p>
      </div>

      <Search />
    </main>
  );
}

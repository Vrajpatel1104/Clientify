"use client";
import { useState } from "react";
import Results from "./Results";

const POPULAR_CATEGORIES = [
  "Restaurant", "Hair Salon", "Gym", "Dentist", "Lawyer", "Real Estate",
  "Auto Repair", "Plumber", "Electrician", "Accountant", "Insurance",
  "Pet Grooming", "Dry Cleaner", "Bakery", "Coffee Shop", "Barber Shop",
  "Massage Therapy", "Chiropractor", "Veterinarian", "Photographer",
  "Wedding Planner", "Landscaping", "Roofing", "HVAC", "Painter"
];

const POPULAR_LOCATIONS = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
  "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville",
  "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville"
];

export default function Search() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<Array<{title: string, address: string, phone?: string, website?: string, email?: string, type?: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{category: string, location: string}>>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category || !location) {
      alert("Please enter both category and location");
      return;
    }

    // Save to recent searches
    const newSearch = { category, location };
    setRecentSearches(prev => {
      const filtered = prev.filter(search => 
        !(search.category === category && search.location === location)
      );
      return [newSearch, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });

    setLoading(true);
    try {
      const res = await fetch(`/api/businesses?category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", res.status, errorText);
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      alert(`Error fetching businesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (selectedCategory: string) => {
    setCategory(selectedCategory);
  };

  const handleLocationClick = (selectedLocation: string) => {
    setLocation(selectedLocation);
  };

  const handleRecentSearchClick = (search: {category: string, location: string}) => {
    setCategory(search.category);
    setLocation(search.location);
  };

  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };

  const toggleShowAllLocations = () => {
    setShowAllLocations(!showAllLocations);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="bg-gray-800 p-4 rounded-lg shadow-md mb-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g., Restaurant)"
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g., New York)"
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </form>

      {/* Compact Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Categories */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Categories:</div>
          <div className="flex flex-wrap gap-1">
            {(showAllCategories ? POPULAR_CATEGORIES : POPULAR_CATEGORIES.slice(0, 8)).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
            {POPULAR_CATEGORIES.length > 8 && (
              <button
                onClick={toggleShowAllCategories}
                className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 hover:bg-gray-700 rounded transition-colors"
              >
                {showAllCategories ? 'Show Less' : `+${POPULAR_CATEGORIES.length - 8} more`}
              </button>
            )}
          </div>
        </div>

        {/* Locations */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Locations:</div>
          <div className="flex flex-wrap gap-1">
            {(showAllLocations ? POPULAR_LOCATIONS : POPULAR_LOCATIONS.slice(0, 8)).map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocationClick(loc)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  location === loc
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {loc}
              </button>
            ))}
            {POPULAR_LOCATIONS.length > 8 && (
              <button
                onClick={toggleShowAllLocations}
                className="text-xs text-green-400 hover:text-green-300 px-2 py-1 hover:bg-gray-700 rounded transition-colors"
              >
                {showAllLocations ? 'Show Less' : `+${POPULAR_LOCATIONS.length - 8} more`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Searches - Only show if exists */}
      {recentSearches.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Recent:</div>
          <div className="flex flex-wrap gap-1">
            {recentSearches.slice(0, 3).map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600"
              >
                {search.category} in {search.location}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <Results loading={loading} results={results} />
    </div>
  );
}

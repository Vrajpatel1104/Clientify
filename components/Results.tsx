"use client";
import React, { useState, useEffect } from "react";
import { BusinessResult, Lead } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function Results({ loading, results }: { loading: boolean; results: BusinessResult[] }) {
  const [addingToLeads, setAddingToLeads] = useState<{ [key: number]: boolean }>({});
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<number>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const [existingLeads, setExistingLeads] = useState<Set<string>>(new Set());
  const [filteredResults, setFilteredResults] = useState<BusinessResult[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  // Fetch existing leads to check which businesses are already added
  useEffect(() => {
    const fetchExistingLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        if (response.ok) {
          const leads: Lead[] = await response.json();
          const businessNames = new Set(
            leads.map(lead => lead.business.name.toLowerCase().trim())
          );
          setExistingLeads(businessNames);
        }
      } catch (error) {
        console.error('Error fetching existing leads:', error);
      }
    };

    fetchExistingLeads();
  }, []);

  // Filter results based on existing leads
  useEffect(() => {
    if (results.length === 0) {
      setFilteredResults([]);
      return;
    }

    const filtered = results.filter(business => {
      const businessName = business.title.toLowerCase().trim();
      return !existingLeads.has(businessName);
    });

    setFilteredResults(filtered);
  }, [results, existingLeads]);

  const addToLeads = async (business: BusinessResult, index: number) => {
    setAddingToLeads(prev => ({ ...prev, [index]: true }));
    
    try {
      // First, save the business to the database
      const businessResponse = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: business.title,
          category: business.type || 'Unknown',
          location: business.address,
          phone: business.phone,
          website: business.website,
          email: business.email || null,
        }),
      });

      if (!businessResponse.ok) {
        throw new Error('Failed to save business');
      }

      const savedBusiness = await businessResponse.json();

      // Then create a lead for this business
      const leadResponse = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: savedBusiness.id,
        }),
      });

      if (!leadResponse.ok) {
        throw new Error('Failed to create lead');
      }

      alert('Business added to leads successfully!');
      
      // Refresh existing leads list
      const leadsResponse = await fetch('/api/leads');
      if (leadsResponse.ok) {
        const leads: Lead[] = await leadsResponse.json();
        const businessNames = new Set(
          leads.map(lead => lead.business.name.toLowerCase().trim())
        );
        setExistingLeads(businessNames);
      }
    } catch (error) {
      console.error('Error adding to leads:', error);
      alert('Failed to add business to leads. Please try again.');
    } finally {
      setAddingToLeads(prev => ({ ...prev, [index]: false }));
    }
  };

  const toggleBusinessSelection = (index: number) => {
    setSelectedBusinesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllBusinesses = () => {
    setSelectedBusinesses(new Set(results.map((_, index) => index)));
  };

  const clearSelection = () => {
    setSelectedBusinesses(new Set());
  };

  const bulkAddToLeads = async () => {
    if (selectedBusinesses.size === 0) {
      alert('Please select at least one business to add to leads.');
      return;
    }

    setBulkAdding(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const index of selectedBusinesses) {
        try {
          const business = filteredResults[index];
          
          // Save business to database
          const businessResponse = await fetch('/api/businesses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: business.title,
              category: business.type || 'Unknown',
              location: business.address,
              phone: business.phone,
              website: business.website,
              email: business.email || null,
            }),
          });

          if (!businessResponse.ok) {
            throw new Error('Failed to save business');
          }

          const savedBusiness = await businessResponse.json();

          // Create lead for this business
          const leadResponse = await fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: savedBusiness.id,
            }),
          });

          if (!leadResponse.ok) {
            throw new Error('Failed to create lead');
          }

          successCount++;
        } catch (error) {
          console.error(`Error adding business ${index} to leads:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully added ${successCount} businesses to leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}!`);
        clearSelection();
        
        // Refresh existing leads list
        const leadsResponse = await fetch('/api/leads');
        if (leadsResponse.ok) {
          const leads: Lead[] = await leadsResponse.json();
          const businessNames = new Set(
            leads.map(lead => lead.business.name.toLowerCase().trim())
          );
          setExistingLeads(businessNames);
        }
      } else {
        alert('Failed to add any businesses to leads. Please try again.');
      }
    } catch (error) {
      console.error('Error in bulk add:', error);
      alert('An error occurred during bulk add. Please try again.');
    } finally {
      setBulkAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <LoadingSpinner size="lg" text="Searching for businesses..." />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="mt-8 ">
        <p className="text-gray-400 text-lg">No businesses found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  const hiddenCount = results.length - filteredResults.length;
  const displayResults = showHidden ? results : filteredResults;

  return (
    <div className="mt-4">
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Found {displayResults.length} businesses
            {hiddenCount > 0 && !showHidden && (
              <span className="text-sm text-gray-400 ml-2">
                ({hiddenCount} already in leads)
              </span>
            )}
          </h2>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-sm text-blue-400 hover:text-blue-300 mt-1"
            >
              {showHidden ? 'Hide already added businesses' : 'Show all businesses'}
            </button>
          )}
        </div>
        
        {displayResults.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllBusinesses}
              className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 hover:bg-gray-700 rounded"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 hover:bg-gray-700 rounded"
            >
              Clear
            </button>
            {selectedBusinesses.size > 0 && (
              <button
                onClick={bulkAddToLeads}
                disabled={bulkAdding}
                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
              >
                {bulkAdding ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Adding {selectedBusinesses.size}...
                  </div>
                ) : (
                  `Add ${selectedBusinesses.size} to Leads`
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {displayResults.map((business, index) => {
          const isAlreadyAdded = existingLeads.has(business.title.toLowerCase().trim());
          return (
            <div key={index} className={`bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow ${
              selectedBusinesses.has(index) ? 'border-blue-500 bg-gray-750' : 'border-gray-700'
            } ${isAlreadyAdded ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedBusinesses.has(index)}
                onChange={() => toggleBusinessSelection(index)}
                className="mt-1 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">{business.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                  {business.address && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📍</span>
                      <span className="truncate">{business.address}</span>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📞</span>
                      <span>{business.phone}</span>
                    </div>
                  )}
                  
                  {business.website ? (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">🌐</span>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        View Site
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">🌐</span>
                      <span className="text-gray-500">No website</span>
                    </div>
                  )}
                  
                  {business.type && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">🏷️</span>
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {business.type}
                      </span>
                    </div>
                  )}

                  {business.email ? (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📧</span>
                      <span className="text-gray-300">{business.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📧</span>
                      <span className="text-gray-300">No email</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="ml-3">
                {isAlreadyAdded ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">✓ Already in Leads</span>
                    <span className="text-xs text-gray-500">({business.title})</span>
                  </div>
                ) : (
                  <button
                    onClick={() => addToLeads(business, index)}
                    disabled={addingToLeads[index]}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {addingToLeads[index] ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Adding
                      </div>
                    ) : (
                      "Add to Leads"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default Results;

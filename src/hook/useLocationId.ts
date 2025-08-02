import { useState, useEffect } from 'react';
import axios from 'axios';

const useLocationId = (companyId: number | null) => {
  const [locationId, setLocationId] = useState<number | null>(null); // State to hold the first location ID
  const [loading, setLoading] = useState<boolean>(false); // State to track loading state
  const [error, setError] = useState<string | null>(null); // State to track any error

  useEffect(() => {
    if (companyId === null) return; // If no companyId is provided, don't fetch

    const fetchLocationId = async () => {
      setLoading(true); // Set loading state to true before fetching
      try {
        const response = await axios.post(`/api/location/getlocationidbycompanyid`, {
          company_id: companyId // Pass the company_id in the request body
        });

        // Check if response data is an array with items, and set the first location ID if available
        if (response.data && response.data.locationIds && response.data.locationIds.length > 0) {
          setLocationId(response.data.locationIds[0]); // Set the first location ID
        } else {
          setLocationId(null); // If no locations found, set it to null
        }
      } catch (err: any) {
        setError(err?.message || 'Error fetching location ID'); // Handle errors
      } finally {
        setLoading(false); // Set loading state to false after fetching
      }
    };

    fetchLocationId(); // Call the function to fetch the location ID
  }, [companyId]); // Only re-fetch when companyId changes

  return { locationId, loading, error }; // Return the first location ID, loading, and error states
};

export default useLocationId;

import { useState, useEffect } from 'react';
import axios from 'axios';

const useCompanyIdByUser = (user: any) => {
  const [company_id, setCompanyId] = useState<number | null>(null); // State to store the company ID
  const [loading, setLoading] = useState<boolean>(false); // State to track loading state
  const [error, setError] = useState<string | null>(null); // State to track errors

  useEffect(() => {
    if (!user || !user.id) return; // If user or user ID is not available, don't fetch

    const fetchCompanyId = async () => {
      setLoading(true); // Set loading state to true before fetching
      try {
        // Assuming user.id is the identifier for the user, adjust according to your user data
        const response = await axios.post('/api/company/getcompanyidbyuser', {
           user_id: user.id, // Send the user ID in the query parameters
        });
        setCompanyId(response.data.companyId)
      } catch (err: any) {
        setError(err?.message || 'Error fetching company ID'); // Handle errors
      } finally {
        setLoading(false); // Set loading state to false after fetching
      }
    };

    fetchCompanyId(); // Call the function to fetch the company ID
  }, [user]); // Re-run the effect when the user object changes
  return { company_id }; // Return the company ID, loading, and error states
};

export default useCompanyIdByUser;

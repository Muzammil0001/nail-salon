import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import axios from "axios";

const Location = () => {
  const { data: session } = useSession();
  const [location, setLocation] = useState({
    location_name: "",
    location_message: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user.selected_location_id) {
      setError("Location ID is not available.");
      return;
    }

    setLocation({
      ...location,
      location_name : session.user.locations.filter(x => x.id === session.user.selected_location_id)[0]?.location_name,
    });
  }, [session?.user.selected_company_id, session?.user.selected_location_id]);

  if (!session) {
    return <div>Please log in to view company and location information.</div>;
  }

  return (
    <div>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div className="text-white">
          <p className="capitalize">
            {location.location_name 
              ? location.location_name 
              : location.location_message || "Loading..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Location;

import { useEffect, useState } from "react";

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((info) => {
        setData(info);
        setIsLoading(false);
        setError(null);
        return info;
      })
      .catch((err) => {
        console.error("Problem with your fetch operation:", err);
        setIsLoading(false);
        setError(err.message);
      });
  }, [url]);

  return { data, setData, isLoading, error };
};

export default useFetch;

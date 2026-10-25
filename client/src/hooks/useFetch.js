import { useState, useEffect, useCallback } from 'react';

/**
 * Custom data fetching hook with loading, error states, and manual reload trigger
 */
export function useFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => {
    setReloadTrigger((count) => count + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchFn()
      .then((result) => {
        if (isMounted) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [...dependencies, reloadTrigger]);

  return { data, loading, error, reload };
}

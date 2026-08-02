import { useCallback, useState } from 'react';

export function usePullToRefresh(onRefreshAction: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await onRefreshAction();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshAction]);

  return {
    refreshing,
    handleRefresh,
  };
}

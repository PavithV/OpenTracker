import { useState } from 'react';

// Pull-to-refresh state for a FlatList/ScrollView. Deliberately not React Query's `isRefetching`:
// that is also true for every background refetch (after an invalidation, on focus, ...), which
// would make the pull spinner pop up on its own.
export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh };
}

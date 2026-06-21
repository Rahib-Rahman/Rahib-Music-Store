import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function useInfiniteScroll(onLoadMore: () => void, loading: boolean) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && !loading) {
      onLoadMore();
    }
  }, [inView, loading, onLoadMore]);

  return { sentinelRef: ref };
}

import { useEffect, useState, type RefObject } from 'react';

export const useStickySidebarOffset = (
  searchBarRef: RefObject<HTMLElement | null>,
  desktopHeaderHeight = 104,
  gap = 12,
) => {
  const [offset, setOffset] = useState(desktopHeaderHeight + 96 + gap);

  useEffect(() => {
    const updateOffset = () => {
      const searchBarHeight = searchBarRef.current?.getBoundingClientRect().height ?? 0;
      setOffset(Math.ceil(desktopHeaderHeight + searchBarHeight + gap));
    };

    updateOffset();

    const resizeObserver = new ResizeObserver(updateOffset);
    if (searchBarRef.current) {
      resizeObserver.observe(searchBarRef.current);
    }

    window.addEventListener('resize', updateOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateOffset);
    };
  }, [desktopHeaderHeight, gap, searchBarRef]);

  return offset;
};

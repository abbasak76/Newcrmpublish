import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** اتصال Quick Add به فرم واقعی هر ماژول: مسیر ?new=1 فرم ایجاد همان صفحه را باز می‌کند و پارامتر را پاک می‌کند (تکرار ایجاد نمی‌شود). */
export function useDeepLinkCreate(open: () => void) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('new') === '1') {
      open();
      const next = new URLSearchParams(params); next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
}

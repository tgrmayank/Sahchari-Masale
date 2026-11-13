import { StoreProvider, SiteShell } from '../Site';
import { getCatalogRaw } from '@/lib/seo-server';
import '../globals.css';

export default async function SiteLayout({ children }) {
  // Shop data goes into the first HTML -> page shows instantly, no loading screen.
  const initial = await getCatalogRaw();
  return (
    <StoreProvider initial={initial}>
      <SiteShell>{children}</SiteShell>
    </StoreProvider>
  );
}

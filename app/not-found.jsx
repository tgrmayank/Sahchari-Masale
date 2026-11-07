import { StoreProvider, SiteShell, NotFoundView } from './Site';
import './globals.css';
import { ROBOTS_NOINDEX } from '@/lib/seo';

export const metadata = {
  title: { absolute: 'Page Not Found | Sahchari Masale' },
  description: 'The page you are looking for does not exist or has moved. Visit the Sahchari Masale home page to shop pure Indian spices.',
  robots: ROBOTS_NOINDEX,
};

export default function NotFound() {
  return (
    <StoreProvider>
      <SiteShell>
        <NotFoundView />
      </SiteShell>
    </StoreProvider>
  );
}

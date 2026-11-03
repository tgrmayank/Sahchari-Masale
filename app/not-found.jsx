import { StoreProvider, SiteShell, NotFoundView } from './Site';
import './globals.css';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StoreProvider>
      <SiteShell>
        <NotFoundView />
      </SiteShell>
    </StoreProvider>
  );
}

import { StoreProvider, SiteShell } from '../Site';
import '../globals.css';

export default function SiteLayout({ children }) {
  return (
    <StoreProvider>
      <SiteShell>{children}</SiteShell>
    </StoreProvider>
  );
}

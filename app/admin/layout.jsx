import './admin.css';
import AdminPwaBoot from './AdminPwaBoot';

export const metadata = {
  title: 'Admin Panel',
  robots: { index: false, follow: false },
  manifest: '/admin.webmanifest',
  appleWebApp: { capable: true, title: 'SM Admin', statusBarStyle: 'black-translucent' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport = { themeColor: '#5a1010' };

// Runs while the page is still loading, so the browser's "install app" event is never missed.
const EARLY = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;window.dispatchEvent(new Event('bip-ready'))});window.addEventListener('appinstalled',function(){window.__bip=null;window.__installed=true;window.dispatchEvent(new Event('bip-ready'))});`;

export default function AdminLayout({ children }) {
  return (
    <div className="adm">
      <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      <AdminPwaBoot />
      {children}
    </div>
  );
}

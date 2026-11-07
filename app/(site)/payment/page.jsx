import { Router } from '@/app/Site';
import { pageMetadata } from '@/lib/seo';

// SEO: private customer page - kept out of Google (noindex) but still crawlable for links
export const metadata = pageMetadata('payment');

export default function Page() {
  return <Router />;
}

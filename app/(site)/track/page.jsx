import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { staticSchema } from '@/lib/seo-server';

// SEO: customer page - title, description, 10 keywords, Open Graph and schema are set,
// but the page is kept out of Google (noindex) because it is private.
export const metadata = pageMetadata('track');

export default async function Page() {
  const schema = await staticSchema('track');
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

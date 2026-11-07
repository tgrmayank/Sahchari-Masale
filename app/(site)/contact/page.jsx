import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { staticSchema } from '@/lib/seo-server';

export const metadata = pageMetadata('contact');

export default async function Page() {
  const schema = await staticSchema('contact');
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

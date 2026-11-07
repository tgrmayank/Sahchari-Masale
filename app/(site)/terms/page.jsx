import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { staticSchema } from '@/lib/seo-server';

export const metadata = pageMetadata('terms');

export default async function Page() {
  const schema = await staticSchema('terms');
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

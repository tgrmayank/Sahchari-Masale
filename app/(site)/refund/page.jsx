import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { staticSchema, refundFaq } from '@/lib/seo-server';

export const metadata = pageMetadata('refund');

export default async function Page() {
  const schema = await staticSchema('refund', refundFaq());
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

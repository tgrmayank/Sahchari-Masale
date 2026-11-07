import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { staticSchema, shippingFaq } from '@/lib/seo-server';

export const metadata = pageMetadata('shipping');

export default async function Page() {
  const schema = await staticSchema('shipping', await shippingFaq());
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

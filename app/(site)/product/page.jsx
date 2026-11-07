import { Router } from '@/app/Site';
import JsonLd from '@/lib/JsonLd';
import { productMetadata, productSchema } from '@/lib/seo-server';

// /product/:id is rewritten to this page. Title, description, canonical, Open Graph
// and Product JSON-LD are built per product from the shop data (see middleware.js).
export async function generateMetadata() {
  return productMetadata();
}

export default async function Page() {
  const schema = await productSchema();
  return (
    <>
      <JsonLd data={schema} />
      <Router />
    </>
  );
}

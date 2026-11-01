import { Baloo_2, Poppins } from 'next/font/google';

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Online Store',
  description: 'Order online with Cash on Delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} ${poppins.variable}`} data-scroll-behavior="smooth">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

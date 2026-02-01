import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goods',
  openGraph: {
    title: 'Goods',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function GoodsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

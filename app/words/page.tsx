import { getAllPosts } from '@/lib/posts';
import WordsClient from './WordsClient';

export const metadata = {
  title: 'Words',
  openGraph: {
    title: 'Words',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function WordsPage() {
  const posts = getAllPosts();
  return <WordsClient posts={posts} />;
}

import { getAllPosts } from '@/lib/posts';
import WordsClient from './WordsClient';

export const metadata = {
  title: 'Words',
};

export default function WordsPage() {
  const posts = getAllPosts();
  return <WordsClient posts={posts} />;
}

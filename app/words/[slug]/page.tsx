import { getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const posts = getAllPosts();
  // Next.js automatically decodes URL params, but handle both encoded and decoded
  const slug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(slug);
  const post = posts.find((p) => p.slug === slug || p.slug === decodedSlug);

  if (!post) {
    notFound();
  }

  // remark-breaks plugin automatically converts single newlines to <br> tags
  // Double newlines (blank lines) remain as paragraph breaks
  // So: single newline = line break, double newline = paragraph break

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          overflow-y: auto;
          height: 100%;
        }
        .post-article {
          width: 100%;
          max-width: 50%;
          margin: 0 auto;
          text-align: left;
          line-height: 1.8;
          font-size: 1.1rem;
        }
        .post-article p {
          margin-bottom: 1.5rem;
          margin-top: 0;
        }
        .post-article strong {
          font-weight: bold;
        }
        .post-article h1, .post-article h2, .post-article h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .post-article {
            max-width: 90% !important;
            padding: 0.5rem !important;
          }
          .post-main {
            padding: 1rem 0.5rem !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .post-article {
            max-width: 75% !important;
          }
        }
        @media (min-width: 1025px) {
          .post-article {
            max-width: 50% !important;
          }
        }
      `}} />
      <main className="post-main" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem 1rem',
        maxWidth: '100%',
        overflowY: 'auto',
      }}>
        <article className="post-article">
          <div style={{
            fontSize: '1rem',
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkBreaks]}
              components={{
                p: ({children}) => <p style={{ marginBottom: '1.5rem', marginTop: '0' }}>{children}</p>,
                h1: ({children}) => <h1 style={{ marginBottom: '1rem', marginTop: '2rem' }}>{children}</h1>
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </>
  );
}

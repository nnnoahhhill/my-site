import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'public/words');

export type Post = {
  slug: string;
  title: string;
  date: string;
  featured: boolean;
  content: string;
};

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const slug = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);
    
    // Extract title from frontmatter, first heading, or filename
    let title = matterResult.data.title;
    if (!title) {
      // Try to extract from first # heading
      const headingMatch = matterResult.content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      } else {
        // Fallback to filename (remove hash and .md)
        title = fileName.replace(/\.md$/, '').replace(/\s+\w{32}$/, ''); // Remove hash at end
      }
    }

    return {
      slug,
      title,
      date: matterResult.data.date ? new Date(matterResult.data.date).toISOString() : new Date().toISOString(),
      featured: matterResult.data.featured || false,
      content: matterResult.content, // Keep the full content including the # title
    };
  });
  
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

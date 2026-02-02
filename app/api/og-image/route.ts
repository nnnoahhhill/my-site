import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PREVIEW_IMAGES = [
  'white.png',
  'purp.png',
  'light-blue.png',
  'dark-blue.png',
  'dark.png',
  'light.png',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const previewParam = searchParams.get('preview');
  
  let index: number;
  
  if (previewParam) {
    // Use the preview query param if provided
    const parsed = parseInt(previewParam, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < PREVIEW_IMAGES.length) {
      index = parsed;
    } else {
      // Fallback: use hash of the param value
      index = Math.abs(previewParam.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PREVIEW_IMAGES.length;
    }
  } else {
    // If no param, rotate based on timestamp (changes per request)
    const timestamp = Date.now();
    index = Math.abs(timestamp) % PREVIEW_IMAGES.length;
  }
  
  const imageName = PREVIEW_IMAGES[index];
  const imagePath = join(process.cwd(), 'public', 'previews', imageName);
  
  try {
    const imageBuffer = await readFile(imagePath);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    // Fallback to first image if file read fails
    const fallbackPath = join(process.cwd(), 'public', 'previews', PREVIEW_IMAGES[0]);
    const imageBuffer = await readFile(fallbackPath);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }
}

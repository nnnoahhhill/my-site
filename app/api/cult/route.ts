export async function POST(req: Request) {
  return new Response(JSON.stringify({ joined: true }));
}

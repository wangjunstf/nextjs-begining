export async function GET() {
  return Response.json({
    status: 'success',
    message: 'This is a test API route',
    timestamp: new Date().toISOString(),
  });
}
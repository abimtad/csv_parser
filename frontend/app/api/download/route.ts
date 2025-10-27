export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return new Response(JSON.stringify({ error: "Missing filename" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const backendUrl = process.env.BACKEND_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!backendUrl || !apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Server misconfiguration: missing BACKEND_URL or BACKEND_API_KEY",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const res = await fetch(
    `${backendUrl}/api/download/${encodeURIComponent(filename)}`,
    {
      headers: { "x-api-key": apiKey },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  }

  const headers = new Headers(res.headers);
  // Ensure proper filename is preserved
  if (!headers.get("content-disposition")) {
    headers.set("content-disposition", `attachment; filename="${filename}"`);
  }
  return new Response(res.body, {
    status: 200,
    headers,
  });
}

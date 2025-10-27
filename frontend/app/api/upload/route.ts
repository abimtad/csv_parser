export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
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

    const forward = new FormData();
    forward.append("file", file);

    const res = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: forward,
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Upload proxy failed" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

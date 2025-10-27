import { Buffer } from "node:buffer";

export const runtime = "nodejs";

// 1x1 transparent PNG (base64)
const ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export function GET() {
  const bytes = Buffer.from(ICON_BASE64, "base64");
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

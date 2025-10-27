import request from "supertest";
import { jest } from "@jest/globals";
import { createApp } from "../app.js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { resolve } from "path";

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

// Load test env
dotenv.config({ path: resolve(process.cwd(), ".env.test") });
describe("API Endpoints", () => {
  const app = createApp();
  const apiKey = (process.env.API_KEYS?.split(",")[0] || process.env.API_KEY)!;

  it("POST /api/upload - success with CSV returns metrics and link", async () => {
    const tmpCsv = path.resolve("uploads", "test-input.csv");
    await fs.mkdir(path.dirname(tmpCsv), { recursive: true });
    await fs.writeFile(
      tmpCsv,
      `Department Name,Date,Number of Sales\nElectronics,2023-08-01,100\nClothing,2023-08-01,200\nElectronics,2023-08-02,150`
    );

    const res = await request(app)
      .post("/api/upload")
      .set("x-api-key", apiKey)
      .attach("file", tmpCsv);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        downloadLink: expect.stringContaining("/api/download/"),
        processingTimeMs: expect.any(Number),
        departmentCount: 2,
      })
    );

    // Download the processed file and check contents
    const downloadPath = new URL(
      res.body.downloadLink,
      "http://localhost"
    ).pathname.replace("/api/download/", "");
    const processedFile = path.resolve("processed", downloadPath);
    const exists = await fs
      .access(processedFile)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
    const content = await fs.readFile(processedFile, "utf8");
    expect(content.trim()).toBe(
      `Department Name,Total Number of Sales\nElectronics,250\nClothing,200`
    );
  });

  it("POST /api/upload - error when no file", async () => {
    const res = await request(app).post("/api/upload").set("x-api-key", apiKey);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("POST /api/upload - unauthorized without API key", async () => {
    const res = await request(app).post("/api/upload");
    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({ error: "Unauthorized" })
    );
  });

  it("GET /api/download/:filename - 404 for missing file", async () => {
    const res = await request(app)
      .get("/api/download/does-not-exist.csv")
      .set("x-api-key", apiKey);
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ error: "File not found." })
    );
  });

  it("GET /api/download/:filename - success after upload", async () => {
    const tmpCsv = path.resolve("uploads", "download-input.csv");
    await fs.mkdir(path.dirname(tmpCsv), { recursive: true });
    await fs.writeFile(
      tmpCsv,
      `Department Name,Date,Number of Sales\nElectronics,2023-08-01,100\nClothing,2023-08-01,200\nElectronics,2023-08-02,150`
    );

    const uploadRes = await request(app)
      .post("/api/upload")
      .set("x-api-key", apiKey)
      .attach("file", tmpCsv);

    expect(uploadRes.status).toBe(200);
    const fileName = new URL(
      uploadRes.body.downloadLink,
      "http://localhost"
    ).pathname
      .split("/")
      .pop();

    const downloadRes = await request(app)
      .get(`/api/download/${fileName}`)
      .set("x-api-key", apiKey);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.text.trim()).toBe(
      `Department Name,Total Number of Sales\nElectronics,250\nClothing,200`
    );
  });
});

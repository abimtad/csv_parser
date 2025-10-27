import { processCsv } from "../services/csvProcessor.js";
import { jest } from "@jest/globals";
import fs from "fs";
import { PassThrough } from "stream";

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

describe("CSV Processor Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process a CSV file and return aggregated sales data", async () => {
    const mockCsvContent = `Department Name,Date,Number of Sales
Electronics,2023-08-01,100
Clothing,2023-08-01,200
Electronics,2023-08-02,150`;

    const mockReadStream = new PassThrough();
    const crsSpy = jest
      .spyOn(fs as unknown as { createReadStream: any }, "createReadStream")
      .mockReturnValue(mockReadStream as any);
    const writeSpy = jest
      .spyOn(fs as unknown as { writeFile: any }, "writeFile")
      .mockImplementation((p: any, d: any, cb: any) => cb(null));
    const unlinkSpy = jest
      .spyOn(fs as unknown as { unlink: any }, "unlink")
      .mockImplementation((p: any, cb: any) => cb(null));

    const promise = processCsv("dummy/path/to/file.csv");

    mockReadStream.write(mockCsvContent);
    mockReadStream.end();

    const result = await promise;

    expect(result.departmentCount).toBe(2);
    const expectedCsvOutput = `Department Name,Total Number of Sales
Electronics,250
Clothing,200`;
    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining(".csv"),
      expectedCsvOutput,
      expect.any(Function)
    );
    crsSpy.mockRestore();
    writeSpy.mockRestore();
    unlinkSpy.mockRestore();
  });
});

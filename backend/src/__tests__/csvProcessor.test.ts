import { processCsv } from "../services/csvProcessor";
import fs from "fs";
import path from "path";

jest.mock("fs");

describe("CSV Processor Service", () => {
  const mockReadStream = {
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (event, handler) {
      if (event === "end") {
        handler();
      }
      return this;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
    (fs.writeFile as jest.Mock).mockImplementation((path, data, callback) =>
      callback(null)
    );
    (fs.unlink as jest.Mock).mockImplementation((path, callback) =>
      callback(null)
    );
  });

  it("should process a CSV file and return aggregated sales data", async () => {
    const mockCsvData = [
      { "Department Name": "Electronics", "Number of Sales": "100" },
      { "Department Name": "Clothing", "Number of Sales": "200" },
      { "Department Name": "Electronics", "Number of Sales": "150" },
    ];

    mockReadStream.on.mockImplementation(function (event, handler) {
      if (event === "data") {
        mockCsvData.forEach((row) => handler(row));
      }
      if (event === "end") {
        handler();
      }
      return this;
    });

    const result = await processCsv("dummy/path/to/file.csv");

    expect(result.departmentCount).toBe(2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      "Department Name,Total Number of Sales\nElectronics,250\nClothing,200",
      expect.any(Function)
    );
  });
});

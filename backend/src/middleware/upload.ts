import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase();
    if (extname === ".csv") {
      return cb(null, true);
    }
    cb(new Error("Only .csv files are allowed!"));
  },
});

export default upload;

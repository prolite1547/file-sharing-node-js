require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");

const app = express();
const PORT = process.env.PORT | 3000;
const DB_URL = process.env.DATABASE_URL;

mongoose.connect(DB_URL);

const upload = multer({
  dest: "uploads",
});
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const { originalname: originalName, path } = req.file;
  const { password } = req.body;
  const fileData = {
    path,
    originalName,
  };

  if (!password != null && password !== "") {
    fileData.password = await bcrypt.hash(password, 10);
  }

  const file = await File.create(fileData);
  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  const { id } = req.params;
  const file = await File.findById(id);
  if (file) {
    if (file.password != null) {
      if (req.body.password == null) {
        console.log(req.body.password);
        res.render("password");
        return;
      }
      if (!(await bcrypt.compare(req.body.password, file.password))) {
        res.render("password", { error: true });
        return;
      }
    }

    file.downloadCount++;
    file.save();
    return res.download(file.path, file.originalName);
  }
  res.send("FILE NOT FOUND");
}

app.listen(PORT, () => {
  console.log(`SERVER STARTED LISTENING TO PORT : ${PORT}`);
});

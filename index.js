const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("YTDL Video Downloader API is running.");
});

app.get("/download", async (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const format = ytdl.chooseFormat(info.formats, { quality: "18" }); // 360p

    res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
    ytdl(videoURL, { format }).pipe(res);
  } catch (err) {
    res.status(500).json({ error: "Failed to download video." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("YTDL Downloader API is live.");
});

app.get("/download", async (req, res) => {
  const videoURL = req.query.url;

  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const title = info.videoDetails.title
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    const format = ytdl.chooseFormat(info.formats, { quality: "18" }); // 360p mp4
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    res.flushHeaders(); // prevent timeout buffering

    ytdl(videoURL, { format }).pipe(res).on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end("Download failed.");
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

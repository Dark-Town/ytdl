const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("YTDL Server is working!");
});

app.get("/download", async (req, res) => {
  try {
    let videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).json({ error: "Missing url parameter." });
    }

    // Convert Shorts URL to normal format
    if (videoURL.includes("youtube.com/shorts/")) {
      const id = videoURL.split("/shorts/")[1].split("?")[0];
      videoURL = `https://youtube.com/watch?v=${id}`;
    }

    if (!ytdl.validateURL(videoURL)) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    const info = await ytdl.getInfo(videoURL);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_").substring(0, 50);
    const filename = `${title}.mp4`;

    // Try to get best video+audio format (360p)
    let format = ytdl.chooseFormat(info.formats, { quality: "18" });

    // Fallback: get best audio-only if no video found
    if (!format || !format.url) {
      format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
      if (!format || !format.url) {
        return res.status(500).json({ error: "No downloadable format found." });
      }
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "video/mp4");
    res.flushHeaders();

    const stream = ytdl(videoURL, { format, highWaterMark: 1 << 25 });
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end("Streaming failed.");
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

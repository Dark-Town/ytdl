const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("YTDL API is live and ready.");
});

app.get("/download", async (req, res) => {
  try {
    let videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    // Auto-convert Shorts URLs to standard watch URLs
    if (videoURL.includes("youtube.com/shorts/")) {
      const id = videoURL.split("/shorts/")[1].split("?")[0];
      videoURL = `https://youtube.com/watch?v=${id}`;
    }

    // Validate URL now
    if (!ytdl.validateURL(videoURL)) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    // Get video info
    const info = await ytdl.getInfo(videoURL);

    // Sanitize title for filename
    const title = info.videoDetails.title
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    // Choose format - 360p mp4 (or fallback)
    const format = ytdl.chooseFormat(info.formats, { quality: "18" });

    if (!format || !format.url) {
      return res.status(500).json({ error: "No downloadable format found." });
    }

    // Set response headers
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    res.flushHeaders();

    // Stream the video with a bigger buffer for stability
    const stream = ytdl(videoURL, { format, highWaterMark: 1 << 25 });

    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Stream error:", err.message);
      try {
        res.status(500).end("Download failed.");
      } catch {}
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

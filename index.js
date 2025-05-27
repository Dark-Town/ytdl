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
      console.error("No url parameter provided");
      return res.status(400).json({ error: "Missing url parameter" });
    }

    // Convert Shorts URLs to standard watch URLs
    if (videoURL.includes("youtube.com/shorts/")) {
      const id = videoURL.split("/shorts/")[1].split("?")[0];
      videoURL = `https://youtube.com/watch?v=${id}`;
      console.log("Converted Shorts URL to watch URL:", videoURL);
    }

    // Validate URL
    if (!ytdl.validateURL(videoURL)) {
      console.error("Invalid YouTube URL:", videoURL);
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    // Fetch video info
    const info = await ytdl.getInfo(videoURL);
    console.log("Video info fetched:", info.videoDetails.title);

    // Choose format (360p mp4 preferred)
    const format = ytdl.chooseFormat(info.formats, { quality: "18" });

    if (!format || !format.url) {
      console.error("No suitable format found for:", videoURL);
      return res.status(500).json({ error: "No downloadable format found." });
    }

    // Clean up title for filename
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    res.flushHeaders();

    // Stream video with bigger buffer for stability
    const stream = ytdl(videoURL, { format, highWaterMark: 1 << 25 });

    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      try {
        res.status(500).end("Stream failed.");
      } catch {}
    });
  } catch (err) {
    console.error("Caught error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

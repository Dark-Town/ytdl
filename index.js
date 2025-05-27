const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("YTDL API Live with Debugging");
});

app.get("/download", async (req, res) => {
  const videoURL = req.query.url;

  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    console.log("Fetched info:", info.videoDetails.title);

    const format = ytdl.chooseFormat(info.formats, { quality: "18" });
    if (!format || !format.url) {
      console.error("No valid format found");
      return res.status(500).json({ error: "No downloadable format found." });
    }

    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    res.flushHeaders();

    const stream = ytdl(videoURL, {
      format,
      highWaterMark: 1 << 25,
    });

    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Stream error:", err.message);
      res.status(500).end("Stream failed.");
    });
  } catch (err) {
    console.error("Catch error:", err.message);
    res.status(500).json({ error: "Download failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

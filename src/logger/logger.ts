import pino from "pino";
import path from "path";

const logger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  level: "trace",
  transport: {
    targets: [
      {
        target: "pino/file",
        level: "trace",
        options: {
          destination: path.resolve("." + "/logs/trace.log"),
          mkdir: true,
        },
      },
      {
        target: "pino/file",
        level: "info",
        options: {
          // this might be busted on windows, I think it should be passed as separate args instead of /unix/like/path
          destination: path.resolve("." + "/logs/info.log"),
          mkdir: true,
        },
      },
    ],
  },
});

export default logger;

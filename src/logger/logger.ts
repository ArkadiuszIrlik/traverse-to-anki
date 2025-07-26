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
          destination: path.resolve("." + "/logs/info.log"),
          mkdir: true,
        },
      },
    ],
  },
});

export default logger;

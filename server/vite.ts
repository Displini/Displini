import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const httpPort = Number(process.env.PORT) || 4000;
  const serverOptions = {
    middlewareMode: true,
    // Use the existing HTTP server for HMR; align clientPort with HTTP port
    hmr: { server, clientPort: httpPort },
    allowedHosts: true as const,
  } as const;

  // Ensure Vite uses the root directory as root regardless of config merging order
  const enforcedRoot = path.resolve(import.meta.dirname, "..");
  log(`Using Vite root: ${enforcedRoot}`);

  // Let Vite load the config file itself to avoid double processing
  const vite = await createViteServer({
    root: enforcedRoot,
    configFile: path.resolve(enforcedRoot, "vite.config.ts"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Use Vite's middleware to handle all requests (including module imports)
  // This MUST come before any other route handlers to process /src/ modules
  app.use(vite.middlewares);
  
  // Fallback to index.html for all routes (SPA fallback)
  // This should only handle routes that Vite middleware didn't process
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip if it's an API route
    if (url.startsWith("/api")) {
      return next();
    }

    // Skip if response was already sent by Vite middleware
    if (res.headersSent || res.writableEnded) {
      return;
    }

    // Skip file requests - Vite middleware handles these
    // Only handle SPA routes (no file extension)
    if (url.includes(".") && !url.endsWith("/")) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

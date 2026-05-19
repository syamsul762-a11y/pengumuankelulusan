import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Helper for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist/
    // Since we bundle server.ts to dist/server.cjs, __dirname will be the dist folder itself.
    // However, if process.cwd() is the project root, then dist is in process.cwd()/dist.
    
    // We'll try to find the dist folder correctly.
    const possibleDistPath1 = path.resolve(__dirname); 
    const possibleDistPath2 = path.join(process.cwd(), 'dist');
    
    // In our deployment, server.cjs is in dist/, so __dirname is dist/.
    const distPath = possibleDistPath1;
      
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

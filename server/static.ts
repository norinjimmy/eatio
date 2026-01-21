import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production, the bundled server is at dist/index.cjs
  // and client files are at dist/public/
  // __dirname in bundled code is /app/dist, so we look for public/ there
  const distPath = path.resolve(__dirname, "public");
  
  console.log("=== SERVE STATIC DEBUG ===");
  console.log("__dirname:", __dirname);
  console.log("Looking for client files at:", distPath);
  console.log("Directory exists:", fs.existsSync(distPath));
  
  if (!fs.existsSync(distPath)) {
    // Try alternative path (current working directory + dist/public)
    const altPath = path.resolve(process.cwd(), "dist", "public");
    console.log("Trying alternative path:", altPath);
    console.log("Alternative path exists:", fs.existsSync(altPath));
    
    if (fs.existsSync(altPath)) {
      console.log("Using alternative path for static files");
      app.use(express.static(altPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(altPath, "index.html"));
      });
      return;
    }
    
    throw new Error(
      `Could not find the build directory at ${distPath} or ${altPath}, make sure to build the client first`,
    );
  }

  console.log("Using standard path for static files");
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

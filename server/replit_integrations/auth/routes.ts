import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For local development without Replit auth, create a default guest user
      if (!process.env.REPL_ID && userId === 'guest-user') {
        let user = await authStorage.getUser(userId);
        if (!user) {
          await authStorage.upsertUser({
            id: 'guest-user',
            email: 'guest@local.dev',
            firstName: 'Guest',
            lastName: 'User',
            profileImageUrl: null,
          });
          user = await authStorage.getUser(userId);
        }
        return res.json(user);
      }
      
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

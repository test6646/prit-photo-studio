import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertClientSchema, insertEventSchema, 
  insertTaskSchema, insertPaymentSchema, insertExpenseSchema,
  loginSchema, firms as firmTable
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

// Simple session type for development
interface SessionData {
  userId?: number;
  firmId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // No demo data - users must create accounts through proper signup
  
  // Get available firms for non-admin users
  app.get("/api/firms", async (req, res) => {
    try {
      // Get all active firms
      const allFirms = await db.select().from(firmTable).where(eq(firmTable.isActive, true));
      res.json(allFirms);
    } catch (error) {
      console.error("Firms fetch error:", error);
      res.status(500).json({ message: "Failed to fetch firms" });
    }
  });

  // Firm-based signup system
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role, firmId } = req.body;

      // Validate role-based firm requirement
      if (role !== "admin" && !firmId) {
        return res.status(400).json({ message: "Firm selection is required for non-admin roles" });
      }

      // Create user with proper firm association
      const user = await storage.createUser({
        email,
        password, // In production, hash this with bcrypt
        firstName,
        lastName,
        phone,
        role,
        firmId: role === "admin" ? null : firmId,
        isActive: true
      });

      if (role === "admin") {
        res.json({ 
          message: "Admin account created successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          redirectTo: "/admin-setup"
        });
      } else {
        res.json({ 
          message: "Account created successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          redirectTo: "/login"
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  // Email-based login
  app.post("/api/auth/login-email", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByUsername(email.split('@')[0]);
      if (!user || user.password !== password || user.email !== email) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const firm = await storage.getFirmByPin("1234"); // We'll improve this lookup
      
      // Set session data
      req.session.userId = user.id;
      req.session.firmId = user.firmId;
      
      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar
        }, 
        firm: firm ? { 
          id: firm.id, 
          name: firm.name 
        } : null
      });
    } catch (error) {
      console.error("Email login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // PIN-based authentication (existing)
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      const { firmPin, username, password } = loginSchema.parse(req.body);
      console.log("Parsed data:", { firmPin, username, password });
      
      const firm = await storage.getFirmByPin(firmPin);
      console.log("Found firm:", firm);
      if (!firm) {
        return res.status(401).json({ message: "Invalid firm PIN" });
      }

      const user = await storage.getUserByUsername(username);
      console.log("Found user:", user);
      if (!user || user.password !== password || user.firmId !== firm.id) {
        console.log("User validation failed:", { 
          userExists: !!user, 
          passwordMatch: user?.password === password,
          firmMatch: user?.firmId === firm.id 
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.firmId = firm.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar
        }, 
        firm: { 
          id: firm.id, 
          name: firm.name 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId || !req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      const firm = await storage.getFirmByPin("1234"); // We'll fix this to get by ID later
      
      if (!user || !firm) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar
        }, 
        firm: { 
          id: firm.id, 
          name: firm.name 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const stats = await storage.getDashboardStats(req.session.firmId);
    res.json(stats);
  });

  app.get("/api/dashboard/financial-summary", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const summary = await storage.getFinancialSummary(req.session.firmId);
    res.json(summary);
  });

  // Events
  app.get("/api/events", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const events = await storage.getEventsByFirm(req.session.firmId);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        firmId: req.session.firmId,
      });
      
      const event = await storage.createEvent(eventData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "event_created",
        entityType: "event",
        entityId: event.id,
        description: `New event "${event.title}" created`,
      });

      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event || event.firmId !== req.session.firmId) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const tasks = await storage.getTasksByFirm(req.session.firmId);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        firmId: req.session.firmId,
      });
      
      const task = await storage.createTask(taskData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "task_assigned",
        entityType: "task",
        entityId: task.id,
        description: `Task "${task.title}" assigned`,
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id/status", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const task = await storage.updateTaskStatus(
      parseInt(req.params.id), 
      status,
      status === 'completed' ? new Date() : undefined
    );

    if (!task || task.firmId !== req.session.firmId) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Create activity log
    await storage.createActivityLog({
      firmId: req.session.firmId,
      userId: req.session.userId,
      action: "task_updated",
      entityType: "task",
      entityId: task.id,
      description: `Task status updated to ${status}`,
    });

    res.json(task);
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const clients = await storage.getClientsByFirm(req.session.firmId);
    res.json(clients);
  });

  app.post("/api/clients", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const clientData = insertClientSchema.parse({
        ...req.body,
        firmId: req.session.firmId,
      });
      
      const client = await storage.createClient(clientData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "client_added",
        entityType: "client",
        entityId: client.id,
        description: `New client "${client.name}" added to system`,
      });

      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payments = await storage.getPaymentsByFirm(req.session.firmId);
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        firmId: req.session.firmId,
        receivedBy: req.session.userId,
      });
      
      const payment = await storage.createPayment(paymentData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "payment_received",
        entityType: "payment",
        entityId: payment.id,
        description: `Payment of ₹${payment.amount} received`,
      });

      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  // Team members
  app.get("/api/team", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const users = await storage.getUsersByFirm(req.session.firmId);
    res.json(users);
  });

  // Activity logs
  app.get("/api/activity", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const activities = await storage.getActivityLogsByFirm(req.session.firmId, 10);
    res.json(activities);
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const expenses = await storage.getExpensesByFirm(req.session.firmId);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        firmId: req.session.firmId,
        createdBy: req.session.userId,
      });
      
      const expense = await storage.createExpense(expenseData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "expense_added",
        entityType: "expense",
        entityId: expense.id,
        description: `Expense "${expense.title}" added - ₹${expense.amount}`,
      });

      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Add session management types
declare module "express-session" {
  interface SessionData {
    userId: number;
    firmId: number;
  }
}

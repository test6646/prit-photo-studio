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
import bcrypt from "bcryptjs";

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

  // Simplified signup system
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role, firmId, adminPin } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // For admin role, create new firm
      if (role === "admin") {
        // Create a default firm for the admin
        const firm = await storage.createFirm({
          name: `${firstName} ${lastName} Studio`,
          pin: Math.random().toString(36).substring(2, 8).toUpperCase(),
          isActive: true
        });

        // Create admin user
        const user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || "",
          role,
          firmId: firm.id,
          isActive: true
        });

        res.json({ 
          message: "Admin account and studio created successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      } else {
        // For non-admin roles, validate firm selection
        if (!firmId) {
          return res.status(400).json({ message: "Studio selection required" });
        }

        // Create user with selected firm
        const user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || "",
          role,
          firmId,
          isActive: true
        });

        res.json({ 
          message: "Account created successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again." });
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
      req.session.firmId = user.firmId || undefined;
      
      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
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

  // Email-based authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Get user's firm if they have one
      let firm = null;
      if (user.firmId) {
        firm = await storage.getFirm(user.firmId);
      }

      // Set session data
      req.session.userId = user.id;
      req.session.firmId = user.firmId || undefined;
      
      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }, 
        firm: firm ? { 
          id: firm.id, 
          name: firm.name 
        } : null
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
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
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let firm = null;
      if (user.firmId) {
        firm = await storage.getFirm(user.firmId);
      }

      res.json({ 
        user: { 
          id: user.id, 
          firmId: user.firmId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }, 
        firm: firm ? { 
          id: firm.id, 
          name: firm.name 
        } : null
      });
    } catch (error) {
      console.error("Auth me error:", error);
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

  // Quotation routes
  app.get("/api/quotations", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const quotations = await storage.getQuotationsByFirm(req.session.firmId);
    res.json(quotations);
  });

  app.post("/api/quotations", async (req, res) => {
    if (!req.session?.firmId || !req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const quotationData = {
        ...req.body,
        firmId: req.session.firmId,
      };
      
      const quotation = await storage.createQuotation(quotationData);
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "quotation_created",
        entityType: "quotation",
        entityId: quotation.id,
        description: `Quotation "${quotation.title}" created for client`,
      });

      res.status(201).json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Invalid quotation data" });
    }
  });

  app.post("/api/quotations/:id/convert", async (req, res) => {
    if (!req.session?.firmId || !req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const quotationId = parseInt(req.params.id);
      const event = await storage.convertQuotationToEvent(quotationId);
      
      if (!event) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "quotation_converted",
        entityType: "event",
        entityId: event.id,
        description: `Quotation converted to event "${event.title}"`,
      });

      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Failed to convert quotation" });
    }
  });

  // Enhanced payment routes with Google Sheets sync
  app.post("/api/payments", async (req, res) => {
    if (!req.session?.firmId || !req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const paymentData = {
        ...req.body,
        firmId: req.session.firmId,
        receivedBy: req.session.userId,
      };
      
      const payment = await storage.createPayment(paymentData);
      
      // Get firm info for Google Sheets integration
      const firm = await storage.getFirm(req.session.firmId);
      if (firm?.spreadsheetId) {
        try {
          // Sync payment to Google Sheets
          const event = await storage.getEvent(payment.eventId);
          if (event) {
            await googleSheetsService.addPaymentToSheet(firm.spreadsheetId, { ...payment, event });
          }
        } catch (sheetsError) {
          console.error("Failed to sync payment to Google Sheets:", sheetsError);
        }
      }
      
      // Create activity log
      await storage.createActivityLog({
        firmId: req.session.firmId,
        userId: req.session.userId,
        action: "payment_recorded",
        entityType: "payment",
        entityId: payment.id,
        description: `Payment of ₹${payment.amount} recorded`,
      });

      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.get("/api/payments", async (req, res) => {
    if (!req.session?.firmId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payments = await storage.getPaymentsByFirm(req.session.firmId);
    res.json(payments);
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

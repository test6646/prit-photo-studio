import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Firms table - for multi-tenant architecture
export const firms = pgTable("firms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Users table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id"), // nullable for admin users
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["admin", "photographer", "videographer", "editor", "other"] }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  clientId: integer("client_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // wedding, birthday, corporate, etc
  eventDate: timestamp("event_date").notNull(),
  venue: text("venue"),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, editing, completed, delivered
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).notNull(),
  photographerId: integer("photographer_id"),
  videographerId: integer("videographer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  eventId: integer("event_id").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // photo_editing, video_editing, delivery, etc
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  eventId: integer("event_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, upi, bank_transfer, card
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  notes: text("notes"),
  receivedBy: integer("received_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // equipment, transport, utilities, etc
  expenseDate: timestamp("expense_date").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity logs for recent activity tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // event, task, payment, etc
  entityId: integer("entity_id").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertFirmSchema = createInsertSchema(firms).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Login schema
// Role-based signup schema
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  role: z.enum(["admin", "photographer", "videographer", "editor", "other"]),
  firmId: z.number().optional(), // Only required for non-admin roles
}).refine((data) => {
  // If role is not admin, firmId is required
  if (data.role !== "admin" && !data.firmId) {
    return false;
  }
  return true;
}, {
  message: "Firm selection is required for non-admin roles",
  path: ["firmId"],
});

// Create firm schema for admin users
export const createFirmSchema = z.object({
  name: z.string().min(2, "Studio name must be at least 2 characters"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
});

// Email-based login schema
export const emailLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Legacy PIN-based login (keeping for compatibility)
export const loginSchema = z.object({
  firmPin: z.string().min(4, "Firm PIN must be at least 4 characters"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type Firm = typeof firms.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertFirm = z.infer<typeof insertFirmSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Extended types for API responses
export type EventWithClient = Event & {
  client: Client;
  photographer?: User;
  videographer?: User;
  tasks?: Task[];
  payments?: Payment[];
};

export type TaskWithDetails = Task & {
  assignedUser: User;
  event: Event & { client: Client };
};

export type DashboardStats = {
  totalRevenue: number;
  activeEvents: number;
  pendingTasks: number;
  teamMembers: number;
  monthlyGrowth: number;
  weeklyEvents: number;
  tasksToday: number;
  activeTeamMembers: number;
};

export type FinancialSummary = {
  totalRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  totalExpenses: number;
  netProfit: number;
};

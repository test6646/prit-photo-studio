import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import {
  firms, users, clients, events, tasks, payments, expenses, activityLogs,
  type Firm, type User, type Client, type Event, type Task, type Payment, type Expense, type ActivityLog,
  type InsertFirm, type InsertUser, type InsertClient, type InsertEvent, type InsertTask, type InsertPayment, type InsertExpense, type InsertActivityLog,
  type EventWithClient, type TaskWithDetails, type DashboardStats, type FinancialSummary
} from "@shared/schema";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Firm management
  createFirm(firm: InsertFirm): Promise<Firm>;
  getFirmByPin(pin: string): Promise<Firm | undefined>;
  
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByFirm(firmId: number): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  
  // Client management
  createClient(client: InsertClient): Promise<Client>;
  getClientsByFirm(firmId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  
  // Event management
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsByFirm(firmId: number): Promise<EventWithClient[]>;
  getEvent(id: number): Promise<EventWithClient | undefined>;
  updateEventStatus(id: number, status: string): Promise<Event | undefined>;
  
  // Task management
  createTask(task: InsertTask): Promise<Task>;
  getTasksByFirm(firmId: number): Promise<TaskWithDetails[]>;
  getTasksByUser(userId: number): Promise<TaskWithDetails[]>;
  updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined>;
  
  // Payment management
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByEvent(eventId: number): Promise<Payment[]>;
  getPaymentsByFirm(firmId: number): Promise<Payment[]>;
  
  // Expense management
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByFirm(firmId: number): Promise<Expense[]>;
  
  // Activity logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByFirm(firmId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Dashboard analytics
  getDashboardStats(firmId: number): Promise<DashboardStats>;
  getFinancialSummary(firmId: number): Promise<FinancialSummary>;
}

export class DatabaseStorage implements IStorage {
  private databaseAvailable = true;
  private sampleData = {
    firms: new Map<number, Firm>(),
    users: new Map<number, User>(),
    clients: new Map<number, Client>(),
    events: new Map<number, Event>(),
    tasks: new Map<number, Task>(),
    payments: new Map<number, Payment>(),
    expenses: new Map<number, Expense>(),
    activityLogs: new Map<number, ActivityLog>(),
  };
  private currentId = 1;
  
  async seedSampleData() {
    try {
      // Check if data already exists
      const existingFirms = await db.select().from(firms).limit(1);
      if (existingFirms.length > 0) return; // Data already seeded
    } catch (error) {
      console.warn("Database connection failed, using sample data for demo");
      this.databaseAvailable = false;
      this.createSampleData();
      return; // Skip seeding if database is not available
    }
    
    // Create sample firm
    const [sampleFirm] = await db.insert(firms).values({
      name: "Aperture Studios",
      pin: "1234",
    }).returning();

    // Create sample users
    await db.insert(users).values([
      {
        firmId: sampleFirm.id,
        username: "admin",
        email: "sarah@aperturestudios.com",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "admin",
        phone: "+91 9876543210",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      {
        firmId: sampleFirm.id,
        username: "rahul",
        email: "rahul@aperturestudios.com", 
        password: "password123",
        firstName: "Rahul",
        lastName: "Kumar",
        role: "photographer",
        phone: "+91 9123456789",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      },
      {
        firmId: sampleFirm.id,
        username: "maya",
        email: "maya@aperturestudios.com",
        password: "password123", 
        firstName: "Maya",
        lastName: "Patel",
        role: "videographer",
        phone: "+91 9234567890",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
      }
    ]);

    // Create sample clients
    await db.insert(clients).values([
      {
        firmId: sampleFirm.id,
        name: "Arjun & Priya's Wedding",
        phone: "+91 9345678901",
        email: "arjun.priya@email.com",
        address: "MG Road, Bangalore, Karnataka 560001",
        notes: "Traditional South Indian wedding, outdoor ceremony preferred",
      },
      {
        firmId: sampleFirm.id,
        name: "Tech Innovations Corp",
        phone: "+91 9456789012",
        email: "events@techinnovations.com",
        address: "Electronic City, Bangalore, Karnataka 560100",
        notes: "Annual company event, need professional headshots for leadership team",
      },
      {
        firmId: sampleFirm.id,
        name: "Baby Aarav's First Birthday",
        phone: "+91 9567890123",
        email: "aarav.parents@email.com",
        address: "Koramangala, Bangalore, Karnataka 560034",
        notes: "Casual family celebration, outdoor park setting preferred",
      }
    ]);

    // Get user and client IDs for events
    const allUsers = await db.select().from(users).where(eq(users.firmId, sampleFirm.id));
    const allClients = await db.select().from(clients).where(eq(clients.firmId, sampleFirm.id));
    
    const photographer = allUsers.find(u => u.role === "photographer");
    const videographer = allUsers.find(u => u.role === "videographer");

    // Create sample events
    const [event1] = await db.insert(events).values({
      firmId: sampleFirm.id,
      clientId: allClients[0].id,
      title: "Arjun & Priya's Wedding Photography",
      description: "Full day wedding coverage including mehendi, ceremony and reception",
      eventType: "wedding",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: "Palace Grounds, Bangalore",
      status: "confirmed",
      totalAmount: "85000.00",
      balanceAmount: "35000.00",
      photographerId: photographer?.id || null,
      videographerId: videographer?.id || null,
    }).returning();

    await db.insert(events).values([
      {
        firmId: sampleFirm.id,
        clientId: allClients[1].id,
        title: "Tech Innovations Annual Meet",
        description: "Corporate event photography and team headshots",
        eventType: "corporate",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        venue: "Taj West End, Bangalore",
        status: "pending",
        totalAmount: "45000.00",
        balanceAmount: "45000.00",
        photographerId: photographer?.id || null,
        videographerId: null,
      },
      {
        firmId: sampleFirm.id,
        clientId: allClients[2].id,
        title: "Aarav's Birthday Celebration",
        description: "First birthday party photography",
        eventType: "birthday",
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        venue: "Cubbon Park, Bangalore",
        status: "confirmed",
        totalAmount: "15000.00",
        balanceAmount: "7500.00",
        photographerId: photographer?.id || null,
        videographerId: null,
      }
    ]);

    // Create sample tasks
    await db.insert(tasks).values([
      {
        firmId: sampleFirm.id,
        title: "Equipment check for wedding",
        description: "Verify all cameras, lenses, lighting equipment and backup gear",
        eventId: event1.id,
        assignedTo: photographer?.id || allUsers[0].id,
        taskType: "preparation",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        firmId: sampleFirm.id,
        title: "Location scouting for wedding",
        description: "Visit venue and plan shot compositions",
        eventId: event1.id,
        assignedTo: photographer?.id || allUsers[0].id,
        taskType: "preparation",
        status: "in_progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      }
    ]);

    // Create sample payments
    await db.insert(payments).values([
      {
        firmId: sampleFirm.id,
        eventId: event1.id,
        amount: "50000.00",
        paymentMethod: "bank_transfer",
        paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        receivedBy: allUsers[0].id,
        notes: "Advance payment for wedding package",
      },
      {
        firmId: sampleFirm.id,
        eventId: allClients[2].id, // Birthday event
        amount: "7500.00",
        paymentMethod: "upi",
        paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        receivedBy: allUsers[0].id,
        notes: "Advance payment for birthday shoot",
      }
    ]);

    // Create sample expense
    await db.insert(expenses).values({
      firmId: sampleFirm.id,
      title: "New Camera Lens Purchase",
      description: "85mm f/1.4 prime lens for portrait photography",
      amount: "35000.00",
      category: "equipment",
      expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: allUsers[0].id,
    });

    console.log("Sample data seeded successfully!");
  }

  private createSampleData() {
    // Create sample firm
    const sampleFirm: Firm = {
      id: 1,
      name: "Aperture Studios",
      pin: "1234",
      createdAt: new Date(),
      isActive: true,
    };
    this.sampleData.firms.set(1, sampleFirm);

    // Create sample users
    const users = [
      {
        id: 1,
        firmId: 1,
        username: "admin",
        email: "sarah@aperturestudios.com",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "admin",
        phone: "+91 9876543210",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        firmId: 1,
        username: "rahul",
        email: "rahul@aperturestudios.com", 
        password: "password123",
        firstName: "Rahul",
        lastName: "Kumar",
        role: "photographer",
        phone: "+91 9123456789",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        firmId: 1,
        username: "maya",
        email: "maya@aperturestudios.com",
        password: "password123", 
        firstName: "Maya",
        lastName: "Patel",
        role: "videographer",
        phone: "+91 9234567890",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
        isActive: true,
        createdAt: new Date(),
      }
    ];

    users.forEach(user => this.sampleData.users.set(user.id, user));

    // Create sample clients
    const clients = [
      {
        id: 1,
        firmId: 1,
        name: "Arjun & Priya's Wedding",
        phone: "+91 9345678901",
        email: "arjun.priya@email.com",
        address: "MG Road, Bangalore, Karnataka 560001",
        notes: "Traditional South Indian wedding, outdoor ceremony preferred",
        createdAt: new Date(),
      },
      {
        id: 2,
        firmId: 1,
        name: "Tech Innovations Corp",
        phone: "+91 9456789012",
        email: "events@techinnovations.com",
        address: "Electronic City, Bangalore, Karnataka 560100",
        notes: "Annual company event, need professional headshots for leadership team",
        createdAt: new Date(),
      },
      {
        id: 3,
        firmId: 1,
        name: "Baby Aarav's First Birthday",
        phone: "+91 9567890123",
        email: "aarav.parents@email.com",
        address: "Koramangala, Bangalore, Karnataka 560034",
        notes: "Casual family celebration, outdoor park setting preferred",
        createdAt: new Date(),
      }
    ];

    clients.forEach(client => this.sampleData.clients.set(client.id, client));

    // Create sample events
    const events = [
      {
        id: 1,
        firmId: 1,
        clientId: 1,
        title: "Arjun & Priya's Wedding Photography",
        description: "Full day wedding coverage including mehendi, ceremony and reception",
        eventType: "wedding",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        venue: "Palace Grounds, Bangalore",
        status: "confirmed",
        totalAmount: "85000.00",
        balanceAmount: "35000.00",
        advanceAmount: "50000.00",
        photographerId: 2,
        videographerId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        firmId: 1,
        clientId: 2,
        title: "Tech Innovations Annual Meet",
        description: "Corporate event photography and team headshots",
        eventType: "corporate",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        venue: "Taj West End, Bangalore",
        status: "pending",
        totalAmount: "45000.00",
        balanceAmount: "45000.00",
        advanceAmount: "0.00",
        photographerId: 2,
        videographerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        firmId: 1,
        clientId: 3,
        title: "Aarav's Birthday Celebration",
        description: "First birthday party photography",
        eventType: "birthday",
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        venue: "Cubbon Park, Bangalore",
        status: "confirmed",
        totalAmount: "15000.00",
        balanceAmount: "7500.00",
        advanceAmount: "7500.00",
        photographerId: 2,
        videographerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    events.forEach(event => this.sampleData.events.set(event.id, event));
    this.currentId = 100;
  }
  async createFirm(firm: InsertFirm): Promise<Firm> {
    const [result] = await db.insert(firms).values(firm).returning();
    return result;
  }

  async getFirmByPin(pin: string): Promise<Firm | undefined> {
    if (!this.databaseAvailable) {
      return Array.from(this.sampleData.firms.values()).find(firm => firm.pin === pin);
    }
    const [result] = await db.select().from(firms).where(eq(firms.pin, pin));
    return result;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.databaseAvailable) {
      return Array.from(this.sampleData.users.values()).find(user => user.username === username);
    }
    const [result] = await db.select().from(users).where(eq(users.username, username));
    return result;
  }

  async getUsersByFirm(firmId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.firmId, firmId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async getClientsByFirm(firmId: number): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.firmId, firmId));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [result] = await db.select().from(clients).where(eq(clients.id, id));
    return result;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }

  async getEventsByFirm(firmId: number): Promise<EventWithClient[]> {
    const eventsWithClients = await db
      .select({
        event: events,
        client: clients,
      })
      .from(events)
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(eq(events.firmId, firmId));

    // Get tasks and payments for each event
    const eventIds = eventsWithClients.map(row => row.event.id);
    
    const eventTasks = eventIds.length > 0 
      ? await db.select().from(tasks).where(inArray(tasks.eventId, eventIds))
      : [];
    
    const eventPayments = eventIds.length > 0 
      ? await db.select().from(payments).where(inArray(payments.eventId, eventIds))
      : [];

    // Get photographer and videographer data
    const photographerIds = eventsWithClients
      .map(row => row.event.photographerId)
      .filter(id => id !== null);
    
    const videographerIds = eventsWithClients
      .map(row => row.event.videographerId)
      .filter(id => id !== null);
    
    const allUserIds = [...photographerIds, ...videographerIds];
    const eventUsers = allUserIds.length > 0 
      ? await db.select().from(users).where(inArray(users.id, allUserIds))
      : [];

    return eventsWithClients.map(row => {
      const photographer = row.event.photographerId 
        ? eventUsers.find(user => user.id === row.event.photographerId)
        : undefined;
      
      const videographer = row.event.videographerId
        ? eventUsers.find(user => user.id === row.event.videographerId)
        : undefined;

      return {
        ...row.event,
        client: row.client,
        photographer,
        videographer,
        tasks: eventTasks.filter(task => task.eventId === row.event.id),
        payments: eventPayments.filter(payment => payment.eventId === row.event.id),
      };
    });
  }

  async getEvent(id: number): Promise<EventWithClient | undefined> {
    const [eventWithClient] = await db
      .select({
        event: events,
        client: clients,
      })
      .from(events)
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(eq(events.id, id));

    if (!eventWithClient) return undefined;

    const [photographer] = eventWithClient.event.photographerId 
      ? await db.select().from(users).where(eq(users.id, eventWithClient.event.photographerId))
      : [undefined];

    const [videographer] = eventWithClient.event.videographerId
      ? await db.select().from(users).where(eq(users.id, eventWithClient.event.videographerId))
      : [undefined];

    const eventTasks = await db.select().from(tasks).where(eq(tasks.eventId, id));
    const eventPayments = await db.select().from(payments).where(eq(payments.eventId, id));

    return {
      ...eventWithClient.event,
      client: eventWithClient.client,
      photographer,
      videographer,
      tasks: eventTasks,
      payments: eventPayments,
    };
  }

  async updateEventStatus(id: number, status: string): Promise<Event | undefined> {
    const [result] = await db
      .update(events)
      .set({ status, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
  }

  async getTasksByFirm(firmId: number): Promise<TaskWithDetails[]> {
    const tasksWithDetails = await db
      .select({
        task: tasks,
        assignedUser: users,
        event: events,
        client: clients,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.assignedTo, users.id))
      .innerJoin(events, eq(tasks.eventId, events.id))
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(eq(tasks.firmId, firmId))
      .orderBy(desc(tasks.createdAt));

    return tasksWithDetails.map(row => ({
      ...row.task,
      assignedUser: row.assignedUser,
      event: { ...row.event, client: row.client },
    }));
  }

  async getTasksByUser(userId: number): Promise<TaskWithDetails[]> {
    const tasksWithDetails = await db
      .select({
        task: tasks,
        assignedUser: users,
        event: events,
        client: clients,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.assignedTo, users.id))
      .innerJoin(events, eq(tasks.eventId, events.id))
      .innerJoin(clients, eq(events.clientId, clients.id))
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));

    return tasksWithDetails.map(row => ({
      ...row.task,
      assignedUser: row.assignedUser,
      event: { ...row.event, client: row.client },
    }));
  }

  async updateTaskStatus(id: number, status: string, completedAt?: Date): Promise<Task | undefined> {
    const [result] = await db
      .update(tasks)
      .set({ 
        status, 
        completedAt: completedAt || null,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();
    return result;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db.insert(payments).values(payment).returning();
    return result;
  }

  async getPaymentsByEvent(eventId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.eventId, eventId));
  }

  async getPaymentsByFirm(firmId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.firmId, firmId));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(expense).returning();
    return result;
  }

  async getExpensesByFirm(firmId: number): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.firmId, firmId));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async getActivityLogsByFirm(firmId: number, limit = 10): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.firmId, firmId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getDashboardStats(firmId: number): Promise<DashboardStats> {
    const [stats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
        activeEvents: sql<number>`COUNT(DISTINCT CASE WHEN ${events.status} NOT IN ('completed', 'delivered') THEN ${events.id} END)`,
        pendingTasks: sql<number>`COUNT(DISTINCT CASE WHEN ${tasks.status} = 'pending' THEN ${tasks.id} END)`,
        teamMembers: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(events)
      .leftJoin(payments, eq(events.id, payments.eventId))
      .leftJoin(tasks, eq(events.id, tasks.eventId))
      .leftJoin(expenses, eq(events.firmId, expenses.firmId))
      .leftJoin(users, eq(events.firmId, users.firmId))
      .where(eq(events.firmId, firmId));

    // Additional calculations for growth metrics
    const monthlyGrowth = 15; // Placeholder - would need historical data calculation
    const weeklyEvents = Math.floor(stats.activeEvents / 4);
    const tasksToday = Math.floor(stats.pendingTasks / 7);
    const activeTeamMembers = stats.teamMembers;

    return {
      totalRevenue: stats.totalRevenue,
      activeEvents: stats.activeEvents,
      pendingTasks: stats.pendingTasks,
      teamMembers: stats.teamMembers,
      monthlyGrowth,
      weeklyEvents,
      tasksToday,
      activeTeamMembers,
    };
  }

  async getFinancialSummary(firmId: number): Promise<FinancialSummary> {
    const [financial] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${events.totalAmount} AS DECIMAL)), 0)`,
        receivedAmount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
      })
      .from(events)
      .leftJoin(payments, eq(events.id, payments.eventId))
      .leftJoin(expenses, eq(events.firmId, expenses.firmId))
      .where(eq(events.firmId, firmId));

    const pendingAmount = financial.totalRevenue - financial.receivedAmount;
    const netProfit = financial.receivedAmount - financial.totalExpenses;

    return {
      totalRevenue: financial.totalRevenue,
      receivedAmount: financial.receivedAmount,
      pendingAmount,
      totalExpenses: financial.totalExpenses,
      netProfit,
    };
  }
}

export const storage = new DatabaseStorage();
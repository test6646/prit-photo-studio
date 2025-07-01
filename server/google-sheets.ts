import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { Firm, Event, Client, Expense, Task, Payment } from '@shared/schema';

export class GoogleSheetsService {
  private sheets: any;
  private drive: any;
  private auth: JWT;

  constructor() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    this.auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async createFirmSpreadsheet(firm: Firm): Promise<string> {
    try {
      // Create new spreadsheet
      const spreadsheetResponse = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `${firm.name} - Photography Management`,
          },
          sheets: [
            { properties: { title: 'Events', gridProperties: { rowCount: 1000, columnCount: 15 } } },
            { properties: { title: 'Clients', gridProperties: { rowCount: 1000, columnCount: 10 } } },
            { properties: { title: 'Expenses', gridProperties: { rowCount: 1000, columnCount: 8 } } },
            { properties: { title: 'Tasks', gridProperties: { rowCount: 1000, columnCount: 10 } } },
            { properties: { title: 'Payments', gridProperties: { rowCount: 1000, columnCount: 8 } } },
          ],
        },
      });

      const spreadsheetId = spreadsheetResponse.data.spreadsheetId!;

      // Set up headers for each sheet
      await this.setupEventsSheet(spreadsheetId);
      await this.setupClientsSheet(spreadsheetId);
      await this.setupExpensesSheet(spreadsheetId);
      await this.setupTasksSheet(spreadsheetId);
      await this.setupPaymentsSheet(spreadsheetId);

      return spreadsheetId;
    } catch (error) {
      console.error('Error creating firm spreadsheet:', error);
      throw new Error('Failed to create firm spreadsheet');
    }
  }

  private async setupEventsSheet(spreadsheetId: string) {
    const headers = [
      'SR NO',
      'CLIENT ID', 
      'NAME',
      'DATE',
      'EVENT TYPE',
      'TOTAL BILL',
      'CREDIT AMOUNT',
      'STILL AMOUNT',
      'PHOTOGRAPHER',
      'VIDEOGRAPHER',
      'PHOTO EDITOR',
      'VIDEO EDITOR',
      'STORAGE DISK',
      'STORAGE SIZE',
      'STATUS'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Events!A1:O1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });

    // Apply formatting
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });
  }

  private async setupClientsSheet(spreadsheetId: string) {
    const headers = [
      'ID',
      'NAME',
      'PHONE',
      'EMAIL',
      'ADDRESS',
      'NOTES',
      'CREATED DATE',
      'TOTAL EVENTS',
      'TOTAL PAID',
      'STATUS'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Clients!A1:J1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });
  }

  private async setupExpensesSheet(spreadsheetId: string) {
    const headers = [
      'ID',
      'TITLE',
      'DESCRIPTION',
      'AMOUNT',
      'CATEGORY',
      'DATE',
      'CREATED BY',
      'STATUS'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expenses!A1:H1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });
  }

  private async setupTasksSheet(spreadsheetId: string) {
    const headers = [
      'ID',
      'TITLE',
      'DESCRIPTION',
      'EVENT',
      'ASSIGNED TO',
      'TASK TYPE',
      'PRIORITY',
      'STATUS',
      'DUE DATE',
      'COMPLETED DATE'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Tasks!A1:J1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });
  }

  private async setupPaymentsSheet(spreadsheetId: string) {
    const headers = [
      'ID',
      'EVENT',
      'AMOUNT',
      'PAYMENT METHOD',
      'PAYMENT DATE',
      'RECEIVED BY',
      'NOTES',
      'STATUS'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Payments!A1:H1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    });
  }

  async addEventToSheet(spreadsheetId: string, event: Event & { client: Client }, rowNumber: number) {
    const eventTypeColors: { [key: string]: { bg: string; text: string } } = {
      'wedding': { bg: '#FFE5E5', text: '#D63384' },
      'pre-wedding': { bg: '#E5F3FF', text: '#0D6EFD' },
      'engagement': { bg: '#FFF3CD', text: '#F57C00' },
      'birthday': { bg: '#E5F7E5', text: '#198754' },
      'corporate': { bg: '#F3E5F5', text: '#6F42C1' },
    };

    const values = [
      rowNumber,
      event.clientId,
      event.client.name,
      new Date(event.eventDate).toLocaleDateString(),
      event.eventType,
      event.totalAmount,
      event.advanceAmount || '0',
      parseFloat(event.totalAmount) - parseFloat(event.advanceAmount || '0'),
      event.photographerId || '',
      event.videographerId || '',
      '', // Photo Editor
      '', // Video Editor
      '', // Storage Disk
      '', // Storage Size
      event.status,
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Events!A:O',
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });
  }

  async addClientToSheet(spreadsheetId: string, client: Client) {
    const values = [
      client.id,
      client.name,
      client.phone,
      client.email,
      client.address,
      client.notes,
      new Date(client.createdAt).toLocaleDateString(),
      0, // Total Events
      0, // Total Paid
      'Active',
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Clients!A:J',
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });
  }

  async addExpenseToSheet(spreadsheetId: string, expense: Expense) {
    const values = [
      expense.id,
      expense.title,
      expense.description,
      expense.amount,
      expense.category,
      new Date(expense.expenseDate).toLocaleDateString(),
      expense.createdBy,
      'Recorded',
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Expenses!A:H',
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });
  }

  async addTaskToSheet(spreadsheetId: string, task: Task & { event?: Event }) {
    const values = [
      task.id,
      task.title,
      task.description,
      task.event?.title || '',
      task.assignedTo,
      task.taskType,
      task.priority,
      task.status,
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '',
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Tasks!A:J',
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });
  }

  async addPaymentToSheet(spreadsheetId: string, payment: Payment & { event?: Event }) {
    const values = [
      payment.id,
      payment.event?.title || '',
      payment.amount,
      payment.paymentMethod,
      new Date(payment.paymentDate).toLocaleDateString(),
      payment.receivedBy,
      payment.notes,
      'Received',
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Payments!A:H',
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });
  }
}

export const googleSheetsService = new GoogleSheetsService();
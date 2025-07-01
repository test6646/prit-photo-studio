import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm');
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE');
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function getStatusColor(status: string): string {
  const statusMap = {
    scheduled: 'status-scheduled',
    in_progress: 'status-in_progress',
    editing: 'status-editing',
    completed: 'status-completed',
    delivered: 'status-completed',
    overdue: 'status-overdue',
    pending: 'status-pending',
  };
  
  return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800';
}

export function getStatusText(status: string): string {
  const statusMap = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    editing: 'Editing',
    completed: 'Completed',
    delivered: 'Delivered',
    overdue: 'Overdue',
    pending: 'Pending',
  };
  
  return statusMap[status as keyof typeof statusMap] || status;
}

export function getPriorityColor(priority: string): string {
  const priorityMap = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent',
  };
  
  return priorityMap[priority as keyof typeof priorityMap] || 'priority-medium';
}

export function getEventTypeIcon(eventType: string): string {
  const iconMap = {
    wedding: 'fas fa-heart',
    birthday: 'fas fa-birthday-cake',
    corporate: 'fas fa-building',
    portrait: 'fas fa-user',
    fashion: 'fas fa-tshirt',
    product: 'fas fa-box',
    event: 'fas fa-calendar-alt',
  };
  
  return iconMap[eventType as keyof typeof iconMap] || 'fas fa-camera';
}

export function getEventTypeColor(eventType: string): string {
  const colorMap = {
    wedding: 'bg-pink-100 text-pink-600',
    birthday: 'bg-blue-100 text-blue-600',
    corporate: 'bg-purple-100 text-purple-600',
    portrait: 'bg-green-100 text-green-600',
    fashion: 'bg-indigo-100 text-indigo-600',
    product: 'bg-orange-100 text-orange-600',
    event: 'bg-gray-100 text-gray-600',
  };
  
  return colorMap[eventType as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function isOverdue(dueDate: Date | string): boolean {
  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return dateObj < new Date();
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's an Indian number
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

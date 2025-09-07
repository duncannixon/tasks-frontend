export interface IPaginationItem {
  number: number;
  current: boolean;
  href: string;
}

export interface IPaginationOptions {
  previous?: { href: string };
  next?: { href: string };
  items: IPaginationItem[];
}

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: Date | { day: string; month: string; year: string };
  time?: string;
}

export interface TaskFormData {
  [key: string]: string | undefined;
  title?: string;
  description?: string;
  status?: string;
  'due-date-day'?: string;
  'due-date-month'?: string;
  'due-date-year'?: string;
  time?: string;
}

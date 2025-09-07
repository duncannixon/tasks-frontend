import { ITask } from './types/Task';
import { IPaginationItem } from './types/types';

const FIRST_PAGE = 1;
const TASKS_PER_PAGE = 5;

export const buildPaginationItems = (baseHref: string, currentPage: number, totalPages: number): IPaginationItem[] =>
  Array.from({ length: totalPages }, (_, i) => {
    const pageNumber = i + 1;
    return {
      number: pageNumber,
      current: currentPage === pageNumber,
      href: `${baseHref}${pageNumber}`,
    };
  });

export const getTasksForCurrentPage = (tasks: ITask[], currentPage: number): ITask[] =>
  tasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);

export const calculateTotalPages = (totalTasks: number): number => Math.ceil(totalTasks / TASKS_PER_PAGE);

export const hasPrevious = (currentPage: number): boolean => currentPage !== FIRST_PAGE;

export const hasNext = (currentPage: number, totalPages: number): boolean => currentPage !== totalPages;

export const hasPagination = (totalTasks: number): boolean => totalTasks > TASKS_PER_PAGE;

export const buildErrorList = (errors: Record<string, string>): { text: string; href: string }[] => {
  return Object.entries(errors).map(([key, text]) => ({
    text,
    href: `#${key.replace(/\./g, '-')}`,
  }));
};

export const trimWhitespaceFromAllFields = <T extends Record<string, string | undefined>>(
  obj: T,
): { [K in keyof T]: T[K] } => {
  const result = {} as { [K in keyof T]: T[K] };

  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    const value = obj[key];
    // Only trim if it's a string, otherwise leave as undefined
    result[key] = typeof value === 'string' ? (value.trim() as T[typeof key]) : value;
  });

  return result;
};

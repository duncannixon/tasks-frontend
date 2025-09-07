import { ITask } from '../../../../task-api/src/models/task';
import {
  buildErrorList,
  buildPaginationItems,
  calculateTotalPages,
  getTasksForCurrentPage,
  hasNext,
  hasPagination,
  hasPrevious,
  trimWhitespaceFromAllFields,
} from '../../main/utilities';

describe('Utilities', () => {
  describe('buildPaginationItems', () => {
    test('builds correct pagination items', () => {
      const baseHref = '/tasks?page=';
      const currentPage = 2;
      const totalPages = 3;

      const result = buildPaginationItems(baseHref, currentPage, totalPages);

      expect(result).toEqual([
        { number: 1, current: false, href: '/tasks?page=1' },
        { number: 2, current: true, href: '/tasks?page=2' },
        { number: 3, current: false, href: '/tasks?page=3' },
      ]);
    });

    test('returns empty array if totalPages is 0', () => {
      expect(buildPaginationItems('/tasks?page=', 1, 0)).toEqual([]);
    });
  });

  describe('getTasksForCurrentPage', () => {
    // Use Partial<ITask> so TS doesn't require all Mongoose methods
    const mockTasks: Partial<ITask>[] = Array.from({ length: 12 }, (_, i) => ({
      _id: `${i + 1}`,
      title: `Task ${i + 1}`,
      status: 'Not started',
      description: `Description ${i + 1}`,
    }));

    test('returns first page tasks', () => {
      const result = getTasksForCurrentPage(mockTasks as ITask[], 1).map((t) => t.title);
      expect(result).toEqual(['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']);
    });

    test('returns second page tasks', () => {
      const result = getTasksForCurrentPage(mockTasks as ITask[], 2).map((t) => t.title);
      expect(result).toEqual(['Task 6', 'Task 7', 'Task 8', 'Task 9', 'Task 10']);
    });

    test('returns last page tasks when less than page size', () => {
      const result = getTasksForCurrentPage(mockTasks as ITask[], 3).map((t) => t.title);
      expect(result).toEqual(['Task 11', 'Task 12']);
    });
  });

  describe('calculateTotalPages', () => {
    test('calculates total pages correctly', () => {
      expect(calculateTotalPages(0)).toBe(0);
      expect(calculateTotalPages(1)).toBe(1);
      expect(calculateTotalPages(5)).toBe(1);
      expect(calculateTotalPages(6)).toBe(2);
      expect(calculateTotalPages(12)).toBe(3);
    });
  });

  describe('hasPrevious', () => {
    test('returns false on first page', () => {
      expect(hasPrevious(1)).toBe(false);
    });

    test('returns true on subsequent pages', () => {
      expect(hasPrevious(2)).toBe(true);
      expect(hasPrevious(10)).toBe(true);
    });
  });

  describe('hasNext', () => {
    test('returns false on last page', () => {
      expect(hasNext(3, 3)).toBe(false);
    });

    test('returns true on pages before last', () => {
      expect(hasNext(1, 3)).toBe(true);
      expect(hasNext(2, 3)).toBe(true);
    });
  });

  describe('hasPagination', () => {
    test('returns false if tasks do not exceed page size', () => {
      expect(hasPagination(0)).toBe(false);
      expect(hasPagination(5)).toBe(false);
    });

    test('returns true if tasks exceed page size', () => {
      expect(hasPagination(6)).toBe(true);
      expect(hasPagination(10)).toBe(true);
    });
  });

  describe('buildErrorList', () => {
    test('converts errors object to array with text and href', () => {
      const errors = {
        title: 'Title is required',
        'due-date-day': 'Day is required',
        'nested.field': 'Nested field error',
      };

      const result = buildErrorList(errors);

      expect(result).toEqual([
        { text: 'Title is required', href: '#title' },
        { text: 'Day is required', href: '#due-date-day' },
        { text: 'Nested field error', href: '#nested-field' },
      ]);
    });

    test('returns empty array when no errors', () => {
      expect(buildErrorList({})).toEqual([]);
    });
  });

  describe('trimWhitespaceFromAllFields', () => {
    test('trims leading and trailing whitespace from string fields', () => {
      const input = {
        title: '  Hello  ',
        description: 'World ',
        status: undefined,
      };

      const result = trimWhitespaceFromAllFields(input);

      expect(result).toEqual({
        title: 'Hello',
        description: 'World',
        status: undefined,
      });
    });

    test('handles empty strings correctly', () => {
      const input = {
        field1: '   ',
        field2: '',
      };

      const result = trimWhitespaceFromAllFields(input);

      expect(result).toEqual({
        field1: '',
        field2: '',
      });
    });

    test('does not modify undefined fields', () => {
      const input = {
        field1: undefined,
        field2: '   test  ',
      };

      const result = trimWhitespaceFromAllFields(input);

      expect(result).toEqual({
        field1: undefined,
        field2: 'test',
      });
    });

    test('preserves type for generic input', () => {
      type Form = { name?: string; age?: string };
      const input: Form = { name: ' Alice ', age: undefined };

      const result = trimWhitespaceFromAllFields<Form>(input);

      expect(result).toEqual({ name: 'Alice', age: undefined });
    });
  });
});

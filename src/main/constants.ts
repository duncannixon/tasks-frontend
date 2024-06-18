export const API_PORT = 3000;
export const API_HOST = `http://localhost:${API_PORT}`;
export const TASKS_ENDPOINT = `${API_HOST}/tasks`;

export const ROUTES = {
  HOME: '/',
  TASK_LIST: '/tasks/list',
  TASK_LIST_PAGE: (page: number = 1): string => `/tasks/list?page=${page}`,
  NEW_TASK: '/tasks/new',
  EDIT_TASK: '/tasks/:id/edit',
  TASK_EDIT: (id: string): string => `/tasks/${id}/edit`,
  TASK_DELETE: (id: string): string => `/tasks/${id}/delete`,
};

export const VIEWS = {
  ERROR: 'error',
  HOME: 'home',
  TASK_FORM: 'tasks/form',
  TASK_LIST: 'tasks/list',
  TASK_CONFIRM_DELETE: 'tasks/confirm-delete',
};

export const MAX_FIELD_LENGTH = 100;

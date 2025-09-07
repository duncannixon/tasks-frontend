import { ROUTES, TASKS_ENDPOINT, VIEWS } from '../../constants';
import { Task, TaskFormData } from '../../types/types';
import { buildErrorList, trimWhitespaceFromAllFields } from '../../utilities';

import axios from 'axios';
import { Application, Request, Response } from 'express';

const MAX_FIELD_LENGTH = 100;

const { TASK_FORM } = VIEWS;

const normaliseTime = (time: string): string => {
  let normalisedTime = time.trim();

  if (/^\d{4}$/.test(normalisedTime)) {
    normalisedTime = normalisedTime.slice(0, 2) + ':' + normalisedTime.slice(2);
  } else if (/^\d{3}$/.test(normalisedTime)) {
    normalisedTime = '0' + normalisedTime[0] + ':' + normalisedTime.slice(1);
  }

  return normalisedTime;
};

const datePartsAreNumeric = (day: string, month: string, year: string): boolean => {
  return /^\d+$/.test(day) && /^\d+$/.test(month) && /^\d+$/.test(year);
};

const validateTaskForm = (body: TaskFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const { title, description, 'due-date-day': day, 'due-date-month': month, 'due-date-year': year, time } = body;

  if (!title?.trim()) {
    errors.title = 'Title is required';
  } else if (title.length > MAX_FIELD_LENGTH) {
    errors.title = `Title can be a maximum of ${MAX_FIELD_LENGTH} characters long`;
  }

  if (description?.length && description.length > MAX_FIELD_LENGTH) {
    errors.description = `Description can be a maximum of ${MAX_FIELD_LENGTH} characters long`;
  }

  if (!day || !month || !year) {
    errors.dueDateDay = 'Due date is required';
  } else if (!datePartsAreNumeric(day, month, year)) {
    errors.dueDateDay = 'Date must contain numbers only';
  } else {
    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);

    const constructed = new Date(yearNum, monthNum - 1, dayNum);

    if (
      constructed.getFullYear() !== yearNum ||
      constructed.getMonth() + 1 !== monthNum ||
      constructed.getDate() !== dayNum
    ) {
      errors.dueDateDay = 'Enter a valid date';
    }
  }

  if (!time) {
    errors.time = 'Time is required';
  } else {
    const normalisedTime = normaliseTime(time);

    if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(normalisedTime)) {
      errors.time = 'Enter a valid time in 24-hour format (hh:mm)';
    }
  }

  return errors;
};

export default (app: Application): void => {
  app.get(ROUTES.NEW_TASK, (_req: Request, res: Response) => {
    const errors: Record<string, string> = {};
    const errorList: { text: string; href: string }[] = [];

    res.render(TASK_FORM, { task: undefined, isEdit: false, errors, errorList });
  });

  app.get(ROUTES.EDIT_TASK, async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const errors: Record<string, string> = {};
    const errorList: { text: string; href: string }[] = [];

    try {
      const response = await axios.get<Task>(`${TASKS_ENDPOINT}/${id}`);
      const task = response.data;

      if (task.dueDate) {
        const due = new Date(task.dueDate as Date);

        task.dueDate = {
          day: String(due.getDate()).padStart(2, '0'),
          month: String(due.getMonth() + 1).padStart(2, '0'),
          year: String(due.getFullYear()),
        };

        task.time = String(due.getHours()).padStart(2, '0') + ':' + String(due.getMinutes()).padStart(2, '0');
      }

      res.render(TASK_FORM, { task, isEdit: true, errors, errorList });
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);

      let errorMessage = 'Something went wrong';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `API responded with status ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response received from the Task service API';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(errorMessage);

      res.redirect(ROUTES.TASK_LIST);
    }
  });

  app.post(ROUTES.NEW_TASK, async (req: Request<Record<string, never>, unknown, TaskFormData>, res: Response) => {
    const trimmedBody = trimWhitespaceFromAllFields(req.body);
    const {
      title,
      description,
      status,
      'due-date-day': day,
      'due-date-month': month,
      'due-date-year': year,
      time,
    } = trimmedBody;

    const errors = validateTaskForm(trimmedBody);
    const errorList = buildErrorList(errors);

    let dueDate: Date | undefined;
    let normalisedTime: string | undefined;

    if (!Object.keys(errors).length && day && month && year && time) {
      normalisedTime = normaliseTime(time);
      const [hours, minutes] = normalisedTime.split(':').map(Number);
      dueDate = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
    }

    if (Object.keys(errors).length) {
      return res.status(400).render(TASK_FORM, {
        error: 'There is a problem with your submission',
        errors,
        errorList,
        task: { title, description, status, dueDate: { day, month, year }, time },
        isEdit: false,
      });
    }

    const payload: Task = { title: title!, description, status, dueDate, time: normalisedTime };

    try {
      await axios.post(TASKS_ENDPOINT, payload);
      res.redirect(ROUTES.TASK_LIST);
    } catch (error: unknown) {
      console.error('Error creating task:', error);

      let errorMessage = 'There was a problem creating the task';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.render(TASK_FORM, {
        error: errorMessage,
        errors: {},
        errorList: [],
        task: { title, description, status, dueDate: { day, month, year }, time },
        isEdit: false,
      });
    }
  });

  app.post(ROUTES.EDIT_TASK, async (req: Request<{ id: string }, unknown, TaskFormData>, res: Response) => {
    const { id } = req.params;
    const trimmedBody = trimWhitespaceFromAllFields(req.body);
    const {
      title,
      description,
      status,
      'due-date-day': day,
      'due-date-month': month,
      'due-date-year': year,
      time,
    } = trimmedBody;

    const errors = validateTaskForm(trimmedBody);
    const errorList = buildErrorList(errors);

    let dueDate: Date | undefined;
    let normalisedTime: string | undefined;

    if (!Object.keys(errors).length && day && month && year && time) {
      normalisedTime = normaliseTime(time);
      const [hours, minutes] = normalisedTime.split(':').map(Number);
      dueDate = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
    }

    if (Object.keys(errors).length) {
      return res.status(400).render(TASK_FORM, {
        error: 'There is a problem with your submission',
        errors,
        errorList,
        task: { _id: id, title, description, status, dueDate: { day, month, year }, time },
        isEdit: true,
      });
    }

    try {
      await axios.patch(`${TASKS_ENDPOINT}/${id}`, { title, description, status, dueDate, time: normalisedTime });
      res.redirect(ROUTES.TASK_LIST);
    } catch (error: unknown) {
      console.error(`Error updating task ${id}:`, error);

      let errorMessage = 'There was a problem updating the task';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.render(TASK_FORM, {
        error: errorMessage,
        errors: {},
        errorList: [],
        task: { _id: id, title, description, status, dueDate: { day, month, year }, time },
        isEdit: true,
      });
    }
  });
};

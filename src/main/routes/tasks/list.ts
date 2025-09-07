import { ROUTES, TASKS_ENDPOINT, VIEWS } from '../../constants';
import { ITask } from '../../types/Task';
import { IPaginationOptions, ISummaryListRow } from '../../types/types';
import {
  buildPaginationItems,
  calculateTotalPages,
  getTasksForCurrentPage,
  hasNext,
  hasPagination,
  hasPrevious,
} from '../../utilities';

import axios from 'axios';
import { Application, Request, Response } from 'express';

const DEFAULT_PAGE = 1;
const TASK_LIST_TEMPLATE = VIEWS.TASK_LIST;
const TASK_LIST_ROUTE = ROUTES.TASK_LIST;

const statusTagClass = (status?: string) => {
  if (!status) {
    return 'govuk-tag';
  }

  switch (status.toLowerCase()) {
    case 'complete':
      return 'govuk-tag--green';
    case 'in progress':
      return 'govuk-tag--blue';
    case 'pending':
      return 'govuk-tag--yellow';
    default:
      return 'govuk-tag';
  }
};

export const buildSummaryListRows = (tasks: ITask[]): ISummaryListRow[] =>
  tasks
    .filter((task) => task.status?.toLowerCase() !== 'overdue') // remove overdue tasks
    .map((task) => ({
      key: {
        html: `<a href="/tasks/${task._id}/edit" class="govuk-link">${task.title}</a>`,
      },
      value: {
        html: `<a href="/tasks/${task._id}/edit" class="govuk-link">${task.description}</a>`,
      },
      actions: {
        items: [
          {
            href: `/tasks/${task._id}/edit`,
            visuallyHiddenText: task.title,
            html: `<span class="govuk-tag ${statusTagClass(task.status)}">${task.status ?? ''}</span>`,
          },
        ],
      },
    }));

export default (app: Application): void => {
  app.get(TASK_LIST_ROUTE, async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || DEFAULT_PAGE;

    try {
      const response = await axios.get(TASKS_ENDPOINT);
      const tasks: ITask[] = response.data;

      const totalTasks = tasks.length;
      const paginatedTasks = getTasksForCurrentPage(tasks, currentPage);
      const summaryListRows = buildSummaryListRows(paginatedTasks);

      const totalPages = calculateTotalPages(totalTasks);

      const paginationOptions: IPaginationOptions = {
        items: buildPaginationItems(TASK_LIST_ROUTE + '?page=', currentPage, totalPages),
      };

      // Previous link
      if (hasPrevious(currentPage)) {
        paginationOptions.previous = {
          href: `${TASK_LIST_ROUTE}?page=${currentPage - 1}`,
        };
      }

      // Next link
      if (hasNext(currentPage, totalPages)) {
        paginationOptions.next = {
          href: `${TASK_LIST_ROUTE}?page=${currentPage + 1}`,
        };
      }

      res.render(TASK_LIST_TEMPLATE, {
        summaryListRows,
        hasPagination: hasPagination(totalTasks),
        paginationOptions,
      });
    } catch (error) {
      console.error('Error making request:', error);
      res.render(TASK_LIST_TEMPLATE, {});
    }
  });
};

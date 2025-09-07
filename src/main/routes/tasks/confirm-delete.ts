import { ROUTES, TASKS_ENDPOINT, VIEWS } from '../../constants';

import axios from 'axios';
import { Application, Request, Response } from 'express';

const { TASK_FORM, TASK_CONFIRM_DELETE } = VIEWS;

export default (app: Application): void => {
  app.get(ROUTES.TASK_DELETE(':id'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const response = await axios.get(`${TASKS_ENDPOINT}/${id}`);
      const task = response.data;

      if (!task) {
        return res.status(404).send('Task not found');
      }

      res.render(TASK_CONFIRM_DELETE, { task });
    } catch (err) {
      console.error(`Error fetching task ${id}:`, err);
      res.redirect(ROUTES.TASK_LIST);
    }
  });

  app.post(ROUTES.TASK_DELETE(':id'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await axios.delete(`${TASKS_ENDPOINT}/${id}`);
      res.redirect(ROUTES.TASK_LIST);
    } catch (err) {
      console.error(`Error deleting task ${id}:`, err);
      res.status(500).send('There was a problem deleting the task');
    }
  });

  app.get(ROUTES.TASK_EDIT(':id'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const response = await axios.get(`${TASKS_ENDPOINT}/${id}`);
      const task = response.data;

      res.render(TASK_FORM, { task, isEdit: true });
    } catch (err) {
      console.error(`Error fetching task ${id}:`, err);
      res.redirect(ROUTES.TASK_LIST);
    }
  });
};

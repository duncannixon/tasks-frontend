import { ROUTES, TASKS_ENDPOINT, VIEWS } from '../constants';

import axios from 'axios';
import { Application, Request, Response } from 'express';

export default (app: Application): void => {
  app.get(ROUTES.HOME, async (req: Request, res: Response) => {
    try {
      const response = await axios.get(TASKS_ENDPOINT);
      const taskCount = response.data.length;
      res.render(VIEWS.HOME, { taskCount });
    } catch (error) {
      console.error('Error making request:', error);

      let errorMessage = 'Something went wrong';

      if (axios.isAxiosError(error)) {
        // axios error type guards
        if (error.response) {
          errorMessage = `API responded with status ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response received from the Task service API';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        // fallback for other Errors
        errorMessage = error.message;
      }

      res.render(VIEWS.ERROR, { error: errorMessage });
    }
  });
};

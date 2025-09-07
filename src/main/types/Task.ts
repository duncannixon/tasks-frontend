export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: Date;
  createdAt: Date;
}

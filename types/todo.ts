export type Todo = {
  id: string;
  userId: string;
  listId: string;
  text: string;
  done: boolean;
  time?: string;
  createdAt: string;
};

export type TodoList = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};

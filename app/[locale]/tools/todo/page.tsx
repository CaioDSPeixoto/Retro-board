import TodoList from "@/components/TodoList";
import { getSession } from "@/lib/auth/session";
import { getTodoLists, getTodos } from "@/app/[locale]/tools/todo/actions";
import type { Todo, TodoList as TodoListType } from "@/types/todo";

export default async function TodoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  let initialLists: TodoListType[] = [];
  let initialTodosMap: Record<string, Todo[]> = {};

  if (session) {
    const listsRes = await getTodoLists(locale);
    if ("lists" in listsRes) {
      initialLists = listsRes.lists;
      // Fetch todos for each list
      const entries = await Promise.all(
        initialLists.map(async (list) => {
          const todosRes = await getTodos(list.id, locale);
          const todos = "todos" in todosRes ? todosRes.todos : [];
          return [list.id, todos] as [string, Todo[]];
        })
      );
      initialTodosMap = Object.fromEntries(entries);
    }
  }

  return (
    <div className="w-full flex justify-center py-8">
      <TodoList
        initialLists={initialLists}
        initialTodosMap={initialTodosMap}
        isLoggedIn={!!session}
        locale={locale}
      />
    </div>
  );
}

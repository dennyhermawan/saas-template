// app/todos/page.tsx

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type Todo = {
  id: number;
  title: string;
  is_done: boolean;
  user_id: string;
  created_at: string;
};

async function getTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error(error);
    return [];
  }

  return data as Todo[];
}

export default async function TodosPage() {
  const user = await currentUser();
  if (!user) {
    return <div>Silakan login dulu.</div>;
  }

  const todos = await getTodos(user.id);

  async function addTodo(formData: FormData) {
    "use server";

    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;

    await supabase.from("todos").insert({
      title,
      user_id: user.id,
    });

    revalidatePath("/todos");
  }

  async function toggleTodo(id: number, isDone: boolean) {
    "use server";

    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await supabase
      .from("todos")
      .update({ is_done: !isDone })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/todos");
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Todo Workspace</h1>

      <form action={addTodo} className="flex gap-2">
        <input
          name="title"
          className="flex-1 border rounded px-2 py-1"
          placeholder="Tulis tugas baru..."
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded">
          Tambah
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo: Todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between border rounded px-3 py-2"
          >
            <span className={todo.is_done ? "line-through text-gray-400" : ""}>
              {todo.title}
            </span>

            <form
              action={async () => {
                "use server";
                await toggleTodo(todo.id, todo.is_done);
              }}
            >
              <button className="text-sm underline">
                {todo.is_done ? "Belum" : "Selesai"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

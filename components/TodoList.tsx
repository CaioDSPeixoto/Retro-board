"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";

export default function TodoList() {
  const t = useTranslations("TodoList");

  const [tasks, setTasks] = useState<
    { text: string; done: boolean; time?: string }[]
  >([]);
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");

  // Som de notificação
  const alarmSound = typeof Audio !== "undefined" && new Audio(
    "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
  );

  // Carregar tasks do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("todoTasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  // Salvar tasks no localStorage
  useEffect(() => {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
  }, [tasks]);

  // Verificar alertas
  useEffect(() => {
    const interval = setInterval(checkAlerts, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const checkAlerts = () => {
    const now = new Date();
    const current = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    tasks.forEach((task) => {
      if (task.time && task.time === current && !task.done) {
        // Toca som
        if (alarmSound) alarmSound.play().catch(() => {});
      }
    });
  };

  const addTask = () => {
    if (!newTask) return;
    setTasks([...tasks, { text: newTask, done: false, time: newTime }]);
    setNewTask("");
    setNewTime("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTask();
  };

  const toggleDone = (idx: number, done: boolean) => {
    const copy = [...tasks];
    copy[idx].done = done;
    setTasks(copy);
  };

  const removeTask = (idx: number) =>
    setTasks(tasks.filter((_, i) => i !== idx));

  return (
    <div className="max-w-3xl w-full bg-white shadow-lg border border-blue-200 rounded-xl p-6">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-6">
        <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          {t("title")}
        </span>
      </h1>

      {/* Formulário para nova tarefa */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="flex-1 border border-gray-300 rounded-xl p-2 shadow-sm text-gray-800"
        />
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="border border-gray-300 rounded-xl p-2 shadow-sm text-gray-800"
        />
        <button
          onClick={addTask}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow"
        >
          {t("add")}
        </button>
      </div>

      {/* Lista de tarefas */}
      <div className="flex flex-col gap-4">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row items-center gap-4 border border-gray-200 p-4 rounded-xl bg-blue-50"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={(e) => toggleDone(i, e.target.checked)}
              className="w-5 h-5"
            />
            <div className="flex-1 flex justify-between items-center">
              <span
                className={`${
                  task.done ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {task.text}
              </span>
              {task.time && (
                <span
                  className={`ml-4 text-sm ${
                    task.done ? "line-through text-gray-400" : "text-gray-600"
                  }`}
                >
                  {task.time}
                </span>
              )}
            </div>
            <button
              onClick={() => removeTask(i)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm text-sm font-bold"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

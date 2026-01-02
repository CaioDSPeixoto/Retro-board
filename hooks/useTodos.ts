import { useState, useEffect } from "react";

export interface Todo {
    text: string;
    done: boolean;
    time?: string;
}

export function useTodos() {
    const [tasks, setTasks] = useState<Todo[]>([]);

    // Som de notificação
    const alarmSound = typeof Audio !== "undefined" ? new Audio(
        "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    ) : null;

    // Carregar tasks do localStorage
    useEffect(() => {
        const saved = localStorage.getItem("todoTasks");
        if (saved) {
            try {
                setTasks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse todos", e);
            }
        }
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
                if (alarmSound) alarmSound.play().catch(() => { });
            }
        });
    };

    const addTask = (text: string, time: string) => {
        if (!text) return;
        setTasks([...tasks, { text, done: false, time }]);
    };

    const toggleDone = (idx: number, done: boolean) => {
        const copy = [...tasks];
        copy[idx].done = done;
        setTasks(copy);
    };

    const removeTask = (idx: number) => {
        setTasks(tasks.filter((_, i) => i !== idx));
    };

    const clearAll = () => {
        setTasks([]);
    };

    return {
        tasks,
        addTask,
        toggleDone,
        removeTask,
        clearAll
    };
}

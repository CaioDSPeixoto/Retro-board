import { FiTrash2 } from "react-icons/fi";
import { useTranslations } from "next-intl";

type TodoItemProps = {
    task: { text: string; done: boolean; time?: string };
    onToggle: (done: boolean) => void;
    onRemove: () => void;
};

export default function TodoItem({ task, onToggle, onRemove }: TodoItemProps) {
    const t = useTranslations("TodoList");
    return (
        <div
            className="flex items-center gap-3 py-3 border-b last:border-0 group"
            style={{ borderColor: "var(--color-border)" }}
        >
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] checked:bg-green-500 checked:border-green-500 appearance-none cursor-pointer transition-colors peer"
                />
                <svg
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <span
                    className="text-lg transition-all"
                    style={{
                        color: task.done ? "var(--color-text-muted)" : "var(--color-text-primary)",
                        textDecoration: task.done ? "line-through" : "none",
                    }}
                >
                    {task.text}
                </span>
                {task.time && (
                    <span
                        className="text-xs"
                        style={{ color: task.done ? "var(--color-text-muted)" : "var(--color-accent-text)" }}
                    >
                        ⏰ {task.time}
                    </span>
                )}
            </div>

            <button
                onClick={onRemove}
                className="hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                style={{ color: "var(--color-text-muted)" }}
                title={t("removeItem")}
                aria-label={t("removeItem")}
            >
                <FiTrash2 size={18} />
            </button>
        </div>
    );
}

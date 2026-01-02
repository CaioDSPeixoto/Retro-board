import { FiTrash2 } from "react-icons/fi";
import { Todo } from "@/hooks/useTodos";

interface TodoItemProps {
    task: Todo;
    onToggle: (done: boolean) => void;
    onRemove: () => void;
}

export default function TodoItem({ task, onToggle, onRemove }: TodoItemProps) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 group">
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 appearance-none cursor-pointer transition-colors peer"
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
                    className={`text-lg transition-all ${task.done ? "text-gray-400 line-through decoration-gray-300" : "text-gray-800"
                        }`}
                >
                    {task.text}
                </span>
                {task.time && (
                    <span
                        className={`text-xs ${task.done ? "text-gray-300" : "text-blue-500 font-medium"
                            }`}
                    >
                        ⏰ {task.time}
                    </span>
                )}
            </div>

            <button
                onClick={onRemove}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                title="Remover item"
            >
                <FiTrash2 size={18} />
            </button>
        </div>
    );
}

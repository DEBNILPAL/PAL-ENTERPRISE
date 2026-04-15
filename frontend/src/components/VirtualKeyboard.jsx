import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Space, ChevronUp, X } from 'lucide-react';

const ROWS_LOWER = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const ROWS_UPPER = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export default function VirtualKeyboard({ value, onChange, onClose, visible }) {
  const [caps, setCaps] = useState(true); // start with caps for names

  if (!visible) return null;

  const rows = caps ? ROWS_UPPER : ROWS_LOWER;

  const handleKey = (key) => {
    onChange(value + key);
    // Auto-lowercase after first character
    if (caps && value.length === 0) {
      // keep caps for first letter
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    onChange(value + ' ');
    setCaps(true); // capitalize after space (for names)
  };

  const handleClear = () => {
    onChange('');
    setCaps(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="mt-2 bg-surface-100 dark:bg-surface-700 rounded-2xl p-3 border border-surface-200 dark:border-white/10 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Virtual Keyboard</span>
          <button type="button" onClick={onClose} className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-600 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-surface-800 rounded-xl px-3 py-2 mb-2 min-h-[36px] flex items-center border border-surface-200 dark:border-white/10">
          <span className="text-sm text-gray-800 dark:text-white font-medium">
            {value || <span className="text-gray-400 dark:text-gray-500 italic">Type your name...</span>}
          </span>
          <span className="w-0.5 h-5 bg-brand-500 ml-0.5 animate-pulse" />
        </div>

        {/* Keyboard rows */}
        <div className="space-y-1.5">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {/* Caps lock on row 3 */}
              {rowIdx === 3 && (
                <button
                  type="button"
                  onClick={() => setCaps(!caps)}
                  className={`h-10 px-2.5 rounded-lg text-xs font-semibold transition-all active:scale-90 ${
                    caps
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-white dark:bg-surface-600 text-gray-700 dark:text-gray-300 border border-surface-200 dark:border-white/10'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKey(key)}
                  className="h-10 min-w-[32px] sm:min-w-[36px] px-1.5 rounded-lg bg-white dark:bg-surface-600 text-gray-800 dark:text-white font-semibold text-sm
                             border border-surface-200 dark:border-white/10 shadow-sm
                             hover:bg-brand-50 dark:hover:bg-brand-500/20 active:scale-90 active:bg-brand-100 dark:active:bg-brand-500/30
                             transition-all"
                >
                  {key}
                </button>
              ))}
              {/* Backspace on row 3 */}
              {rowIdx === 3 && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 px-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-semibold text-xs
                             hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {/* Bottom row: dot, space, clear */}
          <div className="flex justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleKey('.')}
              className="h-10 w-12 rounded-lg bg-white dark:bg-surface-600 text-gray-800 dark:text-white font-bold text-lg
                         border border-surface-200 dark:border-white/10 shadow-sm active:scale-90 transition-all"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleSpace}
              className="h-10 flex-1 max-w-[200px] rounded-lg bg-white dark:bg-surface-600 text-gray-500 dark:text-gray-400 font-medium text-xs
                         border border-surface-200 dark:border-white/10 shadow-sm flex items-center justify-center gap-1
                         hover:bg-brand-50 dark:hover:bg-brand-500/20 active:scale-95 transition-all"
            >
              <Space className="w-4 h-4" /> space
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-10 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-semibold text-xs
                         hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-90 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

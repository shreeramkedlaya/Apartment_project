import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  mode = 'datetime',
  placeholder = 'Select date...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'bottom' | 'top' } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Parse initial value or use current date
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);

  // Time state (24h format)
  const [hours, setHours] = useState(value ? String(initialDate.getHours()).padStart(2, '0') : '00');
  const [minutes, setMinutes] = useState(value ? String(initialDate.getMinutes()).padStart(2, '0') : '00');

  // Update position logic (similar to CustomDropdown)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;

    const preferredHeight = mode === 'datetime' ? 360 : 320;
    const shouldFlip = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
    const placement = shouldFlip ? 'top' : 'bottom';

    let left = rect.left;
    const menuWidth = 280; // approximate fixed width for the calendar
    if (left + menuWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }

    setPosition({
      top: shouldFlip ? rect.top - 4 : rect.bottom + 4,
      left,
      placement,
    });
  }, [mode]);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside & Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Sync internal state if value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
        setHours(String(d.getHours()).padStart(2, '0'));
        setMinutes(String(d.getMinutes()).padStart(2, '0'));
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const emitChange = (d: Date, h: string, m: string) => {
    const updated = new Date(d);
    if (mode === 'datetime' || mode === 'time') {
      updated.setHours(parseInt(h, 10));
      updated.setMinutes(parseInt(m, 10));
      updated.setSeconds(0);
    } else {
      updated.setHours(23, 59, 59, 0);
    }

    // Convert to ISO format but preserve local time by adjusting for timezone offset
    // This prevents the date from shifting when converted to ISO string
    const offset = updated.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(updated.getTime() - offset)).toISOString().slice(0, -1);

    onChange(localISOTime);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    emitChange(newDate, hours, minutes);
    if (mode === 'date') {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    let newH = hours;
    let newM = minutes;
    if (type === 'hours') {
      newH = val;
      setHours(val);
    } else {
      newM = val;
      setMinutes(val);
    }
    if (selectedDate) {
      emitChange(selectedDate, newH, newM);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder;
    const d = selectedDate.getDate().toString().padStart(2, '0');
    const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const y = selectedDate.getFullYear();
    const dateStr = `${d}/${m}/${y}`;

    if (mode === 'date') return dateStr;
    const timeStr = `${hours}:${minutes}`;
    if (mode === 'time') return timeStr;
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 text-left bg-white dark:bg-gray-900 border rounded-lg flex items-center justify-between gap-2 transition-all outline-none shadow-xs select-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800'
          : isOpen ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
      >
        <span className={`text-xs truncate font-medium ${!selectedDate ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {formatDisplayValue()}
        </span>
        {mode === 'time' ? (
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        ) : (
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.placement === 'bottom' ? `${position.top}px` : 'auto',
            bottom: position.placement === 'top' ? `${window.innerHeight - position.top}px` : 'auto',
            left: `${position.left}px`,
            zIndex: 99999,
            width: '264px'
          }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col select-none"
        >
          {(mode === 'date' || mode === 'datetime') && (
            <div className="p-3">
              {/* Header: Month / Year / Prev / Next */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <button
                  onClick={prevMonth}
                  type="button"
                  className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <select
                    value={currentMonth}
                    onChange={e => setCurrentMonth(Number(e.target.value))}
                    className="appearance-none [background-image:none] text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-gray-800/90 hover:bg-gray-200/70 dark:hover:bg-gray-700/80 border-0 rounded-md px-2.5 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors text-center"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{m}</option>
                    ))}
                  </select>
                  <select
                    value={currentYear}
                    onChange={e => setCurrentYear(Number(e.target.value))}
                    className="appearance-none [background-image:none] text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-gray-800/90 hover:bg-gray-200/70 dark:hover:bg-gray-700/80 border-0 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors text-center"
                  >
                    {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                      <option key={y} value={y} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{y}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={nextMonth}
                  type="button"
                  className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="w-7 h-7" />)}
                {days.map(day => {
                  const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;
                  const today = new Date();
                  const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`w-7 h-7 text-xs font-medium rounded-md flex items-center justify-center transition-all cursor-pointer ${isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : isToday
                          ? 'border border-blue-500/60 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Picker Toolbar */}
          {(mode === 'time' || mode === 'datetime') && (
            <div className="px-3 py-2 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Time</span>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={hours}
                  onChange={e => handleTimeChange('hours', e.target.value)}
                  className="appearance-none [background-image:none] w-11 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md py-0.5 px-0 text-xs font-mono font-medium text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs transition-colors"
                >
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                    <option key={h} value={h} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{h}</option>
                  ))}
                </select>
                <span className="text-gray-400 font-bold text-xs">:</span>
                <select
                  value={minutes}
                  onChange={e => handleTimeChange('minutes', e.target.value)}
                  className="appearance-none [background-image:none] w-11 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md py-0.5 px-0 text-xs font-mono font-medium text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs transition-colors"
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                    <option key={m} value={m} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomDatePicker;
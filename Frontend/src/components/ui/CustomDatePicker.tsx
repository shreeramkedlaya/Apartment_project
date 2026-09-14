import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
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
      updated.setHours(0, 0, 0, 0);
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
        className={`w-full min-h-[38px] px-3.5 py-2 text-left bg-white dark:bg-gray-800 border rounded-lg flex items-center justify-between gap-2 transition-all outline-none shadow-xs select-none ${
          disabled ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
          : isOpen ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <span className={`text-sm truncate ${!selectedDate ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {formatDisplayValue()}
        </span>
        {mode === 'time' ? (
          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
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
            width: '280px'
          }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10"
        >
          {(mode === 'date' || mode === 'datetime') && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} type="button" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {MONTHS[currentMonth]} {currentYear}
                </div>
                <button onClick={nextMonth} type="button" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                  const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`h-8 w-8 text-xs rounded-full flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-medium shadow-sm' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(mode === 'time' || mode === 'datetime') && (
            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <select 
                value={hours}
                onChange={e => handleTimeChange('hours', e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-gray-500 font-medium">:</span>
              <select 
                value={minutes}
                onChange={e => handleTimeChange('minutes', e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {['00', '15', '30', '45'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

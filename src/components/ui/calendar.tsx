import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps } from "react-day-picker";
import { setMonth, setYear, getYear, getMonth } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

type CalendarView = 'days' | 'months' | 'years';

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr",
  "May", "Jun", "Jul", "Ago",
  "Sep", "Oct", "Nov", "Dic"
];

const MONTHS_FULL_ES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<CalendarView>('days');
  
  // Get initial date from selected or defaultMonth
  const getInitialDate = (): Date => {
    const { selected, defaultMonth } = props as { selected?: Date; defaultMonth?: Date };
    if (selected instanceof Date) return selected;
    if (defaultMonth instanceof Date) return defaultMonth;
    return new Date();
  };
  
  const [displayDate, setDisplayDate] = React.useState<Date>(getInitialDate());
  const [yearRangeStart, setYearRangeStart] = React.useState(() => {
    const currentYear = getYear(getInitialDate());
    return Math.floor(currentYear / 12) * 12;
  });

  // Sync displayDate when selected changes
  React.useEffect(() => {
    const { selected } = props as { selected?: Date };
    if (selected instanceof Date) {
      setDisplayDate(selected);
    }
  }, [(props as { selected?: Date }).selected]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(displayDate, monthIndex);
    setDisplayDate(newDate);
    setView('days');
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(displayDate, year);
    setDisplayDate(newDate);
    setView('months');
  };

  const handlePrevYearRange = () => {
    setYearRangeStart(prev => prev - 12);
  };

  const handleNextYearRange = () => {
    setYearRangeStart(prev => prev + 12);
  };

  const handlePrevYear = () => {
    const newDate = setYear(displayDate, getYear(displayDate) - 1);
    setDisplayDate(newDate);
  };

  const handleNextYear = () => {
    const newDate = setYear(displayDate, getYear(displayDate) + 1);
    setDisplayDate(newDate);
  };

  // Year Grid View
  if (view === 'years') {
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
    const currentYear = getYear(new Date());
    const selectedYear = getYear(displayDate);

    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex justify-center pt-1 relative items-center mb-4">
          <button
            type="button"
            onClick={handlePrevYearRange}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {yearRangeStart} - {yearRangeStart + 11}
          </span>
          <button
            type="button"
            onClick={handleNextYearRange}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearSelect(year)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-full p-0 font-normal",
                year === selectedYear && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                year === currentYear && year !== selectedYear && "bg-accent text-accent-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Month Grid View
  if (view === 'months') {
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());
    const selectedMonth = getMonth(displayDate);
    const displayYear = getYear(displayDate);

    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex justify-center pt-1 relative items-center mb-4">
          <button
            type="button"
            onClick={handlePrevYear}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setYearRangeStart(Math.floor(displayYear / 12) * 12);
              setView('years');
            }}
            className="text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 transition-colors"
          >
            {displayYear}
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MONTHS_ES.map((month, index) => (
            <button
              key={month}
              type="button"
              onClick={() => handleMonthSelect(index)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-full p-0 font-normal",
                index === selectedMonth && displayYear === getYear(displayDate) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                index === currentMonth && displayYear === currentYear && index !== selectedMonth && "bg-accent text-accent-foreground"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Days View (DayPicker with custom caption)
  const CustomCaption = ({ displayMonth }: CaptionProps) => {
    const month = getMonth(displayMonth);
    const year = getYear(displayMonth);

    return (
      <div className="flex justify-center pt-1 relative items-center">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('months')}
            className="text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 transition-colors"
          >
            {MONTHS_FULL_ES[month]}
          </button>
          <button
            type="button"
            onClick={() => {
              setYearRangeStart(Math.floor(year / 12) * 12);
              setView('years');
            }}
            className="text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 transition-colors"
          >
            {year}
          </button>
        </div>
      </div>
    );
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      month={displayDate}
      onMonthChange={setDisplayDate}
      locale={es}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: CustomCaption,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

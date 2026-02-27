"use client";

import { DateRangePicker } from "@heroui/react";
import { Button } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, now, parseDate } from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";
import type { ComponentProps } from "react";

type DateRangeInputValue = {
  start: string;
  end: string;
};

type HeroDateRangePickerProps = ComponentProps<typeof DateRangePicker>;

export interface DateRangeInputProps
  extends Omit<HeroDateRangePickerProps, "value" | "onChange"> {
  startValue?: string | null;
  endValue?: string | null;
  onRangeChange?: (value: DateRangeInputValue) => void;
  onChange?: (value: DateRangeInputValue) => void;
  rangeValue?: RangeValue<DateValue> | null;
  onRangeValueChange?: (value: RangeValue<DateValue> | null) => void;
  showQuickActions?: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function padYear(value: number): string {
  if (value < 0) {
    return `-${String(Math.abs(value)).padStart(4, "0")}`;
  }

  return String(value).padStart(4, "0");
}

function normalizeDateString(value?: string | null): string {
  if (!value) return "";
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  // Ano incompleto (ex.: 202-02-02) não deve ser interpretado como data válida.
  if (/^\d{1,3}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return "";
  }

  const parsed = new Date(trimmedValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${padYear(parsed.getFullYear())}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function fromDateValue(value: DateValue): string {
  const anyValue = value as unknown as {
    year: number;
    month: number;
    day: number;
  };

  return `${padYear(anyValue.year)}-${pad(anyValue.month)}-${pad(anyValue.day)}`;
}

function toDateRangeValue(
  startValue?: string | null,
  endValue?: string | null,
): RangeValue<DateValue> | null {
  const normalizedStart = normalizeDateString(startValue);
  const normalizedEnd = normalizeDateString(endValue);

  if (!normalizedStart || !normalizedEnd) {
    return null;
  }

  try {
    return {
      start: parseDate(normalizedStart),
      end: parseDate(normalizedEnd),
    };
  } catch {
    return null;
  }
}

export function DateRangeInput({
  startValue,
  endValue,
  rangeValue,
  onRangeChange,
  onChange,
  onRangeValueChange,
  showQuickActions = true,
  CalendarBottomContent,
  ...props
}: DateRangeInputProps) {
  const isRangeMode = rangeValue !== undefined;
  const emitRangeChange = (start: string, end: string) => {
    const nextRange = { start, end };

    onRangeChange?.(nextRange);
    onChange?.(nextRange);
  };
  const today = (() => {
    const now = new Date();

    return `${padYear(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();
  const todayRangeDateValue =
    props.granularity && props.granularity !== "day"
      ? {
          start: now(getLocalTimeZone()),
          end: now(getLocalTimeZone()),
        }
      : {
          start: parseDate(today),
          end: parseDate(today),
        };
  const quickActionsContent = showQuickActions ? (
    <div className="flex items-center justify-end gap-2 border-t border-divider px-2 py-2">
      <Button
        radius="full"
        size="sm"
        variant="light"
        onPress={() => {
          if (isRangeMode) {
            onRangeValueChange?.(todayRangeDateValue);
            return;
          }

          emitRangeChange(today, today);
        }}
      >
        Hoje
      </Button>
      <Button
        radius="full"
        size="sm"
        variant="flat"
        onPress={() => {
          if (isRangeMode) {
            onRangeValueChange?.(null);
            return;
          }

          emitRangeChange("", "");
        }}
      >
        Limpar
      </Button>
    </div>
  ) : undefined;

  return (
    <DateRangePicker
      {...props}
      CalendarBottomContent={CalendarBottomContent ?? quickActionsContent}
      value={isRangeMode ? (rangeValue ?? null) : toDateRangeValue(startValue, endValue)}
      onChange={(nextValue) => {
        if (isRangeMode) {
          onRangeValueChange?.(nextValue ?? null);
          return;
        }

        const nextRange = nextValue
          ? {
              start: fromDateValue(nextValue.start),
              end: fromDateValue(nextValue.end),
            }
          : {
              start: "",
              end: "",
            };

        onRangeChange?.(nextRange);
        onChange?.(nextRange);
      }}
    />
  );
}

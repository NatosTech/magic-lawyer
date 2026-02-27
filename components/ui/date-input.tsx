"use client";

import { DatePicker } from "@heroui/react";
import { Button } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, now, parseDate } from "@internationalized/date";
import type { ComponentProps } from "react";

type DateInputChangeEvent = {
  target: {
    value: string;
  };
};

type HeroDatePickerProps = ComponentProps<typeof DatePicker>;

export interface DateInputProps
  extends Omit<HeroDatePickerProps, "value" | "onChange"> {
  value?: string | null;
  onValueChange?: (value: string) => void;
  onChange?: (event: DateInputChangeEvent) => void;
  dateValue?: DateValue | null;
  onDateChange?: (value: DateValue | null) => void;
  showQuickActions?: boolean;
  type?: string;
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

  if (/^\d{1,3}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return "";
  }

  const parsed = new Date(trimmedValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${padYear(parsed.getFullYear())}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function toDateValue(value?: string | null): DateValue | null {
  const normalized = normalizeDateString(value);

  if (!normalized) {
    return null;
  }

  try {
    return parseDate(normalized);
  } catch {
    return null;
  }
}

function fromDateValue(value: DateValue | null): string {
  if (!value) {
    return "";
  }

  const anyValue = value as unknown as {
    year: number;
    month: number;
    day: number;
  };

  return `${padYear(anyValue.year)}-${pad(anyValue.month)}-${pad(anyValue.day)}`;
}

export function DateInput({
  value,
  dateValue,
  onValueChange,
  onChange,
  onDateChange,
  showQuickActions = true,
  CalendarBottomContent,
  type: _ignoredType,
  ...props
}: DateInputProps) {
  const isDateMode = dateValue !== undefined;
  const emitStringChange = (next: string) => {
    onValueChange?.(next);
    onChange?.({
      target: {
        value: next,
      },
    });
  };
  const todayString = (() => {
    const currentDate = new Date();

    return `${padYear(currentDate.getFullYear())}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
  })();
  const todayDateValue =
    props.granularity && props.granularity !== "day"
      ? now(getLocalTimeZone())
      : parseDate(todayString);
  const quickActionsContent = showQuickActions ? (
    <div className="flex items-center justify-end gap-2 border-t border-divider px-2 py-2">
      <Button
        radius="full"
        size="sm"
        variant="light"
        onPress={() => {
          if (isDateMode) {
            onDateChange?.(todayDateValue);
            return;
          }

          emitStringChange(todayString);
        }}
      >
        Hoje
      </Button>
      <Button
        radius="full"
        size="sm"
        variant="flat"
        onPress={() => {
          if (isDateMode) {
            onDateChange?.(null);
            return;
          }

          emitStringChange("");
        }}
      >
        Limpar
      </Button>
    </div>
  ) : undefined;

  return (
    <DatePicker
      {...props}
      CalendarBottomContent={CalendarBottomContent ?? quickActionsContent}
      value={isDateMode ? (dateValue ?? null) : toDateValue(value)}
      onChange={(nextValue) => {
        if (isDateMode) {
          onDateChange?.(nextValue ?? null);
          return;
        }

        const normalized = fromDateValue(nextValue ?? null);

        emitStringChange(normalized);
      }}
    />
  );
}

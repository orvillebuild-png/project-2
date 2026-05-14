"use client";

import { useMemo, useState } from "react";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toHiddenValue(date: DateParts) {
  const hour24 = date.period === "PM"
    ? date.hour === 12 ? 12 : date.hour + 12
    : date.hour === 12 ? 0 : date.hour;

  return `${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(hour24)}:${pad(date.minute)}`;
}

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  period: "AM" | "PM";
};

function defaultDateParts(offsetHours: number): DateParts {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours, 0, 0, 0);
  const hour = date.getHours();

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: hour % 12 || 12,
    minute: date.getMinutes(),
    period: hour >= 12 ? "PM" : "AM"
  };
}

function datePartsFromIso(value: string | null | undefined, offsetHours: number) {
  if (!value) {
    return defaultDateParts(offsetHours);
  }

  const date = new Date(value);
  const hour = date.getHours();

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: hour % 12 || 12,
    minute: Math.round(date.getMinutes() / 15) * 15,
    period: hour >= 12 ? "PM" : "AM"
  } as DateParts;
}

function DateTimeField({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: string;
  value: DateParts;
  onChange: (value: DateParts) => void;
}) {
  const availableDays = useMemo(() => daysInMonth(value.year, value.month), [value.month, value.year]);
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, index) => current + index);
  }, []);

  function update(next: Partial<DateParts>) {
    const nextValue = { ...value, ...next };
    const maxDays = daysInMonth(nextValue.year, nextValue.month);
    onChange({
      ...nextValue,
      day: Math.min(nextValue.day, maxDays)
    });
  }

  return (
    <fieldset className="rounded-2xl border border-line/90 bg-white/72 p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{label}</legend>
      <input name={name} type="hidden" value={toHiddenValue(value)} />
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_5rem_6rem]">
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.month} onChange={(event) => update({ month: Number(event.target.value) })}>
          {months.map((month, index) => (
            <option key={month} value={index + 1}>{month}</option>
          ))}
        </select>
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.day} onChange={(event) => update({ day: Number(event.target.value) })}>
          {Array.from({ length: availableDays }, (_, index) => index + 1).map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.year} onChange={(event) => update({ year: Number(event.target.value) })}>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr_5rem] gap-3">
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.hour} onChange={(event) => update({ hour: Number(event.target.value) })}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
            <option key={hour} value={hour}>{pad(hour)}</option>
          ))}
        </select>
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.minute} onChange={(event) => update({ minute: Number(event.target.value) })}>
          {[0, 15, 30, 45].map((minute) => (
            <option key={minute} value={minute}>{pad(minute)}</option>
          ))}
        </select>
        <select className="h-11 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" value={value.period} onChange={(event) => update({ period: event.target.value as "AM" | "PM" })}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </fieldset>
  );
}

export function EventDateTimeFields({
  defaultEndsAt,
  defaultStartsAt
}: {
  defaultEndsAt?: string | null;
  defaultStartsAt?: string | null;
}) {
  const [startsAt, setStartsAt] = useState(datePartsFromIso(defaultStartsAt, 24));
  const [endsAt, setEndsAt] = useState(datePartsFromIso(defaultEndsAt, 27));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DateTimeField label="Starts at" name="starts_at" value={startsAt} onChange={setStartsAt} />
      <DateTimeField label="Ends at" name="ends_at" value={endsAt} onChange={setEndsAt} />
    </div>
  );
}

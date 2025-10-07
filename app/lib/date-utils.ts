import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// Configurar Day.js
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("pt-br");

/**
 * Utilitários de data usando Day.js
 * Centraliza todas as operações de data do sistema
 */
export class DateUtils {
  /**
   * Formatar data para exibição (DD/MM/YYYY)
   */
  static formatDate(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format("DD/MM/YYYY");
  }

  /**
   * Formatar data e hora para exibição (DD/MM/YYYY HH:mm)
   */
  static formatDateTime(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  }

  /**
   * Formatar apenas hora (HH:mm)
   */
  static formatTime(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format("HH:mm");
  }

  /**
   * Formatar data longa (DD de MMMM de YYYY)
   */
  static formatDateLong(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format("DD [de] MMMM [de] YYYY");
  }

  /**
   * Formatar data relativa (há 2 dias, em 3 horas, etc.)
   */
  static formatRelative(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).fromNow();
  }

  /**
   * Converter CalendarDate (@internationalized/date) para Day.js
   */
  static fromCalendarDate(calendarDate: any): dayjs.Dayjs {
    const year = calendarDate.year;
    const month = calendarDate.month.toString().padStart(2, "0");
    const day = calendarDate.day.toString().padStart(2, "0");

    return dayjs(`${year}-${month}-${day}`);
  }

  /**
   * Converter CalendarDate para string formatada (DD/MM/YYYY)
   */
  static formatCalendarDate(calendarDate: any): string {
    return this.fromCalendarDate(calendarDate).format("DD/MM/YYYY");
  }

  /**
   * Verificar se duas datas são do mesmo dia
   */
  static isSameDay(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date1).format("YYYY-MM-DD") === dayjs(date2).format("YYYY-MM-DD");
  }

  /**
   * Verificar se uma data é hoje
   */
  static isToday(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
  }

  /**
   * Verificar se uma data é amanhã
   */
  static isTomorrow(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).format("YYYY-MM-DD") === dayjs().add(1, "day").format("YYYY-MM-DD");
  }

  /**
   * Verificar se uma data é ontem
   */
  static isYesterday(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).format("YYYY-MM-DD") === dayjs().subtract(1, "day").format("YYYY-MM-DD");
  }

  /**
   * Obter início do dia
   */
  static startOfDay(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).startOf("day");
  }

  /**
   * Obter fim do dia
   */
  static endOfDay(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).endOf("day");
  }

  /**
   * Obter início da semana
   */
  static startOfWeek(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).startOf("week");
  }

  /**
   * Obter fim da semana
   */
  static endOfWeek(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).endOf("week");
  }

  /**
   * Obter início do mês
   */
  static startOfMonth(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).startOf("month");
  }

  /**
   * Obter fim do mês
   */
  static endOfMonth(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).endOf("month");
  }

  /**
   * Adicionar dias a uma data
   */
  static addDays(date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs {
    return dayjs(date).add(days, "day");
  }

  /**
   * Subtrair dias de uma data
   */
  static subtractDays(date: string | Date | dayjs.Dayjs, days: number): dayjs.Dayjs {
    return dayjs(date).subtract(days, "day");
  }

  /**
   * Adicionar meses a uma data
   */
  static addMonths(date: string | Date | dayjs.Dayjs, months: number): dayjs.Dayjs {
    return dayjs(date).add(months, "month");
  }

  /**
   * Subtrair meses de uma data
   */
  static subtractMonths(date: string | Date | dayjs.Dayjs, months: number): dayjs.Dayjs {
    return dayjs(date).subtract(months, "month");
  }

  /**
   * Verificar se uma data está entre duas datas
   */
  static isBetween(date: string | Date | dayjs.Dayjs, start: string | Date | dayjs.Dayjs, end: string | Date | dayjs.Dayjs): boolean {
    const d = dayjs(date);

    return d.isSameOrAfter(start) && d.isSameOrBefore(end);
  }

  /**
   * Obter diferença em dias entre duas datas
   */
  static diffInDays(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): number {
    return dayjs(date1).diff(dayjs(date2), "day");
  }

  /**
   * Obter diferença em horas entre duas datas
   */
  static diffInHours(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): number {
    return dayjs(date1).diff(dayjs(date2), "hour");
  }

  /**
   * Obter diferença em minutos entre duas datas
   */
  static diffInMinutes(date1: string | Date | dayjs.Dayjs, date2: string | Date | dayjs.Dayjs): number {
    return dayjs(date1).diff(dayjs(date2), "minute");
  }

  /**
   * Obter data atual
   */
  static now(): dayjs.Dayjs {
    return dayjs();
  }

  /**
   * Obter data atual formatada
   */
  static nowFormatted(): string {
    return dayjs().format("DD/MM/YYYY HH:mm");
  }

  /**
   * Converter string para Day.js com validação
   */
  static parse(date: string, format?: string): dayjs.Dayjs | null {
    const parsed = format ? dayjs(date, format) : dayjs(date);

    return parsed.isValid() ? parsed : null;
  }

  /**
   * Verificar se uma string é uma data válida
   */
  static isValid(date: string): boolean {
    return dayjs(date).isValid();
  }

  /**
   * Formatar data para input HTML (YYYY-MM-DD)
   */
  static formatToInput(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format("YYYY-MM-DD");
  }
}

// Exportar também o dayjs para casos específicos
export { dayjs };
export default DateUtils;

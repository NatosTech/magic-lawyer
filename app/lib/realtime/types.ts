/**
 * Tipos para eventos de tempo real via WebSocket/Ably
 */

export type RealtimeEventType = "tenant-status" | "tenant-soft-update" | "plan-update" | "user-status" | "system-changelog" | "notification.new";

export interface RealtimeEvent {
  type: RealtimeEventType;
  tenantId: string | null;
  userId: string | null;
  payload: Record<string, any>;
  timestamp: string;
  version: number;
}

export interface TenantStatusEventPayload {
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  reason?: string;
  changedBy?: string;
}

export interface TenantSoftUpdateEventPayload {
  changes: Record<string, any>; // Branding, configs, etc
  changedBy?: string;
}

export interface PlanUpdateEventPayload {
  planId: string;
  planRevision: number;
  modulesAdded?: string[];
  modulesRemoved?: string[];
  changedBy?: string;
}

export interface UserStatusEventPayload {
  userId: string;
  active: boolean;
  reason?: string;
  changedBy?: string;
}

export interface ChangelogEventPayload {
  changelogId: string;
  title: string;
  summary?: string;
  visibility: "ALL" | "TENANT" | "ADMIN";
}

export type RealtimeEventPayload = TenantStatusEventPayload | TenantSoftUpdateEventPayload | PlanUpdateEventPayload | UserStatusEventPayload | ChangelogEventPayload;

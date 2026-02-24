"use server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/auth";
import prisma from "@/app/lib/prisma";
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/generated/prisma";

export interface CreateTicketData {
  title: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface TicketWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  messages: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: Date;
  }>;
}

export interface CreateMessageData {
  content: string;
  isInternal?: boolean;
}

export async function createTicket(
  data: CreateTicketData,
): Promise<TicketWithDetails> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || TicketPriority.MEDIUM,
      category: data.category || TicketCategory.GENERAL,
      userId: session.user.id,
      tenantId: session.user.tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      attachments: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return ticket as TicketWithDetails;
}

export async function getTicketsForTenant(): Promise<TicketWithDetails[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  // Verificar se o usuário tem permissão para ver todos os tickets do tenant
  const userRole = (session.user as any)?.role;
  const canViewAllTickets = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(canViewAllTickets ? {} : { userId: session.user.id }), // Se não for admin, só vê seus próprios tickets
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      attachments: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tickets as TicketWithDetails[];
}

export async function getTicketById(
  ticketId: string,
): Promise<TicketWithDetails | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  const userRole = (session.user as any)?.role;
  const canViewAllTickets = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      tenantId: session.user.tenantId,
      ...(canViewAllTickets ? {} : { userId: session.user.id }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      attachments: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return ticket as TicketWithDetails | null;
}

export async function addMessageToTicket(
  ticketId: string,
  data: CreateMessageData,
): Promise<{ success: boolean; messageId?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  // Verificar se o ticket existe e o usuário tem acesso
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      tenantId: session.user.tenantId,
    },
  });

  if (!ticket) {
    throw new Error("Ticket não encontrado");
  }

  const userRole = (session.user as any)?.role;
  const canViewAllTickets = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  // Se não for admin, só pode adicionar mensagem aos seus próprios tickets
  if (!canViewAllTickets && ticket.userId !== session.user.id) {
    throw new Error(
      "Você não tem permissão para adicionar mensagens a este ticket",
    );
  }

  const message = await prisma.ticketMessage.create({
    data: {
      content: data.content,
      isInternal: data.isInternal || false,
      ticketId: ticketId,
      userId: session.user.id,
    },
  });

  // Atualizar o status do ticket se necessário
  if (ticket.status === TicketStatus.CLOSED) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.OPEN,
        closedAt: null,
      },
    });
  }

  return { success: true, messageId: message.id };
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<{ success: boolean }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  const userRole = (session.user as any)?.role;
  const canManageTickets = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  if (!canManageTickets) {
    throw new Error("Você não tem permissão para alterar o status de tickets");
  }

  await prisma.ticket.update({
    where: {
      id: ticketId,
      tenantId: session.user.tenantId,
    },
    data: {
      status,
      ...(status === TicketStatus.CLOSED
        ? { closedAt: new Date() }
        : { closedAt: null }),
    },
  });

  return { success: true };
}

export async function getTicketStats(): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new Error("Usuário não autenticado ou sem tenant");
  }

  const userRole = (session.user as any)?.role;
  const canViewAllTickets = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.ticket.count({
      where: {
        tenantId: session.user.tenantId,
        ...(canViewAllTickets ? {} : { userId: session.user.id }),
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: session.user.tenantId,
        status: TicketStatus.OPEN,
        ...(canViewAllTickets ? {} : { userId: session.user.id }),
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: session.user.tenantId,
        status: TicketStatus.IN_PROGRESS,
        ...(canViewAllTickets ? {} : { userId: session.user.id }),
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: session.user.tenantId,
        status: TicketStatus.RESOLVED,
        ...(canViewAllTickets ? {} : { userId: session.user.id }),
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: session.user.tenantId,
        status: TicketStatus.CLOSED,
        ...(canViewAllTickets ? {} : { userId: session.user.id }),
      },
    }),
  ]);

  return { total, open, inProgress, resolved, closed };
}

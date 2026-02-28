"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { CheckCircle, AlertCircle, Calendar } from "lucide-react";

import GoogleIcon from "./google-icon";

import { getGoogleCalendarStatus } from "@/app/actions/google-calendar";

interface GoogleCalendarStatus {
  connected: boolean;
  syncEnabled: boolean;
  calendarId?: string | null;
  eventosSincronizados: number;
}

export default function GoogleCalendarStatusCard() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    syncEnabled: false,
    eventosSincronizados: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Buscar status da integração
  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const result = await getGoogleCalendarStatus();

      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-4">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-default-500">
            Carregando status...
          </span>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={`border-l-4 ${status.connected ? "border-l-green-500" : "border-l-orange-500"}`}
    >
      <CardBody className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GoogleIcon className="w-5 h-5" />
              <Calendar className="w-4 h-4 text-default-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Google Calendar</h4>
              <p className="text-xs text-default-500">
                {status.connected
                  ? `${status.eventosSincronizados} eventos sincronizados`
                  : "Não conectado"}
              </p>
            </div>
          </div>

          <Chip
            color={status.connected ? "success" : "warning"}
            size="sm"
            startContent={
              status.connected ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )
            }
            variant="flat"
          >
            {status.connected ? "Conectado" : "Desconectado"}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

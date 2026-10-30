'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';

export interface PaymentConfirmedEvent {
  paymentId: string;
  invoiceId?: string | null;
  amount: number;
  provider: string;
}

interface UseSocketOptions {
  onPaymentConfirmed?: (event: PaymentConfirmedEvent) => void;
}

export function useSocket({ onPaymentConfirmed }: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const onPaymentConfirmedRef = useRef(onPaymentConfirmed);

  useEffect(() => {
    onPaymentConfirmedRef.current = onPaymentConfirmed;
  }, [onPaymentConfirmed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('dokani_access_token');
    if (!token) {
      return;
    }

    const targetUrl = env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    const socket = io(targetUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('payment:confirmed', (data: PaymentConfirmedEvent) => {
      onPaymentConfirmedRef.current?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    socket: socketRef.current,
  };
}

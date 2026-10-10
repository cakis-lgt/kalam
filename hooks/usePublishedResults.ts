"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAuthConfigured } from "@/lib/auth/config";
import type { PublishedResultView } from "@/lib/results/published-result";

export type PublishedResultsState = {
  loading: boolean;
  published: boolean;
  result: PublishedResultView | null;
  connected: boolean;
  error: string | null;
};

export function usePublishedResults(sessionId: string | null) {
  const [state, setState] = useState<PublishedResultsState>({
    loading: Boolean(sessionId),
    published: false,
    result: null,
    connected: false,
    error: null,
  });

  const fetchResults = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/results`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to load results");
      }
      const data = (await res.json()) as {
        published: boolean;
        result: PublishedResultView | null;
      };
      setState((prev) => ({
        ...prev,
        loading: false,
        published: data.published,
        result: data.result,
        error: null,
      }));
      return data;
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load results",
      }));
      return null;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setState({
        loading: false,
        published: false,
        result: null,
        connected: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    let channel: any = null;

    async function init() {
      await fetchResults();
      if (cancelled || !isAuthConfigured()) return;

      try {
        const supabase = createClient();
        channel = supabase
          .channel(`results:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "session_results",
              filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
              const row = (payload.new ?? payload.old) as {
                published_at?: string | null;
              };
              if (row?.published_at) {
                void fetchResults();
              }
            },
          )
          .subscribe((status) => {
            if (cancelled) return;
            setState((prev) => ({
              ...prev,
              connected: status === "SUBSCRIBED" || prev.connected,
            }));
          });
      } catch {
        setState((prev) => ({ ...prev, connected: false }));
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [sessionId, fetchResults]);

  return { ...state, refresh: fetchResults };
}

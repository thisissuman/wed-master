import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseEnvironment } from "@/lib/supabase/environment";

type SessionState =
  | { status: "unconfigured"; session: null }
  | { status: "loading"; session: null }
  | { status: "ready"; session: Session | null };

const SessionContext = createContext<SessionState>({ status: "unconfigured", session: null });

export function SessionProvider({ children }: PropsWithChildren) {
  const environment = useMemo(() => getSupabaseEnvironment(), []);
  const [state, setState] = useState<SessionState>(() =>
    environment.isConfigured
      ? { status: "loading", session: null }
      : { status: "unconfigured", session: null },
  );

  useEffect(() => {
    if (!environment.isConfigured) {
      return;
    }

    const client = getSupabaseClient();
    client.auth
      .getSession()
      .then(({ data }) => setState({ status: "ready", session: data.session }));
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setState({ status: "ready", session });
    });

    return () => subscription.subscription.unsubscribe();
  }, [environment.isConfigured]);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}

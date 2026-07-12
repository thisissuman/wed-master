const REQUIRED_SUPABASE_ENVIRONMENT = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type SupabaseEnvironment = {
  anonKey: string | null;
  isConfigured: boolean;
  missingKeys: readonly string[];
  url: string | null;
};

type ConfiguredSupabaseEnvironment = {
  anonKey: string;
  url: string;
};

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const values = {
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
  };
  const missingKeys = REQUIRED_SUPABASE_ENVIRONMENT.filter((key) => !values[key]);

  return {
    anonKey: values.EXPO_PUBLIC_SUPABASE_ANON_KEY || null,
    isConfigured: missingKeys.length === 0,
    missingKeys,
    url: values.EXPO_PUBLIC_SUPABASE_URL || null,
  };
}

export function requireSupabaseEnvironment(): ConfiguredSupabaseEnvironment {
  const environment = getSupabaseEnvironment();

  if (!environment.isConfigured || !environment.anonKey || !environment.url) {
    throw new Error(
      `Supabase is not configured. Add ${environment.missingKeys.join(", ")} to .env.`,
    );
  }

  const { anonKey, url } = environment;

  if (!anonKey || !url) {
    throw new Error("Supabase environment could not be resolved.");
  }

  return { anonKey, url };
}

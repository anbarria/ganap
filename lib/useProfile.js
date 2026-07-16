"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./supabase/client";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [misFincas, setMisFincas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setMisFincas([]);
      setLoading(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(perfil);

    if (perfil?.rol === "superadmin") {
      const { data: todas } = await supabase.from("fincas").select("*").order("nombre");
      setMisFincas(todas || []);
    } else {
      const { data: fincas } = await supabase
        .from("fincas")
        .select("*")
        .order("nombre");
      setMisFincas(fincas || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, misFincas, loading, reload: load };
}

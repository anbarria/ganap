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
      // Filtramos explícitamente por las fincas donde el usuario tiene un vínculo real
      // (usuario_finca), en vez de confiar solo en RLS — así evitamos que se cuelen
      // fincas ajenas que son visibles únicamente por tener animales en el Mercado.
      const { data: enlaces } = await supabase.from("usuario_finca").select("finca_id").eq("usuario_id", user.id);
      const fincaIds = (enlaces || []).map((e) => e.finca_id);
      if (fincaIds.length === 0) {
        setMisFincas([]);
      } else {
        const { data: fincas } = await supabase.from("fincas").select("*").in("id", fincaIds).order("nombre");
        setMisFincas(fincas || []);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, misFincas, loading, reload: load };
}

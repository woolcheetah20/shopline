import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect, useState } from "react";

const TOKEN_KEY = "shopline_token";
const AUTH_EVENT = "shopline-auth-changed";

setAuthTokenGetter(() => {
  return localStorage.getItem(TOKEN_KEY);
});

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const handleChange = () => {
      setToken(localStorage.getItem(TOKEN_KEY));
    };
    // storage fires across tabs; AUTH_EVENT fires within the same tab
    window.addEventListener("storage", handleChange);
    window.addEventListener(AUTH_EVENT, handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(AUTH_EVENT, handleChange);
    };
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    window.dispatchEvent(new Event(AUTH_EVENT));
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.clear();
  };

  const { data: user, isLoading } = useQuery({
    queryKey: getGetMeQueryKey(),
    queryFn: ({ signal }) => getMe({ signal }),
    enabled: !!token,
    retry: false,
  });

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };
}

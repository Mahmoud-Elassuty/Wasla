import { Navigate, useSearchParams } from "react-router-dom";

export default function Search() {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  const query = (next.get("search") ?? next.get("q") ?? "").trim();
  next.delete("q");
  if (query) next.set("search", query);
  else next.delete("search");
  const queryString = next.toString();

  return <Navigate to={{ pathname: "/products", search: queryString ? `?${queryString}` : "" }} replace />;
}

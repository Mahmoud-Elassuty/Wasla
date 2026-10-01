import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchProducts } from "../store/reducers/productsSlice";
import { buildCategoryCards } from "../utils/categoryDisplay";

// Shared by the Navbar menu, the Home section and the /categories page, so all three
// show exactly the same categories, counts and images from the same Redux state.
export default function useCategoryCards() {
  const dispatch = useDispatch();
  const { items, categories, status } = useSelector((state) => state.products);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, status, categories.length]);

  const hasProducts = items.length > 0;
  const cards = useMemo(() => {
    const built = buildCategoryCards(categories, items);
    // Until products are loaded a count would read "0 products", which is misleading.
    return hasProducts ? built : built.map((card) => ({ ...card, count: null }));
  }, [categories, items, hasProducts]);

  return {
    cards,
    status,
    loading: cards.length === 0 && (status === "idle" || status === "loading"),
    failed: cards.length === 0 && status === "failed",
  };
}

import { randomUUID } from "crypto";
import { createSeededMenuState } from "../data/menuSeed.js";

const seededState = createSeededMenuState();
const memoryMenuCategories = seededState.categories;
let nextMenuItemId = seededState.nextMenuItemId;

const vegFallbackImages = {
  paneer: "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  mushroom: "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  dal: "https://images.pexels.com/photos/9609845/pexels-photo-9609845.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  rice: "https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  roti: "https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  paratha: "https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  prantha: "https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  raita: "https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  salad: "https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  papad: "https://images.pexels.com/photos/9609842/pexels-photo-9609842.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  thali: "https://images.pexels.com/photos/9609838/pexels-photo-9609838.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  dessert: "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  lassi: "https://images.pexels.com/photos/5946973/pexels-photo-5946973.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  default: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
};

function getVegImage(name, categoryTitle) {
  const text = `${String(name || "")} ${String(categoryTitle || "")}`.toLowerCase();
  if (text.includes("paneer")) return vegFallbackImages.paneer;
  if (text.includes("mushroom")) return vegFallbackImages.mushroom;
  if (text.includes("dal") || text.includes("chole") || text.includes("kadhi")) return vegFallbackImages.dal;
  if (text.includes("rice") || text.includes("pulao")) return vegFallbackImages.rice;
  if (text.includes("roti")) return vegFallbackImages.roti;
  if (text.includes("paratha") || text.includes("prantha")) return vegFallbackImages.paratha;
  if (text.includes("raita") || text.includes("curd")) return vegFallbackImages.raita;
  if (text.includes("salad")) return vegFallbackImages.salad;
  if (text.includes("papad")) return vegFallbackImages.papad;
  if (text.includes("thali")) return vegFallbackImages.thali;
  if (text.includes("lassi") || text.includes("jamun") || text.includes("dessert")) return vegFallbackImages.dessert;
  return vegFallbackImages.default;
}

function normalizePrices(input) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const entries = Object.entries(input)
      .map(([variant, value]) => [String(variant || "Regular"), Number(value) || 0])
      .filter(([, value]) => Number.isFinite(value));
    if (entries.length > 0) {
      return Object.fromEntries(entries);
    }
  }
  return { Regular: 0 };
}

function findCategoryByIdOrTitle(categoryId, categoryTitle) {
  if (categoryId) {
    const byId = memoryMenuCategories.find((category) => category.id === categoryId);
    if (byId) return byId;
  }
  if (categoryTitle) {
    const byTitle = memoryMenuCategories.find((category) => category.title.toLowerCase() === String(categoryTitle).toLowerCase());
    if (byTitle) return byTitle;
  }
  return null;
}

function findMenuItemById(itemId) {
  for (const category of memoryMenuCategories) {
    const index = category.items.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      return {
        category,
        index,
        item: category.items[index],
      };
    }
  }
  return null;
}

export function getAllMenuCategories() {
  return memoryMenuCategories;
}

export function createMenuItem({ categoryId, categoryTitle, name, prices, image }) {
  let targetCategory = findCategoryByIdOrTitle(categoryId, categoryTitle);
  if (!targetCategory) {
    targetCategory = {
      id: String(categoryTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || randomUUID(),
      title: String(categoryTitle).trim(),
      items: [],
    };
    memoryMenuCategories.push(targetCategory);
  }

  const nextItem = {
    id: nextMenuItemId++,
    name: String(name).trim(),
    prices: normalizePrices(prices),
    image: String(image || getVegImage(name, targetCategory.title) || ""),
  };

  targetCategory.items.push(nextItem);
  return { categoryId: targetCategory.id, categoryTitle: targetCategory.title, item: nextItem };
}

export function updateMenuItem(itemId, { name, prices, image, categoryId, categoryTitle }) {
  const found = findMenuItemById(itemId);
  if (!found) return null;

  const updatedItem = {
    ...found.item,
    name: String(name || found.item.name).trim(),
    prices: prices ? normalizePrices(prices) : found.item.prices,
    image: image !== undefined ? String(image || "") : String(found.item.image || getVegImage(name || found.item.name, found.category.title) || ""),
  };

  let targetCategory = found.category;
  if (categoryId || categoryTitle) {
    const movedCategory = findCategoryByIdOrTitle(categoryId, categoryTitle);
    if (movedCategory) {
      targetCategory = movedCategory;
    } else if (String(categoryTitle || "").trim()) {
      targetCategory = {
        id: String(categoryTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || randomUUID(),
        title: String(categoryTitle).trim(),
        items: [],
      };
      memoryMenuCategories.push(targetCategory);
    }
  }

  found.category.items.splice(found.index, 1);
  targetCategory.items.push(updatedItem);

  return { categoryId: targetCategory.id, categoryTitle: targetCategory.title, item: updatedItem };
}

export function deleteMenuItem(itemId) {
  const found = findMenuItemById(itemId);
  if (!found) return false;

  found.category.items.splice(found.index, 1);
  return true;
}

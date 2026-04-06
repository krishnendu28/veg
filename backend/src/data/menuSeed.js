import { randomUUID } from "crypto";

const seedMenuCategories = [
  {
    id: "combos",
    title: "Combos",
    items: [
      {
        name: "2pcs Aloo Prantha Combo (Kabuli Chola / Dal Makhani Optional, Dahi, Pickle, Onion)",
        prices: { Regular: 140 },
      },
      {
        name: "2pcs Aloo Pyaaz Prantha Combo (Kabuli Chola / Dal Makhani Optional, Dahi, Pickle, Onion)",
        prices: { Regular: 150 },
      },
      {
        name: "2pcs Pyaaz Prantha Combo (Kabuli Chola / Dal Makhani Optional, Dahi, Pickle, Onion)",
        prices: { Regular: 150 },
      },
      {
        name: "2pcs Masala Lacha Paratha Combo (Kabuli Chola / Dal Makhani Optional, Dahi, Pickle, Onion)",
        prices: { Regular: 140 },
      },
    ],
  },
  {
    id: "extra",
    title: "Extra",
    items: [
      { name: "Water Bottle 750ml", prices: { Regular: 10 } },
      { name: "Cold Drinks", prices: { "250ml": 10, "500ml": 20 } },
    ],
  },
  {
    id: "daily-main-course-menu",
    title: "Daily Main Course Menu",
    items: [
      { name: "Punjabi Kali Dal", prices: { Full: 200, Half: 110 } },
      { name: "Masala Chole", prices: { Full: 200, Half: 110 } },
      { name: "Butter Dal Fry", prices: { Full: 180, Half: 100 } },
      { name: "Paneer Makhani", prices: { Full: 260, Half: 140 } },
      { name: "Masala Mushroom", prices: { Full: 280, Half: 150 } },
      { name: "Masala Chaap", prices: { Full: 280 } },
      { name: "Creamy Palak Corn", prices: { Full: 220 } },
      { name: "Palak Paneer", prices: { Full: 280 } },
      { name: "Paneer Bhurji", prices: { Full: 299 } },
      { name: "Kadhi Pakora", prices: { Full: 200, Half: 110 } },
      { name: "Veg Handi", prices: { Full: 200, Half: 110 } },
      { name: "Dry Mix Veg", prices: { Full: 180, Half: 100 } },
      { name: "Jeera Aloo", prices: { Full: 180 } },
    ],
  },
  {
    id: "rice",
    title: "Rice",
    items: [
      { name: "Kashmiri Pulao", prices: { Full: 140 } },
      { name: "Special Tawa Pulao", prices: { Full: 140 } },
      { name: "Veg Pulao / Peas Pulao", prices: { Full: 130 } },
      { name: "Jeera Rice", prices: { Full: 120 } },
      { name: "Plain Rice", prices: { Full: 90 } },
    ],
  },
  {
    id: "roti-pranthas",
    title: "Roti & Pranthas [per pc]",
    items: [
      { name: "Aloo Prantha", prices: { Regular: 45 } },
      { name: "Aloo Pyaaz Prantha", prices: { Regular: 50 } },
      { name: "Pyaaz Prantha", prices: { Regular: 50 } },
      { name: "Paneer Prantha", prices: { Regular: 90 } },
      { name: "Ajwain Prantha", prices: { Regular: 40 } },
      { name: "Wheat Lachha Prantha", prices: { Regular: 35 } },
      { name: "Masala Lachha Prantha", prices: { Regular: 40 } },
      { name: "Plain Prantha", prices: { Regular: 30 } },
      { name: "Butter Roti", prices: { Regular: 12 } },
      { name: "Plain Roti", prices: { Regular: 8 } },
    ],
  },
  {
    id: "desserts",
    title: "Desserts",
    items: [
      { name: "Gulab Jamun (2pcs)", prices: { Regular: 50 } },
      { name: "Lassi [200ml]", prices: { Regular: 50 } },
      { name: "Chach 200ml", prices: { Regular: 35 } },
    ],
  },
  {
    id: "raitas",
    title: "Raitas",
    items: [
      { name: "Boondi Raita", prices: { Full: 130, Half: 65 } },
      { name: "Vegetable Raita", prices: { Full: 130, Half: 65 } },
      { name: "Jeera Raita", prices: { Full: 120, Half: 60 } },
      { name: "Plain Curd", prices: { Full: 110, Half: 55 } },
    ],
  },
  {
    id: "salad-papad",
    title: "Salad & Papad",
    items: [
      { name: "Green Salad", prices: { Regular: 70 } },
      { name: "Onion Salad", prices: { Regular: 60 } },
      { name: "Fried Papad [per pc]", prices: { Regular: 30 } },
      { name: "Roasted Papad [per pc]", prices: { Regular: 25 } },
    ],
  },
  {
    id: "thalis",
    title: "Thalis",
    items: [
      { name: "Shahi Thali", prices: { Regular: 255 } },
      { name: "Premium Thali", prices: { Regular: 210 } },
      { name: "Classic Thali", prices: { Regular: 160 } },
    ],
  },
];

function getFoodKeyword(name) {
  const lowered = String(name || "").toLowerCase();
  if (lowered.includes("biryani")) return "biryani";
  if (lowered.includes("roll")) return "kathi-roll";
  if (lowered.includes("noodle")) return "noodles";
  if (lowered.includes("fried rice") || lowered.includes("rice")) return "fried-rice";
  if (lowered.includes("paneer")) return "paneer";
  if (lowered.includes("mushroom")) return "mushroom-curry";
  if (lowered.includes("prawn")) return "prawn-curry";
  if (lowered.includes("mutton")) return "mutton-curry";
  if (lowered.includes("fish")) return "fish-fry";
  if (lowered.includes("egg")) return "egg-curry";
  if (lowered.includes("kebab") || lowered.includes("tandoori")) return "kebab";
  if (lowered.includes("chilli")) return "chilli-chicken";
  if (lowered.includes("paratha") || lowered.includes("roti") || lowered.includes("nan")) return "paratha";
  if (lowered.includes("thali")) return "indian-thali";
  if (lowered.includes("combo")) return "indian-meal";
  if (lowered.includes("chicken")) return "chicken-curry";
  return "indian-food";
}

function getFoodImage(name, categoryTitle) {
  const keyword = encodeURIComponent(getFoodKeyword(name));
  const key = encodeURIComponent(`${categoryTitle}-${name}`);
  return `https://loremflickr.com/960/720/indian,food,${keyword}?lock=${key}`;
}

export function createSeededMenuState() {
  let nextMenuItemId = 1;

  const categories = (Array.isArray(seedMenuCategories) ? seedMenuCategories : []).map((category) => ({
    id: String(category.id || randomUUID()),
    title: String(category.title || "Menu"),
    items: (Array.isArray(category.items) ? category.items : []).map((item) => ({
      id: nextMenuItemId++,
      name: String(item.name || "Item"),
      prices: item.prices && typeof item.prices === "object" ? item.prices : { Regular: Number(item.price) || 0 },
      image: String(item.image || getFoodImage(item.name, category.title) || ""),
    })),
  }));

  return {
    categories,
    nextMenuItemId,
  };
}

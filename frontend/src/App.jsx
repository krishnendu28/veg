import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import { getFoodImage } from "./data/menuImages";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";
const socket = io(API_BASE_URL, { autoConnect: true });
const USER_SESSION_KEY = "cbk_user_session";

function formatINR(value) {
  return `Rs ${value}`;
}

function App() {
  const [menuCategories, setMenuCategories] = useState([]);
  const [userSession, setUserSession] = useState(() => {
    const stored = localStorage.getItem(USER_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [activeCategory, setActiveCategory] = useState("");
  const [variantSelections, setVariantSelections] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [userLogin, setUserLogin] = useState({ name: "", phone: "" });
  const [customer, setCustomer] = useState({
    customerName: userSession?.name || "",
    phone: userSession?.phone || "",
    address: "",
  });
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/menu`);
        const categories = Array.isArray(response.data) ? response.data : [];
        setMenuCategories(categories);
        if (!categories.some((category) => category.id === activeCategory)) {
          setActiveCategory(categories[0]?.id || "");
        }
      } catch {
        setMenuCategories([]);
      }
    }

    loadMenu();

    const onMenuChanged = () => {
      loadMenu();
    };

    socket.on("menu_created", onMenuChanged);
    socket.on("menu_updated", onMenuChanged);
    socket.on("menu_deleted", onMenuChanged);

    return () => {
      socket.off("menu_created", onMenuChanged);
      socket.off("menu_updated", onMenuChanged);
      socket.off("menu_deleted", onMenuChanged);
    };
  }, []);

  const handleUserLogout = () => {
    localStorage.removeItem(USER_SESSION_KEY);
    setUserSession(null);
    setUserLogin({ name: "", phone: "" });
    setCustomer({ customerName: "", phone: "", address: "" });
    setCartItems([]);
    setCartOpen(false);
  };

  const activeCategoryData = useMemo(
    () => menuCategories.find((category) => category.id === activeCategory) ?? menuCategories[0],
    [activeCategory, menuCategories],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [cartItems],
  );
  const deliveryCharge = cartItems.length > 0 ? 20 : 0;
  const grandTotal = subtotal + deliveryCharge;

  const handleUserLogin = (event) => {
    event.preventDefault();
    if (!userLogin.name.trim() || !userLogin.phone.trim()) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    const session = {
      name: userLogin.name.trim(),
      phone: userLogin.phone.trim(),
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    setUserSession(session);
    setCustomer((prev) => ({
      ...prev,
      customerName: session.name,
      phone: session.phone,
    }));
  };

  const addToCart = (item) => {
    const variants = Object.entries(item.prices);
    const selectedVariant = variantSelections[item.name] || variants[0][0];
    const selectedPrice = item.prices[selectedVariant];

    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.name === item.name && cartItem.variant === selectedVariant);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === existing.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                totalPrice: (cartItem.quantity + 1) * cartItem.unitPrice,
              }
            : cartItem,
        );
      }

      return [
        ...prev,
        {
          id: `${item.name}-${selectedVariant}`,
          name: item.name,
          variant: selectedVariant,
          quantity: 1,
          unitPrice: selectedPrice,
          totalPrice: selectedPrice,
        },
      ];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                totalPrice: Math.max(0, item.quantity + delta) * item.unitPrice,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const placeOrder = async () => {
    if (!customer.customerName || !customer.phone || !customer.address) {
      toast.error("Please fill customer name, phone, and address.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        customerName: customer.customerName,
        phone: customer.phone,
        address: customer.address,
        items: cartItems,
        deliveryCharge,
        total: grandTotal,
      };

      const response = await axios.post(`${API_BASE_URL}/api/orders`, payload);
      socket.emit("new_order", response.data);

      toast.success("Your order is being prepared! 🍛");
      setCartItems([]);
      setCustomer({
        customerName: userSession?.name || "",
        phone: userSession?.phone || "",
        address: "",
      });
      setCartOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!userSession) {
    return (
      <div className="login-screen user-login-screen">
        <Toaster position="top-center" />
        <div className="login-card">
          <img src="/logo.png" alt="Chakhna By Kilo logo" className="login-logo" />
          <h1>Welcome to Chakhna By Kilo</h1>
          <p>Log in as a user to start ordering.</p>
          <form className="login-form" onSubmit={handleUserLogin}>
            <input
              type="text"
              placeholder="Your Name"
              value={userLogin.name}
              onChange={(event) => setUserLogin((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={userLogin.phone}
              onChange={(event) => setUserLogin((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <button type="submit">Continue as User</button>
          </form>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="owner-link">
            Owner/Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="top-center" />
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="Chakhna By Kilo" className="brand-logo" />
          <div>
            <h2>Chakhna By Kilo</h2>
            <p>By Kilo, By Choice, By Taste</p>
          </div>
        </div>
        <nav>
          <a href="#menu">Menu</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="cart-pill" onClick={() => setCartOpen(true)}>
          Cart <span>{cartItems.length}</span>
        </button>
        <button className="cart-pill logout-pill" onClick={handleUserLogout}>
          Logout
        </button>
      </header>

      <section className="hero">
        <div className="hero-overlay" />
        <img src="/logo.png" alt="Chakhna logo" className="hero-logo" />
        <h1>Chakhna By Kilo</h1>
        <p className="tagline">By Kilo, By Choice, By Taste</p>
        <p className="shimmer">Premium street food, handcrafted in Technocity</p>
        <button className="cta" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
          Order Now
        </button>
      </section>

      <main id="menu" className="menu-section">
        <div className="tabs">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "tab active" : "tab"}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.title}
            </button>
          ))}
        </div>

        <div className="cards-grid">
          {(activeCategoryData?.items || []).map((item) => {
            const variants = Object.keys(item.prices);
            const activeVariant = variantSelections[item.name] || variants[0];
            const currentPrice = item.prices[activeVariant];

            return (
              <article key={item.name} className="menu-card">
                <img
                  src={getFoodImage(item.name, activeCategoryData?.title)}
                  alt={item.name}
                  className="food-image"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getFoodImage("", activeCategoryData?.title || "indian");
                  }}
                />
                <h3>{item.name}</h3>
                <p className="price">{formatINR(currentPrice)}</p>

                {variants.length > 1 && (
                  <div className="variant-toggle">
                    {variants.map((variant) => (
                      <button
                        key={variant}
                        onClick={() =>
                          setVariantSelections((prev) => ({
                            ...prev,
                            [item.name]: variant,
                          }))
                        }
                        className={activeVariant === variant ? "variant active" : "variant"}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                )}

                <button className="add-btn" onClick={() => addToCart(item)}>
                  Add to Cart
                </button>
              </article>
            );
          })}
        </div>
      </main>

      <section id="about" className="about-block">
        <h2>From New Town, Kolkata</h2>
        <p>
          Outside Shapoorji C Block Gate, Technocity (New Town), Kolkata - 700135.
          Serving bold, warm, authentic flavors across street favorites, biryani, tandoor, and combo meals.
        </p>
      </section>

      <footer id="contact" className="footer">
        <p>Address: Outside Shapoorji C Block Gate, Technocity (New Town), Kolkata - 700135</p>
        <p>Phone: +91-84202 52042 | Instagram: @chakhnabykilo</p>
        <div className="delivery-badges">
          <span>Zomato</span>
          <span>Swiggy</span>
        </div>
      </footer>

      <button className="floating-cart" onClick={() => setCartOpen(true)}>
        Cart ({cartItems.length})
      </button>

      <aside className={cartOpen ? "cart-drawer open" : "cart-drawer"}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button onClick={() => setCartOpen(false)}>Close</button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 && <p>Your cart is empty.</p>}
          {cartItems.map((item) => (
            <div key={item.id} className="cart-row">
              <div>
                <h4>{item.name}</h4>
                <p>
                  {item.variant} x {item.quantity}
                </p>
              </div>
              <div className="qty-controls">
                <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}>+</button>
              </div>
              <strong>{formatINR(item.totalPrice)}</strong>
            </div>
          ))}
        </div>

        <div className="customer-fields">
          <input
            type="text"
            placeholder="Customer Name"
            value={customer.customerName}
            disabled
            onChange={(event) => setCustomer((prev) => ({ ...prev, customerName: event.target.value }))}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={customer.phone}
            disabled
            onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <textarea
            placeholder="Delivery Address"
            value={customer.address}
            onChange={(event) => setCustomer((prev) => ({ ...prev, address: event.target.value }))}
          />
        </div>

        <div className="checkout-row">
          <p>Subtotal: {formatINR(subtotal)}</p>
          <p>Delivery: {formatINR(deliveryCharge)}</p>
          <p>Payable: {formatINR(grandTotal)}</p>
          <button onClick={placeOrder} disabled={placingOrder}>
            {placingOrder ? "Placing..." : "Place Order"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;

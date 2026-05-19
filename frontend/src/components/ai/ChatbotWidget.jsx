import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, applyCoupon, clearCoupon, removeFromCart, updateCartQty } from "../../redux/features/cart/cartSlice";
import getBaseUrl from "../../utils/baseURL";
import { getRecommendationBehaviorContext, trackProductClick } from "../../utils/recommendationBehavior";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const idleTimerRef = useRef(null);
  const suggestionTimerRef = useRef(null);
  const suggestionAbortRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const [lastShownProducts, setLastShownProducts] = useState([]);
  const [pendingCartAction, setPendingCartAction] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your Smart librarian!! ",
      products: [],
    },
  ]);

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);

  const buildCartContext = () => ({
    items: (cartItems || []).map((item) => ({
      id: item?._id || item?.id || item?.productId,
      title: item?.title || item?.name || "Item",
      quantity: item?.quantity || 1,
      price: Number(item?.newPrice ?? item?.price) || 0,
    })),
    appliedCoupon: appliedCoupon
      ? {
          code: appliedCoupon.code,
          percent: appliedCoupon.percent,
        }
      : null,
  });

  const clearSuggestions = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const buildSuggestionPrompt = (suggestion) => {
    if (!suggestion) return "";
    if (suggestion.type === "category") return `Show me ${suggestion.value} books`;
    if (suggestion.type === "brand") return `Show me books from ${suggestion.value}`;
    return `Show me ${suggestion.value}`;
  };

  const handleSuggestionSelect = async (suggestion) => {
    const prompt = buildSuggestionPrompt(suggestion);
    if (!prompt || isLoading) return;
    setInput("");
    clearSuggestions();
    lastInteractionRef.current = Date.now();
    await sendMessage(prompt, false);
  };

  const fetchSuggestions = async (query) => {
    if (query.trim().length < 2) {
      clearSuggestions();
      return;
    }

    if (suggestionAbortRef.current) {
      suggestionAbortRef.current.abort();
    }

    const controller = new AbortController();
    suggestionAbortRef.current = controller;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${getBaseUrl()}/api/ai/suggestions?q=${encodeURIComponent(query.trim())}&limit=6`,
        {
          signal: controller.signal,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        clearSuggestions();
        return;
      }

      const data = await response.json();
      const nextSuggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(nextSuggestions);
      setShowSuggestions(nextSuggestions.length > 0);
      setActiveSuggestionIndex(nextSuggestions.length > 0 ? 0 : -1);
    } catch (error) {
      if (error?.name !== "AbortError") {
        clearSuggestions();
      }
    }
  };

  const askBackend = async (conversation, idle = false) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${getBaseUrl()}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages: conversation.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        idle,
        lastShownProducts,
        pendingCartAction,
        behaviorContext: getRecommendationBehaviorContext(),
        cartContext: buildCartContext(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to reach AI backend");
    }

    return response.json();
  };

  const sendMessage = async (content, idle = false) => {
    const userMessage = { role: "user", content, products: [] };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    try {
      setIsLoading(true);
      const data = await askBackend(nextMessages, idle);
      const actions = Array.isArray(data?.actions) ? data.actions : [];
      const confirmAction = actions.find((item) => item.type === "confirm_add_to_cart");
      const clearAction = actions.find((item) => item.type === "clear_pending_cart");
      if (confirmAction?.payload) {
        setPendingCartAction(confirmAction.payload);
      }
      if (clearAction) {
        setPendingCartAction(null);
      }
      const addAction = actions.find((item) => item.type === "add_to_cart");
      if (addAction?.payload?.productId) {
        await handleQuickAddToCart(addAction.payload.productId, addAction.payload.quantity || 1);
        setPendingCartAction(null);
      }

      const removeAction = actions.find((item) => item.type === "remove_from_cart");
      if (removeAction?.payload?.productId) {
        dispatch(removeFromCart({ _id: removeAction.payload.productId }));
      }

      const couponAction = actions.find((item) => item.type === "apply_coupon");
      if (couponAction?.payload?.code) {
        dispatch(applyCoupon(couponAction.payload));
      }

      const clearCouponAction = actions.find((item) => item.type === "clear_coupon");
      if (clearCouponAction) {
        dispatch(clearCoupon());
      }

      const assistantMessage = {
        role: "assistant",
        content: data?.reply || "I could not generate a response.",
        products: Array.isArray(data?.products) ? data.products : [],
        timeline: actions.find((item) => item.type === "order_timeline")?.payload?.timeline || [],
      };
      if (assistantMessage.products.length > 0) {
        setLastShownProducts(assistantMessage.products);
      }
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I hit an error while processing your request: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    clearSuggestions();
    lastInteractionRef.current = Date.now();
    await sendMessage(text, false);
  };

  const handleQuickAddToCart = async (productId, qty = 1) => {
    const res = await fetch(`${getBaseUrl()}/api/books/${productId}`);
    if (!res.ok) return;
    const product = await res.json();
    dispatch(addToCart(product));
    dispatch(updateCartQty({ id: product._id, quantity: Math.max(1, Number(qty) || 1) }));
  };

  const handleConfirmAdd = async (confirm) => {
    if (!pendingCartAction) return;
    lastInteractionRef.current = Date.now();
    await sendMessage(confirm ? "yes" : "no", false);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    idleTimerRef.current = setInterval(async () => {
      const now = Date.now();
      const isIdle = now - lastInteractionRef.current > 45000;
      if (isIdle && !isLoading) {
        lastInteractionRef.current = now;
        if ((cartItems || []).length > 0) {
          await sendMessage("Can you remind me about my cart?", true);
        } else {
          await sendMessage("Suggest trending products for me", true);
        }
      }
    }, 15000);
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [isOpen, isLoading, messages, cartItems]);

  useEffect(() => {
    if (!isOpen || isLoading) {
      clearSuggestions();
      return;
    }

    const query = input.trim();
    if (query.length < 2) {
      clearSuggestions();
      return;
    }

    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    suggestionTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 220);

    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [input, isOpen, isLoading]);

  useEffect(() => {
    return () => {
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-[22rem] max-w-[calc(100vw-2rem)] h-[28rem] bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col">
          <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
            <span>Smart E-Commerce Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-black text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`text-sm p-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-white ml-8"
                    : "bg-secondary text-text mr-8"
                }`}
              >
                {message.content}
                {Array.isArray(message.products) && message.products.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.products.map((product) => (
                      <div key={product.id} className="border bg-white rounded-md p-2 text-gray-800">
                        <p className="font-semibold text-xs">{product.title}</p>
                        <p className="text-xs">Rs. {product.price}</p>
                        <p className="text-[11px] text-gray-600 capitalize">
                          {product.category || "uncategorized"}
                          {product.brand ? ` | ${product.brand}` : ""}
                        </p>
                        <p className="text-[11px] text-gray-500">Rating: {Number(product.rating || 0).toFixed(1)}</p>
                        {product.reason && (
                          <p className="text-[11px] text-blue-700">{product.reason}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <Link
                            to={`/books/${product.slug}`}
                            onClick={() => trackProductClick(product.id)}
                            className="text-xs px-2 py-1 bg-primary text-white rounded"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => {
                              trackProductClick(product.id);
                              handleQuickAddToCart(product.id);
                            }}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(message.timeline) && message.timeline.length > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    {message.timeline.map((step) => (
                      <p key={step.step} className={step.current ? "font-semibold text-primary" : ""}>
                        {step.done ? "✓" : "○"} {step.step}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <p className="text-xs text-gray-500">Thinking...</p>}
            {!isLoading && pendingCartAction && (
              <div className="text-sm p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-gray-800 mr-8">
                <p>
                  Would you like me to add {pendingCartAction.productTitle} to your cart for Rs. {pendingCartAction.price}?
                </p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleConfirmAdd(true)} className="text-xs px-2 py-1 bg-primary text-white rounded">Yes</button>
                  <button onClick={() => handleConfirmAdd(false)} className="text-xs px-2 py-1 border rounded">No</button>
                </div>
              </div>
            )}
          </div>
          <div className="px-3 pb-2 pt-1 flex gap-2 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
            {["Where is my order?", "Trending books", "Applied coupons?", "Shipping info"].map((q) => (
              <button
                key={q}
                onClick={async () => {
                  if (isLoading) return;
                  setInput("");
                  clearSuggestions();
                  lastInteractionRef.current = Date.now();
                  await sendMessage(q, false);
                }}
                disabled={isLoading}
                className="text-[11px] border rounded-full px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                type="button"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <div className="relative flex-1">
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 bottom-full mb-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-20">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`w-full text-left px-3 py-2 text-xs border-b last:border-b-0 ${
                        index === activeSuggestionIndex ? "bg-secondary" : "bg-white"
                      }`}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                      return;
                    }

                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveSuggestionIndex((prev) => {
                        if (prev <= 0) return suggestions.length - 1;
                        return prev - 1;
                      });
                      return;
                    }

                    if (e.key === "Enter" && activeSuggestionIndex >= 0) {
                      e.preventDefault();
                      handleSuggestionSelect(suggestions[activeSuggestionIndex]);
                      return;
                    }

                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowSuggestions(false);
                      return;
                    }
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about products, orders, shipping, returns..."
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleSend}
              className="bg-primary text-white px-3 py-2 rounded-md text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 bg-primary text-white rounded-full h-12 px-5 shadow-lg z-50 text-sm font-semibold"
        aria-label="Open AI assistant"
      >
        Chat with AI
      </button>
    </>
  );
};

export default ChatbotWidget;

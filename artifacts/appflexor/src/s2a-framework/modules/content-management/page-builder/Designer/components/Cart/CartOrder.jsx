import React, { useContext, useState } from "react";
import axios from "axios";
import { AppContext } from "../../../../../../../AppContext";
import { API_URL } from "../../../../../../Config";
import { v4 as uuidv4 } from "uuid";

const CartOrder = () => {
  const { cartItems, setCartItems } = useContext(AppContext);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(true);

  const handleRemoveFromCart = id => {
    setCartItems(prev => prev.filter(ci => ci.id !== id));
  };

  const handleUpdateQuantity = (id, newQty) => {
    setCartItems(prev =>
      prev.map(ci =>
        ci.id === id ? { ...ci, quantity: Math.max(newQty, 1) } : ci
      )
    );
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setMessage("Please enter customer name.");
      return;
    }
    if (cartItems.length === 0) {
      setMessage("Cart is empty.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const orderId = uuidv4();

      let order = {
        formId: "order",
        entity: "order",
        action: "update",
        id: orderId,
        formData: {
          customer_name: customerName,
          order_total: cartTotal.toFixed(2),
          id: orderId,
        },
      };

      let data = cartItems.map(ci => ({
        formId: "order_item",
        entity: "order_item",
        action: "update",
        id: "new",
        formData: {
          order_id: orderId,
          row_id: ci.id,
          item_id: ci.data.id,
          price: ci.price,
          currency: ci.symbol || "",
          quantity: ci.quantity,
          net_amount: ci.price * ci.quantity,
          id: "new",
        },
      }));

      const request = {
        saveOrUpdate: "Yes",
        data: [order, ...data],
      };
      const url = API_URL + "?service.key=update.formData";
      await axios.post(url, request);

      setMessage("Order placed successfully!");
      setCartItems([]);
      setCustomerName("");
    } catch (error) {
      console.error(error);
      setMessage("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-order">
      <div className="mb-3">
        <label className="form-label">Table/Customer Name</label>
        <input
          type="text"
          className="form-control"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-link"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide Cart Items ▲" : "Show Cart Items ▼"}
        </button>
        <div className="d-flex align-items-center">
          <div className="fw-bold me-3">
            Grand Total: {cartTotal.toFixed(2)}
          </div>
          <button
            className="btn btn-success"
            disabled={loading || cartItems.length === 0}
            onClick={handleCheckout}
          >
            {loading ? "Processing..." : "Checkout"}
          </button>
        </div>
      </div>

      {expanded && cartItems.length > 0 && (
        <table className="s2a-table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map(item => (
              <tr key={item.id}>
                <td>{item.data.title}</td>
                <td>{item.price.toFixed(2)}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      –
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e =>
                        handleUpdateQuantity(item.id, Number(e.target.value))
                      }
                      className="form-control form-control-sm text-center"
                      style={{ width: "60px" }}
                    />
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{(item.quantity * item.price).toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <div className="mt-2 alert alert-info">{message}</div>}
    </div>
  );
};

export default CartOrder;

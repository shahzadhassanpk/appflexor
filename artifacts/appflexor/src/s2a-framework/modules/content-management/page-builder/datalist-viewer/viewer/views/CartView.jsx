import React, { useEffect, useRef, useState, useContext } from "react";
import { AppContext } from "../../../../../../../AppContext";

const CartView = props => {
    const {
        page,
        prepareRow,
        titleShowingFields,
        screenWidth,
        columns = 4,
        datalist_type,
        groupBy = "",
        groupMode = "section",
        showHeader = true,
        showAsCart = true,
        priceField = "price",
    } = props;

    const galleryRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const { cartItems, setCartItems } = useContext(AppContext);

    useEffect(() => {
        if (galleryRef?.current) {
            galleryRef.current.style.gridTemplateColumns = `repeat(${columns}, auto)`;
        }
    }, [columns]);

    useEffect(() => {
        const newcartTotal = cartItems.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
        );
        setCartTotal(newcartTotal);
    }, [cartItems]);

    const handleAddToCart = item => {
        const price = Number(item.row.original[priceField]) || 0;
        const newItem = { id: item.row.id, data: item.row.original, quantity: 1, price };

        setCartItems(prev => {
            const existing = prev.find(ci => ci.id === newItem.id);
            if (existing) {
                return prev.map(ci =>
                    ci.id === newItem.id
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci,
                );
            }
            return [...prev, newItem];
        });
    };

    const handleUpdateQuantity = (id, newQty) => {
        setCartItems(prev =>
            prev.map(ci => (ci.id === id ? { ...ci, quantity: newQty } : ci)),
        );
    };

    const handleRemoveFromCart = id => {
        setCartItems(prev => prev.filter(ci => ci.id !== id));
    };

    const groupedRows = groupBy
        ? page.reduce((acc, row) => {
              prepareRow(row);
              const groupValue = row.original[groupBy] || "Ungrouped";
              if (!acc[groupValue]) acc[groupValue] = [];
              acc[groupValue].push(row);
              return acc;
          }, {})
        : null;

    const categoryCounts =
        groupBy && groupedRows
            ? Object.entries(groupedRows).map(([group, rows]) => ({
                  group,
                  count: rows.length,
              }))
            : [];

    const rowsToRender =
        groupBy && groupMode === "filter" && activeFilter
            ? groupedRows[activeFilter] || []
            : page;

    return (
        <div
            className="s2a-gallery"
            ref={galleryRef}>           

            {/* Filters */}
            {groupBy && groupMode === "filter" && (
                <div className="gallery-filters mb-3 mt-3">
                    <button
                        className={`btn btn-sm me-2 ${
                            activeFilter === null
                                ? "btn-primary"
                                : "btn-outline-primary"
                        }`}
                        onClick={() => setActiveFilter(null)}>
                        Show All ({page.length})
                    </button>
                    {categoryCounts.map(({ group, count }) => (
                        <button
                            key={group}
                            className={`btn btn-sm me-2 ${
                                activeFilter === group
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    activeFilter === group ? null : group,
                                )
                            }>
                            {group} ({count})
                        </button>
                    ))}
                </div>
            )}

            {/* Rows */}
            {groupBy && groupMode === "section" && groupedRows ? (
                Object.entries(groupedRows).map(([group, rows]) => (
                    <div
                        key={group}
                        className="gallery-group">
                        {showHeader && (
                            <h4 className="gallery-group-title">{group}</h4>
                        )}
                        <div className="row">
                            {rows.map((row, i) => {
                                prepareRow(row);
                                return (
                                    <GalleryCell
                                        key={i}
                                        row={row}
                                        columns={columns}
                                        screenWidth={screenWidth}
                                        titleShowingFields={titleShowingFields}
                                        datalist_type={datalist_type}
                                        groupBy={groupBy}
                                        showAsCart={showAsCart}
                                        priceField={priceField}
                                        mode="list"
                                        onAddToCart={handleAddToCart}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="row">
                    {rowsToRender.map((row, i) => {
                        prepareRow(row);
                        return (
                            <GalleryCell
                                key={i}
                                row={row}
                                columns={columns}
                                screenWidth={screenWidth}
                                titleShowingFields={titleShowingFields}
                                datalist_type={datalist_type}
                                groupBy={groupBy}
                                showAsCart={showAsCart}
                                priceField={priceField}
                                mode="list"
                                onAddToCart={handleAddToCart}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const GalleryCell = ({
    row,
    columns,
    screenWidth,
    titleShowingFields,
    datalist_type,
    groupBy,
    showAsCart,
    priceField = "price",
    onAddToCart,
    mode = "list",
    onRemove,
}) => {
    const [quantity, setQuantity] = useState(1);

    const price = Number(row.original[priceField]) || 0;
    const itemTotal = quantity * price;

    const increaseQty = () => setQuantity(qty => qty + 1);
    const decreaseQty = () => setQuantity(qty => (qty > 1 ? qty - 1 : 1));

    const handleAddToCart = () => {
        if (typeof onAddToCart === "function") {
            onAddToCart({
                id: row.id,
                item_id:row.original["id"],
                row,
                columns,
                screenWidth,
                quantity,
                price,
                itemTotal: itemTotal,
            });
        }
    };

    return (
        <div
            className={`gallery-cell col-sm-${12 / columns}`}
            {...row.getRowProps()}>
            <div className="gallery-item">
                {row.cells.map(cell => {
                    const db_column =
                        typeof cell.column.Header !== "function"
                            ? cell.column.Header
                            : "";
                    return (
                        <div
                            className={
                                db_column.toLowerCase() +
                                " " +
                                (screenWidth > 700
                                    ? "s2a-gallery-data"
                                    : "s2a-gallery-data")
                            }
                            title={
                                titleShowingFields[cell.column.datatype]
                                    ? cell.value
                                    : ""
                            }
                            {...cell.getCellProps()}
                            data-cell={db_column}>
                            <div className="s2a-cell">
                                {cell.render("Cell")}
                            </div>
                        </div>
                    );
                })}

                {showAsCart && (
                    <div className="cart-controls mt-2">
                        {/* {mode === "list" ? (
                            <div className="d-flex align-items-center mb-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary me-2"
                                    onClick={decreaseQty}>
                                    –
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={e =>
                                        setQuantity(Number(e.target.value))
                                    }
                                    className="form-control form-control-sm text-center"
                                    style={{ width: "60px" }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary ms-2"
                                    onClick={increaseQty}>
                                    +
                                </button>
                                <div className="m-2">
                                    <strong>Total:</strong>{" "}
                                    {itemTotal.toFixed(2)}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-2">
                                <strong>Quantity:</strong> {quantity} |{" "}
                                <strong>Total:</strong> {itemTotal.toFixed(2)}
                            </div>
                        )} */}
                        {mode === "list" ? (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => onRemove(row.id)}>
                                Remove
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartView;

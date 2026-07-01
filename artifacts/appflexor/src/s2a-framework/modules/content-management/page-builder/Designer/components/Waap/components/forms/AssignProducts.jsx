import { useEffect, useState } from "react";
import { productServices } from "../../services/productServices";
import LoadingButton from "../LoadingButton";
import { handleSave } from "../CrudApiCall";
import { toastEmitter } from "../Toastify/Toastify";

const AssignProducts = props => {
    const { id, hideModal, getData, handleBack, selectedLead } = props;

    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const productResponse = await productServices.getAll();
                    const productList = productResponse?.data?.C_DATA.products;
                    setProducts(productList);

                    // Step 1: Parse selected product IDs from selectedLead
                    const selected = selectedLead?.product
                        ?.split(";")
                        .map(p => p.trim())
                        .filter(p => p); // remove empty strings

                    // Step 2: Filter only valid product IDs from the fetched list
                    const validSelected = productList
                        .filter(product => selected?.includes(product.id))
                        .map(product => product.id);

                    setSelectedProducts(validSelected);
                }
            } catch (error) {
                console.error("Product fetch failed:", error);
                setProducts([]);
            }
        };

        fetchData();
    }, [id, selectedLead]);

    const toggleProduct = productId => {
        const updated = selectedProducts.includes(productId)
            ? selectedProducts.filter(id => id !== productId)
            : [...selectedProducts, productId];
        setSelectedProducts(updated);
    };

    const handleSaveProducts = async () => {
        try {
            const formattedProductIds = selectedProducts.join(";");
            const formData = {
                id,
                product: formattedProductIds,
            };

            await handleSave({
                entity: "waap_lead",
                formData,
            });

            await getData();
            handleBack();
            hideModal();
            toastEmitter("Products updated successfully", true);
        } catch (error) {
            console.error(error);
            toastEmitter("Failed to update products", true, "error");
        }
    };

    return (
        <div className="container mt-4">
            <div className="mb-3">
                <label className="form-label">Select Products</label>
                <div className="form-check-group">
                    {products.map(product => (
                        <div className="form-check" key={product.id}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id={`product_${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => toggleProduct(product.id)}
                            />
                            <label
                                className="form-check-label"
                                htmlFor={`product_${product.id}`}>
                                {product.title}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <LoadingButton
                classes={{ btn: "btn-primary" }}
                label="Update"
                fn={handleSaveProducts}
            />
        </div>
    );
};

export { AssignProducts };

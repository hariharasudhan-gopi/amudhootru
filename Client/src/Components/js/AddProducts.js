import '../css/AddProducts.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProducts() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('add'); // 'add' | 'update'
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    // fields for update mode pre-fill
    const [updateFields, setUpdateFields] = useState({ name: '', price: '', description: '', quantity: '', img_src: '' });
    const [lookupCode, setLookupCode] = useState('');
    const [lookupError, setLookupError] = useState('');

    function validate(code, name, price, description, quantity, isUpdate) {
        const errs = {};
        if (!code.trim()) errs.code = 'Product code is required.';
        if (!isUpdate) {
            if (!name.trim()) errs.name = 'Product name is required.';
            if (!price || isNaN(price) || Number(price) <= 0) errs.price = 'Enter a valid positive price.';
            if (!description.trim()) errs.description = 'Description is required.';
            if (!imagePreview) errs.image = 'Product image is required.';
        }
        if (quantity === '' || isNaN(quantity) || Number(quantity) < 0)
            errs.quantity = 'Enter a valid non-negative quantity.';
        return errs;
    }

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    }

    async function fetchProductForUpdate() {
        if (!lookupCode.trim()) {
            setLookupError('Enter a product code to load.');
            return;
        }
        setLookupError('');
        try {
            const res = await fetch(`http://localhost:8080/products/${encodeURIComponent(lookupCode.trim())}`);
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }
            const data = await res.json();
            const p = data.product;
            setUpdateFields({
                name: p.name || '',
                price: p.price || '',
                description: p.description || '',
                quantity: p.availablequantity ?? '',
                img_src: p.img_src || ''
            });
            setImagePreview(p.img_src || null);
        } catch (err) {
            setLookupError(err.message);
        }
    }

    function switchMode(m) {
        setMode(m);
        setErrors({});
        setSuccess('');
        setImagePreview(null);
        setUpdateFields({ name: '', price: '', description: '', quantity: '', img_src: '' });
        setLookupCode('');
        setLookupError('');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const isUpdate = mode === 'update';
        const code = isUpdate ? lookupCode.trim() : event.target.code.value;
        const name = isUpdate ? event.target.uname.value : event.target.name.value;
        const price = isUpdate ? event.target.uprice.value : event.target.price.value;
        const description = isUpdate ? event.target.udescription.value : event.target.description.value;
        const quantity = event.target.quantity.value;

        const errs = validate(code, name, price, description, quantity, isUpdate);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setSuccess('');
            return;
        }
        setErrors({});

        try {
            const url = isUpdate ? 'http://localhost:8080/products/update' : 'http://localhost:8080/products/add';
            const body = isUpdate
                ? { code, name, price: Number(price), description, quantity: Number(quantity), img_src: imagePreview }
                : { code, name, price: Number(price), description, quantity: Number(quantity), img_src: imagePreview };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg);
            }

            setSuccess(isUpdate ? 'Product updated successfully!' : 'Product added successfully!');
            if (!isUpdate) {
                event.target.reset();
                setImagePreview(null);
            }
        } catch (error) {
            setErrors({ form: error.message });
        }
    }

    return (
        <div className="addProductsContainer">
            <p className="backtoProductPage" onClick={() => navigate('/')}>&#8592; Back to Shop</p>
            <span className="addProductsHeader">
                <h2>{mode === 'add' ? 'Add Product' : 'Update Product'}</h2>
                <p>{mode === 'add' ? 'Add a new product to the catalog' : 'Update an existing product'}</p>
            </span>
            <div className="modeToggle">
                <button type="button" className={`modeBtn${mode === 'add' ? ' modeBtnActive' : ''}`} onClick={() => switchMode('add')}>Add New</button>
                <button type="button" className={`modeBtn${mode === 'update' ? ' modeBtnActive' : ''}`} onClick={() => switchMode('update')}>Update Existing</button>
            </div>

            {mode === 'update' && (
                <div className="lookupRow">
                    <input
                        type="text"
                        className={`prodCode lookupInput${lookupError ? ' inputErrorBorder' : ''}`}
                        placeholder="Enter product code"
                        value={lookupCode}
                        onChange={e => setLookupCode(e.target.value)}
                    />
                    <button type="button" className="lookupBtn" onClick={fetchProductForUpdate}>Load</button>
                    {lookupError && <span className="inputError">{lookupError}</span>}
                </div>
            )}

            <form className="addProductsForm" onSubmit={handleSubmit}>
                {mode === 'add' && (
                    <label className="addProductsLabel">
                        Product Code
                        <input type="text" name="code" className={`prodCode${errors.code ? ' inputErrorBorder' : ''}`} placeholder="Enter product code" />
                        {errors.code && <span className="inputError">{errors.code}</span>}
                    </label>
                )}
                <label className="addProductsLabel">
                    Product Name
                    <input type="text" name={mode === 'update' ? 'uname' : 'name'}
                        value={mode === 'update' ? updateFields.name : undefined}
                        onChange={mode === 'update' ? e => setUpdateFields(f => ({...f, name: e.target.value})) : undefined}
                        className={`prodName${errors.name ? ' inputErrorBorder' : ''}`} placeholder="Enter product name" />
                    {errors.name && <span className="inputError">{errors.name}</span>}
                </label>
                <label className="addProductsLabel">
                    Price (₹)
                    <input type="number" name={mode === 'update' ? 'uprice' : 'price'} min="0" step="0.01"
                        value={mode === 'update' ? updateFields.price : undefined}
                        onChange={mode === 'update' ? e => setUpdateFields(f => ({...f, price: e.target.value})) : undefined}
                        className={`prodPrice${errors.price ? ' inputErrorBorder' : ''}`} placeholder="Enter price" />
                    {errors.price && <span className="inputError">{errors.price}</span>}
                </label>
                <label className="addProductsLabel">
                    Available Quantity
                    <input type="number" name="quantity" min="0"
                        value={mode === 'update' ? updateFields.quantity : undefined}
                        onChange={mode === 'update' ? e => setUpdateFields(f => ({...f, quantity: e.target.value})) : undefined}
                        className={`prodQuantity${errors.quantity ? ' inputErrorBorder' : ''}`} placeholder="Enter available quantity" />
                    {errors.quantity && <span className="inputError">{errors.quantity}</span>}
                </label>
                <label className="addProductsLabel">
                    Description
                    <textarea name={mode === 'update' ? 'udescription' : 'description'}
                        value={mode === 'update' ? updateFields.description : undefined}
                        onChange={mode === 'update' ? e => setUpdateFields(f => ({...f, description: e.target.value})) : undefined}
                        className={`prodDescription${errors.description ? ' inputErrorBorder' : ''}`} placeholder="Enter product description" rows={3} />
                    {errors.description && <span className="inputError">{errors.description}</span>}
                </label>
                <label className="addProductsLabel">
                    Product Image
                    <input type="file" name="image" accept="image/*" className={`prodImage${errors.image ? ' inputErrorBorder' : ''}`} onChange={handleImageChange} />
                    {errors.image && <span className="inputError">{errors.image}</span>}
                </label>
                {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="imagePreview" />
                )}
                {errors.form && <span className="inputError formError">{errors.form}</span>}
                {success && <span className="successMessage">{success}</span>}
                <button className="addProductsButton" type="submit">{mode === 'add' ? 'Add Product' : 'Update Product'}</button>
            </form>
        </div>
    );
}

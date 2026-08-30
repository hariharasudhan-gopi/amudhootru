import "../css/DeliveryAddress.css";

import { useState, useEffect } from "react";

export default function DeliveryAddress(props) {
    const [showAddNewAddressForm, setShowAddNewAddressForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const deliveryAddress = props.userDetails && props.userDetails.deliveryAddress;

    const profileAddr = props.userDetails?.address?.dno
        ? { ...props.userDetails.address, contact: props.userDetails.address.contact || props.userDetails.phone, _isProfileAddress: true }
        : null;

    // combined list: profile address first, then saved delivery addresses
    const allAddresses = [
        ...(profileAddr ? [profileAddr] : []),
        ...(deliveryAddress || []),
    ];

    // auto-select profile address as default when nothing is selected
    useEffect(() => {
        if (!props.deliveryAddress && profileAddr) {
            props.setDeliveryAddress(profileAddr);
        }
    }, []);

    function validateAddress({ houseFlat, street, city, state, zip, country, contact }) {
        const errs = {};
        if (!houseFlat.trim()) errs.houseFlat = 'House/Flat No is required.';
        if (!street.trim()) errs.street = 'Street is required.';
        if (!city.trim()) errs.city = 'City is required.';
        if (!state.trim()) errs.state = 'State is required.';
        if (!zip.trim()) errs.zip = 'Zip is required.';
        else if (!/^\d{4,10}$/.test(zip.trim())) errs.zip = 'Enter a valid zip code (4–10 digits).';
        if (!country.trim()) errs.country = 'Country is required.';
        if (!contact.trim()) errs.contact = 'Contact is required.';
        else if (!/^\+?[\d\s\-]{7,15}$/.test(contact.trim())) errs.contact = 'Enter a valid contact number.';
        return errs;
    }

    function addAddress(event) {
        event.preventDefault();
        event.stopPropagation();
        const form = event.target.closest('form');
        const houseFlat = form.querySelector('.addressHouseFlat').value;
        const street = form.querySelector('.addressStreet').value;
        const city = form.querySelector('.addressCity').value;
        const state = form.querySelector('.addressState').value;
        const zip = form.querySelector('.addressZip').value;
        const country = form.querySelector('.addressCountry').value;
        const contact = form.querySelector('.addressContact').value;

        const errs = validateAddress({ houseFlat, street, city, state, zip, country, contact });
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }
        setFormErrors({});

        const newAddress = {
            dno: houseFlat,
            street,
            city,
            state,
            zip,
            country,
            contact
        };

        try {
            const response = fetch(
                `${process.env.REACT_APP_API_URL}/userInfo/deliveryAddress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usermail: props.userDetails && props.userDetails.email,
                    deliveryAddress: newAddress
                })
            }
            );

            response.then(async (res) => {
                if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg);
                }

                return res.json();
            })
                .then((data) => {
                    console.log("Delivery Address Updated:", data);
                    alert(data.message);
                    props.setDeliveryAddress(newAddress);
                    props.setUserDetails(data.userDetails);
                    props.setShowDeliveryAddress(false);
                })
        } catch (error) {
            console.error("Error updating delivery address:", error);
        }
    }
    return (
        <div className="deliveryAddressContainer">
            <h3>Delivery Address</h3>
            <i
                className="fa-solid fa-xmark close-icon"
                onClick={() => props.setShowDeliveryAddress(false)}
            ></i>
            {allAddresses.length > 0 && !showAddNewAddressForm ?
            <span className="deliveryAddressDetails">
                {allAddresses.map((address, index) => (
                    <div key={index} className="deliveryAddressItem">
                    <div className="addressRadioWrap">
                        <input type="radio" name="deliveryAddress" value={index}
                            checked={props.deliveryAddress === address}
                            onChange={() => props.setDeliveryAddress(address)} />
                    </div>
                    <div className="addressCardText">
                        {address._isProfileAddress && <span className="profileAddressTag">Profile Address</span>}
                        <p>{address ? `${address.dno}, ${address.street}, ${address.city},` : 'N/A'}</p>
                        <p>{address ? `${address.state}, ${address.country}, ${address.zip}` : 'N/A'}</p>
                        <p>Contact: {address && address.contact ? address.contact : 'N/A'}</p>
                    </div>
                    </div>
                ))}
                <button className="addNewAddressButton" onClick={() => setShowAddNewAddressForm(true)}>Add New Address</button>
            </span>
            :
            <span className="deliveryAddressForm">
                <h4>Add New Address</h4>
                <form>
                    <span className="addressForm">
                        <label className="addressLabel">House/Flat No:
                            <input type="text" className="addressHouseFlat" name="houseFlat" placeholder="Enter house/flat number" />
                            {formErrors.houseFlat && <span className="addressError">{formErrors.houseFlat}</span>}
                        </label>
                        <label className="addressLabel">Street:
                            <input type="text" className="addressStreet" name="street" placeholder="Enter street" />
                            {formErrors.street && <span className="addressError">{formErrors.street}</span>}
                        </label>
                        <label className="addressLabel">City:
                            <input type="text" className="addressCity" name="city" placeholder="Enter city" />
                            {formErrors.city && <span className="addressError">{formErrors.city}</span>}
                        </label>
                        <label className="addressLabel">State:
                            <input type="text" className="addressState" name="state" placeholder="Enter state" />
                            {formErrors.state && <span className="addressError">{formErrors.state}</span>}
                        </label>
                        <label className="addressLabel">Zip:
                            <input type="text" className="addressZip" name="zip" placeholder="Enter zip code" />
                            {formErrors.zip && <span className="addressError">{formErrors.zip}</span>}
                        </label>
                        <label className="addressLabel">Country:
                            <input type="text" className="addressCountry" name="country" placeholder="Enter country" />
                            {formErrors.country && <span className="addressError">{formErrors.country}</span>}
                        </label>
                        <label className="addressLabel">Contact:
                            <input type="text" className="addressContact" name="contact" placeholder="Enter contact number" />
                            {formErrors.contact && <span className="addressError">{formErrors.contact}</span>}
                        </label>
                    </span>
                    <button type="submit" className="addressButton" onClick={addAddress}>Use This Address</button>
                </form>
            </span>
            }
        </div>
    );
}

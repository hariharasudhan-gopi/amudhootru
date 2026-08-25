import "../css/DeliveryAddress.css";

import { useState } from "react";

export default function DeliveryAddress(props) {
    const [showAddNewAddressForm, setShowAddNewAddressForm] = useState(false);
    const deliveryAddress = props.userDetails && props.userDetails.deliveryAddress;
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

        const newAddress = {
            dno : houseFlat,
            street,
            city,
            state,
            zip,
            country,
            contact
        };

        // Here you can send the newAddress to your server or update the state as needed
        console.log("New Address:", newAddress);

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
            {deliveryAddress && deliveryAddress.length && !showAddNewAddressForm ?
            <span className="deliveryAddressDetails">
                {deliveryAddress && deliveryAddress.map((address, index) => (
                    <div key={index} className="deliveryAddressItem">
                    <div className="addressRadioWrap">
                        <input type="radio" name="deliveryAddress" value={index} checked={props.deliveryAddress === address} onChange={() => props.setDeliveryAddress(address)} />
                    </div>
                    <div key={index} className="addressCardText">
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
                        </label>
                        <label className="addressLabel">Street:
                            <input type="text" className="addressStreet" name="street" placeholder="Enter street" />
                        </label>
                        <label className="addressLabel">City:
                            <input type="text" className="addressCity" name="city" placeholder="Enter city" />
                        </label>
                        <label className="addressLabel">State:
                            <input type="text" className="addressState" name="state" placeholder="Enter state" />
                        </label>
                        <label className="addressLabel">Zip:
                            <input type="text" className="addressZip" name="zip" placeholder="Enter zip code" />
                        </label>
                        <label className="addressLabel">Country:
                            <input type="text" className="addressCountry" name="country" placeholder="Enter country" />
                        </label>
                        <label className="addressLabel">Contact:
                            <input type="text" className="addressContact" name="contact" placeholder="Enter contact number" />
                        </label>
                    </span>
                    <button type="submit" className="addressButton" onClick={addAddress}>Use This Address</button>
                </form>
            </span>
            }
        </div>
    );
}

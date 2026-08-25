import "../css/ProfileInfo.css";
import ProfileImage from "../../assets/images/profile_image_template.png";
import { useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function ProfileInfo(props) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(props.userDetails && props.userDetails.profileimage ? props.userDetails.profileimage : null);
  const [selectedImageBase64, setSelectedImageBase64] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const fileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  function handleImageClick() {
    if (isEditing) fileInputRef.current.click();
  }

  function handleImageChange(event) {
    const file = event.target.files[0];
    // reset so same file can be re-selected after cancel
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target.result);
    reader.readAsDataURL(file);
  }

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    // default to a centered 1:1 crop covering 80% of the shorter side
    const size = Math.min(width, height) * 0.8;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: 'px', width: size }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  function confirmCrop() {
    const image = cropImgRef.current;
    if (!image || !completedCrop) return;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width,
      completedCrop.height
    );
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(base64);
    setSelectedImageBase64(base64);
    setCropSrc(null);
  }

  function cancelCrop() {
    setCropSrc(null);
  }
  function editProfile(event){
    event.preventDefault();
    setIsEditing(true);
  }
  function handleBack(event){
    event.preventDefault();
    setIsEditing(false);
  }
  function saveProfileInfo(event){
    debugger;
    event.preventDefault();
    event.stopPropagation();
    var usermail = props.userDetails && props.userDetails.email;
    var username = document.querySelector('.userName').value;
    var phone = document.querySelector('.userPhone').value;
    var dno = document.querySelector('.userDno').value;
    var street = document.querySelector('.userStreet').value;
    var city = document.querySelector('.userCity').value;
    var state = document.querySelector('.userState').value;
    var zip = document.querySelector('.userZip').value;
    var country = document.querySelector('.userCountry').value;
    var address = {
      dno: dno,
      street: street,
      city: city,
      state: state,
      zip: zip,
      country: country
    };
    var userInfo = {
        username: username,
        usermail: usermail,
        phone: phone,
        address: address,
        profileimage: selectedImageBase64 || undefined
    };
    console.log(userInfo);
    try {
      const response = fetch(
        `${process.env.REACT_APP_API_URL}/userInfo`,{
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userInfo)
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
        props.setUserDetails(data.userDetails);
        setSelectedImageBase64(null);
        setIsEditing(false);
        alert(data.message);
      })
      .catch((error) => {
        alert(error.message);
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }
  return (
    <>
    <div className="profileInfoContainer">
      {!isEditing ? <span className="profilePreview">
        <span className="profileInfoHeader">
          <img
              src={previewImage || ProfileImage}
              alt="Profile"
              className="profileInfoImage"
          />
          {props.userDetails && <h2 className="profileUserName">{props.userDetails.username}</h2>}
          <p className="profileEditLink" onClick={editProfile}>Edit Profile</p>
          <i
            className="fa-solid fa-xmark close-icon"
            onClick={() => props.setIsProfileOpen(false)}
          ></i>
        </span>
        <span className="profileInfoDetails">
          <p className="profileDetailItem"><i className="fa-solid fa-envelope detailIcon"></i> {props.userDetails && props.userDetails.email}</p>
          <p className="profileDetailItem"><i className="fa-solid fa-phone detailIcon"></i> {props.userDetails && props.userDetails.phone}</p>
          <p className="profileSectionTitle">Address</p>
          <span className="profileInfoAddress">
            <p className="profileAddressLine">D.No : {props.userDetails && props.userDetails.address && props.userDetails.address.dno}</p>
            <p className="profileAddressLine">Street: {props.userDetails && props.userDetails.address && props.userDetails.address.street}</p>
            <p className="profileAddressLine">City: {props.userDetails && props.userDetails.address && props.userDetails.address.city}</p>
            <p className="profileAddressLine">State: {props.userDetails && props.userDetails.address && props.userDetails.address.state}</p>
            <p className="profileAddressLine">Zip: {props.userDetails && props.userDetails.address && props.userDetails.address.zip}</p>
            <p className="profileAddressLine">Country: {props.userDetails && props.userDetails.address && props.userDetails.address.country}</p>
          </span>
        </span>
      </span> : 
      <span className="profileEdit">
        <i
          className="fa-solid fa-arrow-left back-icon"
          onClick={handleBack}
        ></i>
        {/* clicking the image in edit mode opens the file picker */}
        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={handleImageClick}>
          <img
            src={previewImage || ProfileImage}
            alt="Profile"
            className="profileInfoImage"
          />
          <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px 6px', fontSize: 12, color: '#fff' }}>✎</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <form className="profileEditForm">
          <label className="profileEditLabel">
            Name
              <input type="text" name="username" className="userName" placeholder="Enter your username" defaultValue={props.userDetails && props.userDetails.username} />
          </label>
          <br />
          <label className="profileEditLabel">
              Phone
              <input type="tel" name="phone" className="userPhone" placeholder="Enter your phone number" defaultValue={props.userDetails && props.userDetails.phone} />
          </label>
          <br />
          <p className="profileEditLabel">Address</p>
          <br />
          <span className="profileEditAddress">
            <label className="profileEditLabel">
                D.No
                <input type="text" name="dno" className="userDno" placeholder="Enter your D.No" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.dno} />
            </label>
            <label className="profileEditLabel">
                Street
                <input type="text" name="street" className="userStreet" placeholder="Enter your street" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.street} />
            </label>
            <label className="profileEditLabel">
                City
                <input type="text" name="city" className="userCity" placeholder="Enter your city" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.city} />
            </label>
            <label className="profileEditLabel">
                State
                <input type="text" name="state" className="userState" placeholder="Enter your state" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.state} />
            </label>
            <label className="profileEditLabel">
                Zip
                <input type="text" name="zip" className="userZip" placeholder="Enter your zip" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.zip} />
            </label>
            <label className="profileEditLabel">
                Country
                <input type="text" name="country" className="userCountry" placeholder="Enter your country" defaultValue={props.userDetails && props.userDetails.address && props.userDetails.address.country} />
            </label>
            <br />
          </span>
          <button className="profileEditButton" type="submit" onClick={saveProfileInfo}>Save Changes</button>
        </form>
      </span>
      }
    </div>

      {/* crop modal shown after image is selected */}
      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ color: '#fff', margin: 0 }}>Drag to crop, then click Confirm</p>
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt="crop-preview"
                onLoad={onImageLoad}
                style={{ maxHeight: '65vh', maxWidth: '90vw' }}
              />
            </ReactCrop>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={confirmCrop} style={{ padding: '8px 24px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Confirm</button>
            <button onClick={cancelCrop} style={{ padding: '8px 24px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

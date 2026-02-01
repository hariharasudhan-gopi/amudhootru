import React, { useState } from 'react'
import HashProfileImageComponent from './DynamicComponent/HashProfileImageComponent'
import ModalComponent from './ModalComponent'
import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons'
import { useField } from './context/FieldList';
import { useAuthentication } from './context/Authentication';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { FaBars } from 'react-icons/fa';

const Header = () => {
  var [showProfileInfo, setShowProfileInfo] = useState(false);
  var modalFieldsForProfile = [{label : "ProfileImage", type : "profileImage", id : "ProfileImage", isEditable : true, imageUrl : localStorage.ProfileImage},{label : "Name", type : "text", id : "Name", isEditable : false, fieldValue : localStorage.UserName, showLabel : true},{label : "Email", type : "email", id : "Email", isEditable : false, fieldValue : localStorage.Email, showLabel : true},{label : "PhoneNo", type : "tel", id : "PhoneNo", isEditable : false, fieldValue : localStorage.PhoneNo, showLabel : true},{label : "Date Of Birth", type : "date", id : "DateOfBirth", isEditable : false, fieldValue : localStorage.DateOfBirth, showLabel : true}];
  
  const {initialLoad,setInitialLoad,setActionState} = useField();
  const {isLoggedIn,setIsLoggedIn,isAdminProfile,setIsAdminProfile} = useAuthentication();
  const navigate = useNavigate();

  function handleShowProfileInfo(){
    if(isLoggedIn){
      setShowProfileInfo(true);
    }
  }
  function handleBackAction(){
    setInitialLoad(0);
    setIsLoggedIn(false);
    setIsAdminProfile(false);
  }
  function maintainLogInStatus(){
    if(!isLoggedIn){
      navigate('/Login');
    }else{
      setIsLoggedIn(false);
      setIsAdminProfile(false);
      setActionState(false);
    }
  }
  function handleGoToCart(eve){
    navigate('/Cart');
  }
  function handleMainMenuClick(eve){
    navigate('/Admin');
  }

  return (
    <div>
      <div className='header'>
      
        <h2 className='heading'>{initialLoad !== 0 ? <FontAwesomeIcon icon={faArrowLeft} onClick={(e) => handleBackAction(e)}/> : null} HELLO BUDDY</h2>
        <h2 className='welComeGreeting'>WELCOM {initialLoad === 2 ? localStorage.UserName : "HOME"}!!!!</h2>
        <h4 className='loginStatus' onClick={maintainLogInStatus}>{isLoggedIn ? "LogOut" : "LogIn"}</h4>
        {isLoggedIn ? (isAdminProfile ? <FaBars onClick={(e) => handleMainMenuClick(e)}/> : <FaShoppingCart onClick={(e) => handleGoToCart(e)}/>) : null }
        <span className='profileImage' onClick={() => handleShowProfileInfo()}>
          <HashProfileImageComponent fieldClass="ProfileImage" isEditable={false}/>
        </span>
      </div>
      {showProfileInfo && <ModalComponent fieldsList = {modalFieldsForProfile} title="UserInfo" setShowProfileInfo={setShowProfileInfo} />}
      {showProfileInfo && <div className='freezeLayer'></div>}
    </div>
  )
}

export default Header

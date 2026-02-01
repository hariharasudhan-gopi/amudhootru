import React from 'react'
import HashTextComponent from './DynamicComponent/HashTextComponent';
import HashEmailComponent from './DynamicComponent/HashEmailComponent';
import HashDateComponent from './DynamicComponent/HashDateComponent';
import HashPasswordComponent from './DynamicComponent/HashPasswordComponent';
import HashPhoneComponent from './DynamicComponent/HashPhoneComponent';
//import ProfilePage from './ProfilePage';
import './ApplicationForm.css';
import { useField } from './context/FieldList';
import { useAuthentication } from './context/Authentication';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ApplicationForm = (properties) => {
  var validationMapBasedOnClass = {
    Name : "validateName",
    Email : "validateEmail",
    Passwor : "validatePassword",
    ConfirmPassword : "validateConformPassword",
    DateOfBirth : "validateDateOfBirth",
    PhoneNo : "validatePhoneNo"
  }
  var dynamicComp = {}  
  const {setInitialLoad,setActionState,setErrorMessage} = useField();
  const {setIsLoggedIn,setIsAdminProfile} = useAuthentication();
  const navigate = useNavigate();

    function focusoutHandling(eve){
    }
    function handleSignUpAction(){
      var enteredCredentials = {};
      var fieldLen = properties.fieldsList.length;
      for (var i = 0; i < fieldLen; i++){
        var className = properties.applicantType + "_" +properties.fieldsList[i].id;
        var elem = document.getElementsByClassName(className);
        var val = elem[0].value;
        var enteredValue = {id : properties.fieldsList[i].id, value : val, label : properties.fieldsList[i].label};
        enteredCredentials[properties.fieldsList[i].id] = enteredValue;
      }
      var isValidCredentials = validateCredentials(enteredCredentials);
      if(isValidCredentials){

        var userprofile = {
          "firstname": enteredCredentials.Name.value,
          "lastname" : enteredCredentials.Name.value,
          "email" : enteredCredentials.Email.value,
          "password" : enteredCredentials.Password.value,
          "phonenumber" : enteredCredentials.PhoneNo.value,
          "dateofbirth" : enteredCredentials.DateOfBirth.value
        }
        axios.post("http://localhost:8080/users/addUsers", userprofile).then(function(resp){
          alert(resp.data);
        }).catch(function(err){
          debugger
        })

        localStorage.setItem("UserName", enteredCredentials.Name.value);
        localStorage.setItem("Email", enteredCredentials.Email.value);
        localStorage.setItem("DateOfBirth", enteredCredentials.DateOfBirth.value);
        localStorage.setItem("PhoneNo", enteredCredentials.PhoneNo.value);
        setInitialLoad(2);
        setIsLoggedIn(true);
        navigate('/');
      }
        //properties.setInitialLoad(0);

    }
    function validateMandatoryField(enteredCredentials){
      var isvalid = true;
      var fieldLen = properties.fieldsList.length;
      for (var i = 0; i < fieldLen; i++){
        var fieldValue = enteredCredentials[properties.fieldsList[i].id];
        if(properties.fieldsList[i].requied && (fieldValue.value === "")){
          isvalid = false;
          // var customError = {};
          // customError["fieldContainer_" + fieldValue.id] = fieldValue.label + " cannot be Empty";
          // setErrorMessage(errorMessage => ({...errorMessage, ["fieldContainer_" + fieldValue.id] : customError[["fieldContainer_" + fieldValue.id]]}));
          // fieldValue.isError = true;
          // document.querySelectorAll(".fieldContainer_"+fieldValue.id)[0].querySelector('.errorMessage').classList.remove('hide');
          fieldValue.isError = true;
          var identifier = "fieldContainer_" + fieldValue.id;
          var message = fieldValue.label + " cannot be Empty";
          fieldValue.erroObj = {"identifier" : identifier, "message" : message };
        }
      }
      return isvalid;
    }

    function setCustomErrorMessage(enteredCredentials){
      var cutomErrorMsg = {};
      var fieldLen = properties.fieldsList.length;
      for (var i = 0; i < fieldLen; i++){
        var fieldValue = enteredCredentials[properties.fieldsList[i].id];
        if(fieldValue.isError && fieldValue.erroObj){
          cutomErrorMsg[fieldValue.erroObj.identifier] = fieldValue.erroObj.message;
          document.querySelectorAll(".fieldContainer_"+fieldValue.id)[0].querySelector('.errorMessage').classList.remove('hide');
        }
      }
      setErrorMessage(cutomErrorMsg);
    }
    
    function validateCredentials(enteredCredentials){
      var isValid = [];
      isValid.push(validateMandatoryField(enteredCredentials));
      isValid.push(validateEmail(enteredCredentials));
      isValid.push(validateDateOfBirth(enteredCredentials));
      isValid.push(validatePassWord(enteredCredentials));
      isValid.push(validateConfirmPassword(enteredCredentials));
      if(isValid.includes(false)){
        setCustomErrorMessage(enteredCredentials);
        return false;
      }
      return true;
    }
    function validatePassWord(enteredCredentials){
      var enteredPassword = enteredCredentials.Password.value;
      if(enteredPassword.length < 8){
      }else if(enteredPassword.length > 12){
      }
      var strength=0;
      if (enteredPassword.match(/[a-z]+/)){
          strength+=1;
      }
      if (enteredPassword.match(/[A-Z]+/)){
          strength+=1;
      }
      if (enteredPassword.match(/[0-9]+/)){
          strength+=1;
      }
      if (enteredPassword.match(/[$@#&!]+/)){
        strength+=1;
      }
      if(strength !== 4 && !enteredCredentials.Password.isError){
        // var customError = {};
        // customError["fieldContainer_" + enteredCredentials.Password.id] = "Please Enter Valid " + enteredCredentials.Password.label;
        // setErrorMessage(errorMessage => ({...errorMessage, ["fieldContainer_" + enteredCredentials.Password.id] : customError[["fieldContainer_" + enteredCredentials.Password.id]]}));
        // document.querySelectorAll(".fieldContainer_"+enteredCredentials.Password.id)[0].querySelector('.errorMessage').classList.remove('hide');
        var fieldValue = enteredCredentials.Password;
        fieldValue.isError = true;
        var identifier = "fieldContainer_" + fieldValue.id;
        var message = "Please Enter Valid " + fieldValue.label;
        fieldValue.erroObj = {"identifier" : identifier, "message" : message };
        return false;
      }
      return true;
    }
    function validateConfirmPassword (enteredCredentials){
      if(enteredCredentials.Password.value === enteredCredentials.ConfirmPassword.value){
        return true;
      }else if(!enteredCredentials.ConfirmPassword.isError){
        // var customError = {};
        // customError["fieldContainer_" + enteredCredentials.ConfirmPassword.id] = "Please Enter Valid " + enteredCredentials.ConfirmPassword.label;
        // setErrorMessage(errorMessage => ({...errorMessage, ["fieldContainer_" + enteredCredentials.ConfirmPassword.id] : customError[["fieldContainer_" + enteredCredentials.ConfirmPassword.id]]}));
        // document.querySelectorAll(".fieldContainer_"+enteredCredentials.ConfirmPassword.id)[0].querySelector('.errorMessage').classList.remove('hide');
        var fieldValue = enteredCredentials.ConfirmPassword;
        fieldValue.isError = true;
        var identifier = "fieldContainer_" + fieldValue.id;
        var message = "Please Enter Valid " + fieldValue.label;
        fieldValue.erroObj = {"identifier" : identifier, "message" : message };
        return false;
      }
    }
    function validateDateOfBirth(enteredCredentials){
      var DateOfBirth = enteredCredentials.DateOfBirth;
      var fieldId = enteredCredentials.DateOfBirth.id;
      var today = new Date();
      var birthDate = new Date(DateOfBirth.value);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      if(isNaN(birthDate) && !enteredCredentials.DateOfBirth.isError){
        // var customError = {};
        // customError["fieldContainer_" + fieldId] = "Please Enter Valid " + enteredCredentials.DateOfBirth.label;
        // setErrorMessage(errorMessage => ({...errorMessage, ["fieldContainer_" + fieldId] : customError[["fieldContainer_" + fieldId]]}));
        // document.querySelectorAll(".fieldContainer_"+DateOfBirth.id)[0].querySelector('.errorMessage').classList.remove('hide');
        var fieldValue = enteredCredentials.DateOfBirth;
        fieldValue.isError = true;
        var identifier = "fieldContainer_" + fieldValue.id;
        var message = "Please Enter Valid " + fieldValue.label;
        fieldValue.erroObj = {"identifier" : identifier, "message" : message };
        return false;
      }
      return true;
    }
    function validateEmail (enteredCredentials){
      var email = enteredCredentials.Email;
      var enteredEmail = email.value;
      var isValid = enteredEmail.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
      if(!isValid && !enteredCredentials.Email.isError){
        // var customError = {};
        // customError["fieldContainer_" + fieldId] = "Please Enter Valid " + enteredCredentials.Email.label;
        // setErrorMessage(errorMessage => ({...errorMessage, ["fieldContainer_" + fieldId] : customError[["fieldContainer_" + fieldId]]}));
        // document.querySelectorAll(".fieldContainer_"+fieldId)[0].querySelector('.errorMessage').classList.remove('hide');
        var fieldValue = enteredCredentials.Email;
        fieldValue.isError = true;
        var identifier = "fieldContainer_" + fieldValue.id;
        var message = "Please Enter Valid " + fieldValue.label;
        fieldValue.erroObj = {"identifier" : identifier, "message" : message };
        return false;
      }
      return true;
    }
    function handleCreateNewAction(){
      properties.setInitialLoad(1);
      navigate('/SignUp');
    }
    function handleSignInAction(){
      var enteredCredentials = {};
      var fieldLen = properties.fieldsList.length;
      for (var i = 0; i < fieldLen; i++){
        var className = properties.applicantType + "_" +properties.fieldsList[i].id;
        var elem = document.getElementsByClassName(className);
        var val = elem[0].value;
        enteredCredentials[properties.fieldsList[i].id] = val;
      }
      var userInfo = {
                        email : enteredCredentials.UserName,
                        password : enteredCredentials.Password
                      }
      axios.get("http://localhost:8080/profile/login", {params : userInfo}).then(function(resp){
        if(resp.data.length){
          document.getElementsByClassName('formContainer')[0].classList.add('hide')
          setInitialLoad(2);
          setIsLoggedIn(true);
          localStorage.setItem("currentUserProfile", JSON.stringify(resp.data[0]));
          if(resp.data[0].lastname === "Hari"){
            setIsAdminProfile(true);
          }else{
            setIsAdminProfile(false);
          }
          navigate('/');
        }else{
          alert("No User Exist With the Entered Credentials...");
        }
        
      }).catch(function(err){
        alert("No User Exist With the Entered Credentials...");
      })

    }
    function handleGoBackAction(){
      setInitialLoad(0);
      setActionState('');
      setIsLoggedIn(false);
      navigate('/');
    }

  return (
    <main>
      <p>{properties.title}</p>
      <div className='formContainer'>
        {properties.fieldsList.map((fld) => {
            {if(fld.type === "text"){
              return (<HashTextComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }else if(fld.type === "email"){
              return (<HashEmailComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }else if(fld.type === "tel"){
              return (<HashPhoneComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }else if(fld.type === "date"){
              return (<HashDateComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }else if(fld.type === "password"){
              return (<HashPasswordComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }else if(fld.type === "password"){
              return (<HashPasswordComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id} label={fld.label} type={fld.type} applicantType={properties.applicantType} placeholder={fld.placeHolder} isEditable={fld.isEditable} showLabel={fld.showLabel} fieldValue={fld.fieldValue ? fld.fieldValue : undefined}/>);
            }
            //else{
            //   return (
            //     <span className='inputFields'>
            //       <label id = {fld.id}>{fld.label}</label>
            //       <input type= {fld.type} className = {properties.applicantType + "_" + fld.id} placeholder = {fld.placeHolder} onBlur={(eve) => focusoutHandling(eve)}></input>
            //       <p className='errorMessage hide'>ErrorMsg</p>
            //     </span>
            //   )
            // }
          }
          })
        }
        {properties.applicantType === "existingUser" ? 
          (<div>
              <button onClick={() => handleSignInAction()}>signin</button>
              <p> Create a NEW Account <a href='#' id="createNew" onClick= {() => handleCreateNewAction()}>SignUp</a></p> 
          </div>) : 
          (<div>
              <button onClick={() => handleSignUpAction()}>signUp</button>
              <button onClick={() => handleGoBackAction()}>Go Back</button>
          </div>)
          
        }
      </div>
    </main>
  )
}

export default ApplicationForm

import React from 'react'
import ApplicationForm from './ApplicationForm';
import HomeContent from './HomeContent';
import { useField } from './context/FieldList';

const Content = () => {
  //var [initialLoad, setInitialLoad] = useState(0);
  // var signUpFields = [{label : "Name", type : "text", id : "Name", isEditable : true, showLabel : true},{label : "Email", type : "email", id : "Email", isEditable : true, showLabel : true},{label : "PhoneNo", type : "tel", id : "PhoneNo", isEditable : true, showLabel : true},{label : "Date Of Birth", type : "date", id : "DateOfBirth", isEditable : true, showLabel : true},{label : "Password", type : "password", id : "Password", isEditable : true, showLabel : true},{label : "Confirm Password", type : "password", id : "ConfirmPassword", isEditable : true, showLabel : true}];
  // var signInFields = [{label : "UserName", type : "email", placeHolder : "Enter Your Email", id : "UserName", isEditable : true, showLabel : true},{label : "Password", type : "password", id : "Password", isEditable : true, showLabel : true}]
  
  const {signInFields,signUpFields,fieldList,initialLoad,setInitialLoad,actionState} = useField();
  
  
  return (
    <div>

      {actionState === "editProfile" ? <ApplicationForm applicantType = 'newUser' title = 'Amudhootru Welcomes You' fieldsList = {fieldList} setInitialLoad = {setInitialLoad}/> : <HomeContent/> }



    </div>
  )
}

export default Content

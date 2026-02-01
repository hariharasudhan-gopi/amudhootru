import React from 'react'
import { useField } from './context/FieldList';
import ApplicationForm from './ApplicationForm';

const NewSignUpPage = () => {


    const {signInFields,signUpFields,fieldList,initialLoad,setInitialLoad,actionState} = useField();

  return (
    <div>
      <h1>Create Your New Account to Continue....</h1>
      <div>
        <ApplicationForm applicantType = 'newUser' title = 'Amudhootru Welcomes You' fieldsList = {signUpFields} setInitialLoad = {setInitialLoad}/>
      </div>
    </div>
  )
}

export default NewSignUpPage

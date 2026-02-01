import React from 'react'
import { useField } from './context/FieldList';
import ApplicationForm from './ApplicationForm';

const LogInPage = () => {


    const {signInFields,signUpFields,fieldList,initialLoad,setInitialLoad,actionState} = useField();

  return (
    <div>
      <h1>LogIn to Continue....</h1>
      <div>
      <ApplicationForm applicantType = 'existingUser' title = 'Amudhootru Welcomes You' fieldsList = {signInFields} setInitialLoad = {setInitialLoad}/>
      </div>
    </div>
  )
}

export default LogInPage

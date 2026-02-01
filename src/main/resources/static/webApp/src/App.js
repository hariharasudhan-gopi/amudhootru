//import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainComponent from './MainComponent';
import { AuthProvider } from './context/Authentication';

function App() {
  // var signUpFields = [{label : "Name", type : "text", id : "Name", isEditable : true, showLabel : true},{label : "Email", type : "email", id : "Email", isEditable : true, showLabel : true},{label : "PhoneNo", type : "tel", id : "PhoneNo", isEditable : true, showLabel : true},{label : "Date Of Birth", type : "date", id : "DateOfBirth", isEditable : true, showLabel : true},{label : "Password", type : "password", id : "Password", isEditable : true, showLabel : true},{label : "Confirm Password", type : "password", id : "ConfirmPassword", isEditable : true, showLabel : true}];
  // var signInFields = [{label : "UserName", type : "email", placeHolder : "Enter Your Email", id : "UserName", isEditable : true, showLabel : true},{label : "Password", type : "password", id : "Password", isEditable : true, showLabel : true}];

  // var [fieldList, setFieldList] = useState(signUpFields);

  return (
    <div>
      <BrowserRouter>
        <AuthProvider>
          <MainComponent />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

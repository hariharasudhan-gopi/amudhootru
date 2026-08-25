import '../css/Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login(props) {
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState('');
  async function userLogin(event){
      // Prevent the default form submission behavior
      event.preventDefault();
      event.stopPropagation();
      var usermail = document.querySelector('.username').value;
      var password = document.querySelector('.password').value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(usermail)) {
        setEmailError('Please enter a valid email address.');
        return;
      }
      setEmailError('');

      try {
        const response = fetch(
          `${process.env.REACT_APP_API_URL}/userLogin`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usermail, password })
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
          debugger;
          props.setUserDetails(data.userDetails);
          props.setIsLoggedIn(true);
          navigate('/');
        })
        .catch((error) => {
          alert(error.message);
        });
      } catch (error) {
        console.error("Error:", error);
      }
    }
  return (
    <div className="loginContainer">
        <span className="loginHeader">
            <h2>Welcome</h2>
            <p>Sign in to your account</p>
        </span>
        <form className="loginForm">
            <label className="loginLabel">
            Email
            <input type="text" className={`username${emailError ? ' inputErrorBorder' : ''}`} name="usermail" placeholder="Enter your email" />
            {emailError && <span className="inputError">{emailError}</span>}
            </label>
            <br />
            <label className="loginLabel">
            Password
            <input type="password" className="password" name="password" placeholder="Enter your password" />
            </label>
            <br />
            <button className="loginButton" type="submit" onClick={userLogin}>Login</button>
            <p>Don't have an account? <a href="/signup" className='signupLink'>Sign up</a></p>
        </form>
    </div>
  );
}

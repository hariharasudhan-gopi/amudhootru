import '../css/SignUp.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignUp(props) {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    function validate(usermail, phone, password, confirmPassword) {
        const errs = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usermail))
            errs.usermail = 'Please enter a valid email address.';
        if (!/^[6-9]\d{9}$/.test(phone))
            errs.phone = 'Please enter a valid 10-digit phone number.';
        if (password.length < 8)
            errs.password = 'Password must be at least 8 characters.';
        if (password !== confirmPassword)
            errs.confirmPassword = 'Passwords do not match.';
        return errs;
    }

    function userSignUp(event) {
        event.preventDefault();
        var username = document.querySelector('.userName').value;
        var usermail = document.querySelector('.userEmail').value;
        var phone = document.querySelector('.userPhone').value;
        var password = document.querySelector('.userPassword').value;
        var confirmPassword = document.querySelector('.userConfirmPassword').value;

        const errs = validate(usermail, phone, password, confirmPassword);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        var userInfo = {
            username: username,
            usermail: usermail,
            phone: phone,
            password: password
        };
        console.log(userInfo);
        try {
        const response = fetch(
          `${process.env.REACT_APP_API_URL}/userInfo`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
                        credentials: 'include',
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
        <div className="signUpContainer">
            <span className="signUpHeader">
                <h2>Welcome</h2>
                <p>Sign up for a new account</p>
            </span>
            <form className="signUpForm">
                <label className="signUpLabel">
                    Username
                    <input type="text" name="username" className="userName" placeholder="Enter your username" />
                </label>
                <br />
                <label className="signUpLabel">
                    Email
                    <input type="email" name="email" className={`userEmail${errors.usermail ? ' inputErrorBorder' : ''}`} placeholder="Enter your email" />
                    {errors.usermail && <span className="inputError">{errors.usermail}</span>}
                </label>
                <br />
                <label className="signUpLabel">
                    Phone
                    <input type="tel" name="phone" className={`userPhone${errors.phone ? ' inputErrorBorder' : ''}`} placeholder="Enter your phone number" />
                    {errors.phone && <span className="inputError">{errors.phone}</span>}
                </label>
                <br />
                <label className="signUpLabel">
                    Password
                    <span className="passwordWrapper">
                        <input type={showPassword ? 'text' : 'password'} name="password" className={`userPassword${errors.password ? ' inputErrorBorder' : ''}`} placeholder="Enter your password" />
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} pwToggleIcon`} onClick={() => setShowPassword(v => !v)} />
                    </span>
                    {errors.password && <span className="inputError">{errors.password}</span>}
                </label>
                <br />
                <label className="signUpLabel">
                    Confirm Password
                    <span className="passwordWrapper">
                        <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" className={`userConfirmPassword${errors.confirmPassword ? ' inputErrorBorder' : ''}`} placeholder="Confirm your password" />
                        <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} pwToggleIcon`} onClick={() => setShowConfirm(v => !v)} />
                    </span>
                    {errors.confirmPassword && <span className="inputError">{errors.confirmPassword}</span>}
                </label>
                <br />
                <button className="signUpButton" type="submit" onClick={userSignUp}>Sign Up</button>
                <p>Already have an account? <a href="/login" className='loginLink'>Log in</a></p>
            </form>
        </div>
    )
}

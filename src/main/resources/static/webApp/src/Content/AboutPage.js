import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const AboutPage = () => {
  const navigate = useNavigate();
  const goToHome = () => {
    navigate('/');
  }
  return (
    <div>AboutPage..
      <button onClick={goToHome}>GO BACK TO HOME</button>
    </div>
  )
}

export default AboutPage

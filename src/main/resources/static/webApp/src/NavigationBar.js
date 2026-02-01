import React, { useState } from 'react'
import { Link, NavLink, Route, Routes, useRouteError } from "react-router-dom"
import './NavigationBar.css'

const NavigationBar = () => {
    const tabStatus = ({isActive}) => {
        var className = isActive ? "activeTab" : "";
        return className;
    }
  return (
    <div>
        <nav className='navigationBar'>
            <p className='pageTitle'>ThulirVanam Welcomes You {localStorage.getItem("UserName")}</p>
            <ul className='navigationList'>
                <li id = "service">
                    <NavLink to='/Product' className={tabStatus}>Product</NavLink>
                </li>
                <li id = "about">
                    <NavLink to='/About' className={tabStatus}>About</NavLink>
                </li>
                <li id = "contact">
                    <NavLink to='/Contact' className={tabStatus}>Contact</NavLink>
                </li>
            </ul>
        </nav>
        <div className='navContent'>
        </div>
    </div>
  )
}

export default NavigationBar

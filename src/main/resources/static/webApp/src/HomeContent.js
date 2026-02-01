import React from 'react'
import './HomeContent.css'
import NavigationBar from './NavigationBar'
import AboutPage from './Content/AboutPage'
import HomePage from './Content/HomePage'
import ContactPage from './Content/ContactPage'
import ProductPage from './Content/ProductPage'
import EnquirePage from './Content/EnquirePage'
import LogInPage from './LogInPage'
import NewSignUpPage from './NewSignUpPage'
import AdminPage from './Content/AdminPage'
import CartPage from './Content/CartPage'
import PrivateRoute from './RouteComponent/PrivateRoute'
import { Link, NavLink, Route, Routes, useRouteError, Navigate } from "react-router-dom"
const HomeContent = () => {
  return (
    <div>
        <div className='navigationContent'>
            <NavigationBar/>
            <Routes>
                <Route path='/' element={<Navigate to="/Product" />}/>
                <Route path='/About' element={<AboutPage/>}/>
                <Route path='/Contact' element={<ContactPage/>}/>
                <Route path='/Product' element={<ProductPage/>}/>
                <Route path='/Enquire/:id' element={<EnquirePage/>}/>
                <Route path='/Login' element={<LogInPage/>}/>
                <Route path='/SignUp' element={<NewSignUpPage/>}/>
                <Route path='/Admin' element={
                  <PrivateRoute><AdminPage/></PrivateRoute>
                }/>
                <Route path='/Cart' element={
                  <PrivateRoute><CartPage/></PrivateRoute>
                }/>
            </Routes>
        </div>
    </div>
  )
}

export default HomeContent

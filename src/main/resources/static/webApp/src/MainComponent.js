import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Content from './Content';
import './MainComponent.css';

const MainComponent = () => {
    // var [initialLoad, setInitialLoad] = useState(0);
    // var [actionState, setActionState] = useState("");
  return (
    <div className='bodyContainer'>
      <div className='headerContainer'>
        <Header />
      </div>
      <div className='contentContainer'>
       <Content />
      </div>
      <div className='footerContainer'>
        <Footer />
      </div>
    </div>
  )
}

export default MainComponent

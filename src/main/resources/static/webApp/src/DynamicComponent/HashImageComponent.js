import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import Profiletemplate from '../Images/Profiletemplate.png'

const HashImageComponent = (properties) => {
  function handleImageUpload(event){
    if(document.getElementsByClassName(properties.fieldClass)[1]){
        document.getElementsByClassName(properties.fieldClass)[1].src = URL.createObjectURL(event.target.files[0]);
    }
    document.getElementsByClassName(properties.fieldClass)[0].src = URL.createObjectURL(event.target.files[0]);
  }
  return (
    <div className={'hashComponent ' + properties.fieldClass}>
        <span className='fieldContainer'>
            <img src = {properties.imageUrl ? properties.imageUrl : Profiletemplate} className={properties.fieldClass}/>
            {properties.isEditable && (<div>
                                        <label for='profileImage'>
                                            <FontAwesomeIcon icon={faCamera}  className='uploadImageIcon'/>
                                        </label>
                                        <input type='file' accept='image/jpeg, image/png, image/jpg' id='profileImage' onChange={(e) => handleImageUpload(e)}/>
                                    </div>)
            }
            
        </span>
    </div>
  )
}

export default HashImageComponent

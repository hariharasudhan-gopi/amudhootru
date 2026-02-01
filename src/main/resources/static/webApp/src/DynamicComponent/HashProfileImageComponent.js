import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import Profiletemplate from '../Images/Profiletemplate.png'
import '../DynamicComponentStyle/HashProfileImageComponent.css';

const HashProfileImageComponent = (properties) => {
    function handleImageUpload(event){
        debugger
        localStorage.setItem('ProfileImage',URL.createObjectURL(event.target.files[0]))
        if(document.getElementsByClassName('ProfilePick')[1]){
            document.getElementsByClassName('ProfilePick')[1].src = URL.createObjectURL(event.target.files[0]);
        }
        document.getElementsByClassName('ProfilePick')[0].src = URL.createObjectURL(event.target.files[0]);

    }
  return (
    <div className={'hashComponent ' + properties.fieldClass}>
        <span className='fieldContainer'>
            <img src = {properties.imageUrl ? properties.imageUrl : Profiletemplate} className={'ProfilePick ' + properties.fieldClass + " " +properties.applicantType + "_" + properties.id}/>
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

export default HashProfileImageComponent

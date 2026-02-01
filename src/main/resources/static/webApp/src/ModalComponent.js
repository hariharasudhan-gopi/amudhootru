import React from 'react'
import HashProfileImageComponent from './DynamicComponent/HashProfileImageComponent'
import './ModalComponent.css';
import HashTextComponent from './DynamicComponent/HashTextComponent';
import HashEmailComponent from './DynamicComponent/HashEmailComponent';
import HashDateComponent from './DynamicComponent/HashDateComponent';
import HashPhoneComponent from './DynamicComponent/HashPhoneComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faPencil} from '@fortawesome/free-solid-svg-icons'
import { useField } from './context/FieldList';

const ModalComponent = (properties) => {

    const {setFieldList,setInitialLoad,setActionState} = useField();
    
    function handleCloseModal(){
        properties.setShowProfileInfo(false)
    }
    function handleProfileEdit(){
        debugger
        var editProfileFields = [{label : "Name", type : "text", id : "Name", isEditable : true, showLabel : true, fieldValue : localStorage.UserName},{label : "Email", type : "email", id : "Email", isEditable : true, showLabel : true, fieldValue : localStorage.Email},{label : "PhoneNo", type : "tel", id : "PhoneNo", isEditable : true, showLabel : true, fieldValue : localStorage.PhoneNo},{label : "Date Of Birth", type : "date", id : "DateOfBirth", isEditable : true, showLabel : true, fieldValue : localStorage.DateOfBirth}];
        setFieldList(editProfileFields);
        setActionState('editProfile');
        properties.setShowProfileInfo(false)
        setInitialLoad(1);
    }
  return (
    <div className='modal'>
        
        <div className='modalHeader'>
            <span className='modalTitle'>{properties.title}</span>
            <span className='closeModal' onClick={() => handleCloseModal()}>&times;</span>
        </div>
        <div className='modalContent'>
            <div className='modalcontentContainer'>
                <div className='modalProfileImageContainer'>
                    {properties.fieldsList.map((fld) => {
                        {
                            if(fld.type === "profileImage"){
                                return (<HashProfileImageComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id+" hashFieldContainer"} type={fld.type}  isEditable={fld.isEditable} imageUrl={localStorage.ProfileImage}/>);
                            }
                        }
                        })
                    }
                </div>
                <div className='profileDetailsContainer'>
                    <span className='profileDetails'>
                        {properties.fieldsList.map((fld) => {
                            {
                                if(fld.type === "text"){
                                    return (<HashTextComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id+" hashFieldContainer"} label={fld.label} type={fld.type} isEditable={fld.isEditable} fieldValue={fld.fieldValue} showLabel={fld.showLabel}/>);
                                }else if(fld.type === "email"){
                                    return (<HashEmailComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id+" hashFieldContainer"} label={fld.label} type={fld.type} isEditable={fld.isEditable} fieldValue={fld.fieldValue} showLabel={fld.showLabel}/>);
                                }else if(fld.type === "tel"){
                                    return (<HashPhoneComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id+" hashFieldContainer"} label={fld.label} type={fld.type} isEditable={fld.isEditable} fieldValue={fld.fieldValue} showLabel={fld.showLabel}/>);
                                }else if(fld.type === "date"){
                                    return (<HashDateComponent id={fld.id} fieldClass={"fieldContainer_"+fld.id+" hashFieldContainer"} label={fld.label} type={fld.type} isEditable={fld.isEditable} fieldValue={fld.fieldValue} showLabel={fld.showLabel}/>);
                                }
                            }
                            })
                        }
                    </span>
                    <span className='profileEditIcon'>
                        <FontAwesomeIcon icon={faPencil} onClick={(e) => handleProfileEdit(e)}/>
                    </span>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ModalComponent

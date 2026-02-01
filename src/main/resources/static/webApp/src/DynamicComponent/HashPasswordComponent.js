import React from 'react'
import { useField } from './../context/FieldList';

const HashPasswordComponent = (properties) => {
    const {errorMessage} = useField();
    function hashFocusOut(eve){
        if(properties.hashFocusOut){
            properties.hashFocusOut(eve);
        }
    }
  return (
    <div className={'hashComponent ' + properties.fieldClass}>
        {properties.showLabel ? (<label id = {properties.id}>{properties.label + " : "}</label>) : null}
        {properties.isEditable ? (
          <span className='fieldContainer'>
            <input type= {properties.type} className = {properties.applicantType + "_" + properties.id} placeholder = {properties.placeholder} onBlur={(eve) => hashFocusOut(eve)}></input>
            <p className='errorMessage hide'>{errorMessage && errorMessage[properties.fieldClass] ? errorMessage[properties.fieldClass] : "ErrorMsg"}</p>
          </span>
        ) : (
          <span className='fieldContainer'>{properties.fieldValue}</span>
        )}
        
    </div>
  )
}

export default HashPasswordComponent

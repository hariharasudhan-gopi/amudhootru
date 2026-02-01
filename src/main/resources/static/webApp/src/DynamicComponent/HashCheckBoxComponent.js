import React from 'react'
import { useField } from './../context/FieldList';

const HashCheckBoxComponent = (properties) => {
    const {errorMessage} = useField();
  return (
    <div className={'hashComponent ' + properties.fieldClass}>
      {properties.showLabel ? (<label id = {properties.id}>{properties.label + " : "}</label>) : null}
      {properties.isEditable ? (
        <span className='fieldContainer'>
          properties.isChecked ? <input type= {properties.type} checked></input> : <input type= {properties.type}></input>
          <p className='errorMessage hide'>{errorMessage && errorMessage[properties.fieldClass] ? errorMessage[properties.fieldClass] : "ErrorMsg"}</p>
        </span>
      ) : (
        properties.isChecked ? <input type= {properties.type} checked></input> : <input type= {properties.type}></input>
      )} 
    </div>
  )
}

export default HashCheckBoxComponent

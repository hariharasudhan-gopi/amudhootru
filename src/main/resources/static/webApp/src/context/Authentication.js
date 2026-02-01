import { createContext, useContext, useState } from "react";

const authContext = createContext();

//Provider
const AuthProvider = ({children}) => {

    var [isLoggedIn, setIsLoggedIn] = useState(false);
    var [isAdminProfile, setIsAdminProfile] = useState(false);

    return(
        <authContext.Provider value={{isLoggedIn,setIsLoggedIn,isAdminProfile,setIsAdminProfile}}>
            {children}
        </authContext.Provider>
    );
}

//Consumer
const useAuthentication = () => useContext(authContext);
export {useAuthentication, AuthProvider};

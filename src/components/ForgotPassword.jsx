import { useState } from "react"
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { useRef } from "react";

export default function ForgotPassword(){

    const [email,setEmail] = useState("")
    const [message,setMessage] = useState({type:"",text:""})
    const [otp,setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);
     const [isPassword,setIsPassword] = useState(false)

      const buttonRef1 = useRef();
      const buttonRef2 = useRef();

  const handleKeyDown1 = (e) => {
    if (e.key === 'Enter') {
      buttonRef1.current.click(); // Trigger button click
    }
  };
  const handleKeyDown2 = (e) => {
    if (e.key === 'Enter') {
      buttonRef2.current.click(); // Trigger button click
    }
  };

    const Forgotpassword = async ()=>{

        try {
            setIsLoading(true)
           fetch("https://mygram-1-1nua.onrender.com/forgot-password",{
            method:"POST",
            body:JSON.stringify({email:email}),
            headers:{
                "Content-Type":"application/json"
            }
           })
           .then((res)=>{
            
            return res.json()
           })
           .then((data)=>{
            console.log(data)
            setIsLoading(false)
            setMessage({type:"success",text:data.message})
            setTimeout(()=>{
                setMessage({type:"",text:""})
                
                
            },5000)
           })
            
        } catch (error) {
            setMessage({type:"error",text:data.error});
            
        }
        
    }

    const handleResetPassword = () => {
        // Ensure password is not empty
        if (!newPassword) {
            setMessage("Password cannot be empty.");
            
        }
        setIsLoading2(true)

        fetch("https://mygram-1-1nua.onrender.com/reset-password", {
            method: "POST",
            body: JSON.stringify({ email:email, newPass: newPassword , otp: otp}),
            headers: {
                "Content-Type": "application/json",
            }
             // Correctly send the new password
        })
        .then((res)=>{
            setIsLoading2(false)
            
                return res.json();
        })
        .then((data)=>{
            console.log(data.error)
           if(data.error){
            setMessage({type:"error",text:data.error})
           }
           else
           {
            setMessage({type:"success",text:data.message})
            setTimeout(()=>{
                setMessage({type:"",text:""})
              
                    setEmail("")
                    setNewPassword("")
                    setOtp("")
             
                
            },3000)
           }
        })
        .catch((err) => {
            console.error("Error:", err);
            setMessage({type:"error",text:data.error});
        });
           
    };

      const showHide = ()=>{
        setIsPassword((prev)=>!prev)
    }

    return (

        <section className="container">

            <div className="form3">
                <h4>Enter your Email to get otp</h4>
                <input onKeyDown={handleKeyDown1} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter Your Email" className="inp" type="email" name="email" id="" value={email} />
                <button ref={buttonRef1} type="submit" onClick={Forgotpassword} className=" btn-2"  disabled={isLoading}>{isLoading ? "Loading..." : "send"}</button>
                <input 
            className="inp" onChange={(e)=>setOtp(e.target.value)}
            type="otp" placeholder="Enter Otp" value={otp}/>
            
            <input
                className="inp"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handleKeyDown2}
            />
             <img className="pass3" onClick={showHide} src={isPassword ? hide : show} alt="" />
            <button ref= {buttonRef2}type="submit" className=" btn-1" onClick={handleResetPassword} disabled={isLoading2}>{isLoading2 ? "Loading..." : "reset"}</button>
            
            <Link className="link" to='/login'>Go to Login page</Link>
                {message && <p className={message.type}>{message.text}</p>}
                
            </div>
            

        </section>
    )

}
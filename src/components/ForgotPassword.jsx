import { useState } from "react"
import { Link } from "react-router-dom";

export default function ForgotPassword(){

    const [email,setEmail] = useState("")
    const [message,setMessage] = useState({type:"",text:""})
    const [otp,setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);

    const Forgotpassword = async ()=>{

        try {
            setIsLoading(true)
           fetch("http://localhost:8000/send-otp",{
            method:"POST",
            body:JSON.stringify({email}),
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

        fetch("http://localhost:8000/reset-password", {
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

    return (

        <section className="container">

            <div className="form">
                <h4>Enter your Email to get reset Link</h4>
                <input onChange={(e)=>setEmail(e.target.value)} placeholder="Enter Your Email" className="inp" type="email" name="email" id="" value={email} />
                <button type="submit" onClick={Forgotpassword} className="btn btn-2"  disabled={isLoading}>{isLoading ? "Loading..." : "send"}</button>
                <input 
            className="input" onChange={(e)=>setOtp(e.target.value)}
            type="otp" placeholder="Enter Otp" value={otp}/>
            
            <input
                className="input"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-1" onClick={handleResetPassword} disabled={isLoading2}>{isLoading2 ? "Loading..." : "reset"}</button>
            
            <Link to='/login'>Go to Login page</Link>
                {message && <p className={message.type}>{message.text}</p>}
                
            </div>
            

        </section>
    )

}
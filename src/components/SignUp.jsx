import { useState } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'

export default function SignUp(){

    const [userDetails,setUserDetails] = useState({
        username:"",
        email:"",
        password:"",
        mobile:""
    })

    const [message,setMessage] = useState({
        type:"",
        text:""
    })

    const [isLoading, setIsLoading] = useState(false);
      const [isPassword,setIsPassword] = useState(false)

    const handleInput = (e)=>{
        e.preventDefault();
        setUserDetails((prev)=>{
            return {...prev,[e.target.name]:e.target.value}
        })
        console.log(userDetails)


    }

    
    const showHide = ()=>{
        setIsPassword((prev)=>!prev)
    }

    const handleSubmit = (e)=>{
        e.preventDefault();
       
        fetch("https://mygram-1-1nua.onrender.com/signup",{
            method:"POST",
            body:JSON.stringify(userDetails),
            headers:{
                "Content-Type":"application/json"
            }
        })
        .then((res)=>{
            
            setIsLoading(true);
              
                return res.json();
        })
        .then((data)=>{
           

            setMessage({type:"success",text:data.message})

            setTimeout(()=>{
                setMessage({type:"",text:""})
                setIsLoading(false);
                setUserDetails({
                    username:"",
                    email:"",
                    password:"",
                    mobile:""

                })
            },5000)

        })
        .catch((err)=>{
            console.log(err)
        })

    }




    return (
<section className="container">
<form className="form">
<h1>SignUp to Create Account</h1>

<input className="inp" type="text" onChange={handleInput} placeholder="Enter Username" required name="username" value={userDetails.username} />
<input className="inp" type="email" onChange={handleInput} placeholder="Enter Email" required name="email" value={userDetails.email} />
<div className="pass1">
<input className="inp" type={isPassword ? "text" : "password"} onChange={handleInput} placeholder="Enter Password" maxLength={16} required name="password" value={userDetails.password} />

    <img onClick={showHide} src={isPassword ? show : hide} alt="" />
</div>
<input className="inp" type="text" onChange={handleInput} placeholder="Enter Mobile" minLength={12} required name="mobile" value={userDetails.mobile} />
<button onClick={handleSubmit} className="btn" disabled={isLoading}>{isLoading ? "Loading..." : "Join"}</button>

<div className="form-content">
    <p>Already Registered ? <Link to='/login'>Login</Link></p>

</div>
<div className="emailotp">
    <p><Link to='/emailotp'>verify email to login</Link></p>
</div>
<p className={message.type}>{message.text}</p>
</form>

</section>
    )
}
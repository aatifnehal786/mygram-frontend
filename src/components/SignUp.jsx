import { useState } from "react";
import { Link } from "react-router-dom";

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

    const handleInput = (e)=>{
        e.preventDefault();
        setUserDetails((prev)=>{
            return {...prev,[e.target.name]:e.target.value}
        })
        console.log(userDetails)


    }

    const handleSubmit = (e)=>{
        e.preventDefault();
       
        fetch("http://localhost:8000/signup",{
            method:"POST",
            body:JSON.stringify(userDetails),
            headers:{
                "Content-Type":"application/json"
            }
        })
        .then((res)=>{
            
            setIsLoading(false);
                // if (!res.ok) {
                //     if (res.status === 404) {
                //         setMessage({ type: "error", text: "User Not Found With this Email, Please Login Again" });
                //     } else if (res.status === 401) {
                //         setMessage({ type: "error", text: "Wrong Password" });
                //     } else {
                //         setMessage({ type: "error", text: "Something went wrong. Please try again later." });
                //     }
                //     throw new Error(`HTTP error! status: ${res.status}`);
                // }
                return res.json();
        })
        .then((data)=>{
           

            setMessage({type:"success",text:data.message})

            setTimeout(()=>{
                setMessage({type:"",text:""})
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
<form>
<h1>SignUp to Create Account</h1>

<input className="inp" type="text" onChange={handleInput} placeholder="Enter Username" required name="username" value={userDetails.username} />
<input className="inp" type="email" onChange={handleInput} placeholder="Enter Email" required name="email" value={userDetails.email} />
<input className="inp" type="password" onChange={handleInput} placeholder="Enter Password" maxLength={16} required name="password" value={userDetails.password} />
<input className="inp" type="text" onChange={handleInput} placeholder="Enter Mobile" minLength={12} required name="mobile" value={userDetails.mobile} />

<button onClick={handleSubmit} className="btn" disabled={isLoading}>{isLoading ? "Loading..." : "Join"}</button>

<div className="form-content">
    <p>Already Registered ? <Link to='/login'>Login</Link></p>
<p><Link to='/emailotp'>verify email to login</Link></p>
<p className={message.type}>{message.text}</p>
</div>
</form>

</section>
    )
}
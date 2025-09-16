import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { apiFetch } from "../api/apiFetch";

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
      const [strength, setStrength] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

    const handleInput = (e)=>{
        e.preventDefault();
        setUserDetails((prev)=>{
            return {...prev,[e.target.name]:e.target.value}
        })
        console.log(userDetails)


    }

    useEffect(() => {
    const val = userDetails.password;
    const weakRegex = /.{1,5}/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.{6,})/;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (strongRegex.test(val)) setStrength("strong");
    else if (mediumRegex.test(val)) setStrength("medium");
    else if (weakRegex.test(val)) setStrength("weak");
    else setStrength("");

     if (typingTimeout) clearTimeout(typingTimeout);

  // Set timeout to clear strength after 2 seconds of inactivity
  const timeout = setTimeout(() => {
    setStrength("");
  }, 3000);

  setTypingTimeout(timeout);

  // Cleanup on component unmount
  return () => clearTimeout(timeout);
  }, [userDetails.password]);

  const getStrengthText = () => {
    switch (strength) {
      case "weak":
        return "Weak Password";
      case "medium":
        return "Medium Password";
      case "strong":
        return "Strong Password";
      default:
        return "";
    }
  };

    
    const showHide = ()=>{
        setIsPassword((prev)=>!prev)
    }

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const data = await apiFetch("api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userDetails),
    });

    setMessage({ type: "success", text: data.message });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
      setIsLoading(false);
      setUserDetails({
        username: "",
        email: "",
        password: "",
        mobile: "",
      });
    }, 10000);
  } catch (err) {
    console.error(err);
    setMessage({ type: "error", text: err.message });
    setIsLoading(false);
  }
};





    return (
<section className="container">
<form className="form">
<h1>SignUp to Create Account</h1>

<input className="inp" type="text" onChange={handleInput} placeholder="Enter Username" required name="username" value={userDetails.username} />
<input className="inp" type="email" onChange={handleInput} placeholder="Enter Email" required name="email" value={userDetails.email} />
<div className="pass1">
<input className="inp" type={isPassword ? "text" : "password"} onChange={handleInput} placeholder="Enter Password" maxLength={16} required name="password" value={userDetails.password} />

    <img onClick={showHide} src={isPassword ? show : hide} alt="" />
     <div className={`strength ${strength}`}>{getStrengthText()}</div>
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
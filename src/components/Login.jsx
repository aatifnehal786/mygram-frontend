import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import hide from '../assets/hide.png'
import show from '../assets/show.png'

export default function Login() {
    const loggedData = useContext(UserContext);
    const [user, setUser] = useState({ loginId: "", password: "" });
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isPassword,setIsPassword] = useState(false)

    const navigate = useNavigate();

    const handleInput = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        fetch("https://mygram-1-1nua.onrender.com/login", {
            method: "POST",
            body: JSON.stringify({ loginId: user.loginId, password: user.password }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                setIsLoading(false);
                
              if(!res.ok){
                setIsLoading(false)
                if(res.status==404){
                    setMessage({type:'error',text:'User not found,please login'})
                }else if(res.status==403){
                    setMessage({type:'error',data:"Email not verified. Please verify your email to login."})
                }
              }
                   
                
                return res.json();
            })
            .then((data) => {
                setMessage({ type: "success", text: data.message });

                if (data.token) {
                    sessionStorage.setItem('token-auth', JSON.stringify(data));

                    loggedData.setLoggedUser(data);
                    navigate('/home', { replace: true });
                }
            })
            .catch((err) => {
                console.error(err);
                setMessage({ type: "error", text: "An error occurred. Please try again later." });
            });
    };

    const showHide = ()=>{
        setIsPassword((prev)=>!prev)
    }

    return (
        <section className="container">
            <form className="form" onSubmit={handleSubmit}>
                <h1>Login</h1>
                <input
                    className="inp"
                    type="text"
                    placeholder="Enter Username, Email, or Mobile"
                    required
                    name="loginId"
                    onChange={handleInput}
                    value={user.loginId}
                />
                
                <input
                    className="inp"
                    type={isPassword ? "password" : "text"}
                    placeholder="Enter Password"
                    maxLength={16}
                    onChange={handleInput}
                    required
                    name="password"
                    value={user.password}
                />
                <img className="pass" onClick={showHide} src={isPassword ? hide : show} alt="" />
                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Join"}
                </button>
                <div className="form-content">
                    <p>Don't Have Account? <Link to='/register'>Register Now</Link></p>
                    <Link className="forgot" to='/forgot-password'>Forgot Password</Link>
                    <p className={message.type}>{message.text}</p>
                </div>
            </form>
        </section>
    );
}

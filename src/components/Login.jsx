import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";


export default function Login() {
    const loggedData = useContext(UserContext);
    const [user, setUser] = useState({ email: "", password: "" });
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);
    
    

    const navigate = useNavigate();

    const handleInput = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
//     useEffect(() => {
//     if (loggedData) {
//       navigate('/home', { replace: true });
//     }
//   }, [loggedData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        fetch("http://localhost:8000/login", {
            method: "POST",
            body: JSON.stringify({ email: user.email, password: user.password }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                setIsLoading(false);
                if (!res.ok) {
                    if (res.status === 404) {
                        setMessage({ type: "error", text: "User Not Found With this Email, Please Login Again" });
                    } else if (res.status === 401) {
                        setMessage({ type: "error", text: "Wrong Password" });
                    } else {
                        setMessage({ type: "error", text: "Something went wrong. Please try again later." });
                    }
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                
                setMessage({ type: "success", text: data.message });
              
               
                if (data.token) {
                  



            // On successful login:
            localStorage.setItem('token-auth', JSON.stringify(data));
            loggedData.setLoggedUser(data);
            navigate('/home', { replace: true }); // 👈 Replace login in history

                    
                    
                    
                }
               
                
            })
            .catch((err) => {
                console.error(err);
                setMessage({ type: "error", text: "An error occurred. Please try again later." });
            });
            
    };

 

    return (
        <section className="container">
            <form className="form" onSubmit={handleSubmit}>
                <h1>Login</h1>
                <input
                    className="inp"
                    type="email"
                    placeholder="Enter Email"
                    required
                    name="email"
                    onChange={handleInput}
                    value={user.email}
                />
                <input
                    className="inp"
                    type="password"
                    placeholder="Enter Password"
                    maxLength={16}
                    onChange={handleInput}
                    required
                    name="password"
                    value={user.password}
                />
                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Join"}
                </button>
               <div className="form-content">
                  <p>Don't Have Account? <Link to='/register'>Register Now</Link></p>
                <Link to='/forgot-password'>Forgot Password</Link>
                <p className={message.type}>{message.text}</p>
               </div>
               
            </form>
            
        </section>
    );
}

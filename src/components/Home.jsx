import { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
export default function Home() {

  let [users,setUsers] = useState([])
  const {loggedUser} = useContext(UserContext);
  console.log(loggedUser)

  useEffect(()=>{
   fetch("http://localhost:8000/allusers",{
    method:"GET",
    headers:{
      Authorization: `Bearer ${loggedUser.token}`
    },
   })
   .then((res)=>{
    return res.json()
   })
   .then((data)=>{
    console.log(data)
   })

  },[])
  return (
    <section className="home">
      <h1>Welcome to the Home Page</h1>
      {/* <p>This is your dashboard or feed area.</p> */}
    </section>
  );
}

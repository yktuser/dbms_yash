<!DOCTYPE html>
<html>
<head>
<title>Login</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<h2>Login</h2>

<input id="user" placeholder="Username">
<input id="pass" type="password" placeholder="Password">
<button onclick="login()">Login</button>

<script>
function login(){
    if(user.value === "admin" && pass.value === "admin"){
        window.location = "dashboard.html";
    } else {
        alert("Invalid credentials");
    }
}
</script>

</body>
</html>

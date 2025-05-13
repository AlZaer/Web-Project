document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault();

    const username = document.getElementById("registerUsernameInput").value;
    const email = document.getElementById("registerEmailInput").value;
    const password = document.getElementById("registerPasswordInput").value;
    const confirmPassword = document.getElementById("registerConfirmPasswordInput").value;

    if(password != confirmPassword){
        alert("Passwords do not match. Please try again.");
        return;
    }

    fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username,email,password})
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            alert("The account created successfully");
            window.location.href = "/";
        }
        else{
            alert(data.message);
        }
    })
    .catch(error => {
        console.error("❌ خطأ في التسجيل:", error);
        alert("Something went wrong. Please try again later.");
    });
});